const mongoose = require("mongoose");
const dotenv = require("dotenv");
const CoronaryRecommendations = require("../models/patient/riskAssessments/coronaryRecommendations.model");

dotenv.config();

// Initial data for coronary recommendations based on age, gender, and risk level
const recommendationsData = [
  // Male 18-30
  {
    ageGroup: "18-30",
    gender: "Male",
    riskLevel: "Low",
    dietAdjustments:
      "Maintain a balanced diet with plenty of fruits, vegetables, and whole grains. Limit processed foods and sugary beverages.",
    physicalActivity:
      "Aim for at least 150 minutes of moderate-intensity aerobic activity per week. Include strength training 2-3 times per week.",
    medicalInterventions:
      "Annual check-up with your healthcare provider. Monitor blood pressure and cholesterol levels.",
  },
  {
    ageGroup: "18-30",
    gender: "Male",
    riskLevel: "Moderate",
    dietAdjustments:
      "Follow a heart-healthy diet low in saturated fats and sodium. Increase intake of omega-3 fatty acids from fish or plant sources.",
    physicalActivity:
      "Increase to 200-250 minutes of moderate-intensity exercise per week. Add interval training for cardiovascular benefits.",
    medicalInterventions:
      "Bi-annual check-ups. Consider cholesterol-lowering strategies if LDL is elevated.",
  },
  {
    ageGroup: "18-30",
    gender: "Male",
    riskLevel: "High",
    dietAdjustments:
      "Mediterranean or DASH diet recommended. Strictly limit saturated fats, trans fats, and sodium. Avoid alcohol or limit to occasional use.",
    physicalActivity:
      "Daily physical activity recommended, aiming for 300 minutes per week. Work with a fitness professional if possible.",
    medicalInterventions:
      "Quarterly check-ups. Medication may be considered for blood pressure or cholesterol management. Consider stress management techniques.",
  },
  {
    ageGroup: "18-30",
    gender: "Male",
    riskLevel: "Very High",
    dietAdjustments:
      "Strict heart-healthy diet supervised by a nutritionist. Eliminate processed foods, added sugars, and excessive sodium.",
    physicalActivity:
      "Supervised exercise program recommended. Start with low-intensity and gradually increase as tolerated.",
    medicalInterventions:
      "Regular monitoring with cardiologist. Medication likely needed. Consider comprehensive cardiac risk management program.",
  },

  // Female 18-30
  {
    ageGroup: "18-30",
    gender: "Female",
    riskLevel: "Low",
    dietAdjustments:
      "Focus on a balanced diet rich in fruits, vegetables, lean proteins, and whole grains. Adequate calcium and iron intake important.",
    physicalActivity:
      "150 minutes of moderate-intensity exercise per week, including both cardio and strength training.",
    medicalInterventions:
      "Annual check-up with healthcare provider. Discuss family history of heart disease.",
  },
  {
    ageGroup: "18-30",
    gender: "Female",
    riskLevel: "Moderate",
    dietAdjustments:
      "Heart-healthy diet with reduced sodium and saturated fats. Include foods rich in potassium, magnesium, and calcium.",
    physicalActivity:
      "Increase to 200 minutes of exercise per week. Include activities that promote heart health like swimming, cycling, or brisk walking.",
    medicalInterventions:
      "Bi-annual check-ups. Monitor blood pressure and cholesterol closely.",
  },
  {
    ageGroup: "18-30",
    gender: "Female",
    riskLevel: "High",
    dietAdjustments:
      "Mediterranean or DASH diet recommended. Focus on plant-based proteins and omega-3 fatty acids. Eliminate trans fats.",
    physicalActivity:
      "Regular exercise 5-6 days per week, combining cardio, strength, and flexibility training.",
    medicalInterventions:
      "Quarterly check-ups. Consider medication for risk factors. Stress management techniques important.",
  },
  {
    ageGroup: "18-30",
    gender: "Female",
    riskLevel: "Very High",
    dietAdjustments:
      "Supervised nutrition plan focusing on heart health. Stringent sodium and fat restrictions.",
    physicalActivity:
      "Supervised exercise program tailored to individual capacity. Start with low intensity and gradually increase.",
    medicalInterventions:
      "Regular monitoring with cardiologist. Medication likely needed. Comprehensive risk management program recommended.",
  },

  // Male 31-45
  {
    ageGroup: "31-45",
    gender: "Male",
    riskLevel: "Low",
    dietAdjustments:
      "Balanced diet with emphasis on lean proteins, whole grains, and plant-based foods. Moderate alcohol consumption if any.",
    physicalActivity:
      "150-180 minutes of moderate exercise weekly. Include activities that you enjoy to maintain consistency.",
    medicalInterventions:
      "Annual physical exam including lipid panel and blood pressure check.",
  },
  {
    ageGroup: "31-45",
    gender: "Male",
    riskLevel: "Moderate",
    dietAdjustments:
      "Heart-healthy diet with reduced saturated fats. Increase fiber intake and limit processed foods and added sugars.",
    physicalActivity:
      "200-250 minutes of exercise weekly, including both cardio and resistance training. Consider high-intensity interval training if appropriate.",
    medicalInterventions:
      "Bi-annual check-ups. Consider low-dose aspirin if recommended by your doctor.",
  },
  {
    ageGroup: "31-45",
    gender: "Male",
    riskLevel: "High",
    dietAdjustments:
      "Strict heart-healthy diet. Consider working with a nutritionist. Eliminate processed foods and minimize restaurant meals.",
    physicalActivity:
      "Regular exercise 5-6 days per week. Consider working with a fitness professional to maximize cardiovascular benefits.",
    medicalInterventions:
      "Quarterly medical follow-ups. Medication likely needed for blood pressure, cholesterol, or other risk factors.",
  },
  {
    ageGroup: "31-45",
    gender: "Male",
    riskLevel: "Very High",
    dietAdjustments:
      "Therapeutic diet plan supervised by healthcare professionals. Strict sodium and fat restrictions.",
    physicalActivity:
      "Medically supervised exercise program tailored to individual capacity and limitations.",
    medicalInterventions:
      "Regular cardiology consultations. Comprehensive medication regimen likely needed. Consider advanced cardiovascular risk assessment.",
  },

  // Female 31-45
  {
    ageGroup: "31-45",
    gender: "Female",
    riskLevel: "Low",
    dietAdjustments:
      "Balanced diet rich in whole foods. Include adequate calcium and vitamin D for bone health.",
    physicalActivity:
      "150 minutes of moderate exercise weekly, including weight-bearing exercises for bone health.",
    medicalInterventions:
      "Annual physical exam including heart health screening.",
  },
  {
    ageGroup: "31-45",
    gender: "Female",
    riskLevel: "Moderate",
    dietAdjustments:
      "Heart-healthy diet low in saturated fats and sodium. Focus on nutrient-dense foods and adequate protein intake.",
    physicalActivity:
      "200 minutes of varied exercise weekly. Include both cardio and strength training for metabolic health.",
    medicalInterventions:
      "Bi-annual check-ups. Monitor blood pressure, cholesterol, and blood glucose.",
  },
  {
    ageGroup: "31-45",
    gender: "Female",
    riskLevel: "High",
    dietAdjustments:
      "Mediterranean or DASH diet recommended. Work with a nutritionist to develop a personalized eating plan.",
    physicalActivity:
      "Regular exercise 5 days per week, combining different types of activities for cardiovascular health.",
    medicalInterventions:
      "Quarterly medical follow-ups. Consider medication for major risk factors. Stress management important.",
  },
  {
    ageGroup: "31-45",
    gender: "Female",
    riskLevel: "Very High",
    dietAdjustments:
      "Therapeutic diet supervised by healthcare professionals. Focus on optimal nutrition for heart health.",
    physicalActivity:
      "Supervised exercise program tailored to individual capacity and risk level.",
    medicalInterventions:
      "Regular cardiology consultations. Comprehensive treatment plan including medications. Consider advanced cardiac imaging if appropriate.",
  },

  // Male 46-60
  {
    ageGroup: "46-60",
    gender: "Male",
    riskLevel: "Low",
    dietAdjustments:
      "Mediterranean-style diet rich in plant foods, fish, and olive oil. Limit red meat and processed foods.",
    physicalActivity:
      "150 minutes of moderate exercise weekly. Focus on maintaining muscle mass with resistance training.",
    medicalInterventions:
      "Annual comprehensive physical with cardiovascular risk assessment.",
  },
  {
    ageGroup: "46-60",
    gender: "Male",
    riskLevel: "Moderate",
    dietAdjustments:
      "Heart-healthy diet with emphasis on plant proteins, healthy fats, and complex carbohydrates. Limit sodium intake.",
    physicalActivity:
      "Regular exercise 4-5 days per week. Include a variety of activities to improve cardiovascular fitness and strength.",
    medicalInterventions:
      "Bi-annual check-ups. Consider stress test if symptoms present. Medication may be appropriate for risk factors.",
  },
  {
    ageGroup: "46-60",
    gender: "Male",
    riskLevel: "High",
    dietAdjustments:
      "Therapeutic diet focusing on heart health. Work with healthcare professionals for a structured eating plan.",
    physicalActivity:
      "Regular exercise under guidance of healthcare provider. Focus on activities appropriate for individual health status.",
    medicalInterventions:
      "Regular cardiology follow-up. Comprehensive medication regimen likely needed. Consider advanced cardiovascular testing.",
  },
  {
    ageGroup: "46-60",
    gender: "Male",
    riskLevel: "Very High",
    dietAdjustments:
      "Strict therapeutic diet under medical supervision. Significant restrictions on sodium, saturated fats, and processed foods.",
    physicalActivity:
      "Medically supervised exercise program tailored to individual capacity and cardiac status.",
    medicalInterventions:
      "Frequent cardiology consultations. Intensive medical management needed. Consider referral for advanced cardiac care if appropriate.",
  },

  // Female 46-60
  {
    ageGroup: "46-60",
    gender: "Female",
    riskLevel: "Low",
    dietAdjustments:
      "Heart-healthy diet rich in fruits, vegetables, lean proteins, and whole grains. Monitor calcium intake for bone health.",
    physicalActivity:
      "150 minutes of varied exercise weekly. Include weight-bearing exercises and flexibility work.",
    medicalInterventions:
      "Annual physical with heart health assessment. Discuss hormonal considerations with healthcare provider.",
  },
  {
    ageGroup: "46-60",
    gender: "Female",
    riskLevel: "Moderate",
    dietAdjustments:
      "Mediterranean or DASH diet recommended. Focus on heart-healthy fats, lean proteins, and limited sodium.",
    physicalActivity:
      "Regular exercise 4-5 days per week, including both cardio and strength training to maintain muscle mass.",
    medicalInterventions:
      "Bi-annual check-ups. Consider cardiovascular screening tests. Medication may be appropriate for risk factors.",
  },
  {
    ageGroup: "46-60",
    gender: "Female",
    riskLevel: "High",
    dietAdjustments:
      "Therapeutic diet focusing on heart health. Work with healthcare professionals for structured eating plan.",
    physicalActivity:
      "Regular exercise under guidance of healthcare provider. Focus on appropriate activities for individual health status.",
    medicalInterventions:
      "Regular cardiology follow-up. Comprehensive medication regimen likely needed. Consider advanced cardiovascular testing.",
  },
  {
    ageGroup: "46-60",
    gender: "Female",
    riskLevel: "Very High",
    dietAdjustments:
      "Strict therapeutic diet under medical supervision. Significant restrictions on sodium, saturated fats, and refined carbohydrates.",
    physicalActivity:
      "Medically supervised exercise program tailored to individual capacity and cardiac status.",
    medicalInterventions:
      "Frequent cardiology consultations. Intensive medical management needed. Consider referral for specialized cardiac care.",
  },

  // Male 61+
  {
    ageGroup: "61+",
    gender: "Male",
    riskLevel: "Low",
    dietAdjustments:
      "Heart-healthy diet rich in plant foods, fish, and healthy fats. Ensure adequate protein intake for muscle maintenance.",
    physicalActivity:
      "Regular, moderate exercise 3-5 days per week. Focus on balance, strength, and cardiovascular health.",
    medicalInterventions:
      "Regular check-ups with comprehensive cardiovascular risk assessment.",
  },
  {
    ageGroup: "61+",
    gender: "Male",
    riskLevel: "Moderate",
    dietAdjustments:
      "Mediterranean or DASH diet recommended. Work with healthcare provider to address specific nutritional needs.",
    physicalActivity:
      "Regular, moderate exercise tailored to functional capacity. Include strength training to prevent sarcopenia.",
    medicalInterventions:
      "Regular medical follow-up. Consider comprehensive cardiovascular testing. Appropriate medications based on risk factors.",
  },
  {
    ageGroup: "61+",
    gender: "Male",
    riskLevel: "High",
    dietAdjustments:
      "Therapeutic diet under healthcare guidance. Focus on optimal nutrition for heart health while meeting age-specific needs.",
    physicalActivity:
      "Structured exercise program developed with healthcare providers, focusing on activities appropriate for cardiac status.",
    medicalInterventions:
      "Regular cardiology follow-up. Comprehensive medication regimen. Consider advanced cardiac care if appropriate.",
  },
  {
    ageGroup: "61+",
    gender: "Male",
    riskLevel: "Very High",
    dietAdjustments:
      "Strict therapeutic diet under medical supervision. Tailored to individual cardiac status and comorbidities.",
    physicalActivity:
      "Medically supervised exercise program carefully tailored to individual capacity and limitations.",
    medicalInterventions:
      "Frequent specialized cardiac care. Intensive medical management. Consider advanced interventions if appropriate and aligned with care goals.",
  },

  // Female 61+
  {
    ageGroup: "61+",
    gender: "Female",
    riskLevel: "Low",
    dietAdjustments:
      "Heart-healthy diet rich in plant foods and lean proteins. Ensure adequate calcium and vitamin D for bone health.",
    physicalActivity:
      "Regular, moderate exercise 3-5 days per week. Focus on balance, strength, and cardiovascular health.",
    medicalInterventions:
      "Regular check-ups with comprehensive cardiovascular risk assessment.",
  },
  {
    ageGroup: "61+",
    gender: "Female",
    riskLevel: "Moderate",
    dietAdjustments:
      "Mediterranean or DASH diet recommended. Work with healthcare provider to address specific nutritional needs.",
    physicalActivity:
      "Regular, moderate exercise tailored to functional capacity. Include balance and strength training to prevent falls.",
    medicalInterventions:
      "Regular medical follow-up. Consider comprehensive cardiovascular testing. Appropriate medications based on risk factors.",
  },
  {
    ageGroup: "61+",
    gender: "Female",
    riskLevel: "High",
    dietAdjustments:
      "Therapeutic diet under healthcare guidance. Focus on optimal nutrition for heart health while meeting age-specific needs.",
    physicalActivity:
      "Structured exercise program developed with healthcare providers, focusing on activities appropriate for cardiac status.",
    medicalInterventions:
      "Regular cardiology follow-up. Comprehensive medication regimen. Consider advanced cardiac care if appropriate.",
  },
  {
    ageGroup: "61+",
    gender: "Female",
    riskLevel: "Very High",
    dietAdjustments:
      "Strict therapeutic diet under medical supervision. Tailored to individual cardiac status and comorbidities.",
    physicalActivity:
      "Medically supervised exercise program carefully tailored to individual capacity and limitations.",
    medicalInterventions:
      "Frequent specialized cardiac care. Intensive medical management. Consider advanced interventions if appropriate and aligned with care goals.",
  },
];

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB connected for seeding data");

    try {
      // Clear existing recommendations
      await CoronaryRecommendations.deleteMany({});
      console.log("Cleared existing recommendations");

      // Insert new recommendations
      const result = await CoronaryRecommendations.insertMany(
        recommendationsData
      );
      console.log(
        `Successfully inserted ${result.length} recommendation records`
      );

      console.log("Seeding completed successfully");
    } catch (error) {
      console.error("Error seeding data:", error);
    } finally {
      mongoose.disconnect();
      console.log("MongoDB disconnected");
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
