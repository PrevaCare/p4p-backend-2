const mongoose = require("mongoose");

// lab schema
const labReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lab",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    // testName === package
    testName: { type: String, required: true },
    remarks: { type: String },
    labReportFile: { type: String, required: true },
    documentType: {
      type: String,
      enum: ["Blood Report", "Urine Report", "Imaging Reports", "Other"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  },
  { timestamps: true }
);

// Create indexes for frequently queried fields
labReportSchema.index({ user: 1 });
labReportSchema.index({ lab: 1 });
labReportSchema.index({ doctor: 1 });
labReportSchema.index({ category: 1 });
labReportSchema.index({ testName: 1 });
labReportSchema.index({ documentType: 1 });
labReportSchema.index({ createdAt: -1 }); // For sorting by date

module.exports = mongoose.model("LabReport", labReportSchema);
