const Joi = require("joi");

const dietaryHabitValidationSchema = Joi.object({
  regularMeals: Joi.boolean().default(false),
  frequentSnacks: Joi.boolean().default(false),
  processedFoods: Joi.boolean().default(false),
  sodaJuices: Joi.boolean().default(false),
  restaurantFood: Joi.boolean().default(false),
});

const liverRiskCalculatorValidationSchema = Joi.object({
  user: Joi.string().required().messages({
    "any.required": "User is required!",
  }),
  age: Joi.string().required(),
  gender: Joi.string().valid("Male", "Female", "Prefer not to say").required(),
  riskReasons: Joi.array().items(Joi.string()).required(),
  diabetes: Joi.string().valid("Yes", "No").required(),
  highBloodPressure: Joi.string().valid("Yes", "No").required(),
  exercise: Joi.string()
    .valid(
      "Over 2.5 Hours per Week",
      "1-2 Hours per Week",
      "Less than 1 Hour per Week",
      "Never"
    )
    .required(),
  alcohol: Joi.string()
    .valid(
      "Never",
      "Monthly or Less",
      "2-4 Times per Month",
      "2-3 Times per Week",
      "Over 4 Times per Week"
    )
    .required(),
  dietaryHabits: dietaryHabitValidationSchema,
  riskScore: Joi.number().optional().messages({
    "number.base": "Risk Score must be a number!",
  }),
  riskLevel: Joi.string().trim().optional().messages({
    "string.base": "Risk level must be a string!",
  }),
});

module.exports = { liverRiskCalculatorValidationSchema };
