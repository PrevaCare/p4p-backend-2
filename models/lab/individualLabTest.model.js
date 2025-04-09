const mongoose = require("mongoose");

const testIncludedSchema = new mongoose.Schema({
  test: { type: String, required: true },
  parameters: [String],
});

// City availability schema - with required pricing fields
const cityAvailabilitySchema = new mongoose.Schema({
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "City",
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  billingRate: {
    type: Number,
    required: [true, "City-specific lab selling price is required!"],
  },
  partnerRate: {
    type: Number,
    required: [true, "City-specific offered price to PrevaCare is required!"],
  },
  prevaCarePrice: {
    type: Number,
    required: [true, "City-specific PrevaCare price is required!"],
  },
  discountPercentage: {
    type: Number,
    required: [true, "City-specific discount percentage is required!"],
  },
  homeCollectionCharge: {
    type: Number,
    default: 0,
  },
  homeCollectionAvailable: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// Pre-save hook to set homeCollectionAvailable based on homeCollectionCharge
cityAvailabilitySchema.pre("save", function (next) {
  if (this.homeCollectionCharge > 0) {
    this.homeCollectionAvailable = true;
  }
  next();
});

// lab schema
const individualLabTestSchema = new mongoose.Schema(
  {
    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lab",
      required: true,
    },
    testCode: {
      type: String,
      required: [true, "Test code is required!"],
      unique: true,
      trim: true,
    },
    desc: { type: String },
    category: {
      type: String,
      required: [true, "Category is required!"],
      trim: true,
    },
    testName: {
      type: String,
      required: [true, "Test name is required!"],
      trim: true,
    },
    testIncluded: testIncludedSchema,
    sampleRequired: [String],
    preparationRequired: [String],
    gender: {
      type: String,
      default: "both",
    },
    ageGroup: {
      type: String,
      default: "all age group",
    },
    homeCollectionChargeIncluded: {
      type: Boolean,
      default: false,
    },
    cityAvailability: [cityAvailabilitySchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Create a compound unique index on testCode and labId
individualLabTestSchema.index({ testCode: 1, lab: 1 }, { unique: true });

module.exports = mongoose.model("IndividualLabTest", individualLabTestSchema);
