const waterIntakeModel = require("../../../../models/patient/healthTracker/waterIntake/patientWaterIntake.model");
const waterIntakeGoalModel = require("../../../../models/patient/healthTracker/waterIntake/patientWaterIntakeGoal.model");
const Response = require("../../../../utils/Response");
const AppConstant = require("../../../../utils/AppConstant");
const dayjs = require("dayjs");
const {
  patientWaterIntakeGoalValidation,
  patientWaterIntakeValidation,
} = require("../../../../validators/patient/healthTracker/patientWaterIntake.validator");
// const {
//   waterIntakeValidationSchema,
//   waterIntakeGoalValidationSchema,
// } = require("../../../../validators/patient/healthTracker/waterIntake.validator");

// Create water intake goal
const createWaterIntakeGoal = async (req, res) => {
  try {
    const { error } = patientWaterIntakeGoalValidation.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    const newWaterIntakeGoal = new waterIntakeGoalModel(req.body);
    const savedWaterIntakeGoal = await newWaterIntakeGoal.save();

    return Response.success(
      res,
      savedWaterIntakeGoal,
      201,
      "User water intake goal created successfully!"
    );
  } catch (err) {
    return Response.error(
      res,
      400,
      AppConstant.FAILED,
      err.message || "Internal server failed!"
    );
  }
};

// Create water intake
const createWaterIntake = async (req, res) => {
  try {
    const { error } = patientWaterIntakeValidation.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    const { patientId } = req.body;

    // Check latest water intake goal, if not found, create a default goal
    const latestGoal = await waterIntakeGoalModel
      .findOne({ patientId })
      .sort({ createdAt: -1 });

    if (!latestGoal) {
      const setDefaultGoal = new waterIntakeGoalModel({
        patientId,
        waterIntakeGoal: 3, // Default goal in liters
      });
      await setDefaultGoal.save();
    }

    const newWaterIntake = new waterIntakeModel({
      ...req.body,
      waterIntakeGoal: latestGoal?.waterIntakeGoal || 3, // Use the latest goal or default value
    });
    const savedWaterIntake = await newWaterIntake.save();

    return Response.success(
      res,
      savedWaterIntake,
      201,
      "User water intake record created successfully!"
    );
  } catch (err) {
    return Response.error(
      res,
      400,
      AppConstant.FAILED,
      err.message || "Internal server failed!"
    );
  }
};

// Get water intake records by date range
const getAllWaterIntakeByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, patientId } = req.body;

    // Set start date to beginning of day (00:00:00)
    const startDateTime = dayjs(startDate).startOf("day").toDate();
    // Set end date to end of day (23:59:59)
    const endDateTime = dayjs(endDate).endOf("day").toDate();

    const data = await waterIntakeModel
      .find(
        {
          patientId,
          date: {
            $gte: startDateTime,
            $lte: endDateTime,
          },
        },
        "patientId waterIntake waterIntakeGoal measurementUnit date"
      )
      .sort({ date: -1 });

    return Response.success(
      res,
      data,
      200,
      "Water intake records fetched successfully!"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

// Get current water intake goal by patient ID
const getCurrentWaterIntakeGoalByPatientId = async (req, res) => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Patient ID is missing!"
      );
    }

    const currentGoal = await waterIntakeGoalModel
      .findOne({ patientId })
      .sort({ createdAt: -1 });

    if (!currentGoal) {
      return Response.error(res, 404, AppConstant.FAILED, "Goal not found!");
    }

    return Response.success(
      res,
      currentGoal,
      200,
      "User current water intake goal found!"
    );
  } catch (err) {
    return Response.error(
      res,
      400,
      AppConstant.FAILED,
      err.message || "Internal server failed!"
    );
  }
};

module.exports = {
  createWaterIntakeGoal,
  createWaterIntake,
  getAllWaterIntakeByDateRange,
  getCurrentWaterIntakeGoalByPatientId,
};
