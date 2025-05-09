const mongoose = require("mongoose");
const dotenv = require("dotenv");
const StrokeRecommendations = require("../models/patient/riskAssessments/strokeRecommendations.model");

dotenv.config();

// Initial data for stroke risk recommendations based on risk level
const recommendationsData = [
  // Low Risk (0-2)
  {
    riskLevel: "Low",
    dietRecommendation:
      "Maintain a balanced diet; avoid alcohol; reduce oily and processed foods.",
    medicalRecommendation: "Undergo liver function tests once a year.",
    physicalActivityRecommendation:
      "Daily moderate activity (walking or yoga).",
  },

  // Moderate Risk (3-6)
  {
    riskLevel: "Moderate",
    dietRecommendation:
      "Avoid sugar, alcohol, and oily foods; eat more steamed vegetables and pulses.",
    medicalRecommendation:
      "Consult a physician for liver function tests and abdominal ultrasound.",
    physicalActivityRecommendation:
      "Brisk walking or yoga, with adequate hydration.",
  },

  // High Risk (7-10)
  {
    riskLevel: "High",
    dietRecommendation:
      "High-protein vegetarian diet; avoid alcohol, fried foods, and sugar.",
    medicalRecommendation:
      "Consult a liver specialist; begin treatment as per test results.",
    physicalActivityRecommendation:
      "Limit to mild walking or guided physiotherapy.",
  },
];

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB connected for seeding stroke recommendations data");

    try {
      // Clear existing recommendations
      await StrokeRecommendations.deleteMany({});
      console.log("Cleared existing stroke recommendations");

      // Insert new recommendations
      const result = await StrokeRecommendations.insertMany(
        recommendationsData
      );
      console.log(
        `Successfully inserted ${result.length} stroke recommendation records`
      );

      console.log("Stroke recommendations seeding completed successfully");
    } catch (error) {
      console.error("Error seeding stroke data:", error);
    } finally {
      mongoose.disconnect();
      console.log("MongoDB disconnected");
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
