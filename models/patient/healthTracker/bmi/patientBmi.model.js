const mongoose = require("mongoose");

const patientBmiSchema = new mongoose.Schema(
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
    bmi: {
      type: Number,
      required: [true, "weight  is required !"],
    },
    date: {
      type: Date,
      required: [true, "date  is required !"],
      // default: Date.now,
    },
    measurementUnit: {
      type: String,
      default: "Kg/m2",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PatientBmi", patientBmiSchema);
