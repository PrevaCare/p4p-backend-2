const Joi = require("joi");

const addressSchema = Joi.object({
  name: Joi.string().required(),
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  pincode: Joi.string().required(),
});

const accountsDetailSchema = Joi.object({
  bankName: Joi.string().allow(""),
  ifscCode: Joi.string().allow(""),
  branchName: Joi.string().allow(""),
  accountNumber: Joi.string().allow(""),
});

const availableCitySchema = Joi.object({
  cityId: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
  cityName: Joi.string().required(),
  state: Joi.string().required(),
  pinCodes_excluded: Joi.array().items(Joi.string()).default([]),
  regions_excluded: Joi.array().items(Joi.string()).default([]),
  isActive: Joi.boolean().default(true),
});

const labValidationSchema = Joi.object({
  logo: Joi.string().optional(),
  labName: Joi.string().required(),
  labPersonName: Joi.string().required(),
  contactNumber: Joi.string()
    .length(10)
    .pattern(/^[0-9]+$/),
  address: addressSchema.required(),
  accountsDetail: accountsDetailSchema,
  availableCities: Joi.array().items(availableCitySchema).min(1).required(),
});

const updateLabValidationSchema = Joi.object({
  logo: Joi.string().optional(),
  labName: Joi.string(),
  labPersonName: Joi.string(),
  contactNumber: Joi.string()
    .length(10)
    .pattern(/^[0-9]+$/),
  address: addressSchema,
  accountsDetail: accountsDetailSchema,
  availableCities: Joi.array().items(availableCitySchema).min(1),
});

module.exports = {
  labValidationSchema,
  updateLabValidationSchema,
};
