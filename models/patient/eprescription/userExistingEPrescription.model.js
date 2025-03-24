const mongoose = require("mongoose");

const userExistingEPrescriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    documentName: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    doctorName: {
      type: String,
      required: [true, "doctor name is required !"],
    },
    specialization: {
      type: String,
      required: [true, "specialization required !"],
    },
    ePrescriptionFileUrl: {
      type: String,
      required: [true, "prescription pdf required !"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "UserExistingEprescription",
  userExistingEPrescriptionSchema
);
