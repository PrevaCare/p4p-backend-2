const EMR = require("../../../../models/common/emr.model");
const HealthTracker = require("../../../../models/patient/healthTracker/healthTracker.model");
const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const {
  createHealthTrackerSchema,
} = require("../../../../validators/healthTracker/healthTracker.Validation");

// create
const createHealthTracker = async (req, res) => {
  try {
    const { error } = createHealthTrackerSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation failed !"
      );
    }
    const { _id } = req.user;

    const { steps, caloriesBurnt } = req.body;
    const newHealthTracker = new HealthTracker({
      user: _id,
      steps,
      caloriesBurnt,
    });
    const savedHealthTracker = await newHealthTracker.save();

    return Response.success(
      res,
      savedHealthTracker,
      201,
      "User health tracker created successfully !"
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

// update
const updateHealthTracker = async (req, res) => {
  try {
    const { BP, PR, SPO2, steps, caloriesBurnt } = req.body;

    if (BP || PR || SPO2) {
      const exisingEmr = await EMR.find({ user: req.user._id });
      console.log(exisingEmr);
      if (!exisingEmr || exisingEmr.length === 0) {
        return Response.error(res, 400, AppConstant.FAILED, "EMR not exist");
      }
      const exisingEmrLen = exisingEmr.length;

      const exisingEmrToBeUpdated = exisingEmr[exisingEmrLen - 1];
      exisingEmrToBeUpdated.generalPhysicalExamination.BP = BP
        ? BP
        : exisingEmrToBeUpdated.generalPhysicalExamination.BP;
      exisingEmrToBeUpdated.generalPhysicalExamination.PR = PR
        ? PR
        : exisingEmrToBeUpdated.generalPhysicalExamination.PR;
      exisingEmrToBeUpdated.generalPhysicalExamination.SPO2 = SPO2
        ? SPO2
        : exisingEmrToBeUpdated.generalPhysicalExamination.SPO2;
      await exisingEmrToBeUpdated.save();
    }
    if (steps || caloriesBurnt) {
      const today = new Date();
      const start = new Date(today);
      const end = new Date(today);

      const exisingHealthTracker = await HealthTracker.findOne({
        user: req.user._id,
        // when cron is set to generate daily health track with default value
        // createdAt: {
        //   $gte: start,
        //   $lte: end,
        // },
      });
      if (!exisingHealthTracker) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "HealthTracker not exist"
        );
      }

      //
      exisingHealthTracker.steps = steps ? steps : exisingHealthTracker.steps;
      exisingHealthTracker.caloriesBurnt = caloriesBurnt
        ? caloriesBurnt
        : exisingHealthTracker.caloriesBurnt;

      await exisingHealthTracker.save();
    }
    return Response.success(
      res,
      {},
      201,
      "User health tracker Updated  successfully !"
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

module.exports = { createHealthTracker, updateHealthTracker };
