const Joi = require("joi");

// Validation schema for stress risk calculator
const stressRiskCalculatorValidationSchema = Joi.object({
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
  pssQuestions: Joi.object({
    upsetByUnexpected: Joi.number().min(0).max(4).required().messages({
      "number.base": "Answer must be a number between 0-4",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 4",
      "any.required": "This question is required",
    }),
    unableToControl: Joi.number().min(0).max(4).required().messages({
      "number.base": "Answer must be a number between 0-4",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 4",
      "any.required": "This question is required",
    }),
    feltNervous: Joi.number().min(0).max(4).required().messages({
      "number.base": "Answer must be a number between 0-4",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 4",
      "any.required": "This question is required",
    }),
    confidentHandling: Joi.number().min(0).max(4).required().messages({
      "number.base": "Answer must be a number between 0-4",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 4",
      "any.required": "This question is required",
    }),
    thingsGoingWell: Joi.number().min(0).max(4).required().messages({
      "number.base": "Answer must be a number between 0-4",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 4",
      "any.required": "This question is required",
    }),
    couldNotCope: Joi.number().min(0).max(4).required().messages({
      "number.base": "Answer must be a number between 0-4",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 4",
      "any.required": "This question is required",
    }),
    controlIrritations: Joi.number().min(0).max(4).required().messages({
      "number.base": "Answer must be a number between 0-4",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 4",
      "any.required": "This question is required",
    }),
    onTopOfThings: Joi.number().min(0).max(4).required().messages({
      "number.base": "Answer must be a number between 0-4",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 4",
      "any.required": "This question is required",
    }),
    angryOutOfControl: Joi.number().min(0).max(4).required().messages({
      "number.base": "Answer must be a number between 0-4",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 4",
      "any.required": "This question is required",
    }),
    difficulties: Joi.number().min(0).max(4).required().messages({
      "number.base": "Answer must be a number between 0-4",
      "number.min": "Answer must be at least 0",
      "number.max": "Answer must be at most 4",
      "any.required": "This question is required",
    }),
  }).required(),
  additionalFactors: Joi.object({
    chronicConditions: Joi.array().items(Joi.string()),
    sleepQuality: Joi.string().valid("Poor", "Fair", "Good"),
    workLifeBalance: Joi.string().valid("Poor", "Fair", "Good"),
  }),
});

module.exports = {
  stressRiskCalculatorValidationSchema,
};
