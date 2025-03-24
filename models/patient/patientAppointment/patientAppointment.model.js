const mongoose = require("mongoose");
const { RequestStatus } = require("../../../constants/request.contants");
const { capitalize } = require("../../../utils/stringMethods");

const AppointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Patient ID is required"],
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Doctor ID is required"],
    },
    appointmentDate: {
      type: Date,
      required: [true, "Appointment date is required"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid time format! Use HH:mm`,
      },
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid time format! Use HH:mm`,
      },
    },
    consultationType: {
      type: String,
      enum: ["offline", "online"],
      required: [true, "Consultation type is required"],
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "no-show"],
      default: "scheduled",
    },
    symptoms: {
      type: String,
      required: [true, "Symptoms description is required"],
    },
    symptomsInDetail: {
      type: String,
    },
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Eprescription",
    },
    emrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EMR",
    },
    // paymentStatus: {
    //   type: String,
    //   enum: ["pending", "completed", "refunded"],
    //   default: "pending",
    // },
    // paymentId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Payment",
    // },
    cancellationReason: {
      type: String,
    },
    cancelledBy: {
      type: String,
      // enum: ["Patient", "Doctor", "Superadmin"],
    },
    doctorNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Custom validation to check if the appointment slot is available
// AppointmentSchema.pre("save", async function (next) {
//   if (
//     this.isNew ||
//     this.isModified("appointmentDate") ||
//     this.isModified("startTime") ||
//     this.isModified("endTime")
//   ) {
//     const DoctorAvailability = mongoose.model("DoctorAvailability");
//     const appointmentDay = new Date(this.appointmentDate)
//       .toLocaleString("en-US", { weekday: "long" })
//       .toLowerCase();

//     // Check if doctor is available on this day and time
//     const doctorSchedule = await DoctorAvailability.findOne({
//       doctorId: this.doctorId,
//       "weeklySchedule.day": appointmentDay,
//       status: RequestStatus.APPROVED,
//       consultationType: this.consultationType,
//     });

//     if (!doctorSchedule) {
//       throw new Error(
//         "Doctor is not available on this day for the selected consultation type"
//       );
//     }

//     const daySchedule = doctorSchedule.weeklySchedule.find(
//       (schedule) => schedule.day === appointmentDay
//     );
//     const isTimeSlotAvailable = daySchedule.timeSlots.some(
//       (slot) => slot.startTime <= this.startTime && slot.endTime >= this.endTime
//     );

//     if (!isTimeSlotAvailable) {
//       throw new Error("Selected time slot is not within doctor's availability");
//     }

//     // Check for overlapping appointments
//     const Appointment = mongoose.model("Appointment");
//     const overlappingAppointment = await Appointment.findOne({
//       doctorId: this.doctorId,
//       appointmentDate: this.appointmentDate,
//       status: "scheduled",
//       paymentStatus: "completed",
//       _id: { $ne: this._id },
//       $or: [
//         {
//           startTime: { $lt: this.endTime },
//           endTime: { $gt: this.startTime },
//         },
//       ],
//     });

//     if (overlappingAppointment) {
//       throw new Error("This time slot is already booked");
//     }
//   }
//   next();
// });

// validation fn to validate
AppointmentSchema.statics.validateAppointment = async function (
  appointmentData
) {
  const { doctorId, appointmentDate, startTime, endTime, consultationType } =
    appointmentData;

  const DoctorAvailability = mongoose.model("DoctorAvailability");
  const appointmentDay = new Date(appointmentDate).toLocaleString("en-US", {
    weekday: "long",
  });
  // .toLowerCase();

  // Check doctor availability
  const doctorSchedule = await DoctorAvailability.findOne({
    doctorId,
    "weeklySchedule.day": capitalize(appointmentDay),
    status: RequestStatus.APPROVED,
    consultationType,
  });

  if (!doctorSchedule) {
    // console.log(appointmentDay);
    // console.log(
    //   await DoctorAvailability.findOne({
    //     doctorId,
    //     // "weeklySchedule.day": appointmentDay,
    //     status: RequestStatus.APPROVED,
    //     consultationType,
    //   })
    // );
    return "Doctor is not available on this day for the selected consultation type";
  }

  const daySchedule = doctorSchedule.weeklySchedule.find(
    (schedule) => schedule.day === appointmentDay
  );
  const isTimeSlotAvailable = daySchedule.timeSlots.some(
    (slot) => slot.startTime <= startTime && slot.endTime >= endTime
  );

  if (!isTimeSlotAvailable) {
    return "Selected time slot is not within doctor's availability";
  }

  // Check for overlapping appointments
  const overlappingAppointment = await this.findOne({
    doctorId,
    appointmentDate,
    status: "scheduled",
    paymentStatus: "completed",
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      },
    ],
  });

  if (overlappingAppointment) {
    return "This time slot is already booked";
  }

  return null; // No validation errors
};

module.exports = mongoose.model("Appointment", AppointmentSchema);
