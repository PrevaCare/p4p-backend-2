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
const availableCitySchema = new mongoose.Schema({
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "City",
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  cityName: {
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
    availableCities: [availableCitySchema],
  },
  { timestamps: true }
);

const normaliseCities = (arr) => {
  return Array.isArray(arr)
    ? arr.map((c) => ({
        ...c,
        cityName:
          typeof c.cityName === "string"
            ? c.cityName.toLowerCase()
            : c.cityName,
        state: typeof c.state === "string" ? c.state.toLowerCase() : c.state,
      }))
    : arr;
};

// Pre-save hook for new documents
labSchema.pre("save", function (next) {
  try {
    console.log(
      "Pre-save hook, availableCities before:",
      JSON.stringify(this.availableCities)
    );
    if (this.availableCities && Array.isArray(this.availableCities)) {
      this.availableCities = normaliseCities(this.availableCities);
    }
    console.log(
      "Pre-save hook, availableCities after:",
      JSON.stringify(this.availableCities)
    );
    next();
  } catch (error) {
    console.error("Error in pre-save hook:", error);
    next(error);
  }
});

// Pre-update hook for existing documents
labSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function (next) {
  try {
    const u = this.getUpdate();
    console.log("Pre-update hook, update object:", JSON.stringify(u));

    const handle = (key) => {
      if (u[key]) {
        console.log(`Normalizing ${key} directly:`, JSON.stringify(u[key]));
        u[key] = normaliseCities(u[key]);
      }
      if (u.$set && u.$set[key]) {
        console.log(`Normalizing $set.${key}:`, JSON.stringify(u.$set[key]));
        u.$set[key] = normaliseCities(u.$set[key]);
      }
      if (u.$push && u.$push[key]) {
        if (u.$push[key].$each) {
          console.log(
            `Normalizing $push.${key}.$each:`,
            JSON.stringify(u.$push[key].$each)
          );
          u.$push[key].$each = normaliseCities(u.$push[key].$each);
        } else {
          console.log(
            `Normalizing $push.${key} directly:`,
            JSON.stringify([u.$push[key]])
          );
          u.$push[key] = normaliseCities([u.$push[key]])[0];
        }
      }
    };

    handle("availableCities");
    console.log("After normalization, update object:", JSON.stringify(u));
    next();
  } catch (error) {
    console.error("Error in pre-update hook:", error);
    next(error);
  }
});

labSchema.index({ labName: 1 });
labSchema.index({ "availableCities.cityName": 1 });
labSchema.index({ "availableCities.cityName": 1, "availableCities.state": 1 });

module.exports = mongoose.model("Lab", labSchema);
