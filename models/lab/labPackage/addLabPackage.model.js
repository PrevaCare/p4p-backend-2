const mongoose = require("mongoose");

const testIncludedSchema = new mongoose.Schema({
  test: { type: String, required: [true, "test is required!"] },
  parameters: [String],
});

// City availability schema - with required pricing fields
const cityAvailabilitySchema = new mongoose.Schema({
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "City",
    required: true,
  },
  cityName: {
    type: String,
    required: true,
  },
  pinCode: {
    type: String,
    required: true,
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
const labPackage = new mongoose.Schema(
  {
    labId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lab",
      required: true,
    },
    packageCode: {
      type: String,
      required: [true, "Package code is required and is unique !"],
      unique: true,
      trim: true,
    },
    desc: { type: String },
    category: { type: String, required: [true, "category is required !"] },
    packageName: {
      type: String,
      trim: true,
      required: [true, "test name is required !"],
    },
    testIncluded: [testIncludedSchema],
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
    cityAvailability: [cityAvailabilitySchema], // Enhanced field for city availability with pricing
  },
  { timestamps: true }
);

// Create a compound unique index on packageCode and labId
labPackage.index({ packageCode: 1, labId: 1 }, { unique: true });

module.exports = mongoose.model("LabPackage", labPackage);
