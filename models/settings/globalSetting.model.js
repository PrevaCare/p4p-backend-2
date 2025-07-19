const mongoose = require('mongoose');

const DiscountSchema = new mongoose.Schema({
  value: { type: Number, required: true },
  type: { type: String, enum: ['fixed', 'percentage'], required: true },
}, { _id: false });

const GlobalSettingSchema = new mongoose.Schema({
  consultationFee: { type: Number, required: true },
  doctorConsultationFee: { type: Number, required: true },
  corporateDiscount: { type: DiscountSchema, required: true },
  individualUserDiscount: { type: DiscountSchema, required: true },
}, { timestamps: true });

module.exports = mongoose.model('GlobalSetting', GlobalSettingSchema); 