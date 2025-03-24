const mongoose = require("mongoose");

const patientWaterIntakeGoalSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "patient is required !"],
    },
    waterIntakeGoal: {
      type: Number,
      required: [true, "waterIntakeGoal  is required !"],
    },
    measurementUnit: {
      type: String,
      default: "L",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "PatientWaterIntakeGoal",
  patientWaterIntakeGoalSchema
);
