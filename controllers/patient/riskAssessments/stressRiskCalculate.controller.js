const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const PatientStress = require("../../../models/patient/healthTracker/stress/patientStress.model");

const {
  stressRiskCalculatorValidationSchema,
} = require("../../../validators/patient/riskAssessments/stressRiskCalculator.validator");
const stressRiskCalculateModel = require("../../../models/patient/riskAssessments/stressRiskCalculate.model");
const stressRecommendationsModel = require("../../../models/patient/riskAssessments/stressRecommendations.model");
const {
  calculateStressRiskHelper,
  determineStressLevel,
} = require("../../../helper/riskAssessment/stressRiskCalculator.helper");

// Helper function to determine age group
const getAgeGroup = (age) => {
  if (age <= 40) return "18-40";
  else if (age <= 60) return "41-60";
  else return "60+";
};

// Map incoming question keys to schema enum values
const mapQuestionKeys = {
  upsetByUnexpected: "unexpectedEvents",
  unableToControl: "controlImportantThings",
  feltNervous: "nervousStressed",
  confidentHandling: "handleProblems",
  thingsGoingWell: "goingYourWay",
  couldNotCope: "copeWithThings",
  angryOutOfControl: "controlIrritations",
  difficulties: "difficultiesPilingUp",
};

// Create stress risk calculator entry
const createStressRiskCalculator = async (req, res) => {
  try {
    // Validate request body
    const { error } = stressRiskCalculatorValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation error!"
      );
    }

    // Calculate stress score and level using helper function
    const { pssScore, stressLevel } = calculateStressRiskHelper(req.body);

    // Create new stress risk assessment
    const newStressRisk = new stressRiskCalculateModel({
      user: req.body.user,
      age: req.body.age,
      gender: req.body.gender,
      pssQuestions: req.body.pssQuestions,
      additionalFactors: req.body.additionalFactors,
      pssScore,
      stressLevel,
    });

    // Get recommendations based on stress level, age group, and gender
    const ageGroup = getAgeGroup(req.body.age);
    const recommendationData = await stressRecommendationsModel.findOne({
      riskLevel: stressLevel,
      ageGroup: ageGroup,
      gender: req.body.gender,
    });

    // Create entry in PatientStress collection for health tracking
    const patientStressEntry = new PatientStress({
      patientId: req.body.user,
      totalScore: pssScore,
      stressLevel: stressLevel,
      recommendation: recommendationData
        ? recommendationData.dietaryRecommendation
        : "No specific recommendations available.",
      addedBy: "Doctor",
      questions: Object.entries(req.body.pssQuestions).map(([key, value]) => ({
        questionKey: mapQuestionKeys[key] || key,
        score: value,
      })),
    });

    // Save both entries
    await patientStressEntry.save();
    const savedStressRisk = await newStressRisk.save();

    return Response.success(
      res,
      savedStressRisk,
      201,
      "Stress risk assessment calculated successfully!",
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

// Get all stress risk assessments with recommendations
const getAllStressRiskCalculator = async (req, res) => {
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
    const allAssessments = await stressRiskCalculateModel
      .find({ user: patientId })
      .sort({ createdAt: -1 })
      .limit(10);

    // If no assessments found, return empty array
    if (!allAssessments || allAssessments.length === 0) {
      return Response.success(
        res,
        [],
        200,
        "No stress risk assessments found for this user",
        AppConstant.SUCCESS
      );
    }

    // Process each assessment to include recommendations
    const assessmentsWithRecommendations = await Promise.all(
      allAssessments.map(async (assessment) => {
        // Determine age group for recommendations
        const ageGroup = getAgeGroup(assessment.age);

        // Find appropriate recommendation based on risk level, age group, and gender
        const recommendationData = await stressRecommendationsModel.findOne({
          riskLevel: assessment.stressLevel,
          ageGroup: ageGroup,
          gender: assessment.gender,
        });

        // If recommendation found, include it with the assessment
        let recommendations = null;
        if (recommendationData) {
          recommendations = {
            dietaryRecommendation: recommendationData.dietaryRecommendation,
            physicalActivityRecommendation:
              recommendationData.physicalActivityRecommendation,
            mentalSupportRecommendation:
              recommendationData.mentalSupportRecommendation,
          };
        }

        // Return assessment with embedded recommendations
        return {
          _id: assessment._id,
          pssScore: assessment.pssScore,
          stressLevel: assessment.stressLevel,
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
      "Stress risk assessments and recommendations found successfully",
      AppConstant.SUCCESS
    );
  } catch (err) {
    console.error("Error fetching stress risk data:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

module.exports = {
  createStressRiskCalculator,
  getAllStressRiskCalculator,
};
