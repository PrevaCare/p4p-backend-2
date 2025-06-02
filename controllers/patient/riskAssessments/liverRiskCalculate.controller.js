const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");

const {
  liverRiskCalculatorValidationSchema,
} = require("../../../validators/patient/riskAssessments/liverRiskCalculator.validator");
const liverRiskCalculateModel = require("../../../models/patient/riskAssessments/liverRiskCalculate.model");
const liverRecommendationsModel = require("../../../models/patient/riskAssessments/liverRecommendations.model");
const {
  calculateLiverRiskHelper,
} = require("../../../helper/riskAssessment/liverRiskCalculator.helper");
const {
  determineLiverRiskLevel,
} = require("../../../utils/riskAssessment/liverRiskUtils");

// Fallback utility function in case import fails
const fallbackDetermineLiverRiskLevel = (riskScore) => {
  if (riskScore <= 5) {
    return "Low";
  } else if (riskScore >= 6 && riskScore <= 12) {
    return "Moderate";
  } else {
    return "High"; // riskScore >= 13
  }
};

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

    // Calculate risk score and level
    const { riskScore, riskLevel } = calculateLiverRiskHelper(req.body);

    const getFormattedAge = (age) => {
      const parsedAge = typeof age === 'string' ? parseInt(age) : age

      if (parsedAge <= 25) {
        return "18-25"
      } else if (parsedAge <= 40) {
        return "26-40"
      } else if (parsedAge <= 60) {
        return "41-60"
      } else {
        return "Over 60"
      }
    }

    // Create new liver risk assessment
    const newLiverRisk = new liverRiskCalculateModel({
      ...req.body,
      age: getFormattedAge(req.body.age),
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

// get all liver risk assessments with recommendations
const getAllLiverRiskCalculator = async (req, res) => {
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
    const allAssessments = await liverRiskCalculateModel
      .find({ user: patientId }, "riskScore riskLevel createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    // If there are no assessments, return empty array
    if (!allAssessments || allAssessments.length === 0) {
      return Response.success(
        res,
        [],
        200,
        "No liver risk assessments found for this user",
        AppConstant.SUCCESS
      );
    }

    // Process each assessment to include recommendations
    const assessmentsWithRecommendations = await Promise.all(
      allAssessments.map(async (assessment) => {
        const riskScore = assessment.riskScore || 0;

        // Use imported function with fallback for risk level
        const getRiskLevel =
          typeof determineLiverRiskLevel === "function"
            ? determineLiverRiskLevel
            : fallbackDetermineLiverRiskLevel;

        // Normalize risk level format from DB (HIGH/MODERATE/LOW) to Title case (High/Moderate/Low)
        const normalizedRiskLevel =
          assessment.riskLevel.charAt(0).toUpperCase() +
          assessment.riskLevel.slice(1).toLowerCase();

        // Fetch recommendations for this assessment
        const recommendationData = await liverRecommendationsModel.findOne({
          riskLevel: normalizedRiskLevel,
        });

        // If recommendation found, include it with the assessment
        let recommendations = null;
        // console.log("recommendationData", recommendationData);
        if (recommendationData) {
          recommendations = {
            dietRecommendation: recommendationData.dietRecommendation,
            medicalRecommendation: recommendationData.medicalRecommendation,
            physicalActivityRecommendation:
              recommendationData.physicalActivityRecommendation,
            // riskLevel: normalizedRiskLevel,
          };
        }

        // Return assessment with embedded recommendations
        return {
          _id: assessment._id,
          riskScore: assessment.riskScore,
          riskLevel: assessment.riskLevel,
          riskLevel: normalizedRiskLevel,
          recommendations: recommendations,
          createdAt: assessment.createdAt,
        };
      })
    );

    return Response.success(
      res,
      assessmentsWithRecommendations,
      200,
      "Liver risk assessments and recommendations found successfully",
      AppConstant.SUCCESS
    );
  } catch (err) {
    console.error("Error fetching liver risk data:", err);
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
