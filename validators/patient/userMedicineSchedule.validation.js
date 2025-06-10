const Joi = require('joi');

const medicineSchema = Joi.object({
  drugName: Joi.string().required(),
  dosage: Joi.string().required(),
  source: Joi.string(),
  frequency: Joi.string().required(),
  doseCycleGap: Joi.string(),
  startDate: Joi.date().required(),
  endDate: Joi.date().allow(null),
  status: Joi.string().valid('Active', 'Completed', 'Stopped').default('Active')
});

const createUserMedicineScheduleSchema = Joi.object({
  diagnosisName: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().allow(null),
  medicines: Joi.array().items(medicineSchema).min(1).required(),
  isActive: Joi.boolean().default(true)
});

const updateUserMedicineScheduleSchema = Joi.object({
  diagnosisName: Joi.string(),
  startDate: Joi.date(),
  endDate: Joi.date().allow(null),
  medicines: Joi.array().items(medicineSchema),
  isActive: Joi.boolean()
});

module.exports = {
  createUserMedicineScheduleSchema,
  updateUserMedicineScheduleSchema
};
