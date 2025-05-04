const mongoose = require("mongoose");
const { Schema } = mongoose;

// ——— history sub-schema ———
const HistoryItemSchema = new Schema(
  {
    timestamp: { type: Date, default: Date.now },
    usedDelta: { type: Number, required: true },
    remainingAfter: { type: Number, required: true },
    note: { type: String, default: "" },
  },
  { _id: false }
);

// ——— feature usage tracking sub-schema ———
const FeatureUsageSchema = new Schema(
  {
    featureId: {
      type: Schema.Types.ObjectId,
      refPath: "featureType",
      required: true,
    },
    featureType: {
      type: String,
      enum: [
        "yearly",
        "Yearly",
        "semi-annually",
        "Semi-annually",
        "monthly",
        "Monthly",
        "bi-weekly",
        "Bi-weekly",
        "weekly",
        "Weekly",
        "daily",
        "Daily",
        "semi-monthly",
        "Semi-monthly",
        "bi-monthly",
        "Bi-monthly",
        "quarterly",
        "Quarterly",
      ],
      required: true,
    },
    featureName: { type: String, required: true },
    planType: {
      type: String,
      enum: [
        "yearly",
        "Yearly",
        "semi-annually",
        "Semi-annually",
        "monthly",
        "Monthly",
        "bi-weekly",
        "Bi-weekly",
        "weekly",
        "Weekly",
        "daily",
        "Daily",
        "semi-monthly",
        "Semi-monthly",
        "bi-monthly",
        "Bi-monthly",
        "quarterly",
        "Quarterly",
      ],
      required: true,
    },
    type: {
      type: String,
      default: "others",
      required: [true, "Feature type is required!"],
    },
    subType: {
      type: String,
      default: "others",
      required: [true, "Feature sub-type is required!"],
    },
    status: { type: Boolean, default: false },
    assignedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    totalAllowed: { type: Number, default: 0 },
    totalUsed: { type: Number, default: 0 },
    totalRemaining: { type: Number, default: 0 },
    periodAllowed: { type: Number, default: 0 },
    periodUsed: { type: Number, default: 0 },
    periodRemaining: { type: Number, default: 0 },
    history: { type: [HistoryItemSchema], default: [] },
  },
  { _id: false }
);

// ——— main schema ———
const UserPlansBalanceSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roleType: {
      type: String,
      enum: ["employee", "individual"],
      required: true,
    },
    corporateCompanyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: function () {
        return this.roleType === "employee";
      },
    },
    activeBooleanFeatures: { type: [FeatureUsageSchema], default: [] },
    activeCountFeatures: { type: [FeatureUsageSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

// A feature is unique when the name and planType are the same
UserPlansBalanceSchema.index(
  {
    userId: 1,
    "activeBooleanFeatures.name": 1,
    "activeBooleanFeatures.planType": 1,
  },
  { unique: true }
);

UserPlansBalanceSchema.index(
  {
    userId: 1,
    "activeCountFeatures.name": 1,
    "activeCountFeatures.planType": 1,
  },
  { unique: true }
);

module.exports = mongoose.model("UserPlansBalance", UserPlansBalanceSchema);
