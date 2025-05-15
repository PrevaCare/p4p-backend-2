const Response = require("../../../../../utils/Response.js");
const AppConstant = require("../../../../../utils/AppConstant.js");
const EMR = require("../../../../../models/common/emr.model.js");
// fetch data from the last emr , allergy immunization and current condition
const mongoose = require("mongoose");
const Employee = require("../../../../../models/patient/employee/employee.model.js");
const IndividualUser = require("../../../../../models/individualUser/induvidualUser.model.js");
const {
  convertToDDMMMYYYY,
} = require("../../../../../utils/dateFormat/dateFormat.utils.js");
const immunizationModel = require("../../../../../models/patient/healthSummary/immunization.model.js");
const currentConditionModel = require("../../../../../models/patient/healthSummary/currentCondition.model.js");
const allergyModel = require("../../../../../models/patient/healthSummary/allergy.model.js");
const dayjs = require("dayjs");

const getSingleEmployeeAllEmrForCard = async (req, res) => {
  try {
    // for admin and doctor --> take employeeId as params
    const { employeeId } = req.body;
    const p4pEmr = await EMR.find(
      { user: employeeId },
      "createdAt doctor"
    ).populate({
      path: "doctor",
      select: "firstName lastName specialization",
    });

    const responseData = p4pEmr.map((emr) => {
      const { _id, createdAt, doctor } = emr.toObject();
      // console.log(doctor.firstName);
      return {
        _id,
        date: convertToDDMMMYYYY(createdAt),
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        speciality: doctor.specialization,
        documentType: "Doctor visit",
        hospitalName: "Preva care",
      };
    });

    return Response.success(
      res,
      responseData,
      200,
      AppConstant.SUCCESS,
      "Total EMR of an employee found !"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error !"
    );
  }
};

// get  individual emr of employee by id
const getIndividualEmployeeEmr = async (req, res) => {
  try {
    const { emrId } = req.body;
    if (!emrId) {
      return Response.error(res, 404, AppConstant.FAILED, "emr id missing !");
    }

    const existingEmr = await EMR.findById(emrId);
    const responseData = existingEmr.toObject();

    return Response.success(
      res,
      { ...responseData, date: convertToDDMMMYYYY(responseData.createdAt) },
      200,
      AppConstant.SUCCESS,
      "EMR of an employee found !"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error !"
    );
  }
};

