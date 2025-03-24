const mongoose = require("mongoose");

const existingPatientEprescriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    existingEPrescriptionFile: {
      type: String,
      required: [true, "pdf file is required !"],
    },
    documentType: {
      type: String,
      //   enum: ["dischargeSummary", "doctorVisit", "doctorNotes"],
      required: [true, "document type is required !"],
    },
    date: {
      type: Date,
      required: [true, "date  is required !"],
    },
    hospitalName: {
      type: String,
      required: [true, "hospital name is required !"],
    },
    doctorName: {
      type: String,
      required: [true, "doctor name is required !"],
    },
    doctorSpeciality: {
      type: String,
      required: [true, "doctor speciality is required !"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ExistingPatientEprescription",
  existingPatientEprescriptionSchema
);
