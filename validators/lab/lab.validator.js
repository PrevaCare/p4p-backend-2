const Joi = require("joi");

const addressSchema = Joi.object({
  name: Joi.string(),
  street: Joi.string(),
  city: Joi.string(),
  state: Joi.string(),
  zipCode: Joi.string(),
});
const accountsDetailValidationSchema = Joi.object({
  bankName: Joi.string().allow(""),
  ifscCode: Joi.string().allow(""),
  branchName: Joi.string().allow(""),
  accountNumber: Joi.string().allow(""),
});

const labValidationSchema = Joi.object({
  labName: Joi.string().required(),
  labPersonName: Joi.string().required(),
  contactNumber: Joi.string()
    .length(10)
    .pattern(/^[0-9]+$/),
  accountsDetail: accountsDetailValidationSchema,
  address: addressSchema,
  cityOperatedIn: Joi.array().items(
    Joi.object({
      cityName: Joi.string().required(),
      zipCode: Joi.string()
        .min(6)
        .max(6)
        .pattern(/^[0-9]+$/)
        .optional()
        .allow(""),
    })
  ),
});

const addressForUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  street: Joi.string().optional(),
  city: Joi.string().optional(),
  state: Joi.string().optional(),
  zipCode: Joi.string().optional(),
});

const accountsDetailValidationForUpdateSchema = Joi.object({
  bankName: Joi.string().allow("").optional(),
  ifscCode: Joi.string().allow("").optional(),
  branchName: Joi.string().allow("").optional(),
  accountNumber: Joi.string().allow("").optional(),
});

const updateLabValidationSchema = Joi.object({
  labName: Joi.string().optional(),
  labPersonName: Joi.string().optional(),
  contactNumber: Joi.string()
    .length(10)
    .pattern(/^[0-9]+$/)
    .optional(),
  accountsDetail: accountsDetailValidationForUpdateSchema.optional(),
  address: addressForUpdateSchema.optional(),
  cityOperatedIn: Joi.array().items(
    Joi.object({
      cityName: Joi.string().required(),
      zipCode: Joi.string()
        .min(6)
        .max(6)
        .pattern(/^[0-9]+$/)
        .optional()
        .allow(""),
    })
  ),
});

module.exports = {
  labValidationSchema,
  updateLabValidationSchema,
};
