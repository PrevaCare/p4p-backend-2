const patientAppointmentModel = require("../../models/patient/patientAppointment/patientAppointment.model");
const AppConstant = require("../../utils/AppConstant");
const Response = require("../../utils/Response");
const mongoose = require("mongoose");

const {
  patientAppointmentvadatorSchema,
} = require("../../validators/patient/patientAppointmentWithDoctor/patientAppointment.validator");
const { razorpayInstance } = require("../../config/razorpay.config");
const doctorModel = require("../../models/doctors/doctor.model");
const userModel = require("../../models/common/user.model");
const employeePlanModel = require("../../models/patient/employee/employeePlan.model");
const individualUserPlanModel = require("../../models/individualUser/individualUserPlan.model");
const patientAppointmentPaymentModel = require("../../models/patient/patientAppointment/patientAppointmentPayment.model");
const notificationsModel = require("../../models/notificationSystem/notifications.model");
const {
  appointmentCancellationTemplate,
} = require("../../utils/notifications/superadminNotification.utils");
const {
  appointmentBookedTemplate,
} = require("../../utils/notifications/doctorNotification.utils");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
const {
  sendBookingMsgToPatient,
  sendBookingMsgToDoctor,
} = require("../../helper/otp/sentOtp.helper");

// Extend Day.js with custom parsing for HH:mm format
dayjs.extend(customParseFormat);
// decrement tele consultation if have
const decrementTeleconsultationCount = async (existingUser, session) => {
  const userRole = await existingUser.role;

  const query = {
    status: "active",
    countFeatureList: {
      $elemMatch: {
        name: "tele consultation", // Matches "tele consultation" or "teleconsultation" case-insensitively
        count: { $gt: 0 }, // Ensures count is greater than 0
      },
    },
  };

  // Determine the appropriate model based on the role
  const planModel =
    userRole === "Employee" ? employeePlanModel : individualUserPlanModel;

  const plan = await planModel.findOneAndUpdate(
    userRole === "Employee"
      ? { employeeId: existingUser._id, ...query }
      : { individualUserId: existingUser._id, ...query },
    {
      $inc: { "countFeatureList.$.count": -1 }, // Decrement the count by 1
    },
    { new: true, session } // Return the updated document
  );

  // If no plan is found or update fails, return false
  return plan ? plan : false;
};

// create new patient appointment
// const createNewPatientAppointment = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     const { _id, role } = req.user;
//     const { error } = patientAppointmentvadatorSchema.validate(req.body);
//     if (error) {
//       return Response.error(
//         res,
//         400,
//         AppConstant.FAILED,
//         error.message || "validation failed !"
//       );
//     }

//     const existingUser = await userModel
//       .findOne({
//         _id: req.body.patientId,
//         $or: [{ role: "Employee" }, { role: "IndividualUser" }],
//       })
//       .select("firstName lastName phone email");
//     if (!existingUser) {
//       return Response.error(
//         res,
//         404,
//         AppConstant.FAILED,
//         "Patient not found !"
//       );
//     }
//     const existingUserTeleconsultationPlan =
//       await decrementTeleconsultationCount(existingUser, session);
//     // if doctor create then generate link also and send
//     if (role === "Doctor") {
//       const existingDoctor = await doctorModel
//         .findOne({ _id })
//         .select("firstName lastName consultationFee");
//       console.log("if block");
//       console.log(existingDoctor);

//       if (!existingUserTeleconsultationPlan) {
//         const response = await razorpayInstance.paymentLink.create({
//           amount: amount * 100, // Amount in paise (e.g., ₹500 = 50000)
//           currency: "INR",
//           description:
//             "Make payment to book your appointment with Dr. " +
//             existingDoctor.firstName +
//             " " +
//             existingDoctor.lastName,
//           customer: {
//             name: existingUser.firstName + " " + existingUser.lastName, // Replace with actual patient name
//             email: existingUser.email, // Replace with actual patient email
//             contact: existingUser.phone, // Replace with actual patient contact
//           },
//           notify: {
//             sms: true,
//             email: true,
//           },
//           callback_url: "https://yourwebsite.com/payment-success", // Replace with your callback URL
//           callback_method: "get",
//         });
//       }
//       const newPatientAppointment = new patientAppointmentModel(req.body);
//       const savedPatientAppointment = await newPatientAppointment.save({
//         session,
//       });
//       await session.commitTransaction();
//       session.endSession();
//       return Response.success(
//         res,
//         savedPatientAppointment,
//         201,
//         "new patient appointment created !"
//       );
//     } else {
//       // if employee and individual user through app
//     }

