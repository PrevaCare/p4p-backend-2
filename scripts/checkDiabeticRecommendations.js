const mongoose = require("mongoose");
const dotenv = require("dotenv");
const DiabeticRecommendations = require("../models/patient/riskAssessments/diabeticRecommendations.model");

dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB connected for checking diabetic recommendations");

    try {
      // Get all recommendations
      const recommendations = await DiabeticRecommendations.find({});
      console.log(
        `Found ${recommendations.length} diabetic recommendation records`
      );

      // Group by risk level
      const byRiskLevel = {
        Low: recommendations.filter((r) => r.riskLevel === "Low"),
        Moderate: recommendations.filter((r) => r.riskLevel === "Moderate"),
        High: recommendations.filter((r) => r.riskLevel === "High"),
        Other: recommendations.filter(
          (r) => !["Low", "Moderate", "High"].includes(r.riskLevel)
        ),
      };

      console.log("Recommendations by risk level:");
      console.log(`- Low: ${byRiskLevel.Low.length}`);
      console.log(`- Moderate: ${byRiskLevel.Moderate.length}`);
      console.log(`- High: ${byRiskLevel.High.length}`);
      console.log(`- Other: ${byRiskLevel.Other.length}`);

      // Group by age group
      const byAgeGroup = {
        "20-39": recommendations.filter((r) => r.ageGroup === "20-39"),
        "40-59": recommendations.filter((r) => r.ageGroup === "40-59"),
        "60+": recommendations.filter((r) => r.ageGroup === "60+"),
        Other: recommendations.filter(
          (r) => !["20-39", "40-59", "60+"].includes(r.ageGroup)
        ),
      };

      console.log("Recommendations by age group:");
      console.log(`- 20-39: ${byAgeGroup["20-39"].length}`);
      console.log(`- 40-59: ${byAgeGroup["40-59"].length}`);
      console.log(`- 60+: ${byAgeGroup["60+"].length}`);
      console.log(`- Other: ${byAgeGroup.Other.length}`);

      // Group by gender
      const byGender = {
        Male: recommendations.filter((r) => r.gender === "Male"),
        Female: recommendations.filter((r) => r.gender === "Female"),
        All: recommendations.filter((r) => r.gender === "All"),
        Other: recommendations.filter(
          (r) => !["Male", "Female", "All"].includes(r.gender)
        ),
      };

      console.log("Recommendations by gender:");
      console.log(`- Male: ${byGender.Male.length}`);
      console.log(`- Female: ${byGender.Female.length}`);
      console.log(`- All: ${byGender.All.length}`);
      console.log(`- Other: ${byGender.Other.length}`);

      // Print a few sample recommendations
      if (recommendations.length > 0) {
        console.log("\nSample recommendation:");
        console.log(recommendations[0].toObject());
      }
    } catch (error) {
      console.error("Error checking diabetic recommendations:", error);
    } finally {
      mongoose.disconnect();
      console.log("MongoDB disconnected");
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
