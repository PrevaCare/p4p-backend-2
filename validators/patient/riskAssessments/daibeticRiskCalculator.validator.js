const Joi = require("joi");

const diabeticRiskCalculatorValidation = Joi.object({
  user: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.base": "User must be a valid ObjectId as a string.",
      "string.pattern.base": "User must be a valid MongoDB ObjectId.",
      "any.required": "User is required!",
    }),
  // Raw data fields
  age: Joi.number().min(0).optional().messages({
    "number.base": "Age must be a number.",
    "number.min": "Age cannot be negative.",
  }),
  gender: Joi.string().valid("Male", "Female").optional().messages({
    "string.base": "Gender must be a string.",
    "any.only": "Gender must be either 'Male' or 'Female'.",
  }),
  waistCircumference: Joi.number().min(0).optional().messages({
    "number.base": "Waist circumference must be a number.",
    "number.min": "Waist circumference cannot be negative.",
  }),
  physicalActivity: Joi.string().optional().messages({
    "string.base": "Physical activity must be a string.",
  }),
  familyHistory: Joi.string().optional().messages({
    "string.base": "Family history must be a string.",
  }),
  // Score fields
  ageScore: Joi.number().min(0).default(0).messages({
    "number.base": "Age Score must be a number.",
    "number.min": "Age Score cannot be negative.",
  }),
  waistScore: Joi.number().min(0).default(0).messages({
    "number.base": "Waist Score must be a number.",
    "number.min": "Waist Score cannot be negative.",
  }),
  physicalActivityScore: Joi.number().min(0).default(0).messages({
    "number.base": "Physical Activity Score must be a number.",
    "number.min": "Physical Activity Score cannot be negative.",
  }),
  familyHistoryScore: Joi.number().min(0).default(0).messages({
    "number.base": "Family History Score must be a number.",
    "number.min": "Family History Score cannot be negative.",
  }),
  totalScore: Joi.number().min(0).default(0).optional().messages({
    "number.base": "Total Score must be a number.",
    "number.min": "Total Score cannot be negative.",
  }),
  riskLevel: Joi.string().trim().optional().messages({
    "string.base": "Risk Level must be a string.",
  }),
}).custom((obj, helpers) => {
  // Validate that either raw data or scores are provided
  const hasRawData =
    obj.age &&
    obj.waistCircumference &&
    obj.physicalActivity &&
    obj.familyHistory &&
    obj.gender;
  const hasScores =
    obj.ageScore !== undefined &&
    obj.waistScore !== undefined &&
    obj.physicalActivityScore !== undefined &&
    obj.familyHistoryScore !== undefined;

  if (!hasRawData && !hasScores) {
    return helpers.error("custom.invalid", {
      message:
        "Either provide all raw data (age, waistCircumference, physicalActivity, familyHistory, gender) or all scores (ageScore, waistScore, physicalActivityScore, familyHistoryScore)",
    });
  }

  return obj;
});

module.exports = { diabeticRiskCalculatorValidation };
