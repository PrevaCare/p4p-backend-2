const emrModel = require("../../../models/common/emr.model");
const currentConditionModel = require("../../../models/patient/healthSummary/currentCondition.model");
const userModel = require("../../../models/common/user.model");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const { uploadToS3 } = require("../../../middlewares/uploads/awsConfig");

// create - multipart for the app
const addCurrentCondition = async (req, res) => {
  try {
    const file = req.file;
    const uploadedCondtionFileUrl = file
      ? (await uploadToS3(file)).Location
      : null;
    // condtionFileUrl

    const newCurrentCondition = new currentConditionModel({
      ...req.body,
      condtionFileUrl: uploadedCondtionFileUrl,
    });

    const savedCurrentConditions = await newCurrentCondition.save();

    return Response.success(
      res,
      savedCurrentConditions,
      201,
      "current conditions fetched !"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal Server error !"
    );
  }
};

// get current condition from the latest emr
const getCurrentConditionFromLatestEmr = async (req, res) => {
  try {
    const { patientId } = req.body;
    const existingUser = await userModel.findOne({ _id: patientId });
    if (!existingUser) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "insuranceFile is required !"
      );
    }

    const latestEmrId = await emrModel
      .findOne({ user: existingUser._id })
      .sort({ createdAt: -1 });

    const currentConditions = await currentConditionModel.find(
      {
        emrId: latestEmrId._id,
      },
      "dateOfDiagnosis diagnosisName prescription referralNeeded advice"
    );
    return Response.success(
      res,
      currentConditions,
      200,
      "current conditions fetched !"
    );
  } catch (err) {
    return Response.error(
      res,
      404,
      AppConstant.FAILED,
      err.message || "Internal server error !"
    );
  }
};

module.exports = {
  getCurrentConditionFromLatestEmr,
  addCurrentCondition,
};
