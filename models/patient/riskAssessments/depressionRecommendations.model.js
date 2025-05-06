const mongoose = require("mongoose");

const DepressionRecommendationsSchema = new mongoose.Schema(
  {
    depressionLevel: {
      type: String,
      enum: ["Minimal", "Mild", "Moderate", "Moderately Severe", "Severe"],
      required: [true, "depression level is required !"],
    },
    ageGroup: {
      type: String,
      enum: ["18-40", "41-60", "60+", "All Ages"],
      required: [true, "age group is required !"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "All Genders"],
      required: [true, "gender is required !"],
    },
    dietaryRecommendation: {
      type: String,
      required: [true, "dietary recommendation is required !"],
    },
    activityRecommendation: {
      type: String,
      required: [true, "activity recommendation is required !"],
    },
    supportRecommendation: {
      type: String,
      required: [true, "support recommendation is required !"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "DepressionRecommendations",
  DepressionRecommendationsSchema
);
