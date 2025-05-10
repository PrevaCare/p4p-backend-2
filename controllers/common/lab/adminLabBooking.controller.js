const mongoose = require("mongoose");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const LabBooking = require("../../../models/lab/labBooking.model");
const {
  labBookingStatusUpdateSchema,
} = require("../../../validators/lab/labBooking.validator");
const { razorpayInstance } = require("../../../config/razorpay.config");

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

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    // Execute query with pagination
    let bookings = await LabBooking.find(query)
      .populate("labId", "labName")
      .populate("testId", "testName testCode")
      .populate("packageId", "packageName packageCode")
      .populate("userId", "name email phone")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // If search query exists, filter the results after population
    if (search) {
      bookings = bookings.filter(
        (booking) =>
          booking.userId &&
          ((booking.userId.name &&
            booking.userId.name.toLowerCase().includes(search.toLowerCase())) ||
            (booking.userId.phone && booking.userId.phone.includes(search)))
      );
    }

    // For proper pagination with filtering, we need to count total matching documents
    let totalBookings;
    if (search) {
      // Count matching bookings manually for search
      const allMatchingBookings = await LabBooking.find(query).populate(
        "userId",
        "name email phone"
      );

      totalBookings = allMatchingBookings.filter(
        (booking) =>
          booking.userId &&
          ((booking.userId.name &&
            booking.userId.name.toLowerCase().includes(search.toLowerCase())) ||
            (booking.userId.phone && booking.userId.phone.includes(search)))
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
      .populate("userId", "name email phone address")
      .populate("statusHistory.updatedBy", "name email");

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
    const booking = await LabBooking.findById(bookingId);
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
      .populate("userId", "name email phone");

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

    // Generate a payment link using Razorpay (example integration)
    const paymentLinkData = {
      amount: booking.totalAmount * 100, // Convert to smallest currency unit
      currency: "INR",
      accept_partial: false,
      description: `Payment for ${serviceName} at ${booking.labId.labName}`,
      customer: {
        name: booking.userId.name,
        email: booking.userId.email || "customer@example.com",
        contact: booking.userId.phone,
      },
      notify: {
        sms: true,
        email: true,
      },
      reminder_enable: true,
      notes: {
        bookingId: booking._id.toString(),
      },
    };

    // In a real implementation, call the payment gateway API
    // Here's an example with Razorpay
    /*
    const paymentLink = await razorpayInstance.paymentLink.create(paymentLinkData);
    booking.paymentLink = paymentLink.short_url;
    */

    // For demonstration, create a dummy payment link
    booking.paymentLink = `https://example.com/pay/${bookingId}?amount=${booking.totalAmount}`;
    await booking.save();

    return Response.success(
      res,
      {
        paymentLink: booking.paymentLink,
        bookingId: booking._id,
      },
      200,
      "Payment link generated successfully"
    );
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

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid booking ID format"
      );
    }

    // Check if report file was uploaded
    if (!req.file) {
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

    // Update report file path
    booking.reportFile = req.file.path;

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
      .populate("userId", "name");

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

module.exports = {
  getAllLabBookings,
  getLabBookingDetailsAdmin,
  updateLabBookingStatus,
  generatePaymentLink,
  updatePaymentStatus,
  uploadLabReport,
  getLabBookingStatistics,
};
