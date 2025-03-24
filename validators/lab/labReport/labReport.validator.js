const Joi = require("joi");

const labReportValidationSchema = Joi.object({
  user: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required(),
  lab: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required(),
  // doctor: Joi.string()
  //   .regex(/^[0-9a-fA-F]{24}$/)
  //   .required(),
  // logo: Joi.string().required(),
  category: Joi.string().required(),
  testName: Joi.string().required(),
  remarks: Joi.string().allow("").optional(),
  documentType: Joi.string()
    .valid("Blood Report", "Urine Report", "Imaging Reports", "Other")
    .required(),
  price: Joi.number().required(),
});

module.exports = {
  labReportValidationSchema,
};
