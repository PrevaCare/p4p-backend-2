/**
 * Seeder script for stress recommendations
 * Run using: node scripts/seeders/stressRecommendations.seeder.js
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

// Import the StressRecommendations model
const StressRecommendations = require("../../models/patient/riskAssessments/stressRecommendations.model");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB for seeding"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Recommendations data organized by stress level, age group, and gender
const recommendationsData = [
  // LOW STRESS (0-13)
  // Age 18-40 Male
  {
    riskLevel: "Low",
    ageGroup: "18-40",
    gender: "Male",
    dietaryRecommendation:
      "Balanced diet with vegetables, proteins, and hydration.",
    physicalActivityRecommendation: "Daily walk, light jogging, or yoga.",
    mentalSupportRecommendation: "No intervention; practice mindfulness.",
  },
  // Age 18-40 Female
  {
    riskLevel: "Low",
    ageGroup: "18-40",
    gender: "Female",
    dietaryRecommendation:
      "Balanced diet with vegetables, proteins, and hydration.",
    physicalActivityRecommendation: "Daily walk, light jogging, or yoga.",
    mentalSupportRecommendation: "No intervention; practice mindfulness.",
  },
  // Age 41-60 Male
  {
    riskLevel: "Low",
    ageGroup: "41-60",
    gender: "Male",
    dietaryRecommendation: "Heart-healthy fats; avoid heavy dinners.",
    physicalActivityRecommendation: "30 min moderate activity 5x/week.",
    mentalSupportRecommendation: "Journaling or social bonding encouraged.",
  },
  // Age 41-60 Female
  {
    riskLevel: "Low",
    ageGroup: "41-60",
    gender: "Female",
    dietaryRecommendation: "Heart-healthy fats; avoid heavy dinners.",
    physicalActivityRecommendation: "30 min moderate activity 5x/week.",
    mentalSupportRecommendation: "Journaling or social bonding encouraged.",
  },
  // Age 60+ Male
  {
    riskLevel: "Low",
    ageGroup: "60+",
    gender: "Male",
    dietaryRecommendation: "Light, fibrous meals; avoid excessive tea/coffee.",
    physicalActivityRecommendation: "Gentle stretching, group walks.",
    mentalSupportRecommendation: "Community support; structured routine.",
  },
  // Age 60+ Female
  {
    riskLevel: "Low",
    ageGroup: "60+",
    gender: "Female",
    dietaryRecommendation: "Light, fibrous meals; avoid excessive tea/coffee.",
    physicalActivityRecommendation: "Gentle stretching, group walks.",
    mentalSupportRecommendation: "Community support; structured routine.",
  },

  // MODERATE STRESS (14-26)
  // Age 18-40 Male
  {
    riskLevel: "Moderate",
    ageGroup: "18-40",
    gender: "Male",
    dietaryRecommendation:
      "Avoid stimulants; include nuts, bananas, whole grains.",
    physicalActivityRecommendation: "30 mins cardio or sports.",
    mentalSupportRecommendation: "Deep breathing, peer conversation.",
  },
  // Age 18-40 Female
  {
    riskLevel: "Moderate",
    ageGroup: "18-40",
    gender: "Female",
    dietaryRecommendation: "Iron-rich food; hydration; avoid fried snacks.",
    physicalActivityRecommendation: "Yoga, Zumba, or nature walks.",
    mentalSupportRecommendation: "Express emotions to friends/family.",
  },
  // Age 41-60 Male
  {
    riskLevel: "Moderate",
    ageGroup: "41-60",
    gender: "Male",
    dietaryRecommendation:
      "Home-cooked meals, reduce salt; avoid work snacking.",
    physicalActivityRecommendation: "Brisk walks or stationary cycling.",
    mentalSupportRecommendation: "Structured relaxation (guided meditation).",
  },
  // Age 41-60 Female
  {
    riskLevel: "Moderate",
    ageGroup: "41-60",
    gender: "Female",
    dietaryRecommendation:
      "Home-cooked meals, reduce salt; avoid work snacking.",
    physicalActivityRecommendation: "Brisk walks or stationary cycling.",
    mentalSupportRecommendation: "Structured relaxation (guided meditation).",
  },
  // Age 60+ Male
  {
    riskLevel: "Moderate",
    ageGroup: "60+",
    gender: "Male",
    dietaryRecommendation: "Small frequent meals; include warm fluids.",
    physicalActivityRecommendation: "Mild physiotherapy movements.",
    mentalSupportRecommendation: "Social connection; minimal screen time.",
  },
  // Age 60+ Female
  {
    riskLevel: "Moderate",
    ageGroup: "60+",
    gender: "Female",
    dietaryRecommendation: "Small frequent meals; include warm fluids.",
    physicalActivityRecommendation: "Mild physiotherapy movements.",
    mentalSupportRecommendation: "Social connection; minimal screen time.",
  },

  // HIGH STRESS (27-40)
  // Age 18-40 Male
  {
    riskLevel: "High",
    ageGroup: "18-40",
    gender: "Male",
    dietaryRecommendation:
      "Avoid processed foods; high-protein breakfast; hydrate.",
    physicalActivityRecommendation: "Start with slow walks and build routine.",
    mentalSupportRecommendation: "Counseling/helpline; maintain sleep hygiene.",
  },
  // Age 18-40 Female
  {
    riskLevel: "High",
    ageGroup: "18-40",
    gender: "Female",
    dietaryRecommendation: "Leafy greens, warm food; avoid emotional eating.",
    physicalActivityRecommendation: "Light yoga with breathing.",
    mentalSupportRecommendation: "Discuss feelings with therapist or group.",
  },
  // Age 41-60 Male
  {
    riskLevel: "High",
    ageGroup: "41-60",
    gender: "Male",
    dietaryRecommendation: "Anti-inflammatory (fruits, seeds, no alcohol).",
    physicalActivityRecommendation: "Avoid overexertion; gentle daily workout.",
    mentalSupportRecommendation: "Therapy; reduce news/social media.",
  },
  // Age 41-60 Female
  {
    riskLevel: "High",
    ageGroup: "41-60",
    gender: "Female",
    dietaryRecommendation: "Anti-inflammatory (fruits, seeds, no alcohol).",
    physicalActivityRecommendation: "Avoid overexertion; gentle daily workout.",
    mentalSupportRecommendation: "Therapy; reduce news/social media.",
  },
  // Age 60+ Male
  {
    riskLevel: "High",
    ageGroup: "60+",
    gender: "Male",
    dietaryRecommendation: "Easy-to-digest meals; no meal skipping.",
    physicalActivityRecommendation: "Light stretching with supervision.",
    mentalSupportRecommendation: "Wellness check-ins with counselor/GP.",
  },
  // Age 60+ Female
  {
    riskLevel: "High",
    ageGroup: "60+",
    gender: "Female",
    dietaryRecommendation: "Easy-to-digest meals; no meal skipping.",
    physicalActivityRecommendation: "Light stretching with supervision.",
    mentalSupportRecommendation: "Wellness check-ins with counselor/GP.",
  },
];

// Seed function
const seedStressRecommendations = async () => {
  try {
    // Clear existing data
    await StressRecommendations.deleteMany({});
    console.log("Cleared existing stress recommendations data");

    // Insert new data
    const result = await StressRecommendations.insertMany(recommendationsData);
    console.log(`Successfully seeded ${result.length} stress recommendations`);

    // Close the connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding stress recommendations:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seeder
seedStressRecommendations();
