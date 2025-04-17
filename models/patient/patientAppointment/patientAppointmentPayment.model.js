const mongoose = require("mongoose");

// Payment schema
const PatientAppointmentPaymentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: [true, "Appointment is required"],
    },
    createdBy: {
      type: String,
      enum: ["Doctor", "Patient", "Superadmin"],
      required: [true, "createdBy is required !"],
    },
    razorpayPaymentLinkId: {
      type: String,
      // required: function () {
      //   return this.createdBy === "Doctor" || this.createdBy === "Superadmin"; // Required if razorpayOrderId is not present
      // },
    },
    razorpayOrderId: {
      type: String,
      // required: function () {
      //   return this.createdBy === "Doctor" || this.createdBy === "Superadmin"; // Required if razorpayOrderId is not present
      // },
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["created", "completed", "failed", "refunded"],
      default: "created",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "PatientAppointmentPayment",
  PatientAppointmentPaymentSchema
);
