const mongoose = require("mongoose");

const booleanFeatureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: true,
      required: [true, "Feature name is required!"],
    },
    status: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BooleanFeature", booleanFeatureSchema);
