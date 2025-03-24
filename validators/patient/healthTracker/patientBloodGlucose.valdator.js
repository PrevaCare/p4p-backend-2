const Joi = require("joi");

const validatePatientBloodGlucoseGoal = Joi.object({
  patientId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.base": "patientId must be a valid string!",
      "string.empty": "patientId is required!",
      "any.required": "patientId is required!",
      "string.pattern.base": "patientId must be a valid ObjectId!",
    }),
  bloodGlucoseGoal: Joi.number().required().messages({
    "number.base": "bloodGlucoseGoal must be a number!",
    "any.required": "bloodGlucoseGoal is required!",
  }),
  measurementUnit: Joi.string().optional(),
  readingType: Joi.string().valid("Fasting", "Random", "Post Meal").messages({
    "string.base": "readingType must be a string!",
    "any.only": "readingType must be one of Fasting, Random, or Post Meal!",
  }),
});
const validatePatientBloodGlucose = Joi.object({
  patientId: Joi.string()
    .required()
    .regex(/^[0-9a-fA-F]{24}$/)
    .messages({
      "string.base": "patientId must be a valid string!",
      "string.empty": "patientId is required!",
      "any.required": "patientId is required!",
      "string.pattern.base": "patientId must be a valid ObjectId!",
    }),
  measurementUnit: Joi.string().optional(),
  bloodGlucose: Joi.number().required().messages({
    "number.base": "bloodGlucose must be a number!",
    "any.required": "bloodGlucose is required!",
  }),
  date: Joi.date().optional(),

  readingType: Joi.string().valid("Fasting", "Random", "Post Meal").messages({
    "string.base": "readingType must be a string!",
    "any.only": "readingType must be one of Fasting, Random, or Post Meal!",
  }),
});

module.exports = {
  validatePatientBloodGlucose,
  validatePatientBloodGlucoseGoal,
};
