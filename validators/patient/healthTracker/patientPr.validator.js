const Joi = require("joi");

// Validation for PatientPrGoal
const patientPrGoalValidationSchema = Joi.object({
  patientId: Joi.string().required().messages({
    "string.empty": "Patient ID is required!",
    "any.required": "Patient ID is required!",
  }),
  prGoal: Joi.number().min(40).max(180).required().messages({
    "number.base": "Pulse rate goal must be a number!",
    "number.min": "Pulse rate goal must be at least 40!",
    "number.max": "Pulse rate goal cannot exceed 180!",
    "any.required": "Pulse rate goal is required!",
  }),
  measurementUnit: Joi.string().messages({
    "string.base": "Measurement unit must be a string!",
  }),
});

// Validation for PatientPr
const patientPrValidationSchema = Joi.object({
  patientId: Joi.string().required().messages({
    "string.empty": "Patient ID is required!",
    "any.required": "Patient ID is required!",
  }),
  pr: Joi.number().min(40).max(200).required().messages({
    "number.base": "Pulse rate must be a number!",
    "number.min": "Pulse rate must be at least 40!",
    "number.max": "Pulse rate cannot exceed 200!",
    "any.required": "Pulse rate is required!",
  }),
  date: Joi.date().required().messages({
    "date.base": "Date must be a valid date!",
    "any.required": "Date is required!",
  }),
  measurementUnit: Joi.string().messages({
    "string.base": "Measurement unit must be a string!",
    "any.only": "Measurement unit must be 'bpm'.",
  }),
});

module.exports = {
  patientPrGoalValidationSchema,
  patientPrValidationSchema,
};
