const Joi = require("joi");

// Validation for creating or updating mood
const patientMoodValidationSchema = Joi.object({
  patientId: Joi.string().required().messages({
    "any.required": "Patient ID is required!",
  }),
  mood: Joi.string()
    .valid(
      "Happy",
      "Calm",
      "Anxious",
      "Motivated",
      "Sad",
      "Tired",
      "Angry",
      "Neutral"
    )
    .required()
    .messages({
      "any.required": "Mood is required!",
      "any.only": "Mood must be one of the valid options!",
    }),
});

module.exports = {
  patientMoodValidationSchema,
};
