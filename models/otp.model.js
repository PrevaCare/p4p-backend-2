const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    trim: true,
    required: [true, "phone number is required !"],
  },
  otp: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // auto delete from db agter 10 min
});

module.exports = mongoose.model("OTP", otpSchema);
