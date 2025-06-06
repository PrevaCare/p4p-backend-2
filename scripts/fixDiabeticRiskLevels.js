const mongoose = require("mongoose");
const dotenv = require("dotenv");
const DiabeticRiskCalculator = require("../models/patient/riskAssessments/diabeticRiskCalculator.model");

dotenv.config();

// Function to extract standardized risk level from legacy format
const extractRiskLevelFromLegacy = (legacyRiskLevel) => {
  if (!legacyRiskLevel) return null;

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
    console.log("MongoDB connected for fixing diabetic risk levels");

    try {
      // Find ALL records - we'll check and fix each one
      const assessments = await DiabeticRiskCalculator.find({});

      console.log(`Found ${assessments.length} total records to check`);

      // Keep track of updates
      let updateCount = 0;
      let alreadyCorrectCount = 0;
      let errorCount = 0;

      // Update each record
      for (const assessment of assessments) {
        try {
          // Skip if already in correct format
          if (
            assessment.riskLevel === "Low" ||
            assessment.riskLevel === "Moderate" ||
            assessment.riskLevel === "High"
          ) {
            alreadyCorrectCount++;
            continue;
          }

          const standardizedRiskLevel = extractRiskLevelFromLegacy(
            assessment.riskLevel
          );

          if (standardizedRiskLevel) {
            console.log(
              `Updating: ${assessment.riskLevel} -> ${standardizedRiskLevel}`
            );
            assessment.riskLevel = standardizedRiskLevel;
            await assessment.save();
            updateCount++;
          } else {
            // If we can't determine, set to Moderate as fallback
            console.warn(
              `Couldn't determine risk level for assessment ${assessment._id}, using default "Moderate"`
            );
            assessment.riskLevel = "Moderate";
            await assessment.save();
            updateCount++;
          }
        } catch (err) {
          console.error(`Error updating assessment ${assessment._id}:`, err);
          errorCount++;
        }
      }

      console.log(
        `Update complete: ${updateCount} records updated, ${alreadyCorrectCount} already correct, ${errorCount} errors`
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
