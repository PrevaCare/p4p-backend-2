const mongoose = require("mongoose");

const existingPatientLabReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    testName: { type: String, required: true },
    labName: { type: String, required: true },
    doctorName: { type: String, required: true },
    doctorSpeciality: { type: String, required: true },
    labReportFile: { type: String, required: true },
    documentType: { type: String, enum: ["labReport"], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ExistingPatientLabReport",
  existingPatientLabReportSchema
);
