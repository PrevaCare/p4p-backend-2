const mongoose = require("mongoose");

// spo2 goal model change
const patientSpo2GoalSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "patient is required !"],
    },
    spo2Goal: {
      type: Number,
      required: [true, "spo2Goal  is required !"],
    },
    measurementUnit: {
      type: String,
      default: "%",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PatientSpo2Goal", patientSpo2GoalSchema);
