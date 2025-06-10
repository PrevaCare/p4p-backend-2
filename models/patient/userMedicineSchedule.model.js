const mongoose = require("mongoose");

// Main Medicine Schedule Schema
const UserMedicineScheduleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    diagnosisName: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: Date,
    medicines: [
      {
        drugName: { type: String, required: true },
        dosage: { type: String, required: true },
        source: { type: String },
        frequency: { type: String, required: true },
        timing: [String],
        startDate: { type: Date, required: true },
        endDate: Date,
        status: {
          type: String,
          enum: ["Active", "Completed", "Stopped"],
          default: "Active",
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastModified: {
      type: Date,
      default: Date.now,
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
UserMedicineScheduleSchema.index({ user: 1, isActive: 1 });

const UserMedicineSchedule = mongoose.model(
  "UserMedicineSchedule",
  UserMedicineScheduleSchema
);

module.exports = UserMedicineSchedule;
