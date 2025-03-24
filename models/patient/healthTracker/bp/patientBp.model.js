const mongoose = require("mongoose");

const patientBpSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "patient is required !"],
    },
    sys: {
      type: Number,
      required: [true, "sys is required !"],
    },
    dia: {
      type: Number,
      required: [true, "dia is required !"],
    },
    sysGoal: {
      type: Number,
      required: [true, "sysGoal is required !"],
    },
    diaGoal: {
      type: Number,
      required: [true, "diaGoal is required !"],
    },
    measurementUnit: {
      type: String,
      default: "mmHg",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PatientBP", patientBpSchema);
