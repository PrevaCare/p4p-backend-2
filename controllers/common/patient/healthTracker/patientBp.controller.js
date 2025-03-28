const EMR = require("../../../../models/common/emr.model");
const patientBpModel = require("../../../../models/patient/healthTracker/bp/patientBp.model");
const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");

const {
  patientBPValidationSchema,
  patientBPGoalValidationSchema,
} = require("../../../../validators/patient/healthTracker/patientBp.validator");
const dayjs = require("dayjs");
const patientBpGoalModel = require("../../../../models/patient/healthTracker/bp/patientBpGoal.model");
// create

const createPatienBpGoal = async (req, res) => {
  try {
    const { error } = patientBPGoalValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation failed !"
      );
    }

    const newPatientBpGoal = new patientBpGoalModel(req.body);
    const savedPatientBpGoal = await newPatientBpGoal.save();

    return Response.success(
      res,
      savedPatientBpGoal,
      201,
      "User BP Goal created successfully !"
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

const createPatienBp = async (req, res) => {
  try {
    const { error } = patientBPValidationSchema.validate(req.body);
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
    const latestBpGoal = await patientBpGoalModel
      .findOne({ patientId })
      .sort({ createdAt: -1 });

    if (!latestBpGoal) {
      const setDefaultBpGoal = new patientBpGoalModel({
        patientId,
        sysGoal: 120,
        diaGoal: 80,
      });
      await setDefaultBpGoal.save();
    }

    const newPatientBp = new patientBpModel({
      ...req.body,
      sysGoal: latestBpGoal.sysGoal || 120,
      diaGoal: latestBpGoal.diaGoal || 80,
    });
    const savedPatientBp = await newPatientBp.save();

    return Response.success(
      res,
      savedPatientBp,
      201,
      "User BP created successfully !"
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

const getAllPatientBpByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, patientId } = req.body;

    // Set start date to beginning of day (00:00:00)
    const startDateTime = dayjs(startDate).startOf("day").toDate();
    // Set end date to end of day (23:59:59)
    const endDateTime = dayjs(endDate).endOf("day").toDate();

    const data = await patientBpModel.find(
      {
        patientId: patientId,
        date: {
          $gte: startDateTime,
          $lte: endDateTime,
        },
      },
      "patient sys dia sysGoal diaGoal date"
    );
    return Response.success(res, data, 200, "BP records fetched successfully!");
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
const getCurrentPatienBpGoalByPatientId = async (req, res) => {
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
    const currentBpGoal = await patientBpGoalModel
      .findOne({ patientId })
      .sort({ createdAt: -1 });
    if (!currentBpGoal) {
      return Response.error(res, 404, AppConstant.FAILED, "goal not found  !");
    }

    return Response.success(
      res,
      currentBpGoal,
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
  createPatienBpGoal,
  createPatienBp,
  getCurrentPatienBpGoalByPatientId,
  getAllPatientBpByDateRange,
};
