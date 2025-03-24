const mongoose = require("mongoose");

const StrokeRiskCalculatorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user is required !"],
    },
    bloodPressure: {
      type: String,
      enum: ["higher", "lower"],
    },
    atrialFibrillation: {
      type: String,
      enum: ["higher", "lower"],
    },
    bloodSugar: {
      type: String,
      enum: ["higher", "lower"],
    },
    bmi: {
      type: String,
      enum: ["higher", "lower"],
    },
    diet: {
      type: String,
      enum: ["higher", "lower"],
    },
    cholesterol: {
      type: String,
      enum: ["higher", "lower"],
    },
    diabetes: {
      type: String,
      enum: ["higher", "lower"],
    },
    physicalActivity: {
      type: String,
      enum: ["higher", "lower"],
    },
    history: {
      type: String,
      enum: ["higher", "lower"],
    },
    tobacco: {
      type: String,
      enum: ["higher", "lower"],
    },
    lowerRiskScore: {
      type: Number,
      default: 0,
    },
    higherRiskScore: {
      type: Number,
      default: 0,
    },
    desc: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "StrokeRiskCalculator",
  StrokeRiskCalculatorSchema
);
