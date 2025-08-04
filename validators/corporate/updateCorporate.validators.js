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
const corporateUpdateSchema = Joi.object({
  //   profileImg: Joi.string().optional(),
  companyName: Joi.string().optional(),
  gstNumber: Joi.string().optional(),
  email: Joi.string().email().optional(),
  //   password: Joi.string().optional(),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional(),
  //   corporate: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  addresses: Joi.array().items(addressSchema).optional(),
  designation: Joi.string().optional(),
  department: Joi.string()
    .valid(
      "HR",
      "FIN",
      "IT",
      "MKT",
      "SLS",
      "OPS",
      "CS",
      "R&D",
      "ADM",
      "QA",
      "PR",
      "BD",
      "T&D"
    )
    .optional(),
  assignedDoctors: Joi.array().items(Joi.string()).optional(),
});

module.exports = { corporateUpdateSchema };
