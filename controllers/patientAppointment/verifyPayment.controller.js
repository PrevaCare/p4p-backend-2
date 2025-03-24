const crypto = require("crypto");
const mongoose = require("mongoose");
const Response = require("../../utils/Response");
const AppConstant = require("../../utils/AppConstant");
const patientAppointmentModel = require("../../models/patient/patientAppointment/patientAppointment.model");
const patientAppointmentPaymentModel = require("../../models/patient/patientAppointment/patientAppointmentPayment.model");

// Verify Razorpay webhook signature
const verifyWebhookSignature = (webhookBody, signature, webhookSecret) => {
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(JSON.stringify(webhookBody))
    .digest("hex");

  if (!signature || !expectedSignature) {
    throw new Error("Invalid signature or expected signature");
  }

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

const verifyPaymentLinkPayment = async (req, res) => {
  console.log("yes webhook hitted");
  //   console.log(req.body);
  //   console.log(req.headers);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const webhookSignature = req.headers["x-razorpay-signature"];
    const webhookBody = req.body;

    // Verify webhook signature
    if (
      !verifyWebhookSignature(
        webhookBody,
        webhookSignature,
        process.env.RAZORPAY_WEBHOOK_SECRET
      )
    ) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid webhook signature"
      );
    }

    const {
      id: payment_link_id,
      payment_id,
      status,
    } = webhookBody.payload.payment_link.entity; // Access `entity`

    // console.log("payment_link_id:", payment_link_id, "status:", status);

    const existingAppointmentPayment =
      await patientAppointmentPaymentModel.findOne({
        razorpayPaymentLinkId: payment_link_id,
      });

    if (!existingAppointmentPayment) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Appointment payment not found"
      );
    }

    // console.log("Existing Payment Record:", existingAppointmentPayment);

    // Update payment record
    const paymentRecord = await patientAppointmentPaymentModel.findOneAndUpdate(
      { _id: existingAppointmentPayment._id },
      {
        razorpayPaymentId: payment_id,
        status: status === "paid" ? "completed" : "failed",
      },
      { session, new: true }
    );

    // Update appointment payment status
    await patientAppointmentModel.findByIdAndUpdate(
      existingAppointmentPayment.appointmentId,
      { paymentStatus: status === "paid" ? "completed" : "pending" },
      { session }
    );
    // console.log("paymentRecord");
    // console.log(paymentRecord);

    await session.commitTransaction();
    return Response.success(
      res,
      { payment: paymentRecord },
      200,
      "Payment verification successful"
    );
  } catch (error) {
    await session.abortTransaction();
    console.error("Payment verification error:", error);

    if (error.name === "ValidationError") {
      const errorMessages = Object.values(error.errors).map(
        (error) => error.message
      );
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        errorMessages.join(", ") || "Validation error!"
      );
    }
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      "Payment verification failed"
    );
  } finally {
    session.endSession();
  }
};

// Handle direct payment verification (User created appointments)
const verifyDirectPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid payment signature"
      );
    }

    // Find and update payment record
    const paymentRecord = await patientAppointmentPaymentModel.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "completed",
      },
      { session, new: true }
    );

    if (!paymentRecord) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Payment record not found"
      );
    }

    // Update appointment payment status
    await patientAppointmentModel.findByIdAndUpdate(
      paymentRecord.appointmentId,
      { paymentStatus: "completed" },
      { session }
    );

    await session.commitTransaction();
    return Response.success(
      res,
      { payment: paymentRecord },
      200,
      "Payment verification successful"
    );
  } catch (error) {
    await session.abortTransaction();
    console.error("Payment verification error:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      "Payment verification failed"
    );
  } finally {
    session.endSession();
  }
};

module.exports = {
  verifyPaymentLinkPayment,
  verifyDirectPayment,
};
