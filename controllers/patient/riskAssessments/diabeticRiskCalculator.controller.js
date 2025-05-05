const coronaryHeartDiseaseModel = require("../../../models/patient/riskAssessments/coronaryHeartDisease.model");
const Employee = require("../../../models/patient/employee/employee.model");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const mongoose = require("mongoose");
const {
  coronaryHeartDiseaseValidationSchema,
} = require("../../../validators/patient/riskAssessments/coronaryHeartDiseases.validator");
const {
  calculateRisk,
} = require("../../../helper/employeeDiseaseAssessmentHelper/employeeDiseaseAssessmentHelper.helper");
const userModel = require("../../../models/common/user.model");
const individualUserModel = require("../../../models/individualUser/induvidualUser.model");
const diabeticRiskCalculatorModel = require("../../../models/patient/riskAssessments/diabeticRiskCalculator.model");
const diabeticRecommendationsModel = require("../../../models/patient/riskAssessments/diabeticRecommendations.model");
const {
  diabeticRiskCalculatorValidation,
} = require("../../../validators/patient/riskAssessments/daibeticRiskCalculator.validator");
const {
  calculateDiabeticRiskHelper,
} = require("../../../helper/riskAssessment/diabeticRiskCalculator.helper");
const {
  determineDiabeticRiskLevel,
  determineDiabeticAgeGroup,
  mapGenderForDiabeticRecommendations,
} = require("../../../utils/riskAssessment/diabeticRiskUtils");

// Fallback utility functions in case import fails
const fallbackDetermineDiabeticRiskLevel = (totalScore) => {
  if (totalScore < 30) {
    return "Low";
  } else if (totalScore >= 30 && totalScore < 60) {
    return "Moderate";
  } else {
    return "High";
  }
};

const fallbackDetermineDiabeticAgeGroup = (age) => {
  if (age < 40) {
    return "20-39";
  } else if (age >= 40 && age < 60) {
    return "40-59";
  } else {
    return "60+";
  }
};

const fallbackMapGenderForDiabeticRecommendations = (gender, ageGroup) => {
  if (ageGroup === "20-39" || ageGroup === "60+") {
    return "All";
  }

  if (gender === "M" || gender === "Male") {
    return "Male";
  } else if (gender === "F" || gender === "Female") {
    return "Female";
  }

  return "All";
};

// create
const createDiabeticRiskCalculator = async (req, res) => {
  try {
    const { error } = diabeticRiskCalculatorValidation.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation error !"
      );
    }
    const {
      user,
      ageScore,
      waistScore,
      physicalActivityScore,
      familyHistoryScore,
    } = req.body;

    // Calculate risk using helper function
    const { totalScore, riskLevel } = calculateDiabeticRiskHelper({
      ageScore: Number(ageScore),
      waistScore: Number(waistScore),
      physicalActivityScore: Number(physicalActivityScore),
      familyHistoryScore: Number(familyHistoryScore),
    });

    // Create new diabetic risk assessment
    const newDiabeticRisk = await diabeticRiskCalculatorModel.create({
      user,
      ageScore: Number(ageScore),
      waistScore: Number(waistScore),
      physicalActivityScore: Number(physicalActivityScore),
      familyHistoryScore: Number(familyHistoryScore),
      totalScore,
      riskLevel,
    });

    return Response.success(res, newDiabeticRisk, 201, AppConstant.SUCCESS);
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
const getAllDiabeticRiskCalculatorDateAndRisk = async (req, res) => {
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
    const allAssessments = await diabeticRiskCalculatorModel
      .find({ user: patientId }, "totalScore riskLevel createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    // If there are no assessments, return empty array
    if (!allAssessments || allAssessments.length === 0) {
      return Response.success(
        res,
        [],
        200,
        "No diabetic risk assessments found for this user",
        AppConstant.SUCCESS
      );
    }

    // Get user info for age and gender
    const userInfo = await userModel.findById(patientId, "age gender");
    if (!userInfo) {
      // If no user info, return data without recommendations
      return Response.success(
        res,
        allAssessments,
        200,
        "Diabetic risk assessments found, but user info not available for recommendations",
        AppConstant.SUCCESS
      );
    }

    // Determine age group from user age (default to middle age if not available)
    const age = userInfo.age || 45;

    // Use imported function with fallback
    const getAgeGroup =
      typeof determineDiabeticAgeGroup === "function"
        ? determineDiabeticAgeGroup
        : fallbackDetermineDiabeticAgeGroup;
    const ageGroup = getAgeGroup(age);

    // Process each assessment to include recommendations
    const assessmentsWithRecommendations = await Promise.all(
      allAssessments.map(async (assessment) => {
        const totalScore = assessment.totalScore;

        // Use imported function with fallback for risk level
        const getRiskLevel =
          typeof determineDiabeticRiskLevel === "function"
            ? determineDiabeticRiskLevel
            : fallbackDetermineDiabeticRiskLevel;

        // Extract risk level from assessment or calculate it
        let riskLevel;
        if (assessment.riskLevel && assessment.riskLevel.includes("LOW")) {
          riskLevel = "Low";
        } else if (
          assessment.riskLevel &&
          assessment.riskLevel.includes("MODERATE")
        ) {
          riskLevel = "Moderate";
        } else if (
          assessment.riskLevel &&
          assessment.riskLevel.includes("HIGH")
        ) {
          riskLevel = "High";
        } else {
          riskLevel = getRiskLevel(totalScore);
        }

        // Get mapped gender for recommendations
        const mapGender =
          typeof mapGenderForDiabeticRecommendations === "function"
            ? mapGenderForDiabeticRecommendations
            : fallbackMapGenderForDiabeticRecommendations;

        const gender = userInfo.gender || "Male";
        const mappedGender = mapGender(gender, ageGroup);

        // Fetch recommendations for this assessment
        const recommendationData = await diabeticRecommendationsModel.findOne({
          ageGroup,
          gender: mappedGender,
          riskLevel,
        });

        // If recommendation found, include it with the assessment
        let recommendations = null;
        if (recommendationData) {
          recommendations = {
            dietaryRecommendation: recommendationData.dietaryRecommendation,
            medicalRecommendation: recommendationData.medicalRecommendation,
            physicalActivityRecommendation:
              recommendationData.physicalActivityRecommendation,
            riskLevel: riskLevel,
          };
        } else {
          // Try with default "All" gender if specific gender not found
          const defaultRecommendation =
            await diabeticRecommendationsModel.findOne({
              ageGroup,
              gender: "All",
              riskLevel,
            });

          if (defaultRecommendation) {
            recommendations = {
              dietaryRecommendation:
                defaultRecommendation.dietaryRecommendation,
              medicalRecommendation:
                defaultRecommendation.medicalRecommendation,
              physicalActivityRecommendation:
                defaultRecommendation.physicalActivityRecommendation,
              riskLevel: riskLevel,
            };
          }
        }

        // Return assessment with embedded recommendations
        return {
          _id: assessment._id,
          totalScore: assessment.totalScore,
          riskLevel: assessment.riskLevel,
          recommendations: recommendations,
          createdAt: assessment.createdAt,
        };
      })
    );

    return Response.success(
      res,
      assessmentsWithRecommendations,
      200,
      "Diabetic risk assessments and recommendations found successfully",
      AppConstant.SUCCESS
    );
  } catch (err) {
    console.error("Error fetching diabetic risk data:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

module.exports = {
  createDiabeticRiskCalculator,
  getAllDiabeticRiskCalculatorDateAndRisk,
};
