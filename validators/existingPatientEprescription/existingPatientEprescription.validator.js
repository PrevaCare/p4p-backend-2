const Joi = require("joi");

const existingPatientEprescriptionValidationSchema = Joi.object({
  user: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid user ID format!",
      "any.required": "User ID is required!",
    }),
  // existingEPrescriptionFile: Joi.string().required().messages({
  //   "any.required": "PDF file is required!",
  // }),
  date: Joi.string().required().messages({
    "any.required": "date is required!",
  }),
  documentType: Joi.string()
    .valid("dischargeSummary", "doctorVisit", "doctorNotes")
    .required()
    .messages({
      "any.only":
        "Document type must be one of ['dischargeSummary', 'doctorVisit', 'doctorNotes']",
      "any.required": "Document type is required!",
    }),
  hospitalName: Joi.string().required().messages({
    "any.required": "Hospital name is required!",
  }),
  doctorName: Joi.string().required().messages({
    "any.required": "Doctor name is required!",
  }),
  doctorSpeciality: Joi.string().required().messages({
    "any.required": "Doctor speciality is required!",
  }),
});

module.exports = { existingPatientEprescriptionValidationSchema };
