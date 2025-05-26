const mongoose = require("mongoose");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const LabBooking = require("../../../models/lab/labBooking.model");
const Report = require("../../../models/lab/reports.model");
const User = require("../../../models/common/user.model");
const { uploadToS3 } = require("../../../middlewares/uploads/awsConfig");
const {
  labBookingStatusUpdateSchema,
} = require("../../../validators/lab/labBooking.validator");
const { razorpayInstance } = require("../../../config/razorpay.config");
const {
  sendLabTestScheduleMsg,
  sentLabReportReadyMsg,
  sendCustomLabReportMsg,
} = require("../../../helper/otp/sentOtp.helper");

/**
 * Get all lab test/package bookings for admin
 * @route GET /v1/admin/lab-bookings
 */
const getAllLabBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const bookingType = req.query.bookingType;
    const search = req.query.search;
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const rawDate = req.query.date;
    let parsedDate;

    // Replace '+' with spaces, remove trailing ' z'
    if (rawDate != null) {
      const cleanedDateStr = rawDate.replace(/\+/g, " ").replace(" z", "");

      // Parse the string into a Date object
      parsedDate = new Date(cleanedDateStr);

      console.log(parsedDate.toISOString()); // or parsedDate.toLocaleString()
    }

    // Build query
    const query = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by booking type if provided
    if (bookingType) {
      query.bookingType = bookingType;
    }

    // Search by user name or phone
    if (search) {
      // We'll need to perform the search on the populated user field
      // Store the search query for later use
      const searchQuery = search;
    }

    if (parsedDate && rawDate != null) {
      const start = new Date(parsedDate);
      start.setHours(0, 0, 0, 0); // Start of the day in local time

      const end = new Date(start);
      end.setDate(end.getDate() + 1); // Next day

      query.scheduledDate = { $gte: start, $lt: end };
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    // Execute query with pagination
    let bookings = await LabBooking.find(query)
      .populate("labId", "labName")
      .populate("testId", "testName testCode")
      .populate("packageId", "packageName packageCode")
      .populate("bookedby", "firstName lastName email phone")
      .populate("bookedFor", "firstName lastName email phone")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // If search query exists, filter the results after population
    if (search) {
      bookings = bookings.filter(
        (booking) =>
          (booking.bookedFor &&
            ((booking.bookedFor.firstName &&
              booking.bookedFor.lastName &&
              `${booking.bookedFor.firstName} ${booking.bookedFor.lastName}`
                .toLowerCase()
                .includes(search.toLowerCase())) ||
              (booking.bookedFor.phone &&
                booking.bookedFor.phone.includes(search)))) ||
          (booking.bookedby &&
            ((booking.bookedby.firstName &&
              booking.bookedby.lastName &&
              `${booking.bookedby.firstName} ${booking.bookedby.lastName}`
                .toLowerCase()
                .includes(search.toLowerCase())) ||
              (booking.bookedby.phone &&
                booking.bookedby.phone.includes(search))))
      );
    }

    // For proper pagination with filtering, we need to count total matching documents
    let totalBookings;
    if (search) {
      // Count matching bookings manually for search
      const allMatchingBookings = await LabBooking.find(query)
        .populate("bookedby", "firstName lastName email phone")
        .populate("bookedFor", "firstName lastName email phone");

      totalBookings = allMatchingBookings.filter(
        (booking) =>
          (booking.bookedFor &&
            ((booking.bookedFor.firstName &&
              booking.bookedFor.lastName &&
              `${booking.bookedFor.firstName} ${booking.bookedFor.lastName}`
                .toLowerCase()
                .includes(search.toLowerCase())) ||
              (booking.bookedFor.phone &&
                booking.bookedFor.phone.includes(search)))) ||
          (booking.bookedby &&
            ((booking.bookedby.firstName &&
              booking.bookedby.lastName &&
              `${booking.bookedby.firstName} ${booking.bookedby.lastName}`
                .toLowerCase()
                .includes(search.toLowerCase())) ||
              (booking.bookedby.phone &&
                booking.bookedby.phone.includes(search))))
      ).length;
    } else {
      // Count without search filter
      totalBookings = await LabBooking.countDocuments(query);
    }

    return Response.success(
      res,
      {
        bookings,
        pagination: {
          total: totalBookings,
          pages: Math.ceil(totalBookings / limit),
          page,
          limit,
        },
      },
      200,
      "Lab bookings retrieved successfully"
    );
  } catch (error) {
    console.error("Error fetching all lab bookings:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error"
    );
  }
};

