const mongoose = require("mongoose");

const patientPrGoalSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "patient is required !"],
    },
    prGoal: {
      type: Number,
      required: [true, "prGoal  is required !"],
    },
    measurementUnit: {
      type: String,
      default: "bpm",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PatientPrGoal", patientPrGoalSchema);
