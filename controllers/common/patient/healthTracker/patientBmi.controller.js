const PatientBmiGoal = require("../../../../models/patient/healthTracker/bmi/patientBmiGoal.model");
const PatientBmi = require("../../../../models/patient/healthTracker/bmi/patientBmi.model");
const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const dayjs = require("dayjs");
const {
  patientBmiGoalValidationSchema,
  patientBmiValidationSchema,
} = require("../../../../validators/patient/healthTracker/patientBmi.validator");

// Create BMI Goal
const createPatientBmiGoal = async (req, res) => {
  try {
    const { error } = patientBmiGoalValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    const newBmiGoal = new PatientBmiGoal(req.body);
    const savedBmiGoal = await newBmiGoal.save();

    return Response.success(
      res,
      savedBmiGoal,
      201,
      "BMI goal created successfully!"
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

// Create BMI Record
const createPatientBmi = async (req, res) => {
  try {
    const { error } = patientBmiValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    const { patientId } = req.body;

    // Check for latest BMI goal
    const latestBmiGoal = await PatientBmiGoal.findOne({ patientId }).sort({
      createdAt: -1,
    });

    if (!latestBmiGoal) {
      const defaultGoal = new PatientBmiGoal({
        patientId,
        bmiGoal: 22.0,
        measurementUnit: "Kg/m2",
      });
      await defaultGoal.save();
    }

    const newBmi = new PatientBmi({
      ...req.body,
      bmiGoal: latestBmiGoal?.bmiGoal || 22.0,
      measurementUnit: latestBmiGoal?.measurementUnit || "Kg/m2",
    });
    const savedBmi = await newBmi.save();

    return Response.success(
      res,
      savedBmi,
      201,
      "BMI record created successfully!"
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

// Get BMI Records by Date Range
const getAllPatientBmisByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, patientId } = req.body;

    const data = await PatientBmi.find(
      {
        patientId,
        date: {
          $gte: dayjs(new Date(startDate)).format("YYYY-MM-DD"),
          $lte: dayjs(new Date(endDate)).format("YYYY-MM-DD"),
        },
      },
      "patientId bmi bmiGoal date measurementUnit"
    );

    const responseData =
      data && data.length > 0
        ? data.map((item) => {
            return {
              ...item.toObject(),
              bmi: item.bmi.toFixed(2),
              bmiGoal: item.bmiGoal.toFixed(2),
            };
          })
        : [];

    return Response.success(
      res,
      responseData,
      200,
      "BMI records fetched successfully!"
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

// Get Current BMI Goal
const getCurrentPatientBmiGoal = async (req, res) => {
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

    const currentBmiGoal = await PatientBmiGoal.findOne({ patientId }).sort({
      createdAt: -1,
    });

    if (!currentBmiGoal) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "BMI goal not found!"
      );
    }

    return Response.success(
      res,
      {
        ...currentBmiGoal.toObject(),
        bmiGoal: currentBmiGoal.bmiGoal.toFixed(2),
      },
      200,
      "Current BMI goal retrieved successfully!"
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
  createPatientBmiGoal,
  createPatientBmi,
  getAllPatientBmisByDateRange,
  getCurrentPatientBmiGoal,
};
