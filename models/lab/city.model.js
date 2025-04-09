const mongoose = require("mongoose");

const citySchema = new mongoose.Schema(
  {
    cityName: {
      type: String,
      required: [true, "City name is required"],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
      unique: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to normalize city name and pincode
citySchema.pre("save", function (next) {
  if (this.cityName) {
    this.cityName = this.cityName.toLowerCase().trim();
  }
  if (this.pincode) {
    this.pincode = this.pincode.trim();
  }
  next();
});

// Pre-update middleware to normalize city name and pincode
citySchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.$set) {
    if (update.$set.cityName) {
      update.$set.cityName = update.$set.cityName.toLowerCase().trim();
    }
    if (update.$set.pincode) {
      update.$set.pincode = update.$set.pincode.trim();
    }
  }
  next();
});

module.exports = mongoose.model("City", citySchema);
