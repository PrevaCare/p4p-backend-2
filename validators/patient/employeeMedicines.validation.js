const Joi = require("joi");

// Validator for retrieving corporate employee medicines
exports.employeeMedicinesValidationSchema = Joi.object({
  employeeId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid employee ID format",
      "any.required": "Employee ID is required",
    }),
});