// get lastEMR of corporate employee by employee id;
const getLastEmrOfCorporateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "employee id is missing!"
      );
    }

    // Find the last EMR for the employee by sorting in descending order
    // and limiting to 1 result
    const lastEmr = await EMR.findOne(
      { user: employeeId },
      {},
      {
        sort: { createdAt: -1 }, // Sort by createdAt in descending order
      }
    );

    if (!lastEmr) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "No EMR found for this employee!"
      );
    }

    // const responseData = lastEmr.toObject();

    return Response.success(
      res,
      lastEmr,
      200,
      AppConstant.SUCCESS,
      "Latest EMR of employee found!"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

const getInitialEmrFormData = async (req, res) => {
  try {
    // const { userId } = req.params;
    const { userId, role } = req.body;

    // Convert userId to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get user data first to ensure user exists
    const UserModel = role === "Employee" ? Employee : IndividualUser;

    const [userData] = await UserModel.aggregate([
      {
        $match: { _id: userObjectId },
      },
      {
        $project: {
          _id: 0,
          firstName: 1,
          lastName: 1,
          age: 1,
          gender: 1,
          isMarried: 1,
          phone: 1,
          address: 1,
          children: 1,
        },
      },
    ]);

    if (!userData) {
      return Response.error(res, 404, AppConstant.FAILED, "User not found!");
    }

    // Main aggregation pipeline to get EMR and related data
    const [latestEmr] = await EMR.aggregate([
      // First get the latest EMR
      {
        $match: { user: userObjectId },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $limit: 1,
      },
      // Project EMR fields
      {
        $project: {
          _id: 0,
          history: 1,
          generalPhysicalExamination: 1,
          systemicExamination: 1,
          gynaecologicalHistory: 1,
          doctorNotes: 1,
          consultationMode: 1,
          doctor: 1,
          bloodGroup: 1,
          advice: 1,
          referrals: 1,
          followUpSchedule: 1,
        },
      },
    ]);

    // Get all current conditions
    const currentConditions = await currentConditionModel.find(
      { userId: userObjectId },
      {
        dateOfDiagnosis: 1,
        diagnosisName: 1,
        prescription: 1,
        referralNeeded: 1,
        advice: 1,
      }
    );

    // Get all allergies
    const allergies = await allergyModel.find(
      { userId: userObjectId },
      {
        allergyName: 1,
        pastAllergyDrugName: 1,
        pastAllergyFreequency: 1,
        advisedBy: 1,
        advise: 1,
        adviseAllergyDrugName: 1,
        adviseAllergyFreequency: 1,
      }
    );

    // Get all immunizations
    const immunizations = await immunizationModel.find(
      { userId: userObjectId },
      {
        _id: 0,
        immunizationType: 1,
        vaccinationName: 1,
        totalDose: 1,
        doseDates: 1,
        doctorName: 1,
        sideEffects: 1,
        immunizationNotes: 1,
      }
    );

    // Initialize empty surgicalHistory array
    const surgicalHistory = [];

    // Construct form data object
    const formData = {
      user: userId,
      role,
      basicInfo: {
        name: `${userData.firstName} ${userData.lastName}`,
        age: userData.age || "",
        children: userData.children || 0,
        gender: userData.gender || "",
        phoneNumber: userData.phone || "",
        maritalStatus: userData.isMarried || false,
        bloodGroup: (latestEmr && latestEmr.bloodGroup) || "not known",
        address: userData.address
          ? {
              name: userData.address.name || "",
              street: userData.address.street || "",
              city: userData.address.city || "",
              state: userData.address.state || "",
              zipCode: userData.address.zipCode || "",
            }
          : {
              name: "",
              street: "",
              city: "",
              state: "",
              zipCode: "",
            },
      },
      history: latestEmr
        ? {
            ...latestEmr.history,
            allergies:
              allergies && allergies.length > 0
                ? allergies?.map((item) => ({
                    allergyName: item.allergyName || "",
                    pastAllergyDrugName: item.pastAllergyDrugName || [],
                    pastAllergyFreequency: item.pastAllergyFreequency || [],
                    advisedBy: item.advisedBy || "",
                    advise: item.advise || "",
                    adviseAllergyDrugName: item.adviseAllergyDrugName || [],
                    adviseAllergyFreequency: item.adviseAllergyFreequency || [],
                  }))
                : [
                    {
                      allergyName: "",
                      pastAllergyDrugName: [],
                      pastAllergyFreequency: [],
                      advisedBy: "",
                      advise: "",
                      adviseAllergyDrugName: [],
                      adviseAllergyFreequency: [],
                    },
                  ],
          }
        : {
            chiefComplaint: "",
            historyOfPresentingIllness: "",
            pastHistory: [
              {
                sufferingFrom: "",
                drugName: [],
                freequency: [],
                readings: "",
                pastHistoryNotes: "",
              },
            ],
            surgicalHistory: [],
            allergies:
              allergies && allergies.length > 0
                ? allergies.map((item) => ({
                    allergyName: item.allergyName || "",
                    pastAllergyDrugName: item.pastAllergyDrugName || [],
                    pastAllergyFreequency: item.pastAllergyFreequency || [],
                    advisedBy: item.advisedBy || "",
                    advise: item.advise || "",
                    adviseAllergyDrugName: item.adviseAllergyDrugName || [],
                    adviseAllergyFreequency: item.adviseAllergyFreequency || [],
                  }))
                : [
                    {
                      allergyName: "",
                      pastAllergyDrugName: [],
                      pastAllergyFreequency: [],
                      advisedBy: "",
                      advise: "",
                      adviseAllergyDrugName: [],
                      adviseAllergyFreequency: [],
                    },
                  ],
            previousSurgeries: "",
            habits: {
              smoking: false,
              packYears: "",
              alcohol: false,
              alcoholDetails: "",
              qntPerWeek: "",
              substanceAbuse: "NONE",
            },
            bowelAndBladder: "NORMAL AND REGULAR",
            appetite: "ADEQUATE",
            sleep: "",
            depressionScreening: {
              desc: "",
              recomendation: "",
              score: "",
            },
            stressScreening: {
              desc: "",
              recomendation: "",
              score: "",
            },
            mentalHealthAssessment: "",
          },
      immunization: immunizations.length
        ? immunizations
        : [
            {
              immunizationType: "up to date",
              vaccinationName: "",
              totalDose: 1,
              doseDates: [
                {
                  date: new Date(),
                  status: "due",
                },
              ],
              doctorName: "",
              sideEffects: "",
              immunizationNotes: "",
            },
          ],
      generalPhysicalExamination: latestEmr
        ? {
            PR: latestEmr?.generalPhysicalExamination?.PR,
            BP: {
              sys: latestEmr?.generalPhysicalExamination?.BP?.sys,
              dia: latestEmr?.generalPhysicalExamination?.BP?.dia,
            },
            volume: latestEmr?.generalPhysicalExamination?.volume,
            regularity:
              latestEmr?.generalPhysicalExamination?.regularity || "regular",
            character:
              latestEmr?.generalPhysicalExamination?.character || "normal",
            temperature:
              latestEmr?.generalPhysicalExamination?.temperature || "afebrile",
            RR: latestEmr?.generalPhysicalExamination?.RR || "",
            SPO2: latestEmr?.generalPhysicalExamination?.SPO2 || "",
            radioFemoralDelay:
              latestEmr?.generalPhysicalExamination?.radioFemoralDelay ||
              "NONE",
            height: latestEmr?.generalPhysicalExamination?.height || "",
            weight: latestEmr?.generalPhysicalExamination?.weight || "",
            pallor: latestEmr?.generalPhysicalExamination?.pallor || "absent",
            icterus: latestEmr?.generalPhysicalExamination?.icterus || "absent",
            cyanosis:
              latestEmr?.generalPhysicalExamination?.cyanosis || "absent",
            clubbing:
              latestEmr?.generalPhysicalExamination?.clubbing || "absent",
            lymphadenopathy:
              latestEmr?.generalPhysicalExamination?.edema || "absent",
            edema:
              latestEmr?.generalPhysicalExamination?.lymphadenopathy ||
              "absent",
            JVP: latestEmr?.generalPhysicalExamination?.JVP || "not raised",
          }
        : {
            PR: "",
            BP: { sys: "", dia: "" },
            volume: "full",
            regularity: "regular",
            character: "normal",
            temperature: "afebrile",
            RR: "",
            SPO2: "",
            radioFemoralDelay: "NONE",
            height: "",
            weight: "",
            pallor: "absent",
            icterus: "absent",
            cyanosis: "absent",
            clubbing: "absent",
            lymphadenopathy: "absent",
            edema: "absent",
            JVP: "not raised",
          },
      systemicExamination:
        latestEmr && latestEmr.systemicExamination
          ? {
              respiratorySystem:
                latestEmr.systemicExamination?.respiratorySystem ||
                "normal vesicular breath sounds",
              CVS:
                latestEmr.systemicExamination?.CVS ||
                "S1 S2 PRESENT, NO ADDED SOUNDS",
              CNS:
                latestEmr.systemicExamination?.CNS ||
                "NO FOCAL NEUROLOGICAL DEFICIT",
              PA:
                latestEmr.systemicExamination?.PA ||
                "SOFT, NORMAL BOWEL SOUNDS PRESENT",
              otherSystemicFindings:
                latestEmr.systemicExamination?.otherSystemicFindings ||
                "NOTHING SIGNIFICANT",
            }
          : {
              respiratorySystem: "normal vesicular breath sounds",
              CVS: "S1 S2 PRESENT, NO ADDED SOUNDS",
              CNS: "NO FOCAL NEUROLOGICAL DEFICIT",
              PA: "SOFT, NORMAL BOWEL SOUNDS PRESENT",
              otherSystemicFindings: "NOTHING SIGNIFICANT",
            },
      diagnosis: currentConditions.length
        ? currentConditions.map((condition) => ({
            dateOfDiagnosis: condition.dateOfDiagnosis
              ? dayjs(condition.dateOfDiagnosis).format("YYYY-MM-DD")
              : "",
            diagnosisName: condition.diagnosisName || "",
            prescription: condition.prescription || [],
          }))
        : [
            {
              dateOfDiagnosis: "",
              diagnosisName: "",
              prescription: [],
            },
          ],
      advice: (latestEmr && latestEmr.advice) || "",
      referrals: (latestEmr && latestEmr.referrals) || "",
      followUpSchedule: (latestEmr && latestEmr.followUpSchedule) || "",
      doctorNotes: (latestEmr && latestEmr.doctorNotes) || "",
      consultationMode: (latestEmr && latestEmr.consultationMode) || "on site",
      doctor: (latestEmr && latestEmr.doctor) || "",
    };

    // Only include gynaecologicalHistory if user is female
    if (userData.gender === "F") {
      formData.gynaecologicalHistory = (latestEmr &&
        latestEmr.gynaecologicalHistory) || {
        ageOfMenarche: "",
        cycleDuration: "",
        cycleRegularity: "regular",
        daysOfBleeding: "",
        padsUsedPerDay: "",
        passageOfClots: "",
        complaints: "",
        previousHistory: "",
        obstetricHistory: {
          gScore: 0,
          pScore: 0,
          lScore: 0,
          aScore: "",
          partnerBloodGroup: "",
          conceptions: [
            {
              ageAtConception: "",
              modeOfConception: "",
              modeOfDelivery: "",
              complications: "",
            },
          ],
          primigravidaWeeks: "",
          isPregnant: false,
          EDD: "",
          symptoms: "",
          examination: "",
          USGScans: "due",
          TDDoseTaken: "",
          prenatalScreeningReports: "",
          prenatalVitamins: false,
          freshComplaint: "",
          nutritionalHistory: "",
          treatingGynaecologistName: "",
          gynaecologistAddress: "",
        },
      };
    }
    // Explicitly remove gynaecologicalHistory if user is not female
    else if (formData.gynaecologicalHistory) {
      delete formData.gynaecologicalHistory;
    }

    return Response.success(
      res,
      formData,
      200,
      AppConstant.SUCCESS,
      "Form data initialized successfully!"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

module.exports = {
  getSingleEmployeeAllEmrForCard,
  getIndividualEmployeeEmr,
  getLastEmrOfCorporateEmployee,
  getInitialEmrFormData,
};
