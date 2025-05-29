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
const {
  getFormattedBasicInfo,
  defaultHistory,
  getFormattedGeneralPhysicalExamination,
  getFormattedSystemicExamination,
  defaultGynaecologicalHistory,
  getFormattedDiagnosisData,
  defaultImmunization
} = require('../../../utils/helper.js');

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
    const latestEmrPromise = EMR.aggregate([
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
          bloodGroup: {
            $ifNull: ['$basicInfo.bloodGroup', 'not known']
          },
          advice: 1,
          referrals: 1,
          followUpSchedule: 1,
        },
      },
    ]);

    // Retrive past EMR history excluding the latest one
    const pastEmrHistoryPromise = EMR.aggregate([
      // First get the latest EMR
      {
        $match: { user: userObjectId },
      },
      {
        $sort: { createdAt: -1 },
      },
      { $skip: 1 },
      {
        $limit: 2,
      }
    ]);

    // Get all current conditions
    const currentConditionsPromise = currentConditionModel.find(
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
    const allergiesPromise = allergyModel.find(
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
    const immunizationsPromise = immunizationModel.find(
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

    const [
      [latestEmr],
      pastEmrHistory,
      currentConditions,
      allergies,
      immunizations,
    ] = await Promise.all([
      latestEmrPromise,
      pastEmrHistoryPromise,
      currentConditionsPromise,
      allergiesPromise,
      immunizationsPromise,
    ]);

    const pastComplaints = pastEmrHistory.flatMap(emr => {
      if (emr.complaints && emr.complaints.length > 0) {
        return emr.complaints.map(complaint => ({
          chiefComplaint: complaint.chiefComplaint || "",
          historyOfPresentingIllness: complaint.historyOfPresentingIllness || "",
          date: emr.createdAt,
        }));
      } else {
        return [{
          chiefComplaint: emr?.history?.chiefComplaint || "",
          historyOfPresentingIllness: emr?.history?.historyOfPresentingIllness || "",
          date: emr?.createdAt,
        }];
      }
    }) || [];

   const formattedBasicInfo = getFormattedBasicInfo(userData, latestEmr);
   const defaultHistoryData = defaultHistory(allergies);
   const formattedGeneralPhysicalExamination = getFormattedGeneralPhysicalExamination(latestEmr);
   const formattedSystemicExamination = getFormattedSystemicExamination(latestEmr)
   const formattedDiagnosisData = getFormattedDiagnosisData(currentConditions);

    // Construct form data object
    const formData = {
      user: userId,
      role,
      pastComplaints,
      basicInfo: formattedBasicInfo,
      history: latestEmr
        ? {
            ...latestEmr.history,
            allergies: defaultHistoryData.allergies
          }
        : defaultHistoryData,
      immunization: immunizations.length
        ? immunizations
        : defaultImmunization,
      generalPhysicalExamination: formattedGeneralPhysicalExamination,
      systemicExamination: formattedSystemicExamination,
      diagnosis: formattedDiagnosisData,
      advice: (latestEmr && latestEmr.advice) || "",
      referrals: (latestEmr && latestEmr.referrals) || "",
      followUpSchedule: (latestEmr && latestEmr.followUpSchedule) || "",
      doctorNotes: (latestEmr && latestEmr.doctorNotes) || "",
      consultationMode: (latestEmr && latestEmr.consultationMode) || "on site",
      doctor: (latestEmr && latestEmr.doctor) || "",
    };

    // Only include gynaecologicalHistory if user is female
    if (userData.gender === "F") {
      formData.gynaecologicalHistory = latestEmr?.gynaecologicalHistory || defaultGynaecologicalHistory;
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
