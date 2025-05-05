const mongoose = require("mongoose");
const dotenv = require("dotenv");
const LiverRecommendations = require("../models/patient/riskAssessments/liverRecommendations.model");

dotenv.config();

// Initial data for liver risk recommendations based on risk level
const recommendationsData = [
  // Low Risk (0-25)
  {
    riskLevel: "Low",
    dietRecommendation:
      "Maintain a balanced diet; avoid alcohol; reduce oily and processed foods.",
    medicalRecommendation: "Undergo liver function tests once a year.",
    physicalActivityRecommendation:
      "Daily moderate activity (walking or yoga).",
  },

  // Moderate Risk (26-50)
  {
    riskLevel: "Moderate",
    dietRecommendation:
      "Avoid sugar, alcohol, and oily foods; eat more steamed vegetables and pulses.",
    medicalRecommendation:
      "Consult a physician for liver function tests and abdominal ultrasound.",
    physicalActivityRecommendation:
      "Brisk walking or yoga, with adequate hydration.",
  },

  // High Risk (51+)
  {
    riskLevel: "High",
    dietRecommendation:
      "High‑protein vegetarian diet; avoid alcohol, fried foods, and sugar.",
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
    console.log("MongoDB connected for seeding liver recommendations data");

    try {
      // Clear existing recommendations
      await LiverRecommendations.deleteMany({});
      console.log("Cleared existing liver recommendations");

      // Insert new recommendations
      const result = await LiverRecommendations.insertMany(recommendationsData);
      console.log(
        `Successfully inserted ${result.length} liver recommendation records`
      );

      console.log("Liver recommendations seeding completed successfully");
    } catch (error) {
      console.error("Error seeding liver data:", error);
    } finally {
      mongoose.disconnect();
      console.log("MongoDB disconnected");
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
