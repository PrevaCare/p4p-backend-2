const mongoose = require("mongoose");

const patientWeightSchema = new mongoose.Schema(
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
    weight: {
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
      default: "Kg",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PatientWeight", patientWeightSchema);
