const mongoose = require("mongoose");

const patientBloodGlucoseGoalSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "patientId is required !"],
    },
    bloodGlucoseGoal: {
      type: Number,
      required: [true, "bloodGlucoseGoal is required !"],
    },
    measurementUnit: {
      type: String,
      default: "mg/dL",
    },

    readingType: {
      type: String,
      enum: ["Fasting", "Random", "Post Meal"],
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model(
  "PatientBloodGlucoseGoal",
  patientBloodGlucoseGoalSchema
);
