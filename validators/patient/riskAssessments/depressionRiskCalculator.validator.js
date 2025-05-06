const Joi = require("joi");

// Validation schema for depression risk calculator
const depressionRiskCalculatorValidationSchema = Joi.object({
  user: Joi.string().required().messages({
    "string.empty": "User ID is required",
    "any.required": "User ID is required",
  }),
  age: Joi.number().required().min(18).messages({
    "number.base": "Age must be a number",
    "number.min": "Age must be at least 18",
    "any.required": "Age is required",
  }),
  gender: Joi.string().valid("Male", "Female", "Other").required().messages({
    "string.empty": "Gender is required",
    "any.required": "Gender is required",
    "any.only": "Gender must be Male, Female, or Other",
  }),
  phqQuestions: Joi.object({
    littleInterest: Joi.number().min(0).max(3).required().messages({
      "number.base": "Answer must be a number between 0-3",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 3",
      "any.required": "This question is required",
    }),
    feelingDown: Joi.number().min(0).max(3).required().messages({
      "number.base": "Answer must be a number between 0-3",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 3",
      "any.required": "This question is required",
    }),
    sleepIssues: Joi.number().min(0).max(3).required().messages({
      "number.base": "Answer must be a number between 0-3",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 3",
      "any.required": "This question is required",
    }),
    feelingTired: Joi.number().min(0).max(3).required().messages({
      "number.base": "Answer must be a number between 0-3",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 3",
      "any.required": "This question is required",
    }),
    appetiteIssues: Joi.number().min(0).max(3).required().messages({
      "number.base": "Answer must be a number between 0-3",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 3",
      "any.required": "This question is required",
    }),
    feelingBad: Joi.number().min(0).max(3).required().messages({
      "number.base": "Answer must be a number between 0-3",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 3",
      "any.required": "This question is required",
    }),
    concentrationIssues: Joi.number().min(0).max(3).required().messages({
      "number.base": "Answer must be a number between 0-3",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 3",
      "any.required": "This question is required",
    }),
    movingSpeaking: Joi.number().min(0).max(3).required().messages({
      "number.base": "Answer must be a number between 0-3",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 3",
      "any.required": "This question is required",
    }),
    suicidalThoughts: Joi.number().min(0).max(3).required().messages({
      "number.base": "Answer must be a number between 0-3",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 3",
      "any.required": "This question is required",
    }),
  }).required(),
  additionalFactors: Joi.object({
    chronicConditions: Joi.array().items(Joi.string()),
    medicationUse: Joi.array().items(Joi.string()),
    pastTreatment: Joi.string(),
    sleepHours: Joi.number().min(0).max(24),
  }),
});

module.exports = {
  depressionRiskCalculatorValidationSchema,
};
