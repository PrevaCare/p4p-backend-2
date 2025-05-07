const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const userModel = require("../../../models/common/user.model");
const diabeticRiskCalculatorModel = require("../../../models/patient/riskAssessments/diabeticRiskCalculator.model");
const {
  strokeRiskCalculatorValidationSchema,
} = require("../../../validators/patient/riskAssessments/strokeRiskCalculator.validator");
const strokeRiskCalculatorModel = require("../../../models/patient/riskAssessments/strokeRiskCalculator.model");
const strokeRecommendationsModel = require("../../../models/patient/riskAssessments/strokeRecommendations.model");
const {
  calculateStrokeRiskHelper,
} = require("../../../helper/riskAssessment/strokeRiskCalculator.helper");
const {
  determineStrokeRiskLevel,
} = require("../../../utils/riskAssessment/strokeRiskUtils");

// Fallback utility function in case import fails
const fallbackDetermineStrokeRiskLevel = (lowerRiskScore, higherRiskScore) => {
  const meanScore = (lowerRiskScore + higherRiskScore) / 2;

  if (meanScore < 25) {
    return "Low";
  } else if (meanScore >= 25 && meanScore <= 50) {
    return "Moderate";
  } else {
    return "High";
  }
};

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

// Get all stroke risk assessments with recommendations
const getAllStrokeRiskCalculatorDateAndLowerHigherVal = async (req, res) => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Patient ID is required"
      );
    }

    // Get all assessments sorted by date
    const allAssessments = await strokeRiskCalculatorModel
      .find(
        { user: patientId },
        "lowerRiskScore higherRiskScore desc createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(10);

    // If there are no assessments, return empty array
    if (!allAssessments || allAssessments.length === 0) {
      return Response.success(
        res,
        [],
        200,
        "No stroke risk assessments found for this user",
        AppConstant.SUCCESS
      );
    }

    // Process each assessment to include recommendations
    const assessmentsWithRecommendations = await Promise.all(
      allAssessments.map(async (assessment) => {
        const lowerRiskScore = assessment.lowerRiskScore || 0;
        const higherRiskScore = assessment.higherRiskScore || 0;

        // Use imported function with fallback for risk level
        const getRiskLevel =
          typeof determineStrokeRiskLevel === "function"
            ? determineStrokeRiskLevel
            : fallbackDetermineStrokeRiskLevel;

        // Calculate mean score and determine risk level
        const riskLevel = getRiskLevel(lowerRiskScore, higherRiskScore);

        // Fetch recommendations for this assessment
        const recommendationData = await strokeRecommendationsModel.findOne({
          riskLevel,
        });

        // If recommendation found, include it with the assessment
        let recommendations = null;
        if (recommendationData) {
          recommendations = {
            dietRecommendation: recommendationData.dietRecommendation,
            medicalRecommendation: recommendationData.medicalRecommendation,
            physicalActivityRecommendation:
              recommendationData.physicalActivityRecommendation,
          };
        }

        // Return assessment with embedded recommendations
        return {
          _id: assessment._id,
          lowerRiskScore: assessment.lowerRiskScore,
          higherRiskScore: assessment.higherRiskScore,
          meanRiskScore: (lowerRiskScore + higherRiskScore) / 2,
          riskLevel: riskLevel,
          desc: assessment.desc,
          recommendations: recommendations,
          createdAt: assessment.createdAt,
        };
      })
    );

    return Response.success(
      res,
      assessmentsWithRecommendations,
      200,
      "Stroke risk assessments and recommendations found successfully",
      AppConstant.SUCCESS
    );
  } catch (err) {
    console.error("Error fetching stroke risk data:", err);
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
