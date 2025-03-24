const Joi = require("joi");

// Define time slot validation
const TimeSlotSchema = Joi.object({
  startTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "Start time must be in the format HH:mm",
      "any.required": "Start time is required",
    }),
  endTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "End time must be in the format HH:mm",
      "any.required": "End time is required",
    }),
});

// Define weekly availability validation
const WeeklyAvailabilitySchema = Joi.object({
  day: Joi.string()
    .valid(
      ...Object.values(require("../../constants/weekdays.constant").DaysOfWeek)
    )
    .required()
    .messages({
      "any.only": "Day must be one of the valid days of the week",
      "any.required": "Day is required",
    }),
  timeSlots: Joi.array().items(TimeSlotSchema).optional(),
});

// Define the main schema
const DoctorAvailabilitySchema = Joi.object({
  doctorId: Joi.string().optional().allow("").messages({
    "string.base": "Doctor ID must be a valid string",
  }),
  weeklySchedule: Joi.array().items(WeeklyAvailabilitySchema).optional(),
  status: Joi.string()
    .valid(
      ...Object.values(
        require("../../constants/request.contants").RequestStatus
      )
    )
    .optional()
    .allow("")
    .messages({
      "any.only": "Status must be a valid request status",
    }),
  consultationType: Joi.string()
    .valid("offline", "online")
    .required()
    .messages({
      "any.only": "Consultation Type must be offline | online",
      "any.required": "Consultation Type is required",
    }),
  requestedAt: Joi.date().optional().allow(""),
  processedAt: Joi.date().optional().allow(""),
  processedBy: Joi.string().optional().allow("").messages({
    "string.base": "Processed by must be a valid string",
  }),
  doctorRemark: Joi.string().optional().allow(""),
  adminRemark: Joi.string().optional().allow(""),
});

module.exports = { DoctorAvailabilitySchema };