/**
 * Get single lab booking details for admin
 * @route GET /v1/admin/lab-bookings/:bookingId
 */
const getLabBookingDetailsAdmin = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid booking ID format"
      );
    }

    const booking = await LabBooking.findById(bookingId)
      .populate("labId", "labName logo address")
      .populate(
        "testId",
        "testName testCode desc category testIncluded sampleRequired preparationRequired"
      )
      .populate(
        "packageId",
        "packageName packageCode desc category testIncluded sampleRequired preparationRequired"
      )
      .populate("bookedby", "firstName lastName email phone address")
      .populate("bookedFor", "firstName lastName email phone address")
      .populate("statusHistory.updatedBy", "firstName lastName email");

    if (!booking) {
      return Response.error(res, 404, AppConstant.FAILED, "Booking not found");
    }

    return Response.success(
      res,
      booking,
      200,
      "Booking details retrieved successfully"
    );
  } catch (error) {
    console.error("Error fetching booking details for admin:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error"
    );
  }
};

/**
 * Update lab booking status (admin)
 * @route PATCH /v1/admin/lab-bookings/:bookingId
 */
const updateLabBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid booking ID format"
      );
    }

    // Validate request body
    const { error, value } = labBookingStatusUpdateSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.details[0].message
      );
    }

    const {
      status,
      notes,
      paymentLink,
      reportFile,
      paymentStatus,
      paymentDate,
      paymentId,
      rejectionReason,
      cancellationReason,
    } = value;

    // Find the booking
    const booking = await LabBooking.findById(bookingId).populate(
      "bookedFor",
      "phone firstName lastName"
    );
    if (!booking) {
      return Response.error(res, 404, AppConstant.FAILED, "Booking not found");
    }

    // Update status if provided
    if (status) {
      booking.status = status;

      // Add to status history
      booking.statusHistory.push({
        status,
        timestamp: new Date(),
        notes: notes || `Status updated to ${status}`,
        updatedBy: req.user._id, // Assuming admin user is authenticated
      });

      // Add reason for rejection or cancellation
      if (status === "Rejected" && rejectionReason) {
        booking.rejectionReason = rejectionReason;
      } else if (status === "Cancelled" && cancellationReason) {
        booking.cancellationReason = cancellationReason;
      }
    }

    // Update payment status if provided
    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;

      // If payment is completed, record the payment date
      if (paymentStatus === "Completed" && !booking.paymentDate) {
        booking.paymentDate = paymentDate || new Date();
      }
    }

    // Update payment ID if provided
    if (paymentId) {
      booking.paymentId = paymentId;
    }

    // Update additional fields if provided
    if (paymentLink) booking.paymentLink = paymentLink;
    if (reportFile) booking.reportFile = reportFile;
    if (notes) booking.adminNotes = notes;

    // If status is "Confirmed" and no payment link, generate a payment link (placeholder)
    if (
      status === "Confirmed" &&
      !paymentLink &&
      booking.paymentStatus === "Pending" &&
      !booking.paymentLink
    ) {
      // In a real implementation, integrate with payment gateway to create a payment link
      booking.paymentLink = `https://example.com/pay/${bookingId}`;
    }

    await booking.save();
    if (status === "Test_Scheduled") {
      await sendLabTestScheduleMsg(booking.bookedFor.phone);
    }
    if (status === "Report_Ready") {
      await sentLabReportReadyMsg(booking.bookedFor.phone);
    }

    return Response.success(res, booking, 200, "Booking updated successfully");
  } catch (error) {
    console.error("Error updating booking status:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error"
    );
  }
};

/**
 * Generate payment link for a booking
 * @route POST /v1/admin/lab-bookings/:bookingId/payment-link
 */
