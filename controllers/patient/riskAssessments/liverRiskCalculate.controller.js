const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");

const {
  liverRiskCalculatorValidationSchema,
} = require("../../../validators/patient/riskAssessments/liverRiskCalculator.validator");
const liverRiskCalculateModel = require("../../../models/patient/riskAssessments/liverRiskCalculate.model");
const {
  calculateLiverRiskHelper,
} = require("../../../helper/riskAssessment/liverRiskCalculator.helper");
// create

const createLiverRiskCalculator = async (req, res) => {
  try {
    const { error } = liverRiskCalculatorValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation error !"
      );
    }
    // const newLiverRisk = new liverRiskCalculateModel(req.body);

    // Calculate risk score and level
    const { riskScore, riskLevel } = calculateLiverRiskHelper(req.body);

    // Create new liver risk assessment
    const newLiverRisk = new liverRiskCalculateModel({
      ...req.body,
      riskScore,
      riskLevel,
    });

    const savedLiverRisk = await newLiverRisk.save();
    return Response.success(
      res,
      savedLiverRisk,
      201,
      "liver risk calculated successfully !",
      AppConstant.SUCCESS
    );
  } catch (err) {
    if (err.name === "ValidationError") {
      const errorMessages = Object.values(err.errors).map(
        (error) => error.message
      );
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        errorMessages.join(", ") || "Validation error!"
      );
    }
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

// get all diabetic score
const getAllLiverRiskCalculator = async (req, res) => {
  try {
    const { patientId } = req.body;
    const savedStrokeRisk = await liverRiskCalculateModel
      .find({ user: patientId }, "riskScore riskLevel createdAt")
      .sort({ createdAt: -1 })
      .limit(10);
    return Response.success(
      res,
      savedStrokeRisk,
      200,
      "all stoke data found !",
      AppConstant.SUCCESS
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
  createLiverRiskCalculator,
  getAllLiverRiskCalculator,
};
