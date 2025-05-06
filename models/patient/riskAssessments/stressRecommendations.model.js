const mongoose = require("mongoose");

const StressRecommendationsSchema = new mongoose.Schema(
  {
    riskLevel: {
      type: String,
      enum: ["Low", "Moderate", "High"],
      required: [true, "risk level is required !"],
    },
    ageGroup: {
      type: String,
      enum: ["18-40", "41-60", "60+"],
      required: [true, "age group is required !"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: [true, "gender is required !"],
    },
    dietaryRecommendation: {
      type: String,
      required: [true, "dietary recommendation is required !"],
    },
    physicalActivityRecommendation: {
      type: String,
      required: [true, "physical activity recommendation is required !"],
    },
    mentalSupportRecommendation: {
      type: String,
      required: [true, "mental/medical support recommendation is required !"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "StressRecommendations",
  StressRecommendationsSchema
);
