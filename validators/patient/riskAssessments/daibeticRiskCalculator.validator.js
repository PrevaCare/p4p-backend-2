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
});

module.exports = { diabeticRiskCalculatorValidation };
