const mongoose = require("mongoose");

const patientBmiGoalSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "patient is required !"],
    },
    bmiGoal: {
      type: Number,
      required: [true, "weightGoal  is required !"],
    },
    measurementUnit: {
      type: String,
      default: "Kg/m2",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PatientBmiGoal", patientBmiGoalSchema);