//     //
//     await session.commitTransaction();
//     session.endSession();
//     return Response.success(
//       res,
//       savedPatientAppointment,
//       201,
//       "new patient appointment created !"
//     );
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();
//     if (err.name === "ValidationError") {
//       const errorMessages = Object.values(err.errors).map(
//         (error) => error.message
//       );
//       return Response.error(
//         res,
//         400,
//         AppConstant.FAILED,
//         errorMessages.join(", ") || "Validation error!"
//       );
//     }
//     return Response.error(
//       res,
//       500,
//       AppConstant.FAILED,
//       err.message || "Internal server error!"
//     );
//   }
// };

//
const createNewPatientAppointment2 = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { _id, role } = req.user;
    const { error } = patientAppointmentvadatorSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    // validate doctor appointment
    const validateAppointmentError =
      await patientAppointmentModel.validateAppointment(req.body);

    if (validateAppointmentError) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        validateAppointmentError
      );
    }

    // Validate patient
    const existingUser = await userModel
      .findOne({
        _id: req.body.patientId,
        $or: [{ role: "Employee" }, { role: "IndividualUser" }],
        // assignedDoctors: {
        //   $in: [new mongoose.Types.ObjectId(req.body.doctorId)],
        // },
      })
      .select("firstName lastName phone email role");

    // console.log(existingUser);
    // return;
    if (!existingUser) {
      return Response.error(res, 404, AppConstant.FAILED, "Patient not found!");
    }
    console.log(role);
    // Decrement teleconsultation count if applicable
    const teleconsultationPlan = await decrementTeleconsultationCount(
      existingUser,
      session
    );

    console.log(teleconsultationPlan);
    let paymentLinkResponse = null;
    let existingDoctor = null;
    if (role === "Doctor" || role === "Superadmin") {
      //
      if (role === "Doctor") {
        // Doctor creates appointment
        existingDoctor = await doctorModel
          .findOne({ _id })
          .select("firstName lastName consultationFees phone");
        //   console.log(existingDoctor);
        //   console.log(existingUser);
        //   return;
        if (!existingDoctor) {
          return Response.error(
            res,
            404,
            AppConstant.FAILED,
            "Doctor not found!"
          );
        }
      } else {
        existingDoctor = await doctorModel
          .findOne({ _id: req.body.doctorId })
          .select("firstName lastName consultationFees phone");
      }

      if (!teleconsultationPlan) {
        // Generate payment link if no plan exists
        paymentLinkResponse = await razorpayInstance.paymentLink.create({
          amount: existingDoctor.consultationFees * 100, // Convert to paise
          currency: "INR",
          description:
            "Make payment to book your appointment with Dr. " +
            existingDoctor.firstName +
            " " +
            existingDoctor.lastName,
          customer: {
            name: existingUser.firstName + " " + existingUser.lastName,
            email: existingUser.email,
            contact: existingUser.phone,
          },
          notify: {
            sms: true,
            email: true,
          },
          callback_url: "https://preva.care/admin/payment-success", // Your callback URL
          callback_method: "get",
        });
      }
    } else {
      existingDoctor = await doctorModel
        .findOne({ _id: req.body.doctorId })
        .select("firstName lastName consultationFees");
      // Employee or Individual User creates appointment
      if (!teleconsultationPlan) {
        // User must pay if no plan exists
        // const { amount } = req.body; // Get amount from request
        paymentLinkResponse = await razorpayInstance.paymentLink.create({
          amount: existingDoctor.consultationFees * 100, // Convert to paise
          currency: "INR",
          description:
            "Make payment to book your appointment with Dr. " +
            existingDoctor.firstName +
            " " +
            existingDoctor.lastName,
          customer: {
            name: existingUser.firstName + " " + existingUser.lastName,
            email: existingUser.email,
            contact: existingUser.phone,
          },
          notify: {
            sms: true,
            email: true,
          },
          callback_url: "https://preva.care/admin/payment-success", // Your callback URL
          callback_method: "get",
        });

        // Save payment details
        // const paymentRecord = new patientAppointmentPaymentModel({
        //   appointmentId: req.body.appointmentId,
        //   razorpayOrderId: paymentLinkResponse.id,
        //   amount: existingDoctor.consultationFees,
        //   currency: "INR",
        //   status: "created",
        // });
        // await paymentRecord.save({ session });
      }
    }

    // Save patient appointment
    const newPatientAppointment = new patientAppointmentModel(req.body);
    const savedAppointment = await newPatientAppointment.save({ session });

    // Save payment details
    const paymentRecord = new patientAppointmentPaymentModel({
      appointmentId: savedAppointment._id,
      createdBy: role === "Doctor" || role === "Superadmin" ? role : "Patient",
      razorpayOrderId:
        role === "Doctor" || role === "Superadmin" || teleconsultationPlan
          ? null
          : paymentLinkResponse.id,
      razorpayPaymentLinkId:
        role === "Doctor" || role === "Superadmin"
          ? paymentLinkResponse?.id
            ? paymentLinkResponse.id
            : null
          : null,
      amount: existingDoctor.consultationFees,
      currency: "INR",
      status: "created",
    });
    await paymentRecord.save({ session });

    await session.commitTransaction();

    const notifications = appointmentBookedTemplate(
      `${existingUser.firstName} ${existingUser.lastName}`,
      req.body.doctorId,
      req.body.appointmentDate,
      req.body.startTime,
      req.body.endTime,
      req.body.consultationType,
      req.body.symptoms,
      req.body.symptomsInDetail,
      existingUser.phone,
      `${existingDoctor.firstName} ${existingDoctor.lastName}`
    );
    await notificationsModel.create(notifications);
    console.log("Doctor details", existingDoctor.phone, existingUser.phone);
    await sendBookingMsgToPatient(
      existingUser.phone,
      `${existingUser.firstName} ${existingUser.lastName}`,
      `${existingDoctor.firstName} ${existingDoctor.lastName}`,
      req.body.appointmentDate,
      req.body.startTime
    );
    await sendBookingMsgToDoctor(
      existingDoctor.phone,
      `${existingDoctor.firstName} ${existingDoctor.lastName}`,
      `${existingUser.firstName} ${existingUser.lastName}`,
      req.body.appointmentDate,
      req.body.startTime
    );
    // session.endSession();
    return Response.success(
      res,
      {
        appointment: savedAppointment,
        // paymentInfo: paymentLinkResponse,
        paymentRecord: paymentRecord,
      },
      201,
      "New patient appointment created successfully!"
    );
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    // session.endSession();

    if (err.name === "ValidationError") {
      const errorMessages = Object.values(err.errors).map(
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
      err.message || "Internal server error!"
    );
  } finally {
    session.endSession();
  }
};

