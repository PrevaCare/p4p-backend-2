const mongoose = require("mongoose");

const DepressionRiskCalculatorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user is required !"],
    },
    addedBy: {
      type: String,
      enum: ["IndividualUser", "Doctor"],
    },
    age: {
      type: Number,
      required: [true, "age is required !"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: [true, "gender is required !"],
    },
    // PHQ-9 Questions (Depression Scale)
    phqQuestions: {
      // Each question is scored 0-3
      // Over the last 2 weeks, how often have you been bothered by:
      littleInterest: { type: Number, min: 0, max: 3 }, // Little interest or pleasure in doing things
      feelingDown: { type: Number, min: 0, max: 3 }, // Feeling down, depressed, or hopeless
      sleepIssues: { type: Number, min: 0, max: 3 }, // Trouble falling/staying asleep, or sleeping too much
      feelingTired: { type: Number, min: 0, max: 3 }, // Feeling tired or having little energy
      appetiteIssues: { type: Number, min: 0, max: 3 }, // Poor appetite or overeating
      feelingBad: { type: Number, min: 0, max: 3 }, // Feeling bad about yourself or that you're a failure
      concentrationIssues: { type: Number, min: 0, max: 3 }, // Trouble concentrating on things
      movingSpeaking: { type: Number, min: 0, max: 3 }, // Moving or speaking slowly/being fidgety or restless
      suicidalThoughts: { type: Number, min: 0, max: 3 }, // Thoughts that you would be better off dead
    },
    // Total score from the PHQ-9 (0-27)
    phqScore: {
      type: Number,
      required: [true, "depression score is required !"],
    },
    // Depression level categorization based on PHQ-9 score
    depressionLevel: {
      type: String,
      enum: ["Minimal", "Mild", "Moderate", "Moderately Severe", "Severe"],
      required: [true, "depression level is required !"],
    },
    // Additional factors that may influence recommendations
    additionalFactors: {
      chronicConditions: [String],
      medicationUse: [String],
      pastTreatment: { type: String },
      sleepHours: { type: Number },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "DepressionRiskCalculator",
  DepressionRiskCalculatorSchema
);
