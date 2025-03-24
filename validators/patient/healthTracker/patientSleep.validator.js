const Joi = require("joi");

// Validation for PatientSleep
const patientSleepValidation = Joi.object({
  patientId: Joi.string().required().messages({
    "string.base": "Patient ID must be a string",
    "any.required": "Patient ID is required",
  }),
  sleep: Joi.number().min(0).required().messages({
    "number.base": "Sleep must be a number",
    "number.min": "Sleep must be at least 0",
    "any.required": "Sleep is required",
  }),
  sleepGoal: Joi.number().min(0).optional().messages({
    "number.base": "Sleep Goal must be a number",
    "number.min": "Sleep Goal must be at least 0",
    "any.required": "Sleep Goal is required",
  }),
  measurementUnit: Joi.string().messages({
    "string.base": "Measurement Unit must be a string",
  }),
});

// Validation for PatientSleepGoal
const patientSleepGoalValidation = Joi.object({
  patientId: Joi.string().required().messages({
    "string.base": "Patient ID must be a string",
    "any.required": "Patient ID is required",
  }),
  sleepGoal: Joi.number().min(0).required().messages({
    "number.base": "Sleep Goal must be a number",
    "number.min": "Sleep Goal must be at least 0",
    "any.required": "Sleep Goal is required",
  }),
  measurementUnit: Joi.string().messages({
    "string.base": "Measurement Unit must be a string",
  }),
});

module.exports = {
  patientSleepValidation,
  patientSleepGoalValidation,
};
