const mongoose = require("mongoose");

const existingPatientEMR = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    existingEMRFile: {
      type: String,
      required: true,
    },
    documentType: {
      type: String,
      enum: ["dischargeSummary", "doctorVisit", "doctorNotes"],
      required: true,
    },
    hospitalName: {
      type: String,
      required: true,
    },
    doctorName: {
      type: String,
      required: true,
    },
    doctorSpeciality: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExistingPatientEMR", existingPatientEMR);
