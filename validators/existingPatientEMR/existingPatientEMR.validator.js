const Joi = require("joi");

// create
const createExistingPatientEMRSchema = Joi.object({
  existingEMRFile: Joi.string().required(),
  documentType: Joi.string()
    .valid("dischargeSummary", "doctorVisit", "doctorNotes")
    .required(),
  hospitalName: Joi.string().required(),
  doctorName: Joi.string().required(),
  doctorSpeciality: Joi.string().required(),
});

module.exports = {
  createExistingPatientEMRSchema,
};
