const Joi = require("joi");

const labBookingCreateSchema = Joi.object({
  labId: Joi.string().required().messages({
    "string.empty": "Lab ID is required",
    "any.required": "Lab ID is required",
  }),
  bookingType: Joi.string().valid("Test", "Package").required().messages({
    "string.empty": "Booking type is required",
    "any.required": "Booking type is required",
    "any.only": "Booking type must be either Test or Package",
  }),
  testId: Joi.string().when("bookingType", {
    is: "Test",
    then: Joi.required().messages({
      "string.empty": "Test ID is required for test bookings",
      "any.required": "Test ID is required for test bookings",
    }),
    otherwise: Joi.forbidden(),
  }),
  packageId: Joi.string().when("bookingType", {
    is: "Package",
    then: Joi.required().messages({
      "string.empty": "Package ID is required for package bookings",
      "any.required": "Package ID is required for package bookings",
    }),
    otherwise: Joi.forbidden(),
  }),
  scheduledDate: Joi.date().min("now").required().messages({
    "date.base": "Scheduled date must be a valid date",
    "date.min": "Scheduled date cannot be in the past",
    "any.required": "Scheduled date is required",
  }),
  scheduledTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.empty": "Scheduled time is required",
      "string.pattern.base": "Scheduled time must be in HH:MM format",
      "any.required": "Scheduled time is required",
    }),
  homeCollection: Joi.boolean().default(false),

  // Add new fields for enhanced functionality
  location: Joi.object({
    city: Joi.string().required().messages({
      "string.empty": "City is required",
      "any.required": "City is required",
    }),
    state: Joi.string().allow("", null),
    pinCode: Joi.string().allow("", null),
    address: Joi.string().required().messages({
      "string.empty": "Address is required",
      "any.required": "Address is required",
    }),
  }),

  bookingFor: Joi.string().valid("self", "other").default("self"),

  patientDetails: Joi.when("bookingFor", {
    is: "other",
    then: Joi.object({
      // Updated to support both name or firstName+lastName patterns
      name: Joi.string().messages({
        "string.empty": "Patient name is required",
      }),
      firstName: Joi.string().messages({
        "string.empty": "Patient first name is required",
      }),
      lastName: Joi.string().messages({
        "string.empty": "Patient last name is required",
      }),
      email: Joi.string().email().allow("", null),
      phone: Joi.string()
        .pattern(/^[0-9]{10}$/)
        .allow("", null)
        .messages({
          "string.pattern.base": "Phone number must be 10 digits",
        }),
      gender: Joi.string()
        .valid("male", "female", "other", "M", "F", "O")
        .allow("", null)
        .messages({
          "any.only": "Gender must be one of: male, female, other, M, F, O",
        }),
      age: Joi.number().integer().min(0).max(120).allow("", null),
      relationship: Joi.string().allow("", null),
    })
      .xor("name", "firstName") // Either use name OR firstName (with lastName)
      .with("firstName", "lastName")
      .or("email", "phone")
      .messages({
        "object.missing":
          "Either email or phone is required for patient details",
        "object.xor":
          "Either provide full name or separate first and last name",
        "object.with": "When using firstName, lastName is also required",
      }),
  }),
});

const labBookingUpdateSchema = Joi.object({
  scheduledDate: Joi.date().min("now").messages({
    "date.base": "Scheduled date must be a valid date",
    "date.min": "Scheduled date cannot be in the past",
  }),
  scheduledTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .messages({
      "string.pattern.base": "Scheduled time must be in HH:MM format",
    }),
  homeCollection: Joi.boolean(),
  cancellationReason: Joi.string().allow("", null),
});

const labBookingStatusUpdateSchema = Joi.object({
  status: Joi.string()
    .valid(
      "Requested",
      "Confirmed",
      "Sample_Pickup_Scheduled",
      "Sample_Picked_Up",
      "Test_Scheduled",
      "Report_Ready",
      "Collection_Approved",
      "Completed",
      "Cancelled",
      "Rejected"
    )
    .required()
    .messages({
      "string.empty": "Status is required",
      "any.required": "Status is required",
      "any.only": "Invalid status value",
    }),
  notes: Joi.string().allow("", null),
  paymentLink: Joi.string().allow("", null),
  reportFile: Joi.string().allow("", null),
  paymentStatus: Joi.string().valid("Pending", "Completed", "Refunded"),
  paymentDate: Joi.date(),
  paymentId: Joi.string().allow("", null),
  rejectionReason: Joi.string().when("status", {
    is: "Rejected",
    then: Joi.required().messages({
      "string.empty": "Rejection reason is required when rejecting a booking",
      "any.required": "Rejection reason is required when rejecting a booking",
    }),
    otherwise: Joi.forbidden(),
  }),
  cancellationReason: Joi.string().when("status", {
    is: "Cancelled",
    then: Joi.required().messages({
      "string.empty":
        "Cancellation reason is required when cancelling a booking",
      "any.required":
        "Cancellation reason is required when cancelling a booking",
    }),
    otherwise: Joi.forbidden(),
  }),
});

module.exports = {
  labBookingCreateSchema,
  labBookingUpdateSchema,
  labBookingStatusUpdateSchema,
};
