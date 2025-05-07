const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const PatientDepression = require("../../../models/patient/healthTracker/depression/patientDepression.model");

const {
  depressionRiskCalculatorValidationSchema,
} = require("../../../validators/patient/riskAssessments/depressionRiskCalculator.validator");
const depressionRiskCalculateModel = require("../../../models/patient/riskAssessments/depressionRiskCalculate.model");
const depressionRecommendationsModel = require("../../../models/patient/riskAssessments/depressionRecommendations.model");
const {
  calculateDepressionRiskHelper,
  determineDepressionLevel,
} = require("../../../helper/riskAssessment/depressionRiskCalculator.helper");

// Helper function to determine age group
const getAgeGroup = (age) => {
  if (age <= 40) return "18-40";
  else if (age <= 60) return "41-60";
  else return "60+";
};

// Map incoming question keys to schema enum values
const mapQuestionKeys = {
  littleInterest: "interestPleasure",
  feelingDown: "downDepressedHopeless",
  sleepIssues: "sleepIssues",
  feelingTired: "tiredLowEnergy",
  appetiteIssues: "appetiteIssues",
  feelingBad: "feelingBadFailure",
  concentrationIssues: "concentrationIssues",
  movingSpeaking: "movementIssues",
  suicidalThoughts: "selfHarmThoughts",
};

// Create depression risk calculator entry
const createDepressionRiskCalculator = async (req, res) => {
  try {
    // Validate request body
    const { error } = depressionRiskCalculatorValidationSchema.validate(
      req.body
    );
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation error!"
      );
    }

    // Calculate depression score and level using helper function
    const { phqScore, depressionLevel } = calculateDepressionRiskHelper(
      req.body
    );

    // Create new depression risk assessment
    const newDepressionRisk = new depressionRiskCalculateModel({
      user: req.body.user,
      age: req.body.age,
      gender: req.body.gender,
      phqQuestions: req.body.phqQuestions,
      additionalFactors: req.body.additionalFactors,
      phqScore,
      depressionLevel,
    });

    // Get recommendations based on depression level, age group, and gender
    const ageGroup = getAgeGroup(req.body.age);
    const recommendationData = await depressionRecommendationsModel.findOne({
      depressionLevel: depressionLevel,
      ageGroup: ageGroup,
      gender: req.body.gender,
    });

    // Create entry in PatientDepression collection for health tracking
    const patientDepressionEntry = new PatientDepression({
      patientId: req.body.user,
      totalScore: phqScore,
      depressionLevel: depressionLevel,
      recommendation: recommendationData
        ? recommendationData.dietaryRecommendation
        : "No specific recommendations available.",
      addedBy: "Doctor",
      selfHarmRisk:
        depressionLevel === "Severe" || depressionLevel === "ModeratelySevere",
      questions: Object.entries(req.body.phqQuestions).map(([key, value]) => ({
        questionKey: mapQuestionKeys[key] || key,
        score: value,
      })),
    });

    // Save both entries
    await patientDepressionEntry.save();
    const savedDepressionRisk = await newDepressionRisk.save();

    return Response.success(
      res,
      savedDepressionRisk,
      201,
      "Depression risk assessment calculated successfully!",
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

// Get all depression risk assessments with recommendations
const getAllDepressionRiskCalculator = async (req, res) => {
  try {
    // Get patientId from either query parameters or request body
    const patientId = req.query.patientId || req.body.patientId;

    if (!patientId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Patient ID is required"
      );
    }

    // Get the last 10 assessments sorted by date
    const allAssessments = await depressionRiskCalculateModel
      .find({ user: patientId })
      .sort({ createdAt: -1 })
      .limit(10);

    // If no assessments found, return empty array
    if (!allAssessments || allAssessments.length === 0) {
      return Response.success(
        res,
        [],
        200,
        "No depression risk assessments found for this user",
        AppConstant.SUCCESS
      );
    }

    // Process each assessment to include recommendations
    const assessmentsWithRecommendations = await Promise.all(
      allAssessments.map(async (assessment) => {
        // Determine age group for recommendations
        const ageGroup = getAgeGroup(assessment.age);

        // Find appropriate recommendation based on risk level, age group, and gender
        const recommendationData = await depressionRecommendationsModel.findOne(
          {
            depressionLevel: assessment.depressionLevel,
            ageGroup: ageGroup,
            gender: assessment.gender,
          }
        );

        // If recommendation found, include it with the assessment
        let recommendations = null;
        if (recommendationData) {
          recommendations = {
            dietaryRecommendation: recommendationData.dietaryRecommendation,
            activityRecommendation: recommendationData.activityRecommendation,
            supportRecommendation: recommendationData.supportRecommendation,
          };
        }

        // Return assessment with embedded recommendations
        return {
          _id: assessment._id,
          phqScore: assessment.phqScore,
          depressionLevel: assessment.depressionLevel,
          age: assessment.age,
          gender: assessment.gender,
          ageGroup: ageGroup,
          recommendations: recommendations,
          createdAt: assessment.createdAt,
        };
      })
    );

    return Response.success(
      res,
      assessmentsWithRecommendations,
      200,
      "Depression risk assessments and recommendations found successfully",
      AppConstant.SUCCESS
    );
  } catch (err) {
    console.error("Error fetching depression risk data:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

module.exports = {
  createDepressionRiskCalculator,
  getAllDepressionRiskCalculator,
};
