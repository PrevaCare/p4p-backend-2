const mongoose = require("mongoose");

const patientMoodSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "patient is required !"],
    },
    mood: {
      type: String,
      enum: [
        "Happy",
        "Calm",
        "Anxious",
        "Motivated",
        "Sad",
        "Tired",
        "Angry",
        "Neutral",
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PatientMood", patientMoodSchema);
