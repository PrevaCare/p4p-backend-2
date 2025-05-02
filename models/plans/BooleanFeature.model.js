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
  },
  { timestamps: true }
);

module.exports = mongoose.model("BooleanFeature", booleanFeatureSchema);
