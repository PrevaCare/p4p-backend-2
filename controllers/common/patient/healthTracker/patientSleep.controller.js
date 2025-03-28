const PatientSleep = require("../../../../models/patient/healthTracker/sleep/patientSleep.model");
const PatientSleepGoal = require("../../../../models/patient/healthTracker/sleep/patientSleepGoal.model");
const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const dayjs = require("dayjs");
const {
  patientSleepValidation,
  patientSleepGoalValidation,
} = require("../../../../validators/patient/healthTracker/patientSleep.validator");

// Create or Update Sleep Record
const createOrUpdatePatientSleep = async (req, res) => {
  try {
    const { error } = patientSleepValidation.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    const { patientId, sleep, measurementUnit } = req.body;

    // Check if a sleep record exists for today
    const today = dayjs().startOf("day").toDate();
    const tomorrow = dayjs().endOf("day").toDate();

    const existingSleepRecord = await PatientSleep.findOne({
      patientId,
      date: { $gte: today, $lte: tomorrow },
    });

    if (existingSleepRecord) {
      // Update existing sleep record
      existingSleepRecord.sleep = sleep;
      existingSleepRecord.measurementUnit = measurementUnit;
      const updatedSleepRecord = await existingSleepRecord.save();

      return Response.success(
        res,
        updatedSleepRecord,
        200,
        "Sleep record updated successfully!"
      );
    }

    // Create a new sleep record if none exists
    const latestSleepGoal = await PatientSleepGoal.findOne({ patientId }).sort({
      createdAt: -1,
    });

    const newSleepRecord = new PatientSleep({
      patientId,
      sleep,
      sleepGoal: latestSleepGoal?.sleepGoal || 8,
      measurementUnit: latestSleepGoal?.measurementUnit || "hrs",
    });

    const savedSleepRecord = await newSleepRecord.save();

    return Response.success(
      res,
      savedSleepRecord,
      201,
      `Sleep record ${
        existingSleepRecord ? "updated" : "created"
      } successfully!`
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

// Create Sleep Goal
const createPatientSleepGoal = async (req, res) => {
  try {
    const { error } = patientSleepGoalValidation.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    const newSleepGoal = new PatientSleepGoal(req.body);
    const savedSleepGoal = await newSleepGoal.save();

    return Response.success(
      res,
      savedSleepGoal,
      201,
      "Sleep goal created successfully!"
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

// Get Sleep Records by Date Range
const getAllPatientSleepByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, patientId } = req.body;

    // Set start date to beginning of day (00:00:00)
    const startDateTime = dayjs(startDate).startOf("day").toDate();
    // Set end date to end of day (23:59:59)
    const endDateTime = dayjs(endDate).endOf("day").toDate();

    const data = await PatientSleep.find(
      {
        patientId,
        date: {
          $gte: startDateTime,
          $lte: endDateTime,
        },
      },
      "patientId sleep sleepGoal date measurementUnit"
    );

    return Response.success(
      res,
      data,
      200,
      "Sleep records fetched successfully!"
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

// Get Current Sleep Goal
const getCurrentPatientSleepGoal = async (req, res) => {
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

    const currentSleepGoal = await PatientSleepGoal.findOne({ patientId }).sort(
      {
        createdAt: -1,
      }
    );

    if (!currentSleepGoal) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Sleep goal not found!"
      );
    }

    return Response.success(
      res,
      currentSleepGoal,
      200,
      "Current sleep goal retrieved successfully!"
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
  createOrUpdatePatientSleep,
  createPatientSleepGoal,
  getAllPatientSleepByDateRange,
  getCurrentPatientSleepGoal,
};
