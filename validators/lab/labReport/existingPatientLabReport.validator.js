const Joi = require("joi");

// create
const createExistingPatientLabReportSchema = Joi.object({
  testName: Joi.string().required(),
  labName: Joi.string().required(),
  doctorName: Joi.string().required(),
  doctorSpeciality: Joi.string().required(),
  documentType: Joi.string()
    .valid("dischargeSummary", "doctorVisit", "doctorNotes")
    .required(),
});

module.exports = {
  createExistingPatientLabReportSchema,
};
