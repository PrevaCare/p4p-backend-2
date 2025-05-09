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

// Function to extract standardized risk level from legacy format
const extractRiskLevelFromLegacy = (legacyRiskLevel) => {
  const legacyText = legacyRiskLevel.toLowerCase();
  if (legacyText.includes("high")) return "High";
  if (legacyText.includes("moderate")) return "Moderate";
  if (legacyText.includes("low")) return "Low";
  return null; // Default case
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

// Helper function to calculate age score
const calculateAgeScore = (age) => {
  if (age < 35) return 0;
  if (age >= 35 && age <= 49) return 20;
  return 30; // age >= 50
};

// Helper function to calculate waist score
const calculateWaistScore = (waistCircumference, gender) => {
  if (gender.toLowerCase() === "female") {
    if (waistCircumference < 80) return 0;
    if (waistCircumference >= 80 && waistCircumference <= 89) return 10;
    return 20; // waistCircumference >= 90
  } else {
    if (waistCircumference < 90) return 0;
    if (waistCircumference >= 90 && waistCircumference <= 99) return 10;
    return 20; // waistCircumference >= 100
  }
};

// Helper function to calculate physical activity score
const calculatePhysicalActivityScore = (activityLevel) => {
  const level = activityLevel.toLowerCase();
  if (level.includes("vigorous") || level.includes("strenuous")) return 0;
  if (level.includes("moderate")) return 10;
  if (level.includes("mild")) return 20;
  return 30; // sedentary or no exercise
};

// Helper function to calculate family history score
const calculateFamilyHistoryScore = (familyHistory) => {
  const history = familyHistory.toLowerCase();
  if (history.includes("both")) return 20;
  if (history.includes("one")) return 10;
  return 0; // no diabetes in parents
};

const updateSampleRecommendation = async () => {
  try {
    const allRecs = await diabeticRecommendationsModel.find({});

    // Only update if records are missing the physicalActivityRecommendation field
    for (const rec of allRecs) {
      if (!rec.physicalActivityRecommendation) {
        // Add default physical activity recommendation based on risk level
        let activityRec =
          "Regular moderate physical activity for 30 minutes daily.";

        if (rec.riskLevel === "High") {
          activityRec = "Light exercise as approved by your doctor.";
        } else if (rec.riskLevel === "Moderate") {
          activityRec = "Moderate exercise 3-4 times per week.";
        }

        rec.physicalActivityRecommendation = activityRec;
        await rec.save();
        console.log(
          `Updated recommendation ${rec._id} with missing physical activity recommendation`
        );
      }
    }
  } catch (err) {
    console.error("Error updating sample recommendation:", err);
  }
};

// Create diabetic risk calculator entry
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

    let ageScore, waistScore, physicalActivityScore, familyHistoryScore;

    // Check if raw data is provided instead of scores
    if (
      req.body.age &&
      req.body.waistCircumference &&
      req.body.physicalActivity &&
      req.body.familyHistory
    ) {
      // Calculate scores from raw data
      ageScore = calculateAgeScore(req.body.age);
      waistScore = calculateWaistScore(
        req.body.waistCircumference,
        req.body.gender
      );
      physicalActivityScore = calculatePhysicalActivityScore(
        req.body.physicalActivity
      );
      familyHistoryScore = calculateFamilyHistoryScore(req.body.familyHistory);
    } else {
      // Use provided scores directly
      ageScore = Number(req.body.ageScore);
      waistScore = Number(req.body.waistScore);
      physicalActivityScore = Number(req.body.physicalActivityScore);
      familyHistoryScore = Number(req.body.familyHistoryScore);
    }

    // Calculate risk using helper function
    const { totalScore, riskLevel } = calculateDiabeticRiskHelper({
      ageScore,
      waistScore,
      physicalActivityScore,
      familyHistoryScore,
    });

    // Create new diabetic risk assessment
    const newDiabeticRisk = await diabeticRiskCalculatorModel.create({
      user: req.body.user,
      ageScore,
      waistScore,
      physicalActivityScore,
      familyHistoryScore,
      totalScore,
      riskLevel,
      // Include raw data if it was provided
      ...(req.body.age && {
        age: req.body.age,
        waistCircumference: req.body.waistCircumference,
        physicalActivity: req.body.physicalActivity,
        familyHistory: req.body.familyHistory,
        gender: req.body.gender,
      }),
    });

    return Response.success(
      res,
      newDiabeticRisk,
      201,
      "Diabetic risk assessment calculated successfully!",
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

// Get all diabetic risk assessments
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

    console.log(
      `Retrieving diabetic risk assessments for patient ${patientId}`
    );

    // Get all assessments sorted by date
    const allAssessments = await diabeticRiskCalculatorModel
      .find({ user: patientId })
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

    console.log(
      `Found ${allAssessments.length} assessments, latest has risk level: ${allAssessments[0].riskLevel}`
    );

    // Get user data for recommendations
    let userAge = 40; // Default age to middle age group if not found
    let userGender = "Male"; // Default gender if not found
    let userData = null;
    let patientData = null;

    try {
      userData = await userModel.findById(patientId);
      if (userData) {
        if (userData.gender) {
          userGender = userData.gender;
        }

        patientData = await individualUserModel.findOne({
          user: userData._id,
        });
        if (patientData && patientData.dateOfBirth) {
          userAge =
            new Date().getFullYear() -
            new Date(patientData.dateOfBirth).getFullYear();
        }
        console.log(`User data found: age=${userAge}, gender=${userGender}`);
      } else {
        console.log(`No user data found for ID ${patientId}, using defaults`);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      console.log("Using default age and gender values");
    }

    // Determine age group
    const ageGroup = determineDiabeticAgeGroup(userAge);

    // Map gender to appropriate format for recommendations
    const mappedGender = mapGenderForDiabeticRecommendations(
      userGender,
      ageGroup
    );

    // Process each assessment and add recommendation
    const assessmentsWithRecommendations = await Promise.all(
      allAssessments.map(async (assessment) => {
        // Convert to plain object so we can modify it
        const assessmentObj = assessment.toObject();

        // Get the standardized risk level
        const standardizedRiskLevel =
          assessment.riskLevel === "Low" ||
          assessment.riskLevel === "Moderate" ||
          assessment.riskLevel === "High"
            ? assessment.riskLevel
            : extractRiskLevelFromLegacy(assessment.riskLevel);

        // Find recommendation for this risk level
        let recommendation = null;
        try {
          // First try exact match
          recommendation = await diabeticRecommendationsModel.findOne({
            ageGroup,
            gender: mappedGender,
            riskLevel: standardizedRiskLevel,
          });

          // If not found, try with "All" gender
          if (!recommendation) {
            recommendation = await diabeticRecommendationsModel.findOne({
              ageGroup,
              gender: "All",
              riskLevel: standardizedRiskLevel,
            });
          }

          // If still not found, try just by risk level
          if (!recommendation) {
            recommendation = await diabeticRecommendationsModel.findOne({
              riskLevel: standardizedRiskLevel,
            });
          }

          // Last resort: use default recommendation
          if (!recommendation) {
            recommendation = {
              dietaryRecommendation:
                standardizedRiskLevel === "High"
                  ? "Follow a strict low-sugar, high-fiber diet."
                  : standardizedRiskLevel === "Moderate"
                  ? "Limit sugar intake and increase vegetables and whole grains."
                  : "Maintain a balanced diet with limited refined carbohydrates.",
              medicalRecommendation:
                standardizedRiskLevel === "High"
                  ? "Consult your doctor regularly for blood sugar monitoring."
                  : standardizedRiskLevel === "Moderate"
                  ? "Schedule regular blood sugar checks every 6 months."
                  : "Annual blood sugar screening is recommended.",
              physicalActivityRecommendation:
                standardizedRiskLevel === "High"
                  ? "Light exercise as approved by your doctor."
                  : standardizedRiskLevel === "Moderate"
                  ? "Moderate exercise 3-4 times per week."
                  : "Regular physical activity for 30 minutes daily.",
            };
          } else {
            // Convert Mongoose document to plain object
            recommendation = recommendation.toObject();

            // Remove fields that shouldn't be in the response
            delete recommendation._id;
            delete recommendation.ageGroup;
            delete recommendation.gender;
            delete recommendation.riskLevel;
            delete recommendation.__v;
            delete recommendation.createdAt;
            delete recommendation.updatedAt;
          }
        } catch (err) {
          console.error("Error fetching recommendation:", err);
          // Set default empty recommendation
          recommendation = {};
        }

        // Add recommendation directly to assessment object
        assessmentObj.recommendation = recommendation;
        return assessmentObj;
      })
    );

    // Extract user profile data to include in response
    const userProfile = {
      age: userAge,
      gender: userGender,
      name: userData ? userData.name : null,
      email: userData ? userData.email : null,
      phone: userData ? userData.phoneNumber : null,
    };

    const responseData = {
      userProfile: userProfile,
      assessments: assessmentsWithRecommendations,
    };

    return Response.success(
      res,
      responseData,
      200,
      "Diabetic risk assessments found successfully",
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
  createDiabeticRiskCalculator,
  getAllDiabeticRiskCalculatorDateAndRisk,
};
