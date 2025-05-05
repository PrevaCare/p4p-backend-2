const mongoose = require("mongoose");

const DiabeticRecommendationsSchema = new mongoose.Schema(
  {
    ageGroup: {
      type: String,
      required: [true, "Age group is required"],
      enum: ["20-39", "40-59", "60+"],
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["Male", "Female", "All"],
    },
    riskLevel: {
      type: String,
      required: [true, "Risk level is required"],
      enum: ["Low", "Moderate", "High"],
    },
    dietaryRecommendation: {
      type: String,
      required: [true, "Dietary recommendation is required"],
    },
    medicalRecommendation: {
      type: String,
      required: [true, "Medical recommendation is required"],
    },
    physicalActivityRecommendation: {
      type: String,
      required: [true, "Physical activity recommendation is required"],
    },
  },
  { timestamps: true }
);

// Compound index for quick lookup
DiabeticRecommendationsSchema.index({ ageGroup: 1, gender: 1, riskLevel: 1 });

module.exports = mongoose.model(
  "DiabeticRecommendations",
  DiabeticRecommendationsSchema
);
