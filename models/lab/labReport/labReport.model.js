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
  },
  { timestamps: true }
);

module.exports = mongoose.model("LabReport", labReportSchema);
