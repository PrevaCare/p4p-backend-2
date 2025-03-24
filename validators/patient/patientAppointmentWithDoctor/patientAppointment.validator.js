const Joi = require("joi");

const patientAppointmentvadatorSchema = Joi.object({
  patientId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "any.required": "Patient ID is required",
      "string.pattern.base": "Patient ID must be a valid MongoDB ObjectId",
    }),

  doctorId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "any.required": "Doctor ID is required",
      "string.pattern.base": "Doctor ID must be a valid MongoDB ObjectId",
    }),

  appointmentDate: Joi.date().required().messages({
    "any.required": "Appointment date is required",
    "date.base": "Appointment date must be a valid date",
  }),

  startTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "any.required": "Start time is required",
      "string.pattern.base": "Start time is not a valid time format! Use HH:mm",
    }),

  endTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "any.required": "End time is required",
      "string.pattern.base": "End time is not a valid time format! Use HH:mm",
    }),

  consultationType: Joi.string()
    .valid("offline", "online")
    .required()
    .messages({
      "any.required": "Consultation type is required",
      "any.only": "Consultation type must be either 'offline' or 'online'",
    }),

  status: Joi.string()
    .valid("scheduled", "completed", "cancelled", "no-show")
    .default("scheduled")
    .messages({
      "any.only":
        "Status must be one of 'scheduled', 'completed', 'cancelled', or 'no-show'",
    }),

  symptoms: Joi.string().required().messages({
    "any.required": "Symptoms description is required",
  }),

  symptomsInDetail: Joi.string().optional(),

  prescriptionId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "Prescription ID must be a valid MongoDB ObjectId",
    }),

  paymentStatus: Joi.string()
    .valid("pending", "completed", "refunded")
    .default("pending")
    .messages({
      "any.only":
        "Payment status must be one of 'pending', 'completed', or 'refunded'",
    }),

  paymentId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "Payment ID must be a valid MongoDB ObjectId",
    }),

  cancellationReason: Joi.string().optional(),

  cancelledBy: Joi.string()
    .valid("Patient", "Doctor", "Superadmin")
    .optional()
    .messages({
      "any.only":
        "CancelledBy must be one of 'Patient', 'Doctor', or 'Superadmin'",
    }),

  doctorNotes: Joi.string().optional(),
});

module.exports = { patientAppointmentvadatorSchema };
