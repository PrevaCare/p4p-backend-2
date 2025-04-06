const mongoose = require("mongoose");

const testIncludedSchema = new mongoose.Schema({
  test: { type: String, required: [true, "test is required!"] },
  parameters: [String],
});

// City availability schema - with required pricing fields
const cityAvailabilitySchema = new mongoose.Schema({
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lab.availableCities",
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  // City-specific pricing fields (all required)
  labSellingPrice: {
    type: Number,
    required: [true, "City-specific lab selling price is required!"],
  },
  offeredPriceToPrevaCare: {
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
    required: [true, "City-specific home collection charge is required!"],
  },
});

// lab schema
const labPackage = new mongoose.Schema(
  {
    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lab",
      required: true,
    },
    PackageCode: {
      type: String,
      required: [true, "Package code is required !"],
      unique: true,
      trim: true,
    },
    desc: { type: String },
    category: { type: String, required: [true, "category is required !"] },
    testName: {
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
    homeCollectionChargeIncluded: {
      type: Boolean,
      default: false,
    },
    cityAvailability: [cityAvailabilitySchema], // Enhanced field for city availability with pricing
  },
  { timestamps: true }
);

module.exports = mongoose.model("LapPackage", labPackage);
