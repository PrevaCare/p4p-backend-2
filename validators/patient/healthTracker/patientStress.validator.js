const Joi = require("joi");

// Array of valid question keys
const validQuestionKeys = [
  "unexpectedEvents",
  "controlImportantThings",
  "nervousStressed",
  "handleProblems",
  "goingYourWay",
  "copeWithThings",
  "controlIrritations",
  "onTopOfThings",
  "outsideControl",
  "difficultiesPilingUp",
];

// Validation for creating stress assessment
const patientStressValidationSchema = Joi.object({
  patientId: Joi.string().required().messages({
    "any.required": "Patient ID is required!",
  }),
  responses: Joi.array()
    .items(
      Joi.object({
        questionKey: Joi.string()
          .valid(...validQuestionKeys)
          .required()
          .messages({
            "any.required": "Question key is required!",
            "any.only": "Question key must be one of the valid question keys!",
          }),
        response: Joi.number().integer().min(0).max(4).required().messages({
          "any.required": "Response is required!",
          "number.base": "Response must be a number!",
          "number.min": "Response must be at least 0!",
          "number.max": "Response must be at most 4!",
        }),
      })
    )
    .length(10)
    .required()
    .messages({
      "any.required": "All 10 responses are required!",
      "array.length": "All 10 responses are required!",
    }),
});

// Validation for retrieving stress assessments
const stressByDateRangeValidationSchema = Joi.object({
  patientId: Joi.string().required().messages({
    "any.required": "Patient ID is required!",
  }),
  startDate: Joi.date().required().messages({
    "any.required": "Start date is required!",
    "date.base": "Start date must be a valid date!",
  }),
  endDate: Joi.date().required().messages({
    "any.required": "End date is required!",
    "date.base": "End date must be a valid date!",
  }),
});

module.exports = {
  patientStressValidationSchema,
  stressByDateRangeValidationSchema,
  validQuestionKeys,
};
