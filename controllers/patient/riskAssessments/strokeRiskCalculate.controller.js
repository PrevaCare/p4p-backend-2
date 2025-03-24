const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");

const diabeticRiskCalculatorModel = require("../../../models/patient/riskAssessments/diabeticRiskCalculator.model");
const {
  strokeRiskCalculatorValidationSchema,
} = require("../../../validators/patient/riskAssessments/strokeRiskCalculator.validator");
const strokeRiskCalculatorModel = require("../../../models/patient/riskAssessments/strokeRiskCalculator.model");
const {
  calculateStrokeRiskHelper,
} = require("../../../helper/riskAssessment/strokeRiskCalculator.helper");
// create

const createStrokeRiskCalculator = async (req, res) => {
  try {
    const { error } = strokeRiskCalculatorValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation error !"
      );
    }
    // Calculate risk scores and description
    const riskFactors = {
      bloodPressure: req.body.bloodPressure,
      atrialFibrillation: req.body.atrialFibrillation,
      bloodSugar: req.body.bloodSugar,
      bmi: req.body.bmi,
      diet: req.body.diet,
      cholesterol: req.body.cholesterol,
      diabetes: req.body.diabetes,
      physicalActivity: req.body.physicalActivity,
      history: req.body.history,
      tobacco: req.body.tobacco,
    };

    const { higherRiskScore, lowerRiskScore, desc } =
      calculateStrokeRiskHelper(riskFactors);

    // Create new stroke risk assessment
    const newStrokeRisk = new strokeRiskCalculatorModel({
      ...req.body,
      higherRiskScore,
      lowerRiskScore,
      desc,
    });

    const savedStrokeRisk = await newStrokeRisk.save();

    return Response.success(
      res,
      savedStrokeRisk,
      201,
      "Stroke risk assessment created successfully!",
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

// get all diabetic score

const getAllStrokeRiskCalculatorDateAndLowerHigherVal = async (req, res) => {
  try {
    const { patientId } = req.body;
    const savedStrokeRisk = await strokeRiskCalculatorModel
      .find(
        { user: patientId },
        "lowerRiskScore higherRiskScore desc createdAt"
      )
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
  createStrokeRiskCalculator,
  getAllStrokeRiskCalculatorDateAndLowerHigherVal,
};