// cancel the appointment
const cancelAndRefundAppointment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { appointmentId, cancellationReason } = req.body;
    const { role } = req.user;

    if (!appointmentId || !cancellationReason) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Appointment ID and cancellation reason are required!"
      );
    }

    // Find the appointment
    const appointment = await patientAppointmentModel
      .findById(appointmentId)
      .populate({
        path: "patientId",
        select: "firstName lastName phone",
      })
      .populate({
        path: "doctorId",
        select: "firstName lastName phone",
      })
      .session(session);

    if (!appointment) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Appointment not found!"
      );
    }

    // Check if appointment is already cancelled
    if (
      appointment.status === "cancelled" ||
      appointment.status === "completed" ||
      appointment.status === "refunded"
    ) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        `Appointment is already ${appointment.status}!`
      );
    }

    // Get appointment date and time
    const appointmentDate = dayjs(appointment.appointmentDate).format(
      "YYYY-MM-DD"
    );
    const startTime = appointment.startTime;
    const appointmentStartDateTime = dayjs(
      `${appointmentDate} ${startTime}`,
      "YYYY-MM-DD HH:mm"
    );
    const timeDiff = appointmentStartDateTime.diff(dayjs(), "hour", true);
    // console.log(timeDiff);

    // If time difference is less than 1 hour, don't allow cancellation
    if (timeDiff < 1 && role !== "Superadmin") {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Cannot cancel appointment less than 1 hour before scheduled time!"
      );
    }

    // Find payment record
    const paymentRecord = await patientAppointmentPaymentModel
      .findOne({ appointmentId: appointment._id })
      .session(session);

    if (paymentRecord && paymentRecord.status === "completed") {
      try {
        if (
          paymentRecord.createdBy === "Doctor" ||
          (paymentRecord.createdBy === "Superadmin" &&
            paymentRecord.razorpayPaymentLinkId)
        ) {
          // First, fetch the payment ID associated with the payment link
          const paymentLinkDetails = await razorpayInstance.paymentLink.fetch(
            paymentRecord.razorpayPaymentLinkId
          );
          // console.log(paymentLinkDetails.payments[0].payment_id);

          // Use the payment ID to process refund
          refundResponse = await razorpayInstance.payments.refund(
            paymentLinkDetails.payments[0].payment_id, // first payment ID in the link
            {
              // amount: paymentRecord.amount,
              speed: "optimum",
              notes: {
                cancellationReason,
                appointmentId: appointment._id.toString(),
              },
            }
          );
        } else if (
          paymentRecord.createdBy === "Patient" &&
          paymentRecord.razorpayPaymentId
        ) {
          // Refund for direct payment
          refundResponse = await razorpayInstance.payments.refund(
            paymentRecord.razorpayPaymentId,
            {
              speed: "optimum",
              notes: {
                cancellationReason,
                appointmentId: appointment._id.toString(),
              },
            }
          );
        } else {
          throw new Error("Invalid payment information for refund");
        }
      } catch (refundError) {
        console.error("Refund Error:", refundError);
        throw new Error("Failed to process refund: " + refundError.message);
      }
    } else if (paymentRecord) {
      try {
        if (
          paymentRecord.createdBy === "Doctor" ||
          (paymentRecord.createdBy === "Superadmin" &&
            paymentRecord.razorpayPaymentLinkId)
        ) {
          await razorpayInstance.paymentLink.cancel(
            paymentRecord.razorpayPaymentLinkId
          );
        }
      } catch (e) {
        console.error("failed to cancel payment link");
      }
    }

    // create notification for superadmin
    // Find all Superadmin users
    const existingSuperadmins = await userModel
      .find({ role: "Superadmin" })
      .session(session);

    // Create notifications for each Superadmin
    const patientObj = appointment.patientId.toObject
      ? appointment.patientId.toObject()
      : appointment.patientId;
    const doctorObj = appointment.doctorId.toObject
      ? appointment.doctorId.toObject()
      : appointment.doctorId;

    const notifications = existingSuperadmins.map((superadmin) =>
      appointmentCancellationTemplate(
        superadmin._id,
        `${patientObj.firstName} ${patientObj.lastName}`,
        patientObj.phone,
        `${doctorObj.firstName} ${doctorObj.lastName}`,
        doctorObj.phone,
        role,
        cancellationReason
      )
    );

    // Bulk insert notifications
    await notificationsModel.insertMany(notifications, { session });

    // Update appointment status
    appointment.status = "cancelled";
    appointment.cancelledBy =
      role === "Doctor" || role === "Superadmin" ? role : "Patient";

    appointment.cancellationReason = cancellationReason;
    // appointment.cancelledBy = req.user.role;

    await appointment.save({ session });

    // Update payment status
    if (paymentRecord) {
      paymentRecord.status = "refunded";
      await paymentRecord.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return Response.success(
      res,
      {
        appointment,
        // paymentRecord,
        // refundResponse,
      },
      200,
      `Appointment cancelled ${
        paymentRecord && "and refund initiated"
      } successfully!   `
    );
  } catch (err) {
    console.error(err);
    await session.abortTransaction();
    session.endSession();

    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

module.exports = { createNewPatientAppointment2, cancelAndRefundAppointment };
