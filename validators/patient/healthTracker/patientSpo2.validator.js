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
  spo2: Joi.number().min(60).max(100).required().messages({
    "number.base": "SpO2 must be a number!",
    "number.min": "SpO2 must be at least 70!",
    "number.max": "SpO2 cannot exceed 100!",
    "any.required": "SpO2 is required!",
  }),
  spo2Goal: Joi.number().min(90).max(100).messages({
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
  oxygenFlowRate: Joi.number().min(2).max(12).messages({
    "number.base": "oxygen flow rate must be a number!",
    "number.min": "oxygen flow rate must be at least 2!",
    "number.max": "oxygen flow rate cannot exceed 12!",
  }),
  measurementType: Joi.string().valid("Room Air", "On Oxygen").required().messages({
    "any.only": "measurementType must be either 'Room Air' or 'On Oxygen'!",
    "string.base": "measurementType must be a string!",
    "any.required": "measurementType is required!",
  }),

});

module.exports = {
  patientSpo2GoalValidationSchema,
  patientSpo2ValidationSchema,
};
