const Joi = require("joi");

const testIncludedSchema = Joi.object({
  test: Joi.string().required().messages({
    "string.empty": "Test name is required.",
    "any.required": "Test name is required.",
  }),
  parameters: Joi.array().items(Joi.string()).optional(),
});

const cityAvailabilitySchema = Joi.object({
  cityId: Joi.string().messages({
    "string.empty": "City ID is required.",
    "any.required": "City ID is required.",
  }),
  cityName: Joi.string().required().messages({
    "string.empty": "City name is required.",
    "any.required": "City name is required.",
  }),
  state: Joi.string().required().messages({
    "string.empty": "State is required.",
    "any.required": "State is required.",
  }),
  pincode: Joi.string().allow("").default(""),
  pinCodes_excluded: Joi.array().items(Joi.string()).default([]),
  regions_excluded: Joi.array().items(Joi.string()).default([]),
  isActive: Joi.boolean().default(true),
  billingRate: Joi.number().required().messages({
    "number.base": "City-specific lab selling price must be a number.",
    "any.required": "City-specific lab selling price is required.",
  }),
  partnerRate: Joi.number().required().messages({
    "number.base": "City-specific offered price to PrevaCare must be a number.",
    "any.required": "City-specific offered price to PrevaCare is required.",
  }),
  prevaCarePrice: Joi.number().required().messages({
    "number.base": "City-specific PrevaCare price must be a number.",
    "any.required": "City-specific PrevaCare price is required.",
  }),
  discountPercentage: Joi.number().required().messages({
    "number.base": "City-specific discount percentage must be a number.",
    "any.required": "City-specific discount percentage is required.",
  }),
  homeCollectionCharge: Joi.number().default(0),
  homeCollectionAvailable: Joi.boolean().default(false)
});

const individualLabTestValidationSchema = Joi.object({
  lab: Joi.string().required().messages({
    "string.empty": "Lab ID is required.",
    "any.required": "Lab ID is required.",
  }),
  testCode: Joi.string().required().trim().messages({
    "string.empty": "Test code is required.",
    "any.required": "Test code is required.",
  }),
  desc: Joi.string().allow("").optional(),
  category: Joi.string().required().trim().messages({
    "string.empty": "Category is required.",
    "any.required": "Category is required.",
  }),
  testName: Joi.string().required().trim().messages({
    "string.empty": "Test name is required.",
    "any.required": "Test name is required.",
  }),
  testIncluded: Joi.array().items(testIncludedSchema),
  sampleRequired: Joi.array().items(Joi.string()).optional(),
  preparationRequired: Joi.array().items(Joi.string()).optional(),
  gender: Joi.string().default("both"),
  ageGroup: Joi.string().default("all age group"),
  homeCollectionChargeIncluded: Joi.boolean().default(false),
  cityAvailability: Joi.array().items(cityAvailabilitySchema),
  isActive: Joi.boolean().default(true)
});

module.exports = { individualLabTestValidationSchema };
