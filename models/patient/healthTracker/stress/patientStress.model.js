const mongoose = require("mongoose");

const patientStressSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "patient is required !"],
    },
    questions: [
      {
        questionKey: {
          type: String,
          required: true,
          enum: [
            "unexpectedEvents",
            "controlImportantThings",
            "nervousStressed",
            "handleProblems",
            "goingYourWay",
            "copeWithThings",
            "controlIrritations",
            "onTopOfThings",
            "outsideControl",
            "difficultiesPilingUp",
          ],
        },
        score: {
          type: Number,
          required: true,
          min: 0,
          max: 4,
        },
      },
    ],
    totalScore: {
      type: Number,
      required: true,
      min: 0,
      max: 40,
    },
    stressLevel: {
      type: String,
      enum: ["Low", "Moderate", "High"],
      required: true,
    },
    recommendation: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PatientStress", patientStressSchema);
