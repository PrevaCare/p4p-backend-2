const mongoose = require("mongoose");

const StressRiskCalculatorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user is required !"],
    },
    age: {
      type: Number,
      required: [true, "age is required !"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: [true, "gender is required !"],
    },
    // PSS Questions (Perceived Stress Scale)
    pssQuestions: {
      // Each question is scored 0-4
      // In the last month, how often have you:
      upsetByUnexpected: { type: Number, min: 0, max: 4 },
      unableToControl: { type: Number, min: 0, max: 4 },
      feltNervous: { type: Number, min: 0, max: 4 },
      confidentHandling: { type: Number, min: 0, max: 4 },
      thingsGoingWell: { type: Number, min: 0, max: 4 },
      couldNotCope: { type: Number, min: 0, max: 4 },
      controlIrritations: { type: Number, min: 0, max: 4 },
      onTopOfThings: { type: Number, min: 0, max: 4 },
      angryOutOfControl: { type: Number, min: 0, max: 4 },
      difficulties: { type: Number, min: 0, max: 4 },
    },
    // Total score from the PSS (0-40)
    pssScore: {
      type: Number,
      required: [true, "stress score is required !"],
    },
    // Stress level categorization (Low, Moderate, High)
    stressLevel: {
      type: String,
      enum: ["Low", "Moderate", "High"],
      required: [true, "stress level is required !"],
    },
    // Additional factors that may influence stress recommendations
    additionalFactors: {
      chronicConditions: [String],
      sleepQuality: { type: String, enum: ["Poor", "Fair", "Good"] },
      workLifeBalance: { type: String, enum: ["Poor", "Fair", "Good"] },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "StressRiskCalculator",
  StressRiskCalculatorSchema
);
