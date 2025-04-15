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

// Create indexes for frequently queried fields
existingPatientLabReportSchema.index({ user: 1 });
existingPatientLabReportSchema.index({ testName: 1 });
existingPatientLabReportSchema.index({ labName: 1 });
existingPatientLabReportSchema.index({ doctorName: 1 });
existingPatientLabReportSchema.index({ createdAt: -1 }); // For sorting by date

module.exports = mongoose.model(
  "ExistingPatientLabReport",
  existingPatientLabReportSchema
);
