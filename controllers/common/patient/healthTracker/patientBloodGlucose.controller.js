const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");

const dayjs = require("dayjs");

const bloodGlucoseModel = require("../../../../models/patient/healthTracker/bloodGlucose/bloodGlucose.model");
const {
  validatePatientBloodGlucose,
  validatePatientBloodGlucoseGoal,
} = require("../../../../validators/patient/healthTracker/patientBloodGlucose.valdator");
const bloodGlucoseGoalModel = require("../../../../models/patient/healthTracker/bloodGlucose/bloodGlucoseGoal.model");
// create
const createPatienBloodGlucoseGoal = async (req, res) => {
  try {
    const { error } = validatePatientBloodGlucoseGoal.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation failed !"
      );
    }

    const newPatientBloodGlucoseGoal = new bloodGlucoseGoalModel(req.body);
    const savedBloodGlucoseGoal = await newPatientBloodGlucoseGoal.save();

    return Response.success(
      res,
      savedBloodGlucoseGoal,
      201,
      "User Blood Glucose Goal created successfully !"
    );
  } catch (err) {
    return Response.error(
      res,
      400,
      AppConstant.FAILED,
      err.message || "Internal server failed !"
    );
  }
};
const createPatienBloodGlucose = async (req, res) => {
  try {
    const { error } = validatePatientBloodGlucose.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation failed !"
      );
    }
    const { patientId } = req.body;

    // check latest patient bp goal if not found then create new one
    const latestBGGoal = await bloodGlucoseGoalModel
      .findOne({ patientId })
      .sort({ createdAt: -1 });

    if (!latestBGGoal) {
      const setDefaultBGGoal = new bloodGlucoseGoalModel({
        patientId,
        bloodGlucoseGoal: 70,
      });
      await setDefaultBGGoal.save();
    }

    const newPatientBG = new bloodGlucoseModel({
      ...req.body,
      bloodGlucoseGoal: latestBGGoal?.bloodGlucoseGoal || 70,
    });
    const savedPatientBG = await newPatientBG.save();

    return Response.success(
      res,
      savedPatientBG,
      201,
      "User Blood Glucose created successfully !"
    );
  } catch (err) {
    return Response.error(
      res,
      400,
      AppConstant.FAILED,
      err.message || "Internal server failed !"
    );
  }
};

const getAllPatientBloodGlucoseByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, patientId } = req.body;
    const data = await bloodGlucoseModel.find(
      {
        patientId: patientId,
        date: {
          $gte: dayjs(new Date(startDate)).format("YYYY-MM-DD"),
          $lte: dayjs(new Date(endDate)).format("YYYY-MM-DD"),
        },
      },
      "bloodGlucose bloodGlucoseGoal readingType date"
    );
    return Response.success(
      res,
      data,
      200,
      "Blood Glucose  records fetched successfully!"
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

// get current goal
const getCurrentPatienBloodGlucoseGoalByPatientId = async (req, res) => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "patientId is missing  !"
      );
    }
    const currentBGGoal = await bloodGlucoseGoalModel
      .findOne({ patientId })
      .sort({ createdAt: -1 });
    if (!currentBGGoal) {
      return Response.error(res, 404, AppConstant.FAILED, "goal not found  !");
    }

    return Response.success(
      res,
      currentBGGoal,
      200,
      "User current goal found !"
    );
  } catch (err) {
    return Response.error(
      res,
      400,
      AppConstant.FAILED,
      err.message || "Internal server failed !"
    );
  }
};
module.exports = {
  createPatienBloodGlucose,
  createPatienBloodGlucoseGoal,
  getAllPatientBloodGlucoseByDateRange,
  getCurrentPatienBloodGlucoseGoalByPatientId,
};
