const Joi = require("joi");

const immunizationValidationSchema = Joi.object({
  userId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/) // Validates MongoDB ObjectId format
    .required()
    .messages({
      "string.pattern.base": "userId must be a valid MongoDB ObjectId!",
      "any.required": "userId is required!",
    }),
  doctorId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .allow(null)
    .messages({
      "string.pattern.base": "doctorId must be a valid MongoDB ObjectId!",
    }),
  emrId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .allow(null)
    .messages({
      "string.pattern.base": "emrId must be a valid MongoDB ObjectId!",
    }),
  immunizationType: Joi.string()
    .valid("up to date", "adding", "recommended")
    .optional()
    .messages({
      "any.only":
        "immunizationType must be one of 'up to date', 'adding', or 'recommended'!",
    }),
  vaccinationName: Joi.string().trim().optional().allow(null),
  totalDose: Joi.number().integer().min(1).optional().default(1).messages({
    "number.base": "totalDose must be a number!",
    "number.min": "totalDose must be at least 1!",
  }),
  doseDates: Joi.array()
    .items(
      Joi.object({
        date: Joi.date().required().messages({
          "date.base": "Each dose date must be a valid date!",
          "any.required": "Dose date is required!",
        }),
        status: Joi.string().valid("due", "completed").required().messages({
          "any.only": "Status must be either 'due' or 'completed'!",
          "any.required": "Status is required for each dose!",
        }),
      })
    )
    .optional()
    .messages({
      "array.base": "doseDates must be an array of dose objects!",
    }),
  doctorName: Joi.string().trim().optional().allow(null),
  sideEffects: Joi.string().trim().optional().allow(null),
  immunizationNotes: Joi.string().trim().optional().allow(null),
  immunizationFileUrl: Joi.string().uri().optional().allow(null).messages({
    "string.uri": "immunizationFileUrl must be a valid URI!",
  }),
});

module.exports = { immunizationValidationSchema };
