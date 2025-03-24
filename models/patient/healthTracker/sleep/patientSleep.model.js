const mongoose = require("mongoose");

const patientSleepSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "patient is required !"],
    },
    sleep: {
      type: Number,
      default: 8,
      required: [true, "sleep  is required !"],
    },
    sleepGoal: {
      type: Number,
      default: 8,
      required: [true, "sleepGoal  is required !"],
    },
    measurementUnit: {
      type: String,
      default: "hrs",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PatientSleep", patientSleepSchema);
