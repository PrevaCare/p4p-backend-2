const Joi = require("joi");

const coronaryHeartDiseaseValidationSchema = Joi.object({
  user: Joi.string().required().messages({
    "string.base": "User must be a valid ObjectId (string format).",
    "any.required": "User is required!",
  }),
  gender: Joi.string().valid("M", "F", "O").required().messages({
    "any.only": "Gender must be one of 'M', 'F', or 'O'.",
    "any.required": "Gender is required!",
  }),
  age: Joi.number().integer().positive().required().messages({
    "number.base": "Age must be a number.",
    "number.integer": "Age must be an integer.",
    "number.positive": "Age must be a positive number.",
    "any.required": "Age is required!",
  }),
  race: Joi.number().valid(0, 1).required().messages({
    "number.base": "Race must be a number.",
    "any.only": "Race must be either 0 (White) or 1 (African American).",
    "any.required": "Race is required!",
  }),
  systolicBP: Joi.number().positive().required().messages({
    "number.base": "Systolic BP must be a number.",
    "number.positive": "Systolic BP must be a positive number.",
    "any.required": "Systolic BP is required!",
  }),
  onHypertensionMed: Joi.boolean().default(false).messages({
    "boolean.base":
      "onHypertensionMed must be a boolean value (true or false).",
  }),
  diabetes: Joi.boolean().default(false).messages({
    "boolean.base": "Diabetes must be a boolean value (true or false).",
  }),
  smoker: Joi.boolean().default(false).messages({
    "boolean.base": "Smoker must be a boolean value (true or false).",
  }),
  totalCholesterol: Joi.number().positive().required().messages({
    "number.base": "Total cholesterol must be a number.",
    "number.positive": "Total cholesterol must be a positive number.",
    "any.required": "Total cholesterol is required!",
  }),
  hdlCholesterol: Joi.number().positive().required().messages({
    "number.base": "HDL cholesterol must be a number.",
    "number.positive": "HDL cholesterol must be a positive number.",
    "any.required": "HDL cholesterol is required!",
  }),
  //   riskPercentage: Joi.number().min(0).max(100).required().messages({
  //     "number.base": "Risk percentage must be a number.",
  //     "number.min": "Risk percentage must be at least 0.",
  //     "number.max": "Risk percentage must not exceed 100.",
  //     "any.required": "Risk percentage is required!",
  //   }),
});

module.exports = { coronaryHeartDiseaseValidationSchema };
