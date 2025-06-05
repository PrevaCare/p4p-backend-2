const mongoose = require("mongoose");

const currentCondtionSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required !"],
    },
    emrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EMR",
    },
    dateOfDiagnosis: {
      type: Date,
    },
    diagnosisName: {
      type: String,
      trim: true,
    },
    prescription: [
      {
        drugName: String,
        freequency: String,
        duration: String,
        givenBy: String
      },
    ],
    referralNeeded: {
      type: String,
      trim: true,
    },
    advice: {
      type: String,
      trim: true,
    },
    condtionFileUrl: { type: String },
  },
  { timestamp: true }
);

module.exports = mongoose.model("CurrentCondition", currentCondtionSchema);
