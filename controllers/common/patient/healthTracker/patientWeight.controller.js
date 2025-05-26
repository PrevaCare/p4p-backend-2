const patientWeightModel = require("../../../../models/patient/healthTracker/weight/patientWeight.model");
const patientWeightGoalModel = require("../../../../models/patient/healthTracker/weight/patientWeightGoal.model");
const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const {
  patientWeightGoalValidationSchema,
  patientWeightValidationSchema,
} = require("../../../../validators/patient/healthTracker/patientWeight.validator");

const dayjs = require("dayjs");

// Create Weight Goal
const createPatientWeightGoal = async (req, res) => {
  try {
    const { error } = patientWeightGoalValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    const newWeightGoal = new patientWeightGoalModel(req.body);
    const savedWeightGoal = await newWeightGoal.save();

    return Response.success(
      res,
      savedWeightGoal,
      201,
      "Weight goal created successfully!"
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

// Create Weight Entry
const createPatientWeight = async (req, res) => {
  try {
    const { error } = patientWeightValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    const { patientId } = req.body;

    // Check for latest weight goal, or set a default one
    const latestWeightGoal = await patientWeightGoalModel
      .findOne({
        patientId,
      })
      .sort({ createdAt: -1 });

    if (!latestWeightGoal) {
      const defaultGoal = new patientWeightGoalModel({
        patientId,
        weightGoal: 70,
        measurementUnit: "Kg",
      });
      await defaultGoal.save();
    }

    const newWeight = new patientWeightModel({
      ...req.body,
      weightGoal: latestWeightGoal?.weightGoal || 70,
      measurementUnit: latestWeightGoal?.measurementUnit || "Kg",
    });
    const savedWeight = await newWeight.save();

    return Response.success(
      res,
      savedWeight,
      201,
      "Weight record created successfully!"
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

// Get Weight Records by Date Range
const getAllPatientWeightsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, patientId } = req.body;

    // Set start date to beginning of day (00:00:00)
    const startDateTime = dayjs(startDate).startOf("day").toDate();
    // Set end date to end of day (23:59:59)
    const endDateTime = dayjs(endDate).endOf("day").toDate();

    const data = await patientWeightModel
      .find(
        {
          patientId,
          date: {
            $gte: startDateTime,
            $lte: endDateTime,
          },
        },
        "patientId weight weightGoal date measurementUnit"
      )
      .sort({ date: -1 });

    return Response.success(
      res,
      data,
      200,
      "Weight records fetched successfully!"
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

// Get Current Weight Goal
const getCurrentPatientWeightGoal = async (req, res) => {
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

    const currentWeightGoal = await patientWeightGoalModel
      .findOne({
        patientId,
      })
      .sort({ createdAt: -1 });

    if (!currentWeightGoal) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Weight goal not found!"
      );
    }

    return Response.success(
      res,
      currentWeightGoal,
      200,
      "Current weight goal retrieved successfully!"
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
  createPatientWeightGoal,
  createPatientWeight,
  getAllPatientWeightsByDateRange,
  getCurrentPatientWeightGoal,
};
