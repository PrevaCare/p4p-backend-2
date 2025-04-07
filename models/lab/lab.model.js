const mongoose = require("mongoose");

// Address Schema remains the same
const AddressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
});

// AccountsDetail Schema remains the same
const accountsDetailSchema = new mongoose.Schema({
  bankName: { type: String },
  ifscCode: { type: String },
  branchName: { type: String },
  accountNumber: { type: String },
});

// Available Cities Schema - new addition
const availableCitiesSchema = new mongoose.Schema({
  cityName: {
    type: String,
    trim: true,
    required: [true, "city name is required !"],
  },
  zipCode: {
    type: String,
    trim: true,
    required: [true, "Pin code is required !"],
  },
  locationType: {
    type: String,
    enum: ["Same City Lab", "Non Lab City"],
    default: "Same City Lab",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// Lab Schema with multiple middleware hooks
const labSchema = new mongoose.Schema(
  {
    logo: { type: String, required: true },
    labName: {
      type: String,
      trim: true,
      required: [true, "lab name is required !"],
    },
    labPersonName: {
      type: String,
      required: [true, "lab person name is required !"],
    },
    contactNumber: {
      type: String,
      minLength: 10,
      maxLength: 10,
    },
    address: {
      type: AddressSchema,
      required: true,
    },
    accountsDetail: {
      type: accountsDetailSchema,
    },
    cityOperatedIn: [
      {
        cityName: {
          type: String,
          trim: true,
          required: [true, "city name is required !"],
        },
        zipCode: {
          type: String,
          trim: true,
          minLength: 6,
          maxLength: 6,
        },
      },
    ],
    availableCities: [availableCitiesSchema], // New field for available cities
  },
  { timestamps: true }
);

// Function to convert city names to lowercase
const convertCityNamesToLowercase = function (cities) {
  if (cities && Array.isArray(cities)) {
    return cities.map((city) => ({
      ...city,
      cityName: city.cityName ? city.cityName.toLowerCase() : city.cityName,
    }));
  }
  return cities;
};

// Pre-save hook for new documents
labSchema.pre("save", function (next) {
  if (this.cityOperatedIn) {
    this.cityOperatedIn = convertCityNamesToLowercase(this.cityOperatedIn);
  }

  // Also convert available cities to lowercase
  if (this.availableCities) {
    this.availableCities = convertCityNamesToLowercase(this.availableCities);
  }

  next();
});

// Pre-update hooks for different update operations
labSchema.pre(["updateOne", "findOneAndUpdate", "updateMany"], function (next) {
  const update = this.getUpdate();

  // Handle direct updates to cityOperatedIn
  if (update.cityOperatedIn) {
    update.cityOperatedIn = convertCityNamesToLowercase(update.cityOperatedIn);
  }

  // Handle direct updates to availableCities
  if (update.availableCities) {
    update.availableCities = convertCityNamesToLowercase(
      update.availableCities
    );
  }

  // Handle updates using $set
  if (update.$set) {
    if (update.$set.cityOperatedIn) {
      update.$set.cityOperatedIn = convertCityNamesToLowercase(
        update.$set.cityOperatedIn
      );
    }

    if (update.$set.availableCities) {
      update.$set.availableCities = convertCityNamesToLowercase(
        update.$set.availableCities
      );
    }
  }

  // Handle updates using $push with single item
  if (update.$push) {
    if (update.$push.cityOperatedIn) {
      const city = update.$push.cityOperatedIn;
      if (city.cityName) {
        city.cityName = city.cityName.toLowerCase();
      }
    }

    if (update.$push.availableCities) {
      const city = update.$push.availableCities;
      if (city.cityName) {
        city.cityName = city.cityName.toLowerCase();
      }
    }
  }

  // Handle updates using $push with $each
  if (update.$push) {
    if (update.$push.cityOperatedIn && update.$push.cityOperatedIn.$each) {
      update.$push.cityOperatedIn.$each = convertCityNamesToLowercase(
        update.$push.cityOperatedIn.$each
      );
    }

    if (update.$push.availableCities && update.$push.availableCities.$each) {
      update.$push.availableCities.$each = convertCityNamesToLowercase(
        update.$push.availableCities.$each
      );
    }
  }

  next();
});

module.exports = mongoose.model("Lab", labSchema);
