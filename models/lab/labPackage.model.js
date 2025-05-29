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
  state: {
    type: String,
    required: true,
  },
  pinCodes_excluded: {
    type: [String],
    default: [],
  },
  regions_excluded: {
    type: [String],
    default: [],
  },
  isActive: {
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
  prevaCarePriceForCorporate: {
    type: Number,
    required: [true, "City-specific PrevaCare price is required!"],
  },
  prevaCarePriceForIndividual: {
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
});

// lab schema
const labPackage = new mongoose.Schema(
  {
    logo: {
      type: String,
      default: "",
    },
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

// Pre-save hook to set homeCollectionAvailable based on homeCollectionCharge
cityAvailabilitySchema.pre("save", function (next) {
  // Only auto-set homeCollectionAvailable if it wasn't explicitly set to false
  if (this.homeCollectionCharge > 0 && this.homeCollectionAvailable !== false) {
    this.homeCollectionAvailable = true;
  }
  next();
});
//change the package name to packageCode
// Create a compound unique index on packageCode and labId
labPackage.index({ packageCode: 1, labId: 1 }, { unique: true });

// Add document-level pre-save hook for debugging
labPackage.pre("save", function (next) {
  console.log(
    `Saving package: packageCode=${this.packageCode}, packageName=${this.packageName}`
  );
  console.log(`Package has ${this.cityAvailability?.length || 0} cities`);

  // Log a sample of the first city if available
  if (this.cityAvailability && this.cityAvailability.length > 0) {
    const sampleCity = this.cityAvailability[0];
    console.log("Sample city data:", {
      cityId: sampleCity.cityId,
      billingRate: sampleCity.billingRate,
      partnerRate: sampleCity.partnerRate,
      prevaCarePriceForCorporate: sampleCity.prevaCarePriceForCorporate,
      prevaCarePriceForIndividual: sampleCity.prevaCarePriceForIndividual,
      discountPercentage: sampleCity.discountPercentage,
      homeCollectionCharge: sampleCity.homeCollectionCharge,
      homeCollectionAvailable: sampleCity.homeCollectionAvailable,
      isActive: sampleCity.isActive,
    });
  }

  next();
});

module.exports =
  mongoose.models.LabPackage || mongoose.model("LabPackage", labPackage);
