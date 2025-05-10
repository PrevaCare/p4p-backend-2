const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const {
  createLabBooking,
  getUserLabBookings,
  getLabBookingDetails,
  updateLabBooking,
  getAvailableTimeSlots,
  checkTimeSlotAvailability,
} = require("../../../controllers/common/lab/labBooking.controller");
const {
  getAllLabBookings,
  getLabBookingDetailsAdmin,
  updateLabBookingStatus,
  generatePaymentLink,
  updatePaymentStatus,
  uploadLabReport,
  getLabBookingStatistics,
} = require("../../../controllers/common/lab/adminLabBooking.controller");
const {
  verifyToken,
  checkPermissions,
} = require("../../../middlewares/jwt/permission");

// Configure multer for report file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/lab-reports");
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept pdf and image files
    const filetypes = /pdf|jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed"));
    }
  },
});

// User-facing routes
/**
 * Create a new lab test/package booking
 * @route POST /v1/app/lab-bookings
 * Requirements: lab test/package details, authentication
 * Access: Authenticated users only
 */
router.post("/app/lab-bookings", verifyToken, createLabBooking);

/**
 * Get all lab bookings for authenticated user
 * @route GET /v1/app/lab-bookings
 * Requirements: Authentication
 * Access: Authenticated users only
 */
router.get("/app/lab-bookings", verifyToken, getUserLabBookings);

/**
 * Get single lab booking details
 * @route GET /v1/app/lab-bookings/:bookingId
 * Requirements: bookingId, authentication
 * Access: Authenticated users only
 */
router.get("/app/lab-bookings/:bookingId", verifyToken, getLabBookingDetails);

/**
 * Update lab booking (date, time, cancel, etc.)
 * @route PATCH /v1/app/lab-bookings/:bookingId
 * Requirements: bookingId, update data, authentication
 * Access: Authenticated users only
 */
router.patch("/app/lab-bookings/:bookingId", verifyToken, updateLabBooking);

/**
 * Get available time slots for a lab
 * @route GET /v1/app/labs/:labId/available-slots
 * Requirements: labId, date (query), authentication
 * Access: Authenticated users only
 */
router.get(
  "/app/labs/:labId/available-slots",
  verifyToken,
  getAvailableTimeSlots
);

/**
 * Check if a specific time slot is available
 * @route GET /v1/app/labs/:labId/check-slot
 * Requirements: labId, date (query), time (query), authentication
 * Access: Authenticated users only
 */
router.get(
  "/app/labs/:labId/check-slot",
  verifyToken,
  checkTimeSlotAvailability
);

// Admin-facing routes
/**
 * Get all lab bookings (admin)
 * @route GET /v1/admin/lab-bookings
 * Requirements: Authentication, Admin permissions
 * Access: Admin users only
 */
router.get(
  "/admin/lab-bookings",
  verifyToken,
  checkPermissions("READ", "Employee"),
  getAllLabBookings
);

/**
 * Get lab booking statistics (admin)
 * @route GET /v1/admin/lab-bookings/statistics
 * Requirements: Authentication, Admin permissions
 * Access: Admin users only
 */
router.get(
  "/admin/lab-bookings/statistics",
  verifyToken,
  checkPermissions("READ", "Employee"),
  getLabBookingStatistics
);

/**
 * Get single lab booking details (admin)
 * @route GET /v1/admin/lab-bookings/:bookingId
 * Requirements: bookingId, authentication, admin permissions
 * Access: Admin users only
 */
router.get(
  "/admin/lab-bookings/:bookingId",
  verifyToken,
  checkPermissions("READ", "Employee"),
  getLabBookingDetailsAdmin
);

/**
 * Update lab booking status (admin)
 * @route PATCH /v1/admin/lab-bookings/:bookingId
 * Requirements: bookingId, status, authentication, admin permissions
 * Access: Admin users only
 */
router.patch(
  "/admin/lab-bookings/:bookingId",
  verifyToken,
  checkPermissions("UPDATE", "Employee"),
  updateLabBookingStatus
);

/**
 * Update payment status for a booking (admin)
 * @route PATCH /v1/admin/lab-bookings/:bookingId/payment
 * Requirements: bookingId, payment details, authentication, admin permissions
 * Access: Admin users only
 */
router.patch(
  "/admin/lab-bookings/:bookingId/payment",
  verifyToken,
  checkPermissions("UPDATE", "Employee"),
  updatePaymentStatus
);

/**
 * Generate payment link for a booking (admin)
 * @route POST /v1/admin/lab-bookings/:bookingId/payment-link
 * Requirements: bookingId, authentication, admin permissions
 * Access: Admin users only
 */
router.post(
  "/admin/lab-bookings/:bookingId/payment-link",
  verifyToken,
  checkPermissions("UPDATE", "Employee"),
  generatePaymentLink
);

/**
 * Upload lab report for a booking (admin)
 * @route POST /admin/lab-bookings/:bookingId/report
 * Requirements: bookingId, report file, authentication, admin permissions
 * Access: Admin users only
 */
router.post(
  "/admin/lab-bookings/:bookingId/report",
  verifyToken,
  checkPermissions("UPDATE", "Employee"),
  upload.single("reportFile"),
  uploadLabReport
);

module.exports = router;
