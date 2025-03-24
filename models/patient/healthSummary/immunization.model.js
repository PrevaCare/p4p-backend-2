const mongoose = require("mongoose");

const immunizationSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required !"],
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    emrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EMR",
    },
    immunizationType: {
      type: String,
      enum: ["up to date", "adding", "recommended"],
    },
    vaccinationName: { type: String, trim: true },
    totalDose: { type: Number, default: 1 },
    doseDates: [
      {
        date: { type: Date },
        status: { type: String, enum: ["due", "completed"] },
      },
    ],
    doctorName: { type: String, trim: true },
    sideEffects: { type: String, trim: true },
    immunizationNotes: { type: String, trim: true },
    immunizationFileUrl: { type: String },
  },
  { timestamp: true }
);

module.exports = mongoose.model("Immunization", immunizationSchema);
