const mongoose = require("mongoose");

const StrokeRecommendationsSchema = new mongoose.Schema(
  {
    riskLevel: {
      type: String,
      required: [true, "Risk level is required"],
      enum: ["Low", "Moderate", "High"],
    },
    dietRecommendation: {
      type: String,
      required: [true, "Diet recommendation is required"],
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

// Index for quick lookup
StrokeRecommendationsSchema.index({ riskLevel: 1 });

module.exports = mongoose.model(
  "StrokeRecommendations",
  StrokeRecommendationsSchema
);
