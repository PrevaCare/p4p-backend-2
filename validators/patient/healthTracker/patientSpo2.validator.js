const Joi = require("joi");

// Validation for PatientSpo2Goal
const patientSpo2GoalValidationSchema = Joi.object({
  patientId: Joi.string().required().messages({
    "string.empty": "Patient ID is required!",
    "any.required": "Patient ID is required!",
  }),
  spo2Goal: Joi.number().min(90).max(100).required().messages({
    "number.base": "SpO2 goal must be a number!",
    "number.min": "SpO2 goal must be at least 90!",
    "number.max": "SpO2 goal cannot exceed 100!",
    "any.required": "SpO2 goal is required!",
  }),
  measurementUnit: Joi.string().messages({
    "string.base": "Measurement unit must be a string!",
  }),
});

// Validation for PatientSpo2
const patientSpo2ValidationSchema = Joi.object({
  patientId: Joi.string().required().messages({
    "string.empty": "Patient ID is required!",
    "any.required": "Patient ID is required!",
  }),
  spo2: Joi.number().min(70).max(100).required().messages({
    "number.base": "SpO2 must be a number!",
    "number.min": "SpO2 must be at least 70!",
    "number.max": "SpO2 cannot exceed 100!",
    "any.required": "SpO2 is required!",
  }),
  spo2Goal: Joi.number().min(90).max(100).required().messages({
    "number.base": "SpO2 goal must be a number!",
    "number.min": "SpO2 goal must be at least 90!",
    "number.max": "SpO2 goal cannot exceed 100!",
    "any.required": "SpO2 goal is required!",
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
  patientSpo2GoalValidationSchema,
  patientSpo2ValidationSchema,
};
