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
const {
  diabeticRiskCalculatorValidation,
} = require("../../../validators/patient/riskAssessments/daibeticRiskCalculator.validator");
const {
  calculateDiabeticRiskHelper,
} = require("../../../helper/riskAssessment/diabeticRiskCalculator.helper");
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

    // const newDiabeticRisk = new diabeticRiskCalculatorModel(req.body);
    // const savedDiabeticRisk = await newDiabeticRisk.save();
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
    const savedDiabeticRisk = await diabeticRiskCalculatorModel
      .find({ user: patientId }, "totalScore riskLevel createdAt")
      .sort({ createdAt: -1 })
      .limit(10);
    return Response.success(res, savedDiabeticRisk, 200, AppConstant.SUCCESS);
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
