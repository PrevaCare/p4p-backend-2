const Joi = require("joi");

// Validation for PatientBmiGoal
const patientBmiGoalValidationSchema = Joi.object({
  patientId: Joi.string().required().messages({
    "string.empty": "Patient ID is required!",
    "any.required": "Patient ID is required!",
  }),
  bmiGoal: Joi.number().required().messages({
    "number.base": "BMI goal must be a number!",
    "any.required": "BMI goal is required!",
  }),
  measurementUnit: Joi.string().messages({
    "string.base": "Measurement unit must be a string!",
  }),
});

// Validation for PatientBmi
const patientBmiValidationSchema = Joi.object({
  patientId: Joi.string().required().messages({
    "string.empty": "Patient ID is required!",
    "any.required": "Patient ID is required!",
  }),
  bmi: Joi.number().required().messages({
    "number.base": "BMI must be a number!",
    "any.required": "BMI is required!",
  }),

  date: Joi.date().required().messages({
    "date.base": "Date must be a valid date!",
    "any.required": "Date is required!",
  }),
  measurementUnit: Joi.string().messages({
    "string.base": "Measurement unit must be a string!",
  }),
});

module.exports = {
  patientBmiGoalValidationSchema,
  patientBmiValidationSchema,
};
