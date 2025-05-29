const AdultFemaleEMR = require("../../../models/EMR/adultFemaleEMR.model");
const AdultMaleEMR = require("../../../models/EMR/adultMaleEMR.model");
const User = require("../../../models/common/user.model");
const Doctor = require("../../../models/doctors/doctor.model");
const eprescriptionModel = require("../../../models/patient/eprescription/eprescription.model");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const mongoose = require("mongoose");
const {
  EMRValidationSchema,
} = require("../../../validators/emr/emr.validation");

const currentConditionModel = require("../../../models/patient/healthSummary/currentCondition.model");
const allergyModel = require("../../../models/patient/healthSummary/allergy.model");
const immunizationModel = require("../../../models/patient/healthSummary/immunization.model");
const patientBpModel = require("../../../models/patient/healthTracker/bp/patientBp.model");
const patientBpGoalModel = require("../../../models/patient/healthTracker/bp/patientBpGoal.model");
const patientAppointmentModel = require("../../../models/patient/patientAppointment/patientAppointment.model");
const { sendEMRCreationMsg } = require("../../../helper/otp/sentOtp.helper");
const medicineScheduleController = require("../../patient/medicineSchedule.controller");

const createEMR = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    console.log(
      "EMR Creation Request Body:",
      JSON.stringify(req.body, null, 2)
    );
    console.log("Request Query:", req.query);
    console.log(
      "BasicInfo structure:",
      JSON.stringify(req.body.basicInfo, null, 2)
    );

    // Try to modify the request body if firstName and lastName are provided but name is not
    if (
      req.body.basicInfo &&
      req.body.basicInfo.firstName &&
      req.body.basicInfo.lastName &&
      !req.body.basicInfo.name
    ) {
      console.log(
        "Detected firstName/lastName pattern instead of name, fixing..."
      );
      req.body.basicInfo.name = `${req.body.basicInfo.firstName} ${req.body.basicInfo.lastName}`;
      console.log(
        "Modified basicInfo:",
        JSON.stringify(req.body.basicInfo, null, 2)
      );
    }

    session.startTransaction();

    // For tele-consultation, allow empty systemic examination fields
    const isTeleConsultation = req.body.consultationMode === "online";
    console.log("Consultation mode:", req.body.consultationMode);
    console.log("Is tele consultation:", isTeleConsultation);

    if (isTeleConsultation && req.body.systemicExamination) {
      // Allow empty values for systemic examination fields in tele-consultation
      console.log(
        "Tele-consultation detected, making systemic examination optional"
      );
    }

    // Validate the request body
    const { error } = EMRValidationSchema.validate(req.body);
    if (error) {
      // If validation error is related to systemic examination and it's a tele consultation, ignore it
      if (
        isTeleConsultation &&
        error.details &&
        error.details[0] &&
        error.details[0].path &&
        error.details[0].path.includes("systemicExamination")
      ) {
        console.log(
          "Ignoring systemic examination validation for tele-consultation"
        );
      } else {
        console.log("Validation Error:", error.details);
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          error.message || "validation failed !"
        );
      }
    }

    console.log("Validation passed successfully");

    const { appointmentId } = req.query;
    // check if user exist with userId
    console.log("Looking for user with ID:", req.body.user);
    const existingUser = await User.findById(req.body.user).session(session);
    if (!existingUser) {
      console.log("User not found with ID:", req.body.user);
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "User not found with given id"
      );
    }

    console.log("Found user:", existingUser._id);

    const height = req.body.generalPhysicalExamination.height;
    const weight = req.body.generalPhysicalExamination.weight;
    let BMI;
    if (height && weight) {
      BMI = (weight / (height * height)).toFixed(2);
    }

    if (!req.body.doctor) {
      console.log("Doctor ID missing in request");
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "please select doctor !"
      );
    }

    console.log("Doctor ID provided:", req.body.doctor);

    // check if super admin req then update employee assignedDoctor if not present
    if (req.user.role === "Superadmin") {
      const isDoctorAlreadyAssigned = existingUser.assignedDoctors.includes(
        new mongoose.Types.ObjectId(req.body.doctor)
      );
      if (!isDoctorAlreadyAssigned) {
        existingUser.assignedDoctors.push(req.body.doctor);
        await existingUser.save({ session });
      }
    }
    // return;
    // prepare proper data to create emr pdf

    const emrPdfAndEprescriptionData = {
      ...req.body,
      generalPhysicalExamination: {
        ...req.body.generalPhysicalExamination,
        BMI: BMI,
      },
    };

    console.log("Looking for doctor with ID:", req.body.doctor);
    const doctorInfo = await Doctor.findOne(
      { _id: req.body.doctor },
      "firstName lastName education specialization eSign medicalRegistrationNumber"
    ).session(session);

    if (!doctorInfo) {
      console.log("Doctor not found with ID:", req.body.doctor);
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Doctor not found with given ID"
      );
    }

    console.log("Found doctor:", doctorInfo._id);

    // Safely construct doctor info with fallbacks for missing properties
    const doctorInfoForGenerateEmrFn = {
      firstName: doctorInfo.firstName || "",
      lastName: doctorInfo.lastName || "",
      degree:
        doctorInfo.education &&
        Array.isArray(doctorInfo.education) &&
        doctorInfo.education.length > 0
          ? doctorInfo.education[0].degree || ""
          : "",
      specialization: doctorInfo.specialization || "",
      medicalRegistrationNumber: doctorInfo.medicalRegistrationNumber || "",
      eSign: doctorInfo.eSign || "",
    };
    const { prescribedTreatment, ...otherInfo } = emrPdfAndEprescriptionData;
    // await generateEMRPDF({ ...otherInfo, doctor: doctorInfoForGenerateEmrFn });
    const ePrescriptionDocumentCount = await eprescriptionModel
      .countDocuments({
        // user: existingUser._id,
      })
      .session(session);
    // e-prescription data format
    const ePrescriptionDataFormatted = {
      patient: {
        name: req.body.basicInfo.name,
        age: req.body.basicInfo.age,
        gender: req.body.basicInfo.gender === "M" ? "Male" : "Female",
      },
      doctor: doctorInfoForGenerateEmrFn,
      date: new Date(),
      prescriptionID: ePrescriptionDocumentCount + 1,
      sx: req.body.history.chiefComplaint,
      vitals: {
        BP: req.body.generalPhysicalExamination?.BP
          ? `${req.body.generalPhysicalExamination?.BP?.sys || ""}/${
              req.body.generalPhysicalExamination?.BP?.dia || ""
            }`
          : "",
        PR: req.body.generalPhysicalExamination?.PR || "",
        SpO2: req.body.generalPhysicalExamination?.SPO2 || "",
      },
      dx:
        Array.isArray(req.body?.diagnosis) && req.body.diagnosis.length > 0
          ? req.body.diagnosis.map((item) => ({
              dateOfDiagnosis: item?.dateOfDiagnosis || "",
              diagnosisName: item?.diagnosisName || "",
            }))
          : [
              {
                dateOfDiagnosis: "",
                diagnosisName: "",
              },
            ],
      labTest:
        Array.isArray(req.body?.diagnosis) &&
        req.body.diagnosis.length > 0 &&
        req.body.diagnosis[0]?.prescription?.length > 0
          ? req.body.diagnosis[0].prescription.map(
              (item) => item?.investigations || ""
            )
          : [],

      rx:
        Array.isArray(req.body?.diagnosis) &&
        req.body.diagnosis.length > 0 &&
        req.body.diagnosis[0]?.prescription?.length > 0
          ? req.body.diagnosis[0].prescription.map((item) => ({
              drugName: item?.drugName || "",
              freequency: item?.freequency || "",
              frequency: item?.frequency || "",
              duration: item?.duration || "",
              quantity: item?.quantity || "",
            }))
          : [
              {
                drugName: "",
                freequency: "",
                frequency: "",
                duration: "",
                quantity: "",
              },
            ],
      advice: req.body.advice ? req.body.advice.split(",") : [],
      followUpSchedule: req.body.followUpSchedule || "",
      consultationMode: req.body.consultationMode,
      originatedFromEmr: req.body.originatedFromEmr ?? true,
    };

    // console.log("ePrescriptionDataFormatted");
    // console.log(ePrescriptionDataFormatted);
    // await generatePrescriptionPDF(ePrescriptionDataFormatted);
    // // const
    // const emrPdfFileName = `emr_pdf${req.body.basicInfo.phoneNumber}.pdf`;
    // //
    // const emrPdfFile = {
    //   originalname: emrPdfFileName,
    //   filename: emrPdfFileName,
    //   mimetype: "application/pdf",
    // };
    // const ePrescriptionFileName = `eprescription_pdf${
    //   ePrescriptionDocumentCount + 1
    // }.pdf`;
    // //
    // const ePrescriptionPdfFile = {
    //   originalname: ePrescriptionFileName,
    //   filename: ePrescriptionFileName,
    //   mimetype: "application/pdf",
    // };

    // return;
    // const emrPdfFileUrl = await handleFileUpload(emrPdfFile);
    // const ePrescriptionPdfFileUrl = await handleFileUpload(
    //   ePrescriptionPdfFile
    // );
    // // create new e prescription
    const newEprescription = new eprescriptionModel({
      ...ePrescriptionDataFormatted,
      user: existingUser._id,
    });

    // await newEprescription.save();
    // return;
    const newEMR =
      existingUser.gender === "F"
        ? new AdultFemaleEMR({
            ...req.body,
            generalPhysicalExamination: {
              ...req.body.generalPhysicalExamination,
              BMI: BMI,
            },
          })
        : new AdultMaleEMR({
            ...req.body,
            generalPhysicalExamination: {
              ...req.body.generalPhysicalExamination,
              BMI: BMI,
            },
          });

    // check if appointmentId is present then update the appointment table
    if (appointmentId) {
      const existingAppointment = await patientAppointmentModel
        .findOne({
          patientId: existingUser._id,
        })
        .session(session);
      //
      if (!existingAppointment) {
        return Response.error(
          res,
          404,
          AppConstant.FAILED,
          "appointment not found !"
        );
      }
      // update appointment table
      existingAppointment.prescriptionId = newEprescription._id;
      existingAppointment.emrId = newEMR._id;
      existingAppointment.status = "completed";
      await existingAppointment.save({ session });
    }

    //  <============ current conditions  ==============>
    const currentConditions =
      req.body.diagnosis && req.body.diagnosis.length > 0
        ? req.body.diagnosis.map((item) => {
            return {
              userId: existingUser._id,
              emrId: newEMR._id,
              dateOfDiagnosis: item?.dateOfDiagnosis || null,
              diagnosisName: item?.diagnosisName || null,
              drugName:
                item.prescription && item.prescription.length > 0
                  ? item.prescription.map((presItem) => presItem.drugName)
                  : [],
              freequency:
                item.prescription && item.prescription.length > 0
                  ? item.prescription.map((presItem) => presItem.freequency)
                  : [] || null,
              quantity: item?.quantity || null,
              referralNeeded: newEMR?.referrals || "",
              advice: newEMR?.advice || "",
            };
          })
        : null;
    //  <============ allergies  ==============>
    const allergies =
      req.body.history.allergies &&
      (req.body.history.allergies.pastAllergyPrescription ||
        req.body.history.allergies.newAllergyPrescription)
        ? [
            // Process past allergy prescriptions
            ...(req.body.history.allergies.pastAllergyPrescription || []).map(
              (item) => {
                // Extract drug information for the allergy model
                const pastAllergyDrugName = item.drugs
                  ? item.drugs.map((drug) => drug.drugName)
                  : [];
                const pastAllergyFreequency = item.drugs
                  ? item.drugs.map((drug) => drug.frequency)
                  : [];

                return {
                  userId: existingUser._id,
                  emrId: newEMR._id,
                  doctorId: newEMR.doctor,
                  allergyName: item?.allergyName || "",
                  pastAllergyDrugName: pastAllergyDrugName,
                  pastAllergyFreequency: pastAllergyFreequency,
                  advisedBy: item?.diagnosedBy || "",
                  advise: item?.pastAllergyNotes || "",
                  adviseAllergyDrugName: [],
                  adviseAllergyFreequency: [],
                };
              }
            ),
            // Process new allergy prescriptions
            ...(req.body.history.allergies.newAllergyPrescription || []).map(
              (item) => {
                // Extract drug information for the allergy model
                const adviseAllergyDrugName = item.drugs
                  ? item.drugs.map((drug) => drug.drugName)
                  : [];
                const adviseAllergyFreequency = item.drugs
                  ? item.drugs.map((drug) => drug.frequency)
                  : [];

                return {
                  userId: existingUser._id,
                  emrId: newEMR._id,
                  doctorId: newEMR.doctor,
                  allergyName: item?.allergyName || "",
                  pastAllergyDrugName: [],
                  pastAllergyFreequency: [],
                  advisedBy: item?.diagnosedBy || "",
                  advise: item?.pastAllergyNotes || "",
                  adviseAllergyDrugName: adviseAllergyDrugName,
                  adviseAllergyFreequency: adviseAllergyFreequency,
                };
              }
            ),
          ]
        : null;
    //  <============ immunizations  ==============>
    const immunizations =
      req.body.immunization && req.body.immunization.length > 0
        ? req.body.immunization.map((item) => {
            return {
              userId: existingUser._id,
              emrId: newEMR._id,
              doctorId: newEMR.doctor,
              immunizationType: item?.immunizationType || "",
              vaccinationName: item?.vaccinationName || "",
              totalDose: item?.totalDose || null,
              doseDates: item?.doseDates || null,
              doctorName: item?.doctorName || "",
              sideEffects: item?.sideEffects || "",
              immunizationNotes: item?.immunizationNotes || "",
            };
          })
        : null;

    // <=========== default bp if  have  ========>
    if (
      req.body.generalPhysicalExamination &&
      req.body.generalPhysicalExamination &&
      req.body.generalPhysicalExamination?.BP
    ) {
      const { sys, dia } = req.body.generalPhysicalExamination?.BP;
      if (sys && dia) {
        const patientBpGoal = await patientBpGoalModel
          .findOne({ patientId: existingUser._id })
          .sort({ createdAt: -1 })
          .session(session);

        // console.log({
        //   patientId: existingUser._id,
        //   sys,
        //   dia,
        //   sysGoal: patientBpGoal ? patientBpGoal.sysGoal : 120,
        //   diaGoal: patientBpGoal ? patientBpGoal.diaGoal : 80,
        // });

        const newPatientBp = new patientBpModel({
          patientId: existingUser._id,
          sys,
          dia,
          sysGoal: patientBpGoal ? patientBpGoal.sysGoal : 120,
          diaGoal: patientBpGoal ? patientBpGoal.diaGoal : 80,
        });
        await newPatientBp.save({ session });
      }
    }

    if (currentConditions && currentConditions.length) {
      // console.log("currentConditions");
      // console.log(currentConditions);

      await currentConditionModel.insertMany(currentConditions, { session });
    }
    if (allergies && allergies.length) {
      // console.log("allergies");
      // console.log(allergies);

      await allergyModel.insertMany(allergies, { session });
    }
    if (immunizations && immunizations.length) {
      // console.log("immunizations");
      // console.log(immunizations);

      await immunizationModel.insertMany(immunizations, { session });
    }

    // console.log(newEprescription);
    await newEprescription.save({ session });
    await newEMR.save({ session });
    await session.commitTransaction();

    // Create medicine schedule from the EMR and include in response
    let medicineSchedule = null;
    try {
      medicineSchedule =
        await medicineScheduleController.hookCreateMedicineSchedule(newEMR);
      console.log(
        "Medicine schedule created successfully:",
        medicineSchedule ? medicineSchedule._id : "None"
      );
    } catch (scheduleErr) {
      console.error("Error creating medicine schedule:", scheduleErr);
      // Don't fail the whole EMR creation if schedule creation fails
    }

    await sendEMRCreationMsg(existingUser.phone);

    return Response.success(
      res,
      {
        emr: newEMR,
        medicineSchedule: medicineSchedule,
      },
      201,
      "EMR created successfully !"
    );
  } catch (err) {
    await session.abortTransaction();

    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error !"
    );
  } finally {
    session.endSession();
  }
};

module.exports = { createEMR };
