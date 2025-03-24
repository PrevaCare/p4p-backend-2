const Joi = require("joi");

// Validation for PatientWeight
const patientWeightValidationSchema = Joi.object({
  patientId: Joi.string().required().messages({
    "string.empty": "Patient ID is required!",
    "any.required": "Patient ID is required!",
  }),
  weight: Joi.number().required().messages({
    "number.base": "Weight must be a number!",
    "any.required": "Weight is required!",
  }),

  date: Joi.date().required().messages({
    "date.base": "Date must be a valid date!",
    "any.required": "Date is required!",
  }),
  measurementUnit: Joi.string().messages({
    "string.base": "Measurement unit must be a string!",
  }),
});

// Validation for PatientWeightGoal
const patientWeightGoalValidationSchema = Joi.object({
  patientId: Joi.string().required().messages({
    "string.empty": "Patient ID is required!",
    "any.required": "Patient ID is required!",
  }),
  weightGoal: Joi.number().required().messages({
    "number.base": "Weight goal must be a number!",
    "any.required": "Weight goal is required!",
  }),
  measurementUnit: Joi.string().messages({
    "string.base": "Measurement unit must be a string!",
  }),
});

module.exports = {
  patientWeightValidationSchema,
  patientWeightGoalValidationSchema,
};
