const mongoose = require("mongoose");

const patientWeightGoalSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "patient is required !"],
    },
    weightGoal: {
      type: Number,
      required: [true, "weightGoal  is required !"],
    },
    measurementUnit: {
      type: String,
      default: "Kg",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PatientWeightGoal", patientWeightGoalSchema);