const generatePaymentLink = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid booking ID format"
      );
    }

    // Find the booking
    const booking = await LabBooking.findById(bookingId)
      .populate("labId", "labName")
      .populate("testId", "testName")
      .populate("packageId", "packageName")
      .populate("bookedby", "firstName lastName email phone");

    if (!booking) {
      return Response.error(res, 404, AppConstant.FAILED, "Booking not found");
    }

    if (booking.paymentStatus === "Completed") {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Payment has already been completed for this booking"
      );
    }

    // Get service name based on booking type
    const serviceName =
      booking.bookingType === "Test"
        ? booking.testId?.testName
        : booking.packageId?.packageName;

    // Create a unique reference ID for this payment (shorter version - max 40 chars)
    const shortBookingId = bookingId.toString().substring(0, 10);
    const reference_id = `book_${shortBookingId}_${Date.now() % 10000000}`; // Ensure less than 40 chars

    // Format the customer name properly
    const customerName =
      `${booking.bookedby.firstName || ""} ${
        booking.bookedby.lastName || ""
      }`.trim() || "Customer";

    // Generate a payment link using Razorpay - following their exact API format
    const paymentLinkData = {
      amount: Math.round(booking.totalAmount * 100), // Amount in smallest currency unit (paise)
      // amount: 100, // Amount in smallest currency unit (paise)
      currency: "INR",
      accept_partial: false,
      description: `Payment for ${serviceName} at ${booking.labId.labName}`,
      customer: {
        name: customerName,
        email: booking.bookedby.email || `user${Date.now()}@example.com`,
        contact: booking.bookedby.phone || "+919899500873",
        // contact: "+917667629574",
      },
      notify: {
        sms: true, // Disable SMS notifications as requested
        email: false, // Disable email notifications as requested
      },
      reminder_enable: false, // Disable reminders as well
      notes: {
        booking_id: booking._id.toString(),
        service_name: serviceName,
        booking_type: booking.bookingType,
      },
      callback_url: `${
        process.env.FRONTEND_URL || "https://preva.care"
      }/payment/callback?bookingId=${bookingId}`,
      callback_method: "get",
      reference_id: reference_id,
    };

    try {
      // Create payment link using Razorpay API
      const paymentLink =
        await razorpayInstance.paymentLink.create(paymentLinkData);

      // Update booking with payment link details
      booking.paymentLink = paymentLink.short_url;
      booking.paymentLinkId = paymentLink.id;

      // Add note to status history
      booking.statusHistory.push({
        status: booking.status,
        timestamp: new Date(),
        notes: "Payment link generated",
        updatedBy: req.user._id,
      });

      await booking.save();

      return Response.success(
        res,
        {
          paymentLink: paymentLink.short_url,
          paymentLinkId: paymentLink.id,
          bookingId: booking._id,
          expiresAt: paymentLink.expire_by
            ? new Date(paymentLink.expire_by * 1000)
            : null,
        },
        200,
        "Payment link generated successfully"
      );
    } catch (razorpayError) {
      console.error("Razorpay API error:", razorpayError);
      return Response.error(
        res,
        500,
        AppConstant.FAILED,
        `Error from payment gateway: ${
          razorpayError.error?.description ||
          razorpayError.message ||
          "Unknown payment gateway error"
        }`
      );
    }
  } catch (error) {
    console.error("Error generating payment link:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error"
    );
  }
};

/**
 * Update payment status for a booking
 * @route PATCH /v1/admin/lab-bookings/:bookingId/payment
 */
const updatePaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentStatus, paymentId, paymentDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid booking ID format"
      );
    }

    if (
      !paymentStatus ||
      !["Pending", "Completed", "Refunded"].includes(paymentStatus)
    ) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Valid payment status is required"
      );
    }

    // Find the booking
    const booking = await LabBooking.findById(bookingId);
    if (!booking) {
      return Response.error(res, 404, AppConstant.FAILED, "Booking not found");
    }

    // Update payment fields
    booking.paymentStatus = paymentStatus;

    if (paymentId) {
      booking.paymentId = paymentId;
    }

    if (paymentStatus === "Completed") {
      booking.paymentDate = paymentDate || new Date();

      // If status is still just requested, update to confirmed
      if (booking.status === "Requested") {
        booking.status = "Confirmed";
        booking.statusHistory.push({
          status: "Confirmed",
          timestamp: new Date(),
          notes: "Automatically confirmed after payment",
          updatedBy: req.user._id,
        });
      }
    }

    await booking.save();

    return Response.success(
      res,
      booking,
      200,
      "Payment status updated successfully"
    );
  } catch (error) {
    console.error("Error updating payment status:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error"
    );
  }
};

