const mongoose = require("mongoose");

const patientBloodGlucoseSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "patientId is required !"],
    },
    bloodGlucose: {
      type: Number,
      required: [true, "sys is required !"],
    },
    bloodGlucoseGoal: {
      type: Number,
      required: [true, "bloodGlucoseGoal is required !"],
    },
    measurementUnit: {
      type: String,
      default: "mg/dL",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    readingType: {
      type: String,
      enum: ["Fasting", "Random", "Post Meal"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "PatientBloodGlucose",
  patientBloodGlucoseSchema
);
