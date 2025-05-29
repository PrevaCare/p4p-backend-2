const mongoose = require("mongoose");
const AppConstant = require("../../utils/AppConstant");
const userModel = require("../../models/common/user.model");
const Response = require("../../utils/Response");
const labModel = require("../../models/lab/lab.model");
const corporatePlanModel = require("../../models/corporates/corporatePlan.model");
const patientAppointmentModel = require("../../models/patient/patientAppointment/patientAppointment.model");

const deleteEmployeeOrIndividualUser = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Patient ID is required!"
      );
    }

    const existingUser = await userModel.findOne({
      _id: patientId,
      $or: [{ role: "Employee" }, { role: "IndividualUser" }],
    });

    if (!existingUser) {
      return Response.error(res, 404, AppConstant.FAILED, "User not found!");
    }

    // console.log("existing user!");

    // Define delete operations for each model
    // const deleteOperations = [
    //   { model: "Insurance", filter: { user: patientId } },
    //   { model: "Appointment", filter: { patientId } },
    //   { model: "EMR", filter: { user: patientId } },
    //   { model: "Eprescription", filter: { user: patientId } },
    //   { model: "LabReport", filter: { user: patientId } },
    //   { model: "ExistingPatientEMR", filter: { user: patientId } },
    //   { model: "ExistingPatientEprescription", filter: { user: patientId } },
    //   { model: "ExistingPatientLabReport", filter: { user: patientId } },
    //   { model: "allergies", filter: { patientId } },
    //   { model: "CurrentCondition", filter: { userId: patientId } },
    //   { model: "Immunization", filter: { userId: patientId } },
    //   { model: "CoronaryHeartDiseaseAssessment", filter: { user: patientId } },
    //   { model: "DiabeticRiskCalculator", filter: { user: patientId } },
    //   { model: "LiverRiskCalculator", filter: { user: patientId } },
    //   { model: "StrokeRiskCalculator", filter: { user: patientId } },
    //   { model: "HealthScore", filter: { user: patientId } },
    //   { model: "HealthTracker", filter: { user: patientId } },
    //   { model: "PatientAppointmentPayment", filter: { patientId } },
    //   { model: "PatientBloodGlucose", filter: { patientId } },
    //   { model: "PatientBloodGlucoseGoal", filter: { patientId } },
    //   { model: "PatientBmi", filter: { patientId } },
    //   { model: "PatientBmiGoal", filter: { patientId } },
    //   { model: "PatientBP", filter: { patientId } },
    //   { model: "PatientBPGoal", filter: { patientId } },
    //   { model: "PatientMood", filter: { patientId } },
    //   { model: "PatientPr", filter: { patientId } },
    //   { model: "PatientPrGoal", filter: { patientId } },
    //   { model: "PatientSleep", filter: { patientId } },
    //   { model: "PatientSleepGoal", filter: { patientId } },
    //   { model: "PatientSpo2", filter: { patientId } },
    //   { model: "PatientSpo2Goal", filter: { patientId } },
    //   { model: "PatientWaterIntake", filter: { patientId } },
    //   { model: "PatientWaterIntakeGoal", filter: { patientId } },
    //   { model: "PatientWeight", filter: { patientId } },
    //   { model: "PatientWeightGoal", filter: { patientId } },
    // ];

    // // Execute delete operations for each model
    // for (const operation of deleteOperations) {
    //   const Model = mongoose.model(operation.model);
    //   await Model.deleteMany(operation.filter).session(session);
    // }

    // Delete the user
    await userModel.deleteOne({ _id: patientId });

    // Commit the transaction
    return Response.success(res, null, 200, "User data deleted successfully");
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

// delete doctor
const deleteDoctorById = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "doctor Id is required!"
      );
    }

    // Find and verify doctor exists
    const existingUser = await userModel.findOne({
      _id: doctorId,
      role: "Doctor",
    });

    if (!existingUser) {
      return Response.error(res, 404, AppConstant.FAILED, "Doctor not found!");
    }
    await userModel.findByIdAndDelete(doctorId);
    await patientAppointmentModel.deleteMany({ doctorId });

    return Response.success(res, null, 200, "Doctor data deleted successfully");
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

// corporate delete
const deleteCorporateUser = async (req, res) => {
  try {
    const { corporateId } = req.params;

    if (!corporateId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Corporate ID is required!"
      );
    }

    // Verify corporate exists
    const existingCorporate = await userModel.findOne({
      _id: corporateId,
      role: "Corporate",
    });

    if (!existingCorporate) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Corporate user not found!"
      );
    }
    await userModel.findByIdAndDelete(corporateId);
    await corporatePlanModel.deleteMany({ corporateId });

    return Response.success(res, null, 200, "Corporate deleted successfully");
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

// const executeBatchOperations = async (operations, session) => {
//   const batchSize = 5; // Define a reasonable batch size
//   for (let i = 0; i < operations.length; i += batchSize) {
//     const batch = operations.slice(i, i + batchSize);
//     await Promise.all(batch); // Execute a smaller batch of operations
//   }
// };

const deleteLabById = async (req, res) => {
  try {
    const { labId } = req.params;
    if (!labId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Lab ID is required!"
      );
    }
    const existingLab = await labModel.findById(labId);
    if (!existingLab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found!");
    }
    const deleteLab = await labModel.findByIdAndDelete(labId);
    return Response.success(res, null, 200, "Lab deleted successfully");
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
  deleteEmployeeOrIndividualUser,
  deleteDoctorById,
  deleteCorporateUser,
  deleteLabById,
};
