const axios = require("axios");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const DiabeticRiskCalculator = require("../models/patient/riskAssessments/diabeticRiskCalculator.model");
const User = require("../models/common/user.model");

dotenv.config();

// Test function to directly query models
const testDirectQuery = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("MongoDB connected for direct query test");

    // Get a patient ID from existing risk assessments
    const assessment = await DiabeticRiskCalculator.findOne({}).sort({
      createdAt: -1,
    });
    if (!assessment) {
      console.log("No assessments found in database");
      return;
    }

    const patientId = assessment.user.toString();
    console.log(`Found patient ID: ${patientId}`);

    // Check if user exists
    const user = await User.findById(patientId);
    if (!user) {
      console.log(`User with ID ${patientId} not found in the database`);
    } else {
      console.log(
        `User found: ${user._id}, gender: ${user.gender || "not set"}`
      );
    }

    // Get all assessments for this patient
    const assessments = await DiabeticRiskCalculator.find({
      user: patientId,
    }).sort({ createdAt: -1 });
    console.log(`Patient has ${assessments.length} diabetic risk assessments`);

    if (assessments.length > 0) {
      const latest = assessments[0];
      console.log(`Latest assessment risk level: ${latest.riskLevel}`);
    }

    // Get path from the database to verify it matches the endpoint parameters
    console.log("\nCompare these results with API response");
    console.log(`Patient ID for API: ${patientId}`);
  } catch (error) {
    console.error("Error in direct query test:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

// Run the direct database query test
testDirectQuery();
