const Joi = require("joi");

const allergyValidationSchema = Joi.object({
  userId: Joi.string().required().messages({
    "any.required": "userId is required!",
    "string.empty": "userId cannot be empty!",
  }),
  doctorId: Joi.string().optional(), // Optional field for doctorId
  emrId: Joi.string().optional(), // Optional field for emrId
  allergyName: Joi.string().optional(), // Optional field for allergyName
  pastAllergyDrugName: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "pastAllergyDrugName must be an array of strings!",
  }),
  pastAllergyFreequency: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "pastAllergyFreequency must be an array of strings!",
  }),
  advisedBy: Joi.string().optional(),
  advise: Joi.string().optional(),
  adviseAllergyDrugName: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "adviseAllergyDrugName must be an array of strings!",
  }),
  adviseAllergyFreequency: Joi.array().items(Joi.string()).optional().messages({
    "array.base": "adviseAllergyFreequency must be an array of strings!",
  }),
  //   allergyFileUrl: Joi.string().uri().optional().messages({
  //     "string.uri": "allergyFileUrl must be a valid URI!",
  //   }),
});

module.exports = { allergyValidationSchema };
