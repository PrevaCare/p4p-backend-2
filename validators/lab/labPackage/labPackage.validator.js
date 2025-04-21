const Joi = require("joi");

const testIncludedSchema = Joi.object({
  test: Joi.string().required().messages({
    "string.empty": "Test name is required.",
    "any.required": "Test name is required.",
  }),
  parameters: Joi.array().items(Joi.string()).optional(),
});

const labPackageValidationSchema = Joi.object({
  lab: Joi.string().required().messages({
    "string.empty": "Lab ID is required.",
    "any.required": "Lab ID is required.",
  }),
  desc: Joi.string().allow("").optional().messages({
    "string.base": "Description must be a string.",
  }),
  ageGroup: Joi.string().allow("").optional().messages({
    "string.base": "age group must be a string.",
  }),
  gender: Joi.string().allow("").optional().messages({
    "string.base": "gender must be a string.",
  }),
  category: Joi.string().required().messages({
    "string.empty": "Category is required.",
    "any.required": "Category is required.",
  }),
  testName: Joi.string().trim().required().messages({
    "string.empty": "Test name is required.",
    "any.required": "Test name is required.",
  }),
  testIncluded: Joi.array().items(testIncludedSchema).messages({
    "array.base": "Test included must be an array.",
  }),
  sampleRequired: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "Sample required must be an array.",
  }),
  preparationRequired: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "Preparation required must be an array.",
  }),
  labSellingPrice: Joi.number().required().messages({
    "number.base": "Lab selling price must be a number.",
    "any.required": "Lab selling price is required.",
  }),
  offeredPriceToPrevaCare: Joi.number().required().messages({
    "number.base": "Offered price to PrevaCare must be a number.",
    "any.required": "Offered price to PrevaCare is required.",
  }),
  prevaCarePriceForCorporate: Joi.number().required().messages({
    "number.base": "PrevaCare price for corporate must be a number.",
    "any.required": "PrevaCare price for corporate is required.",
  }),
  prevaCarePriceForIndividual: Joi.number().required().messages({
    "number.base": "PrevaCare price for individual must be a number.",
    "any.required": "PrevaCare price for individual is required.",
  }),
  discountPercentage: Joi.number().required().messages({
    "number.base": "Discount percentage must be a number.",
    "any.required": "Discount percentage is required.",
  }),
  homeCollectionCharge: Joi.number().default(0).messages({
    "number.base": "Home collection charge must be a number.",
  }),
  homeCollectionChargeIncluded: Joi.boolean().default(false).messages({
    "boolean.base": "Home collection charge included must be a boolean.",
  }),
});

module.exports = { labPackageValidationSchema };
