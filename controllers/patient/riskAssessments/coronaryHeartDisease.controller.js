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
const coronaryRecommendationsModel = require("../../../models/patient/riskAssessments/coronaryRecommendations.model");
const {
  determineRiskLevel,
  determineAgeGroup,
} = require("../../../utils/riskAssessment/coronaryRiskUtils");

// Create these utility functions locally in case the import fails
const fallbackDetermineRiskLevel = (riskPercentage) => {
  if (riskPercentage < 10) {
    return "Low";
  } else if (riskPercentage >= 10 && riskPercentage < 20) {
    return "Moderate";
  } else if (riskPercentage >= 20 && riskPercentage < 30) {
    return "High";
  } else {
    return "Very High";
  }
};

const fallbackDetermineAgeGroup = (age) => {
  if (age <= 30) {
    return "18-30";
  } else if (age > 30 && age <= 45) {
    return "31-45";
  } else if (age > 45 && age <= 60) {
    return "46-60";
  } else {
    return "61+";
  }
};

// create

const createCoronaryHeartDisease = async (req, res) => {
  try {
    const { error } = coronaryHeartDiseaseValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation error !"
      );
    }

    const { user, ...patientData } = req.body;
    // console.log(patientData);

    const riskPercentage = calculateRisk(patientData);

    const newCoronaryHeartDisease = new coronaryHeartDiseaseModel({
      ...req.body,
      riskPercentage,
    });
    const savedCoronaryHeartDisease = await newCoronaryHeartDisease.save();

    return Response.success(
      res,
      savedCoronaryHeartDisease,
      201,
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

// find data for creating coronary heart disease
const getDataToCreateCoronaryHeartDisease = async (req, res) => {
  const { employeeId } = req.body;
  try {
    const employeeHealthScoreData = await userModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(employeeId) } },
      {
        $lookup: {
          from: "healthscores", // health score collection name
          localField: "_id",
          foreignField: "user",
          as: "healthScore",
        },
      },
      { $unwind: { path: "$healthScore", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          systolicBP: { $ifNull: ["$healthScore.heartScore.BP.sys", 0] },
          totalCholesterol: {
            $ifNull: ["$healthScore.heartScore.totalCholesterol", 0],
          },
          hdlCholesterol: { $ifNull: ["$healthScore.heartScore.HDL", 0] },
          gender: "$gender",
          age: "$age",
        },
      },
    ]);
    // console.log(employeeHealthScoreData);
    return Response.success(
      res,
      employeeHealthScoreData[0],
      200,
      "data fetch to create coronary disease !",
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
// get all for employee dashboard
const getCoronaryHeartDiseaseOfParticularEmployeeForDetailPageRistAssessment =
  async (req, res) => {
    try {
      const { employeeId } = req.body;
      if (!employeeId) {
        return Response.error(
          res,
          404,
          AppConstant.FAILED,
          "employee id is missing !"
        );
      }

      const CoronaryHeartDieases = await coronaryHeartDiseaseModel
        .find({ user: employeeId }, "createdAt riskPercentage")
        .limit(10);
      return Response.success(
        res,
        CoronaryHeartDieases,
        200,
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

// coronary date score and date
const getCoronaryDataScoreAndDateByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.query;
    if (!employeeId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Employee ID is missing!"
      );
    }

    // Get all assessments sorted by date
    const allAssessments = await coronaryHeartDiseaseModel
      .find({ user: employeeId }, "riskPercentage riskLevel createdAt")
      .sort({ createdAt: -1 });

    // If there are no assessments, return empty array
    if (!allAssessments || allAssessments.length === 0) {
      return Response.success(
        res,
        { assessments: [] },
        200,
        "No coronary data found for this user",
        AppConstant.SUCCESS
      );
    }

    // Get user info to determine age group and gender
    const userInfo = await userModel.findById(employeeId);
    if (!userInfo) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "User information not found"
      );
    }

    // Determine age group from user age or default to middle age if not available
    const age = userInfo.age || 45;

    // Use imported function with fallback
    const getAgeGroup =
      typeof determineAgeGroup === "function"
        ? determineAgeGroup
        : fallbackDetermineAgeGroup;
    const ageGroup = getAgeGroup(age);

    // Determine gender, ensuring compatibility with various gender formats
    let gender = userInfo.gender;
    if (gender === "M") gender = "Male";
    else if (gender === "F") gender = "Female";
    else if (gender !== "Male" && gender !== "Female") gender = "Male"; // Default to Male if other or unknown

    // Get recommendations for each assessment
    const assessmentsWithRecommendations = await Promise.all(
      allAssessments.map(async (assessment) => {
        // Determine risk level based on percentage if not already set
        const riskPercentage = assessment.riskPercentage;

        // Use imported function with fallback
        const getRiskLevel =
          typeof determineRiskLevel === "function"
            ? determineRiskLevel
            : fallbackDetermineRiskLevel;
        const riskLevel = assessment.riskLevel || getRiskLevel(riskPercentage);

        // Fetch recommendations
        const recommendationData = await coronaryRecommendationsModel.findOne({
          ageGroup,
          gender,
          riskLevel,
        });

        let recommendations = null;
        if (recommendationData) {
          recommendations = {
            dietAdjustments: recommendationData.dietAdjustments,
            physicalActivity: recommendationData.physicalActivity,
            medicalInterventions: recommendationData.medicalInterventions,
            riskLevel: riskLevel,
          };
        } else {
          // If exact match not found, try to find recommendations with default risk level
          const defaultRecommendation =
            await coronaryRecommendationsModel.findOne({
              ageGroup,
              gender,
              riskLevel: "Moderate", // Default to moderate risk if specific level not found
            });

          if (defaultRecommendation) {
            recommendations = {
              dietAdjustments: defaultRecommendation.dietAdjustments,
              physicalActivity: defaultRecommendation.physicalActivity,
              medicalInterventions: defaultRecommendation.medicalInterventions,
              riskLevel: "Moderate",
              note: "Using default recommendations as exact match not found",
            };
          }
        }

        // Return assessment with embedded recommendations
        return {
          _id: assessment._id,
          riskPercentage: assessment.riskPercentage,
          riskLevel: riskLevel,
          recommendations: recommendations,
          createdAt: assessment.createdAt,
        };
      })
    );

    return Response.success(
      res,
      { assessments: assessmentsWithRecommendations },
      200,
      "Coronary data and recommendations found successfully!",
      AppConstant.SUCCESS
    );
  } catch (err) {
    console.error("Error in getCoronaryDataScoreAndDateByEmployeeId:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};
module.exports = {
  createCoronaryHeartDisease,
  getCoronaryHeartDiseaseOfParticularEmployeeForDetailPageRistAssessment,
  getDataToCreateCoronaryHeartDisease,
  getCoronaryDataScoreAndDateByEmployeeId,
};
