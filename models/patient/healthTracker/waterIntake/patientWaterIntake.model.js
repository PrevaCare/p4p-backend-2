const mongoose = require("mongoose");

const patientWaterIntakeSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "patient is required !"],
    },
    waterIntake: {
      type: Number,
      required: [true, "waterIntake is required !"],
    },
    waterIntakeGoal: {
      type: Number,
      required: [true, "waterIntakeGoal  is required !"],
    },
    measurementUnit: {
      type: String,
      default: "L",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PatientWaterIntake", patientWaterIntakeSchema);
