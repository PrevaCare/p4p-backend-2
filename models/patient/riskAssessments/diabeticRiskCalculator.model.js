const mongoose = require("mongoose");

const DiabeticRiskCalculatorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user is required !"],
    },
    ageScore: {
      type: Number,
      default: 0,
    },
    waistScore: {
      type: Number,
      default: 0,
    },
    physicalActivityScore: {
      type: Number,
      default: 0,
    },
    familyHistoryScore: {
      type: Number,
      default: 0,
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    riskLevel: {
      type: String,
      trim: true,
      required: [true, "risk level is required !"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "DiabeticRiskCalculator",
  DiabeticRiskCalculatorSchema
);
