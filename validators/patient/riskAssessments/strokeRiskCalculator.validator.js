const Joi = require("joi");

const strokeRiskCalculatorValidationSchema = Joi.object({
  user: Joi.string().required().messages({
    "any.required": "User is required!",
    "string.empty": "User must not be empty!",
  }),
  bloodPressure: Joi.string().valid("higher", "lower").optional().messages({
    "any.only": "Blood Pressure must be 'higher' or 'lower'!",
  }),
  atrialFibrillation: Joi.string()
    .valid("higher", "lower")
    .optional()
    .messages({
      "any.only": "Atrial Fibrillation must be 'higher' or 'lower'!",
    }),
  bloodSugar: Joi.string().valid("higher", "lower").optional().messages({
    "any.only": "Blood Sugar must be 'higher' or 'lower'!",
  }),
  bmi: Joi.string().valid("higher", "lower").optional().messages({
    "any.only": "BMI must be 'higher' or 'lower'!",
  }),
  diet: Joi.string().valid("higher", "lower").optional().messages({
    "any.only": "Diet must be 'higher' or 'lower'!",
  }),
  cholesterol: Joi.string().valid("higher", "lower").optional().messages({
    "any.only": "Cholesterol must be 'higher' or 'lower'!",
  }),
  diabetes: Joi.string().valid("higher", "lower").optional().messages({
    "any.only": "Diabetes must be 'higher' or 'lower'!",
  }),
  physicalActivity: Joi.string().valid("higher", "lower").optional().messages({
    "any.only": "Physical Activity must be 'higher' or 'lower'!",
  }),
  history: Joi.string().valid("higher", "lower").optional().messages({
    "any.only": "History must be 'higher' or 'lower'!",
  }),
  tobacco: Joi.string().valid("higher", "lower").optional().messages({
    "any.only": "Tobacco must be 'higher' or 'lower'!",
  }),
  lowerRiskScore: Joi.number().min(0).optional().messages({
    "number.base": "Lower Risk Score must be a number!",
    "number.min": "Lower Risk Score must be at least 0!",
  }),
  higherRiskScore: Joi.number().min(0).optional().messages({
    "number.base": "Higher Risk Score must be a number!",
    "number.min": "Higher Risk Score must be at least 0!",
  }),
  desc: Joi.string().allow("").optional().messages({
    "string.base": "Description must be a string!",
  }),
});

module.exports = { strokeRiskCalculatorValidationSchema };
