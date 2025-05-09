const mongoose = require("mongoose");
const dotenv = require("dotenv");
const DiabeticRiskCalculator = require("../models/patient/riskAssessments/diabeticRiskCalculator.model");

dotenv.config();

// Function to extract standardized risk level from legacy format
const extractRiskLevelFromLegacy = (legacyRiskLevel) => {
  const legacyText = legacyRiskLevel.toLowerCase();
  if (legacyText.includes("high")) return "High";
  if (legacyText.includes("moderate")) return "Moderate";
  if (legacyText.includes("low")) return "Low";
  return null; // Default case
};

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("MongoDB connected for updating diabetic risk levels");

    try {
      // Find all records that need updating (have legacy format risk levels)
      const assessments = await DiabeticRiskCalculator.find({
        $or: [
          { riskLevel: { $regex: /.*LOW.*/ } },
          { riskLevel: { $regex: /.*MODERATE.*/ } },
          { riskLevel: { $regex: /.*HIGH.*/ } },
        ],
      });

      console.log(
        `Found ${assessments.length} records with legacy risk levels`
      );

      // Keep track of updates
      let updateCount = 0;
      let errorCount = 0;

      // Update each record
      for (const assessment of assessments) {
        try {
          const standardizedRiskLevel = extractRiskLevelFromLegacy(
            assessment.riskLevel
          );

          if (standardizedRiskLevel) {
            assessment.riskLevel = standardizedRiskLevel;
            await assessment.save();
            updateCount++;
          } else {
            console.warn(
              `Couldn't determine risk level for assessment ${assessment._id}`
            );
            errorCount++;
          }
        } catch (err) {
          console.error(`Error updating assessment ${assessment._id}:`, err);
          errorCount++;
        }
      }

      console.log(
        `Update complete: ${updateCount} records updated, ${errorCount} errors`
      );
    } catch (error) {
      console.error("Error updating diabetic risk levels:", error);
    } finally {
      mongoose.disconnect();
      console.log("MongoDB disconnected");
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
