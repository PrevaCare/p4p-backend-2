const Joi = require("joi");

// Define the feature schema
const booleanFeatureSchema = Joi.object({
  name: Joi.string().required().trim(),
  status: Joi.boolean().default(false),
  featureId: Joi.string().allow(null, ""),
  type: Joi.string().default("Others").trim(),
  subType: Joi.string().default("Others").trim(),
});

const countFeatureSchema = Joi.object({
  name: Joi.string().required().trim(),
  count: Joi.number().integer().min(0).default(0),
  planType: Joi.string()
    .valid(
      "yearly",
      "monthly",
      "weekly",
      "semi-monthly",
      "semi-annually",
      "daily",
      "quarterly",
      "bimonthly",
      "bi-weekly",
      "bi-monthly"
    )
    .default("yearly"),
  featureId: Joi.string().allow(null, ""),
  type: Joi.string().default("Others").trim(),
  subType: Joi.string().default("Others").trim(),
});

// Define the Joi schema for adding a corporate plan
const addCorporatePlanSchema = Joi.object({
  corporateId: Joi.string().required(),
  name: Joi.string().required().trim(),
  category: Joi.string().required().trim(),
  price: Joi.number().required().positive(),
  duration: Joi.string().valid("monthly", "yearly").required(),
  totalEmployeeCount: Joi.number().integer().min(1).required(),
  billingCycle: Joi.string().valid("monthly", "yearly", "1", "12").required(),
  remarks: Joi.string().allow("", null),
  discountPercentage: Joi.number().min(0).max(100).default(0),

  // Arrays of features
  booleanFeatureList: Joi.array().items(booleanFeatureSchema).default([]),
  countFeatureList: Joi.array().items(countFeatureSchema).default([]),

  // Optional fields with defaults
  autoRenew: Joi.boolean().default(false),
  status: Joi.string()
    .valid("active", "expired", "suspended", "cancelled")
    .default("active"),
  startDate: Joi.date().default(Date.now),
  employeeCount: Joi.number().integer().min(0).default(0),
  paymentStatus: Joi.string()
    .valid("pending", "completed", "failed", "refunded")
    .default("pending"),

  // Optional reference arrays
  assignedEmployee: Joi.array().items(Joi.string()).default([]),
  assignedDoctor: Joi.array().items(Joi.string()).default([]),
  assignedLabs: Joi.array().items(Joi.string()).default([]),
});

// Define the schema for updating a corporate plan
const updateCorporatePlanSchema = Joi.object({
  name: Joi.string().trim(),
  category: Joi.string().trim(),
  price: Joi.number().positive(),
  duration: Joi.string().valid("monthly", "yearly"),
  totalEmployeeCount: Joi.number().integer().min(1),
  billingCycle: Joi.string().valid("monthly", "yearly", "1", "12"),
  remarks: Joi.string().allow("", null),
  discountPercentage: Joi.number().min(0).max(100),

  // Arrays of features
  booleanFeatureList: Joi.array().items(booleanFeatureSchema),
  countFeatureList: Joi.array().items(countFeatureSchema),

  // Optional fields
  autoRenew: Joi.boolean(),
  status: Joi.string().valid("active", "expired", "suspended", "cancelled"),
  startDate: Joi.date(),
  employeeCount: Joi.number().integer().min(0),
  paymentStatus: Joi.string().valid(
    "pending",
    "completed",
    "failed",
    "refunded"
  ),

  // Reference arrays
  assignedEmployee: Joi.array().items(Joi.string()),
  assignedDoctor: Joi.array().items(Joi.string()),
  assignedLabs: Joi.array().items(Joi.string()),
});

module.exports = {
  addCorporatePlanSchema,
  updateCorporatePlanSchema,
};
