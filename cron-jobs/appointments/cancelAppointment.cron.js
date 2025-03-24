const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");

// Extend Day.js with custom parsing for HH:mm format
dayjs.extend(customParseFormat);

const patientAppointmentModel = require("../../models/patient/patientAppointment/patientAppointment.model");
const patientAppointmentPaymentModel = require("../../models/patient/patientAppointment/patientAppointmentPayment.model");
const { razorpayInstance } = require("../../config/razorpay.config");

const updateNoShowAppointments = async () => {
  //   console.log("yes entered no-show");
  try {
    const currentTime = dayjs();

    // Find all relevant appointments
    const appointmentsToUpdate = await patientAppointmentModel.aggregate([
      {
        $match: {
          status: "scheduled",
          emrId: { $exists: false },
        },
      },
      {
        $lookup: {
          from: "patientappointmentpayments",
          localField: "_id",
          foreignField: "appointmentId",
          as: "payment",
        },
      },
      {
        $match: {
          "payment.status": "completed",
        },
      },
    ]);

    // Filter appointments where end time + 15 minutes has passed
    const expiredAppointments = appointmentsToUpdate.filter((appointment) => {
      const appointmentDate = dayjs(appointment.appointmentDate).format(
        "YYYY-MM-DD"
      );
      const endTime = appointment.endTime;
      const appointmentEndDateTime = dayjs(
        `${appointmentDate} ${endTime}`,
        "YYYY-MM-DD HH:mm"
      );
      const noShowCutoffTime = appointmentEndDateTime.add(15, "minute");

      return currentTime.isAfter(noShowCutoffTime);
    });

    const updatePromises = expiredAppointments.map((appointment) =>
      patientAppointmentModel.findByIdAndUpdate(
        appointment._id,
        {
          status: "no-show",
          doctorNotes:
            "Appointment marked as no-show due to absence of interaction",
        },
        { new: true }
      )
    );

    const updatedAppointments = await Promise.all(updatePromises);

    return {
      success: true,
      message: `Updated ${updatedAppointments.length} appointments to no-show status`,
      processedAppointments: updatedAppointments.length,
      processedAt: currentTime.format("YYYY-MM-DD HH:mm:ss"),
    };
  } catch (err) {
    console.error("Error in no-show update job:", err);
    return {
      success: false,
      message: err.message,
    };
  }
};

const paymentLinkExpireAtAppointmentStartDate = async () => {
  //   console.log("yes entered no-show");

  try {
    const currentTime = dayjs();

    // Find appointments with pending payments
    const appointmentsToCancel = await patientAppointmentModel.aggregate([
      {
        $match: {
          status: "scheduled",
        },
      },
      {
        $lookup: {
          from: "patientappointmentpayments",
          localField: "_id",
          foreignField: "appointmentId",
          as: "payment",
        },
      },
      {
        $match: {
          "payment.status": "created",
        },
      },
    ]);

    // Filter appointments where start time has passed
    const expiredAppointments = appointmentsToCancel.filter((appointment) => {
      const appointmentDate = dayjs(appointment.appointmentDate).format(
        "YYYY-MM-DD"
      );
      const startTime = appointment.startTime;
      const appointmentStartDateTime = dayjs(
        `${appointmentDate} ${startTime}`,
        "YYYY-MM-DD HH:mm"
      );

      return currentTime.isAfter(appointmentStartDateTime);
    });

    // Process each expired appointment
    for (const appointment of expiredAppointments) {
      const payment = appointment.payment[0];

      // Update appointment status
      await patientAppointmentModel.findByIdAndUpdate(appointment._id, {
        status: "cancelled",
        cancellationReason: "Payment not received by appointment start time",
        cancelledBy: "System",
      });

      // Update payment status
      await patientAppointmentPaymentModel.findByIdAndUpdate(payment._id, {
        status: "failed",
      });

      // Handle Razorpay payment link cancellation if needed
      if (payment.razorpayPaymentLinkId) {
        try {
          // Razorpay integration code here
          razorpayInstance.paymentLink.cancel(payment.razorpayPaymentLinkId);
        } catch (razorpayError) {
          console.error(
            `Failed to cancel Razorpay payment link: ${razorpayError.message}`
          );
        }
      }
    }

    return {
      success: true,
      message: `Processed ${expiredAppointments.length} expired appointments`,
      processedAppointments: expiredAppointments.length,
      processedAt: currentTime.format("YYYY-MM-DD HH:mm:ss"),
    };
  } catch (err) {
    console.error("Error in payment link expiration job:", err);
    return {
      success: false,
      message: err.message,
    };
  }
};

module.exports = {
  updateNoShowAppointments,
  paymentLinkExpireAtAppointmentStartDate,
};
