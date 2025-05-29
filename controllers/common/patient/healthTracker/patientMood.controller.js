const patientMoodModel = require("../../../../models/patient/healthTracker/mood/patientMood.model");
const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const dayjs = require("dayjs");
const {
  patientMoodValidationSchema,
} = require("../../../../validators/patient/healthTracker/patientMood.validator");

// Create or Update Mood
const createPatientMood = async (req, res) => {
  try {
    const { error } = patientMoodValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    const { patientId, mood } = req.body;

    // const today = dayjs().startOf("day").toDate();
    // const existingMood = await patientMoodModel.findOne({
    //   patientId,
    //   createdAt: { $gte: today },
    // });

    // if (existingMood) {
    //   existingMood.mood = mood;
    //   const updatedMood = await existingMood.save();
    //   return Response.success(
    //     res,
    //     updatedMood,
    //     200,
    //     "Mood updated successfully for today!"
    //   );
    // }

    const newMood = new patientMoodModel({ patientId, mood });
    const savedMood = await newMood.save();

    return Response.success(res, savedMood, 201, "Mood created successfully!");
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

// Get Single Mood for Today
const getSingleMood = async (req, res) => {
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

    const mood = await patientMoodModel
      .findOne({
        patientId,
      })
      .sort({ createdAt: -1 });

    if (!mood) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Mood not found for today!"
      );
    }

    return Response.success(
      res,
      mood,
      200,
      "Today's mood fetched successfully!"
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

// Get Mood Records by Date Range
const getAllMoodByDateRange = async (req, res) => {
  try {
    const { patientId, startDate, endDate } = req.body;

    const data = await patientMoodModel
      .find({
        patientId,
        createdAt: {
          $gte: dayjs(new Date(startDate)).startOf("day").toDate(),
          $lte: dayjs(new Date(endDate)).endOf("day").toDate(),
        },
      })
      .sort({ date: -1 });

    return Response.success(
      res,
      data,
      200,
      "Mood records fetched successfully!"
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
  createPatientMood,
  getSingleMood,
  getAllMoodByDateRange,
};