/**
 * Upload lab report for a booking
 * @route POST /v1/admin/lab-bookings/:bookingId/report
 */
const uploadLabReport = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reportName, indication, remarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid booking ID format"
      );
    }

    // Check if report file was uploaded
    if (!req.files) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Report file is required"
      );
    }

    // Find the booking
    const booking = await LabBooking.findById(bookingId);
    if (!booking) {
      return Response.error(res, 404, AppConstant.FAILED, "Booking not found");
    }

    // Update report file
    const files = req.files.reportFile;
    const reportFiles = await Promise.all(
      files.map(async (file) => {
        const uploadResult = await uploadToS3(file);
        return {
          fileName: file.originalname,
          url: uploadResult.Location,
        };
      })
    );
    console.log(reportFiles);
    const bookerFor = booking.bookedFor;

    const user = await User.findById(bookerFor).populate({
      path: "assignedDoctors",
      select: "firstName lastName specialization",
    });
    // console.log(user);
    // await sendCustomLabReportMsg(user.phone, reportFiles);
    //
    if (!user.assignedDoctors || user.assignedDoctors.length === 0) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "no doctor assigned to this user !"
      );
    }

    const assignedGeneralPhysicianDoctor = user.assignedDoctors.filter(
      (doctor) => {
        return doctor.specialization === "General Physician";
      }
    );

    if (
      !assignedGeneralPhysicianDoctor ||
      assignedGeneralPhysicianDoctor.length === 0
    ) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "no general physician doctor assigned to this employee !"
      );
    }

    const newLabReport = new Report({
      reportName: req.body.reportName,
      indication: req.body.indication,
      remarks: req.body.remarks,
      doctor: assignedGeneralPhysicianDoctor[0]._id,
      user: bookerFor,

      documents: reportFiles,
    });

    const savedLabReport = await newLabReport.save();
    booking.reportFile = reportFiles;

    // Update status to Report_Ready if not already at a later stage
    const statusOrder = [
      "Requested",
      "Confirmed",
      "Sample_Pickup_Scheduled",
      "Sample_Picked_Up",
      "Test_Scheduled",
      "Report_Ready",
      "Collection_Approved",
      "Completed",
    ];

    const currentStatusIndex = statusOrder.indexOf(booking.status);
    const reportReadyIndex = statusOrder.indexOf("Report_Ready");

    if (currentStatusIndex < reportReadyIndex) {
      booking.status = "Report_Ready";
      booking.statusHistory.push({
        status: "Report_Ready",
        timestamp: new Date(),
        notes: "Lab report uploaded",
        updatedBy: req.user._id,
      });
    }

    await booking.save();

    return Response.success(
      res,
      {
        reportFile: booking.reportFile,
        bookingId: booking._id,
      },
      200,
      "Lab report uploaded successfully"
    );
  } catch (error) {
    console.error("Error uploading lab report:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error"
    );
  }
};

/**
 * Get lab booking statistics
 * @route GET /v1/admin/lab-bookings/statistics
 */
