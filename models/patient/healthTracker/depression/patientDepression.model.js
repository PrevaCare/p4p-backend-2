const mongoose = require("mongoose");

const patientDepressionSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "patient is required !"],
    },
    addedBy: {
      type: String,
      enum: ["IndividualUser", "Doctor", "Employee"],
      // required: [true, "addedBy is required !"],
    },
    questions: [
      {
        questionKey: {
          type: String,
          required: true,
          enum: [
            "interestPleasure",
            "downDepressedHopeless",
            "sleepIssues",
            "tiredLowEnergy",
            "appetiteIssues",
            "feelingBadFailure",
            "concentrationIssues",
            "movementIssues",
            "selfHarmThoughts",
          ],
        },
        score: {
          type: Number,
          required: true,
          min: 0,
          max: 3,
        },
      },
    ],
    totalScore: {
      type: Number,
      required: true,
      min: 0,
      max: 27,
    },
    depressionLevel: {
      type: String,
      enum: ["Minimal", "Mild", "Moderate", "ModeratelySevere", "Severe"],
      required: true,
    },
    recommendation: {
      type: String,
      required: true,
    },
    selfHarmRisk: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PatientDepression", patientDepressionSchema);
