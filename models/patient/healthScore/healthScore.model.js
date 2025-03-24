const mongoose = require("mongoose");

const healthScoreSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user is required !"],
    },
    heartScore: {
      totalCholesterol: {
        type: Number,
      },
      HDL: {
        type: Number,
      },
      LDL: {
        type: Number,
      },
      BP: {
        sys: {
          type: Number, // Systolic blood pressure
        },
        dia: {
          type: Number, // Diastolic blood pressure
        },
      },
      PR: {
        type: Number, // Pulse rate
      },
      BMI: {
        type: Number, // Body mass index
      },
      alcoholIntake: {
        type: Boolean,
        default: false,
      },
      smoking: {
        type: Boolean,
        default: false,
      },
      overAllHeartScore: {
        type: Number,
        default: 0,
      },
    },
    gutScore: {
      urea: {
        type: Number,
      },
      creatinine: {
        type: Number,
      },
      plasmaGlucose: {
        type: Number,
      },
      sleepingHours: {
        type: Number,
      },
      overAllGutScore: {
        type: Number,
        default: 0,
      },
    },
    mentalScore: {
      phq9Score: {
        type: Number, // PHQ-9 score for depression assessment
      },
      stressRiskAssessmentScore: {
        type: Number,
      },
      overAllMentalScore: {
        type: Number,
        default: 0,
      },
    },
    metabolicScore: {
      hemoglobin: {
        type: Number,
      },
      TLC: {
        type: Number, // Total Leukocyte Count
      },
      AST: {
        type: Number, // Aspartate aminotransferase
      },
      ALT: {
        type: Number, // Alanine aminotransferase
      },
      plasmaGlucose: {
        type: Number,
      },
      BMI: {
        type: Number,
      },
      overAllMetabolicScore: {
        type: Number,
        default: 0,
      },
    },
    overallHealthScore: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HealthScore", healthScoreSchema);
