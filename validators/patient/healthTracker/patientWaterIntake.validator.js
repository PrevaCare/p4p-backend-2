const Joi = require("joi");

const patientWaterIntakeValidation = Joi.object({
  patientId: Joi.string()
    .required()
    .messages({ "any.required": "Patient ID is required!" }),
  waterIntake: Joi.number()
    .required()
    .messages({ "any.required": "Water intake is required!" }),
  measurementUnit: Joi.string().allow(""),
  date: Joi.date(),
});

const patientWaterIntakeGoalValidation = Joi.object({
  patientId: Joi.string()
    .required()
    .messages({ "any.required": "Patient ID is required!" }),
  waterIntakeGoal: Joi.number()
    .required()
    .messages({ "any.required": "Water intake goal is required!" }),
  measurementUnit: Joi.string().allow(""),
});

module.exports = {
  patientWaterIntakeGoalValidation,
  patientWaterIntakeValidation,
};
