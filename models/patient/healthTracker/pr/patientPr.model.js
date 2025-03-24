const mongoose = require("mongoose");

const patientPrSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "patient is required !"],
    },
    prGoal: {
      type: Number,
      required: [true, "spo2Goal  is required !"],
    },
    pr: {
      type: Number,
      required: [true, "spo2  is required !"],
    },
    date: {
      type: Date,
      required: [true, "date  is required !"],
      // default: Date.now,
    },
    measurementUnit: {
      type: String,
      default: "bpm",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PatientPr", patientPrSchema);
