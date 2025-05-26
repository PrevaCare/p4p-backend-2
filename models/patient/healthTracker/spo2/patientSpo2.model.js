const mongoose = require("mongoose");
// spo2 model change
const patientSpo2Schema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "patient is required !"],
    },
    spo2Goal: {
      type: Number,
    },
    spo2: {
      type: Number,
      required: [true, "spo2  is required !"],
    },
    measurementType: {
      type: String,
      enum: ["Room Air", "On Oxygen"],
      required: [true, "measurementType is required !"],
    },
    oxygenFlowRate: {
      type: Number,
    },
    oxygenFlowRateUnit: {
      type: String,
      default: "L/min",
    },
    date: {
      type: Date,
      required: [true, "date  is required !"],
      // default: Date.now,
    },
    measurementUnit: {
      type: String,
      default: "%",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PatientSpo2", patientSpo2Schema);
