const PatientPrGoal = require("../../../../models/patient/healthTracker/pr/patientPrGoal.model");
const PatientPr = require("../../../../models/patient/healthTracker/pr/patientPr.model");
const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const dayjs = require("dayjs");
const {
  patientPrGoalValidationSchema,
  patientPrValidationSchema,
} = require("../../../../validators/patient/healthTracker/patientPr.validator");

// Create Pulse Rate Goal
const createPatientPrGoal = async (req, res) => {
  try {
    const { error } = patientPrGoalValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    const newPrGoal = new PatientPrGoal(req.body);
    const savedPrGoal = await newPrGoal.save();

    return Response.success(
      res,
      savedPrGoal,
      201,
      "Pulse rate goal created successfully!"
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

// Create Pulse Rate Record
const createPatientPr = async (req, res) => {
  try {
    const { error } = patientPrValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    const { patientId } = req.body;

    // Check for latest Pulse Rate goal
    const latestPrGoal = await PatientPrGoal.findOne({ patientId }).sort({
      createdAt: -1,
    });

    if (!latestPrGoal) {
      const defaultGoal = new PatientPrGoal({
        patientId,
        prGoal: 75,
        measurementUnit: "bpm",
      });
      await defaultGoal.save();
    }

    const newPr = new PatientPr({
      ...req.body,
      prGoal: latestPrGoal?.prGoal || 75,
      measurementUnit: latestPrGoal?.measurementUnit || "bpm",
    });
    const savedPr = await newPr.save();

    return Response.success(
      res,
      savedPr,
      201,
      "Pulse rate record created successfully!"
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

// Get Pulse Rate Records by Date Range
const getAllPatientPrByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, patientId } = req.body;

    // Set start date to beginning of day (00:00:00)
    const startDateTime = dayjs(startDate).startOf("day").toDate();
    // Set end date to end of day (23:59:59)
    const endDateTime = dayjs(endDate).endOf("day").toDate();

    const data = await PatientPr.find(
      {
        patientId,
        date: {
          $gte: startDateTime,
          $lte: endDateTime,
        },
      },
      "patientId pr prGoal date measurementUnit"
    );

    return Response.success(
      res,
      data,
      200,
      "Pulse rate records fetched successfully!"
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

// Get Current Pulse Rate Goal
const getCurrentPatientPrGoal = async (req, res) => {
  try {
    const { patientId } = req.body;

    if (!patientId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Patient ID is missing!"
      );
    }

    const currentPrGoal = await PatientPrGoal.findOne({ patientId }).sort({
      createdAt: -1,
    });

    if (!currentPrGoal) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Pulse rate goal not found!"
      );
    }

    return Response.success(
      res,
      currentPrGoal,
      200,
      "Current pulse rate goal retrieved successfully!"
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
  createPatientPrGoal,
  createPatientPr,
  getAllPatientPrByDateRange,
  getCurrentPatientPrGoal,
};
