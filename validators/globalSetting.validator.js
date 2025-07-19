const Joi = require('joi');

const discountSchema = Joi.object({
  value: Joi.number().required(),
  type: Joi.string().valid('fixed', 'percentage').required(),
});

const globalSettingSchema = Joi.object({
  consultationFee: Joi.number().required(),
  doctorConsultationFee: Joi.number().required(),
  corporateDiscount: discountSchema.required(),
  individualUserDiscount: discountSchema.required(),
});

exports.validateGlobalSetting = (req, res, next) => {
  const { error } = globalSettingSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  next();
}; 