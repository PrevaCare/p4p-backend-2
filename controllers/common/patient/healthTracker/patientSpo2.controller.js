const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const dayjs = require("dayjs");
const {
  patientSpo2GoalValidationSchema,
  patientSpo2ValidationSchema,
} = require("../../../../validators/patient/healthTracker/patientSpo2.validator");
const patientSpo2GoalModel = require("../../../../models/patient/healthTracker/spo2/patientSpo2Goal.model");
const patientSpo2Model = require("../../../../models/patient/healthTracker/spo2/patientSpo2.model");

// Create SpO2 Goal
const createPatientSpo2Goal = async (req, res) => {
  try {
    const { error } = patientSpo2GoalValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    const newSpo2Goal = new patientSpo2GoalModel(req.body);
    const savedSpo2Goal = await newSpo2Goal.save();

    return Response.success(
      res,
      savedSpo2Goal,
      201,
      "SpO2 goal created successfully!"
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

// Create SpO2 Record
const createPatientSpo2 = async (req, res) => {
  try {
    const { error } = patientSpo2ValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    const { patientId } = req.body;

    // Check for latest SpO2 goal
    const latestSpo2Goal = await patientSpo2GoalModel
      .findOne({ patientId })
      .sort({
        createdAt: -1,
      });

    if (!latestSpo2Goal) {
      const defaultGoal = new patientSpo2GoalModel({
        patientId,
        spo2Goal: 95,
        measurementUnit: "%",
      });
      await defaultGoal.save();
    }

    const newSpo2 = new patientSpo2Model({
      ...req.body,
      spo2Goal: latestSpo2Goal?.spo2Goal || 95,
      measurementUnit: latestSpo2Goal?.measurementUnit || "%",
    });
    const savedSpo2 = await newSpo2.save();

    return Response.success(
      res,
      savedSpo2,
      201,
      "SpO2 record created successfully!"
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

// Get SpO2 Records by Date Range
const getAllPatientSpo2ByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, patientId } = req.body;

    // Set start date to beginning of day (00:00:00)
    const startDateTime = dayjs(startDate).startOf("day").toDate();
    // Set end date to end of day (23:59:59)
    const endDateTime = dayjs(endDate).endOf("day").toDate();

    const data = await patientSpo2Model
      .find(
        {
          patientId,
          date: {
            $gte: startDateTime,
            $lte: endDateTime,
          },
        },
        "patientId spo2 spo2Goal date measurementUnit measurementType"
      )
      .sort({ date: -1 });

    return Response.success(
      res,
      data,
      200,
      "SpO2 records fetched successfully!"
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

// Get Current SpO2 Goal
const getCurrentPatientSpo2Goal = async (req, res) => {
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

    const currentSpo2Goal = await patientSpo2GoalModel
      .findOne({ patientId })
      .sort({
        createdAt: -1,
      });

    if (!currentSpo2Goal) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "SpO2 goal not found!"
      );
    }

    return Response.success(
      res,
      currentSpo2Goal,
      200,
      "Current SpO2 goal retrieved successfully!"
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
  createPatientSpo2Goal,
  createPatientSpo2,
  getAllPatientSpo2ByDateRange,
  getCurrentPatientSpo2Goal,
};
