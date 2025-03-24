// const mongoose = require("mongoose");

// // Payment Schema
// const CorporatePlanPaymentSchema = new mongoose.Schema(
//   {
//     razorpayOrderId: {
//       type: String,
//       required: true,
//     },
//     razorpayPaymentId: {
//       type: String,
//     },
//     razorpaySignature: {
//       type: String,
//     },
//     amount: {
//       type: Number,
//       required: true,
//     },
//     currency: {
//       type: String,
//       default: "INR",
//     },
//     status: {
//       type: String,
//       enum: ["created", "authorized", "captured", "failed", "refunded"],
//       default: "created",
//     },
//     corporatePlan: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "CorporatePlan",
//     },
//     corporateId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Corporate",
//       required: true,
//     },
//     metadata: {
//       type: Object,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model(
//   "CorporatePlanPayment",
//   CorporatePlanPaymentSchema
// );
