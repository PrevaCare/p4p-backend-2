const mongoose = require("mongoose");

const testIncludedSchema = new mongoose.Schema({
  test: { type: String, required: [true, "test is required!"] },
  parameters: [String],
});

// City availability schema - new addition
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
    // packages: [packageSchema],
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
    labSellingPrice: {
      type: Number,
      required: [true, "labSellingPrice is required !"],
    },
    offeredPriceToPrevaCare: {
      type: Number,
      required: [true, "offeredPriceToPrevaCare is required !"],
    },
    prevaCarePrice: {
      type: Number,
      required: [true, "prevaCarePrice is required !"],
    },
    discountPercentage: {
      type: Number,
      required: [true, "discountPercentage is required !"],
    },
    homeCollectionCharge: {
      type: Number,
      defualt: 0,
      // required: [true, "homeCollectionCharge is required !"],
    },
    homeCollectionChargeIncluded: {
      type: Boolean,
      default: false,
    },
    cityAvailability: [cityAvailabilitySchema], // New field for city availability
  },
  { timestamps: true }
);

module.exports = mongoose.model("LapPackage", labPackage);
