const mongoose = require("mongoose");

const patientSleepGoalSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "patient is required !"],
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

module.exports = mongoose.model("PatientSleepGoal", patientSleepGoalSchema);
