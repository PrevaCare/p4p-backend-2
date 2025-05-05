const mongoose = require("mongoose");
const dotenv = require("dotenv");
const DiabeticRecommendations = require("../models/patient/riskAssessments/diabeticRecommendations.model");

dotenv.config();

// Initial data for diabetic recommendations based on age, gender, and risk level
const recommendationsData = [
  // Low Risk (0-30)
  {
    ageGroup: "20-39",
    gender: "All",
    riskLevel: "Low",
    dietaryRecommendation:
      "Reduce sugar; consume whole grains, fruits, legumes.",
    medicalRecommendation: "Fasting blood sugar & HbA1c annually.",
    physicalActivityRecommendation: "≥ 30 min jogging or yoga daily.",
  },
  {
    ageGroup: "40-59",
    gender: "Male",
    riskLevel: "Low",
    dietaryRecommendation:
      "Avoid sweets/refined carbs; eat home‑cooked, fiber‑rich meals.",
    medicalRecommendation: "Routine sugar screening annually.",
    physicalActivityRecommendation: "Gym or walking ≥ 4x/week.",
  },
  {
    ageGroup: "40-59",
    gender: "Female",
    riskLevel: "Low",
    dietaryRecommendation: "Add leafy greens, seasonal fruits, whole grains.",
    medicalRecommendation: "Monitor blood sugar & thyroid periodically.",
    physicalActivityRecommendation: "Combine cardio with stress‑reducing yoga.",
  },
  {
    ageGroup: "60+",
    gender: "All",
    riskLevel: "Low",
    dietaryRecommendation: "Soft, low‑glycemic meals in smaller portions.",
    medicalRecommendation: "Sugar testing & BP monitoring every 6 months.",
    physicalActivityRecommendation: "Safe, low‑impact indoor walking.",
  },

  // Moderate Risk (30-50)
  {
    ageGroup: "20-39",
    gender: "All",
    riskLevel: "Moderate",
    dietaryRecommendation:
      "Avoid sugary drinks & fried foods; eat more vegetables/whole grains.",
    medicalRecommendation: "Monitor weight and blood sugar monthly.",
    physicalActivityRecommendation: "45 min activity most days.",
  },
  {
    ageGroup: "40-59",
    gender: "Male",
    riskLevel: "Moderate",
    dietaryRecommendation:
      "Replace white rice/refined flour with millets & vegetables.",
    medicalRecommendation:
      "Consider early‑stage medication after physician evaluation.",
    physicalActivityRecommendation: "Moderate‑intensity exercise regularly.",
  },
  {
    ageGroup: "40-59",
    gender: "Female",
    riskLevel: "Moderate",
    dietaryRecommendation: "Limit sweets; increase fiber and plant protein.",
    medicalRecommendation: "Insulin resistance screening if family history.",
    physicalActivityRecommendation: "Strength & flexibility training.",
  },
  {
    ageGroup: "60+",
    gender: "All",
    riskLevel: "Moderate",
    dietaryRecommendation:
      "Diabetic‑friendly meals in small, frequent servings.",
    medicalRecommendation: "Log blood sugar; doctor consult every 3 months.",
    physicalActivityRecommendation:
      "Mild movement exercises under supervision.",
  },

  // High Risk (60+)
  {
    ageGroup: "20-39",
    gender: "All",
    riskLevel: "High",
    dietaryRecommendation:
      "Eliminate sweets/refined carbs; high‑protein, low‑glycemic foods.",
    medicalRecommendation: "Begin medical treatment (oral meds or insulin).",
    physicalActivityRecommendation: "Only medically‑approved activity.",
  },
  {
    ageGroup: "40-59",
    gender: "Male",
    riskLevel: "High",
    dietaryRecommendation:
      "Diabetic‑specific meal plan; no sugar/processed foods.",
    medicalRecommendation:
      "Comprehensive tests and treatment under a diabetologist.",
    physicalActivityRecommendation: "Only clinically supervised activity.",
  },
  {
    ageGroup: "40-59",
    gender: "Female",
    riskLevel: "High",
    dietaryRecommendation: "Low‑glycemic, high‑fiber foods; track carbs.",
    medicalRecommendation: "Monitor hormones; adjust medication accordingly.",
    physicalActivityRecommendation:
      "Gentle walking or yoga per physician guidance.",
  },
  {
    ageGroup: "60+",
    gender: "All",
    riskLevel: "High",
    dietaryRecommendation: "Soft, balanced diabetic meals; low sugar and salt.",
    medicalRecommendation: "Routine follow‑ups for glucose, feet, and eyes.",
    physicalActivityRecommendation:
      "Only light physical movements under observation.",
  },
];

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB connected for seeding diabetic recommendations data");

    try {
      // Clear existing recommendations
      await DiabeticRecommendations.deleteMany({});
      console.log("Cleared existing diabetic recommendations");

      // Insert new recommendations
      const result = await DiabeticRecommendations.insertMany(
        recommendationsData
      );
      console.log(
        `Successfully inserted ${result.length} diabetic recommendation records`
      );

      console.log("Diabetic recommendations seeding completed successfully");
    } catch (error) {
      console.error("Error seeding diabetic data:", error);
    } finally {
      mongoose.disconnect();
      console.log("MongoDB disconnected");
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
