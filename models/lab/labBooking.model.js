const mongoose = require("mongoose");
const User = require("../common/user.model");
const Lab = require("./lab.model");
const IndividualLabTest = require("./individualLabTest.model");
const LabPackage = require("./labPackage.model");

const LabBookingSchema = new mongoose.Schema(
  {
    bookedby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Booked by is required"],
    },
    bookedFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Booked for is required"],
    },
    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lab",
      required: [true, "Lab ID is required"],
    },
    bookingType: {
      type: String,
      enum: ["Test", "Package"],
      required: [true, "Booking type is required"],
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IndividualLabTest",
      required: function () {
        return this.bookingType === "Test";
      },
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabPackage",
      required: function () {
        return this.bookingType === "Package";
      },
    },
    scheduledDate: {
      type: Date,
      required: [true, "Scheduled date is required"],
    },
    scheduledTime: {
      type: String,
      required: [true, "Scheduled time is required"],
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid time format! Use HH:mm`,
      },
    },
    status: {
      type: String,
      enum: [
        "Requested",
        "Confirmed",
        "Sample_Pickup_Scheduled",
        "Sample_Picked_Up",
        "Test_Scheduled",
        "Report_Ready",
        "Collection_Approved",
        "Completed",
        "Cancelled",
        "Rejected",
      ],
      default: "Requested",
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            "Requested",
            "Confirmed",
            "Sample_Pickup_Scheduled",
            "Sample_Picked_Up",
            "Test_Scheduled",
            "Report_Ready",
            "Collection_Approved",
            "Completed",
            "Cancelled",
            "Rejected",
          ],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        notes: {
          type: String,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Refunded"],
      default: "Pending",
    },
    paymentLink: {
      type: String,
    },
    paymentDate: {
      type: Date,
    },
    paymentId: {
      type: String,
    },
    amount: {
      type: Number,
      required: [true, "Booking amount is required"],
    },
    homeCollection: {
      type: Boolean,
      default: false,
    },
    homeCollectionCharge: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
    },
    reportFile: {
      type: String,
    },
    adminNotes: {
      type: String,
    },
    cancellationReason: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
    location: {
      city: {
        type: String,
        required: [true, "City is required"],
      },
      state: {
        type: String,
      },
      pinCode: {
        type: String,
      },
      address: {
        type: String,
        required: [true, "Address is required"],
      },
    },
    bookingFor: {
      type: String,
      enum: ["self", "other"],
      default: "self",
    },
    patientRelationship: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to track status changes and set default values
LabBookingSchema.pre("save", function (next) {
  // Log validation process
  console.log(`Pre-save validation for booking ID: ${this._id || "new"}`);

  if (this.isNew) {
    console.log("Creating new booking - adding to status history");
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      notes: "Booking created",
    });

    // Set bookingFor based on whether bookedby and bookedFor are the same
    if (this.bookedby.toString() === this.bookedFor.toString()) {
      this.bookingFor = "self";
    } else {
      this.bookingFor = "other";
    }
  } else if (this.isModified("status")) {
    console.log(`Status changed to: ${this.status} - updating status history`);
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
    });
  }
  next();
});

// Static method to validate time slot availability
LabBookingSchema.statics.validateTimeSlot = async function (bookingData) {
  const { labId, scheduledDate, scheduledTime } = bookingData;

  // Convert time string to minutes for easier comparison
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const bookingTimeMinutes = timeToMinutes(scheduledTime);

  // Check if the requested time is within operational hours (7AM - 8PM)
  if (
    bookingTimeMinutes < timeToMinutes("07:00") ||
    bookingTimeMinutes > timeToMinutes("20:00")
  ) {
    return "Booking time must be between 7AM and 8PM";
  }

  console.log(
    `Time slot requested: ${scheduledTime} (${bookingTimeMinutes} minutes since midnight)`
  );
  console.log(`Validating for lab ID: ${labId} on date: ${scheduledDate}`);

  // Check for overlapping bookings with buffer time
  const bookingDateStart = new Date(scheduledDate);
  bookingDateStart.setHours(0, 0, 0, 0);

  const bookingDateEnd = new Date(scheduledDate);
  bookingDateEnd.setHours(23, 59, 59, 999);

  // Find bookings on the same date for the same lab
  const existingBookings = await this.find({
    labId,
    scheduledDate: {
      $gte: bookingDateStart,
      $lte: bookingDateEnd,
    },
    scheduledTime: scheduledTime,
    status: { $nin: ["Cancelled", "Rejected"] },
  });

  console.log(
    `Found ${existingBookings.length} existing bookings at the same time slot`
  );

  // Set maximum bookings per time slot
  const MAX_BOOKINGS_PER_SLOT = 5; // Allow up to 5 bookings per time slot

  if (existingBookings.length >= MAX_BOOKINGS_PER_SLOT) {
    return `This time slot has reached maximum capacity (${MAX_BOOKINGS_PER_SLOT} bookings). Please try a different time.`;
  }

  // If we get here, the slot is available with acceptable capacity
  console.log(
    `Time slot ${scheduledTime} is available (current bookings: ${existingBookings.length}/${MAX_BOOKINGS_PER_SLOT})`
  );
  return null; // No validation errors
};

module.exports = mongoose.model("LabBooking", LabBookingSchema);
