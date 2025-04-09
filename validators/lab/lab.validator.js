const Joi = require("joi");

const addressSchema = Joi.object({
  name: Joi.string().required(),
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zipCode: Joi.string().required(),
});

const accountsDetailSchema = Joi.object({
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
  address: Joi.object({
    name: Joi.string().required(),
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
  }).required(),
  accountsDetail: accountsDetailSchema,
  cityOperatedIn: Joi.array()
    .items(
      Joi.object({
        cityName: Joi.string().required(),
        zipCode: Joi.string()
          .length(6)
          .pattern(/^[0-9]+$/)
          .required(),
        existingCityId: Joi.string().optional(),
      })
    )
    .min(1)
    .required(),
});

const updateLabValidationSchema = Joi.object({
  labName: Joi.string(),
  labPersonName: Joi.string(),
  contactNumber: Joi.string()
    .length(10)
    .pattern(/^[0-9]+$/),
  address: Joi.object({
    name: Joi.string(),
    street: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    zipCode: Joi.string(),
  }),
  accountsDetail: accountsDetailSchema,
  cityOperatedIn: Joi.array()
    .items(
      Joi.object({
        cityName: Joi.string().required(),
        zipCode: Joi.string()
          .length(6)
          .pattern(/^[0-9]+$/)
          .required(),
      })
    )
    .min(1),
});

module.exports = {
  labValidationSchema,
  updateLabValidationSchema,
};
