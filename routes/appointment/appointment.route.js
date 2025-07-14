const router = require("express").Router();
const {
  getAssignedDoctorPatientForAppointmentBooking,
  getDateIsAvailableAndAvailableTimeSlotToBookAnAppointment,
  getAppointmentDashboardCardDataByDoctorId,
  myAppointmentTableList,
  myAppointmentsList,
  upcomingConsultationTableData,
  getAppointmentById,
  getAllPatientDoctorAppointmentListForAdmin,
} = require("../../controllers/patientAppointment/getPatientAppointment.controller");
const {
  createNewPatientAppointment2,
  cancelAndRefundAppointment,
} = require("../../controllers/patientAppointment/patientAppointment.controller");
const {
  verifyPaymentLinkPayment,
  verifyDirectPayment,
} = require("../../controllers/patientAppointment/verifyPayment.controller");
const {
  rateLimitOneCallInTenSeconds,
} = require("../../helper/rateLimitOnRoute/appointmentRateLimit.route");
const { verifyToken } = require("../../middlewares/jwt/permission");

router.post("/patient/appointments", verifyToken, createNewPatientAppointment2);
router.post(
  "/patient/appointment-cancel",
  verifyToken,
  rateLimitOneCallInTenSeconds,
  cancelAndRefundAppointment
);

// razorpay verify payments

// Webhook endpoint for payment link verification
router.post("/webhook/payment-link-verification", verifyPaymentLinkPayment);

// Endpoint for direct payment verification
router.post(
  "/patient/appointments/verify-payment",
  verifyToken,
  verifyDirectPayment
);

// patient list for add appointment
router.post(
  "/patient/appointments/patient-lists",
  verifyToken,
  getAssignedDoctorPatientForAppointmentBooking
);
// date, isavailable and timeslots to book an appointments
router.post(
  "/patient/appointments/date-timeslots",
  verifyToken,
  getDateIsAvailableAndAvailableTimeSlotToBookAnAppointment
);
// my appointment dashboard cards
router.post(
  "/patient/appointments/dashboard-cards",
  verifyToken,
  getAppointmentDashboardCardDataByDoctorId
);

// my appointment table list
router.post(
  "/patient/appointments/table-data",
  verifyToken, // Modify to check if the doctor requests for the table-data for herself only
  myAppointmentTableList
);

router.get(
  "/patient/appointments/list",
  verifyToken,
  myAppointmentsList
)
//  upcoming appointment dashboard cards
router.post(
  "/patient/appointments/upcoming-appointments",
  verifyToken, // Modify to check if the doctor requests for the table-data for herself only
  upcomingConsultationTableData
);
// get appointment by id
router.post("/patient/appointment", verifyToken, getAppointmentById);
router.get(
  "/admin/patient/appointments-all",
  verifyToken,
  getAllPatientDoctorAppointmentListForAdmin
);

module.exports = router;

// For direct payments - frontend
// const verifyPayment = async (response) => {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = response;

//     const result = await fetch('/api/verify-payment', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         razorpay_order_id,
//         razorpay_payment_id,
//         razorpay_signature
//       })
//     });

//     // Handle the verification response
//     const data = await result.json();
//     if (data.success) {
//       // Payment verified successfully
//     }
//   };
