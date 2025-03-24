const mongoose = require("mongoose");
const { DaysOfWeek } = require("../../constants/weekdays.constant");
const { RequestStatus } = require("../../constants/request.contants");
// time slot
const TimeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        // Validate time format (HH:mm)
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: (props) =>
        `${props.value} is not a valid time format! Use HH:mm`,
    },
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: (props) =>
        `${props.value} is not a valid time format! Use HH:mm`,
    },
  },
});

const WeeklyAvailabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: Object.values(DaysOfWeek),
    required: true,
  },
  timeSlots: [TimeSlotSchema],
});

const DoctorAvailabilitySchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    weeklySchedule: [WeeklyAvailabilitySchema],
    status: {
      type: String,
      enum: Object.values(RequestStatus),
      default: Object.values(RequestStatus.PENDING),
    },
    consultationType: {
      type: String,
      enum: ["offline", "online"],
      required: [true, "consultation type is required !"],
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Superadmin",
    },
    doctorRemark: {
      type: String,
    },
    adminRemark: {
      type: String,
    },
  },
  { timestamps: true }
);

// Custom validation for weeklySchedule
DoctorAvailabilitySchema.path("weeklySchedule").validate(function (value) {
  // Check for duplicate days
  const days = value.map((entry) => entry.day);
  const uniqueDays = new Set(days);
  if (days.length !== uniqueDays.size) {
    throw new Error("Each day must be unique in the weekly schedule.");
  }

  // Check for overlapping time slots within the same day
  for (const entry of value) {
    const { timeSlots } = entry;
    for (let i = 0; i < timeSlots.length; i++) {
      for (let j = i + 1; j < timeSlots.length; j++) {
        const slotA = timeSlots[i];
        const slotB = timeSlots[j];

        const startA = slotA.startTime;
        const endA = slotA.endTime;
        const startB = slotB.startTime;
        const endB = slotB.endTime;

        if (
          (startA < endB && startB < endA) || // Overlapping time slots
          (startA === startB && endA === endB) // Exact duplicate time slots
        ) {
          throw new Error(
            `Overlapping time slots detected on day "${entry.day}": [${startA}-${endA}] and [${startB}-${endB}].`
          );
        }
      }
    }
  }

  return true;
}, "Invalid weekly schedule");

module.exports = mongoose.model("DoctorAvailability", DoctorAvailabilitySchema);
