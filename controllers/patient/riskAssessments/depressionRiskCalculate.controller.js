const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");

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

// Helper function to determine if severe depression levels - will use common recommendations for these
const isHighSeverityLevel = (level) => {
  return level === "Moderately Severe" || level === "Severe";
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
      ...req.body,
      phqScore,
      depressionLevel,
    });

    // Save to database
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
    const { patientId } = req.body;
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

        // Set query parameters for finding recommendations
        const queryParams = {};

        // For higher severity levels, we use common recommendations
        if (isHighSeverityLevel(assessment.depressionLevel)) {
          queryParams.depressionLevel = assessment.depressionLevel;
          queryParams.ageGroup = "All Ages";
          queryParams.gender = "All Genders";
        } else {
          queryParams.depressionLevel = assessment.depressionLevel;
          queryParams.ageGroup = ageGroup;

          // For Minimal/Moderate depression, gender specific recommendations exist only for specific age groups
          if (assessment.depressionLevel === "Mild" && ageGroup === "18-40") {
            queryParams.gender = assessment.gender;
          } else {
            // For other levels/age groups, gender doesn't matter in recommendations
            queryParams.gender =
              assessment.gender === "Other" ? "Male" : assessment.gender;
          }
        }

        // Find appropriate recommendation
        const recommendationData = await depressionRecommendationsModel.findOne(
          queryParams
        );

        // If recommendation found, include it with the assessment
        let recommendations = null;
        if (recommendationData) {
          recommendations = {
            dietaryRecommendation: recommendationData.dietaryRecommendation,
            activityRecommendation: recommendationData.activityRecommendation,
            supportRecommendation: recommendationData.supportRecommendation,
            depressionLevel: assessment.depressionLevel,
            ageGroup: recommendationData.ageGroup,
            gender: recommendationData.gender,
          };
        }

        // Return assessment with embedded recommendations
        return {
          _id: assessment._id,
          phqScore: assessment.phqScore,
          depressionLevel: assessment.depressionLevel,
          age: assessment.age,
          gender: assessment.gender,
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
