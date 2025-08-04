const Joi = require("joi");

const addressSchema = Joi.object({
  name: Joi.string().optional(),
  street: Joi.string().optional(),
  city: Joi.string().optional(),
  state: Joi.string().optional(),
  pincode: Joi.string()
    .pattern(/^\d{5,6}$/)
    .optional(),
}).optional();

const individualUserUpdateValidationSchema = Joi.object({
  //   profileImg: Joi.string().optional(),
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().optional(),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional(),
  gender: Joi.string().valid("M", "F", "O").optional(),
  address: addressSchema,
  isMarried: Joi.boolean().optional(),
  age: Joi.number().integer().min(0).optional(),
  weight: Joi.number().integer().min(0).optional(),
  height: Joi.number().integer().min(0).optional(),
  jobProfile: Joi.string().optional(),

  assignedDoctors: Joi.array().items(Joi.string()).optional(),
});

module.exports = { individualUserUpdateValidationSchema };
