const mongoose = require("mongoose");

// Schema for tracking individual medicine history
const MedicineHistorySchema = new mongoose.Schema({
  drugName: { type: String, required: true },
  changeType: {
    type: String,
    enum: ["Started", "Modified", "Stopped"],
    required: true,
  },
  previousSchedule: {
    frequency: String,
    timing: [String],
    dosage: String,
  },
  newSchedule: {
    frequency: String,
    timing: [String],
    dosage: String,
  },
  changedBy: {
    type: String,
    enum: ["Doctor", "User"],
    required: true,
  },
  reason: String,
  changedAt: {
    type: Date,
    default: Date.now,
  },
});

// Main Medicine Schedule Schema
const MedicineScheduleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
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
        scheduleType: {
          type: String,
          enum: ["EMR", "Self", "Doctor"],
          required: true,
        },
        source: {
          emrId: { type: mongoose.Schema.Types.ObjectId, ref: "EMR" },
          doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
          organization: {
            name: String,
            id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
          },
        },
        frequency: { type: String, required: true },
        timing: [String],
        instructions: String,
        startDate: { type: Date, required: true },
        endDate: Date,
        status: {
          type: String,
          enum: ["Active", "Completed", "Stopped"],
          default: "Active",
        },
        medicineHistory: [MedicineHistorySchema],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
    pdfLink: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
MedicineScheduleSchema.index({ user: 1, isActive: 1 });
MedicineScheduleSchema.index({ "medicines.status": 1 });

// Method to check if schedule is deletable
MedicineScheduleSchema.methods.isDeletable = function () {
  return this.scheduleType === "self";
};

const MedicineSchedule = mongoose.model(
  "MedicineSchedule",
  MedicineScheduleSchema
);

module.exports = MedicineSchedule;
