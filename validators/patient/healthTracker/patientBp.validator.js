const Joi = require("joi");

const patientBPValidationSchema = Joi.object({
  patientId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid patient ID format!",
      "any.required": "Patient is required!",
    }),
  sysGoal: Joi.number().required().messages({
    "number.base": "Systolic pressure (sys) must be a number!",
    "any.required": "Systolic pressure (sys) is required!",
  }),
  diaGoal: Joi.number().required().messages({
    "number.base": "Diastolic pressure (dia) must be a number!",
    "any.required": "Diastolic pressure (dia) is required!",
  }),
  sys: Joi.number().required().messages({
    "number.base": "Systolic pressure (sys) must be a number!",
    "any.required": "Systolic pressure (sys) is required!",
  }),
  dia: Joi.number().required().messages({
    "number.base": "Diastolic pressure (dia) must be a number!",
    "any.required": "Diastolic pressure (dia) is required!",
  }),
  date: Joi.date()
    .iso()
    // .default(() => new Date().toISOString(), "current ISO date")
    .messages({
      "date.base": "Invalid date format!",
      "date.format":
        "Date must be in ISO 8601 format (e.g., YYYY-MM-DDTHH:mm:ss.sssZ)!",
    }),
  measurementUnit: Joi.string().optional(),
});
const patientBPGoalValidationSchema = Joi.object({
  patientId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid patient ID format!",
      "any.required": "Patient is required!",
    }),
  sysGoal: Joi.number().required().messages({
    "number.base": "Systolic pressure (sys) must be a number!",
    "any.required": "Systolic pressure (sys) is required!",
  }),
  diaGoal: Joi.number().required().messages({
    "number.base": "Diastolic pressure (dia) must be a number!",
    "any.required": "Diastolic pressure (dia) is required!",
  }),
  measurementUnit: Joi.string().optional(),
});

module.exports = { patientBPValidationSchema, patientBPGoalValidationSchema };