const getLabBookingStatistics = async (req, res) => {
  try {
    // Count bookings by status
    const statusCounts = await LabBooking.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Format status counts into an object
    const statusCountsObject = statusCounts.reduce((acc, status) => {
      acc[status._id] = status.count;
      return acc;
    }, {});

    // Count bookings by payment status
    const paymentStatusCounts = await LabBooking.aggregate([
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // Format payment status counts into an object
    const paymentStatusCountsObject = paymentStatusCounts.reduce(
      (acc, status) => {
        acc[status._id] = status.count;
        return acc;
      },
      {}
    );

    // Count bookings by booking type
    const bookingTypeCounts = await LabBooking.aggregate([
      {
        $group: {
          _id: "$bookingType",
          count: { $sum: 1 },
        },
      },
    ]);

    // Format booking type counts into an object
    const bookingTypeCountsObject = bookingTypeCounts.reduce((acc, type) => {
      acc[type._id] = type.count;
      return acc;
    }, {});

    // Get total revenue from completed payments
    const revenueStats = await LabBooking.aggregate([
      {
        $match: { paymentStatus: "Completed" },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          averageRevenue: { $avg: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Get recent bookings
    const recentBookings = await LabBooking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("labId", "labName")
      .populate("testId", "testName")
      .populate("packageId", "packageName")
      .populate("bookedby", "firstName lastName email phone");

    return Response.success(
      res,
      {
        statusCounts: statusCountsObject,
        paymentStatusCounts: paymentStatusCountsObject,
        bookingTypeCounts: bookingTypeCountsObject,
        revenue: revenueStats[0] || {
          totalRevenue: 0,
          averageRevenue: 0,
          count: 0,
        },
        recentBookings,
      },
      200,
      "Booking statistics retrieved successfully"
    );
  } catch (error) {
    console.error("Error fetching booking statistics:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error"
    );
  }
};

/**
 * Handle Razorpay payment webhook
 * @route POST /v1/admin/lab-bookings/razorpay-webhook
 */
const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers["x-razorpay-signature"];
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET || "your_webhook_secret";

    // Verify webhook signature
    const crypto = require("crypto");
    const generatedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    // Validate the webhook signature
    if (generatedSignature !== webhookSignature) {
      console.error("Invalid webhook signature");
      return res.status(400).send({ status: "invalid signature" });
    }

    const event = req.body;
    const eventType = event.event;

    // Handle different event types
    if (eventType === "payment_link.paid") {
      // Payment was successfully made
      const paymentLinkId = event.payload.payment_link.entity.id;

      // Find the booking with this payment link ID
      const booking = await LabBooking.findOne({
        paymentLinkId: paymentLinkId,
      });

      if (!booking) {
        console.error(
          `No booking found with payment link ID: ${paymentLinkId}`
        );
        return res.status(200).send({ status: "no booking found" });
      }

      // Update booking payment status
      booking.paymentStatus = "Completed";
      booking.paymentDate = new Date();
      booking.paymentId = event.payload.payment.entity.id;

      // Update booking status if it's still in Requested status
      if (booking.status === "Requested") {
        booking.status = "Confirmed";
        booking.statusHistory.push({
          status: "Confirmed",
          timestamp: new Date(),
          notes: "Payment completed via Razorpay",
        });
      }

      await booking.save();
      console.log(`Payment completed for booking ${booking._id}`);
    } else if (eventType === "payment_link.cancelled") {
      // Payment link was cancelled
      const paymentLinkId = event.payload.payment_link.entity.id;

      const booking = await LabBooking.findOne({
        paymentLinkId: paymentLinkId,
      });
      if (booking) {
        // Add a note to the booking about the cancelled payment link
        booking.statusHistory.push({
          status: booking.status,
          timestamp: new Date(),
          notes: "Payment link cancelled",
        });

        await booking.save();
        console.log(`Payment link cancelled for booking ${booking._id}`);
      }
    }

    // Acknowledge the webhook
    return res.status(200).send({ status: "success" });
  } catch (error) {
    console.error("Error processing Razorpay webhook:", error);
    return res.status(500).send({ status: "error", message: error.message });
  }
};

/**
 * Admin manual payment verification
 * @route POST /v1/admin/lab-bookings/:bookingId/verify-payment
 */
const verifyPaymentManually = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentId, paymentDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid booking ID format"
      );
    }

    // Find the booking
    const booking = await LabBooking.findById(bookingId);
    if (!booking) {
      return Response.error(res, 404, AppConstant.FAILED, "Booking not found");
    }

    // If payment already completed
    if (booking.paymentStatus === "Completed") {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Payment has already been marked as completed"
      );
    }

    // Update payment details
    booking.paymentStatus = "Completed";
    booking.paymentDate = paymentDate || new Date();

    if (paymentId) {
      booking.paymentId = paymentId;
    }

    // Update booking status if it's still in Requested status
    if (booking.status === "Requested") {
      booking.status = "Confirmed";
      booking.statusHistory.push({
        status: "Confirmed",
        timestamp: new Date(),
        notes: "Payment manually verified by admin",
        updatedBy: req.user._id,
      });
    }

    await booking.save();

    return Response.success(res, booking, 200, "Payment verified successfully");
  } catch (error) {
    console.error("Error verifying payment:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error"
    );
  }
};

module.exports = {
  getAllLabBookings,
  getLabBookingDetailsAdmin,
  updateLabBookingStatus,
  generatePaymentLink,
  updatePaymentStatus,
  uploadLabReport,
  getLabBookingStatistics,
  handleRazorpayWebhook,
  verifyPaymentManually,
};
