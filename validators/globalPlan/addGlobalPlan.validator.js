const Joi = require("joi");

// Define the Joi schema for labPackage
const addGlobalPlanSchema = Joi.object({
  name: Joi.string().required(),
  features: Joi.array().items(Joi.string()),
  price: Joi.number().required().positive(),
  remarks: Joi.string().allow("").optional(),
});
const updateGlobalPlanSchema = Joi.object({
  name: Joi.string().optional(),
  features: Joi.array().items(Joi.string().allow("")).optional(),
  price: Joi.number().positive().optional(),
  remarks: Joi.string().allow("").optional(),
});

module.exports = { addGlobalPlanSchema, updateGlobalPlanSchema };
