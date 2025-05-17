const mongoose = require("mongoose");
const ReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user is required !"],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      //   required: true,
    },
    reportName: {
      type: String,
      required: true,
    },
    indication: {
      type: String,
      required: true,
    },
    documents: [
      {
        fileName: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    ],
    remarks: {
      type: String,
    },
    // New fields for additional report information
    prescribingDoctor: {
      type: String,
      default: "Self", // Default to Self if not provided
    },
    labName: {
      type: String,
      default: "",
    },
    systemDoctorName: {
      type: String,
      default: "", // Store doctor name as string instead of reference
    },
    reportDate: {
      type: Date,
      default: () => {
        const today = new Date();
        return today.toISOString().split("T")[0];
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reports", ReportSchema);
