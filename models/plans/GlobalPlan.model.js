const mongoose = require("mongoose");

const globalCorporatePlanSchema = new mongoose.Schema(
  {
    imageLink: {
      type: String,
      default: "",
      required: [true, "imageLink is required !"],
    },
    name: {
      type: String,
      trim: true,
      unique: true,
      required: [true, "name is required !"],
    },
    category: {
      type: String,
      trim: true,
      required: [true, "category is required !"],
    },
    booleanFeatureList: [
      {
        name: {
          type: String,
          trim: true,
        },
        status: {
          type: Boolean,
          default: false,
        },
      },
    ],
    countFeatureList: [
      {
        name: {
          type: String,
          trim: true,
        },
        count: {
          type: Number,
          default: 0,
        },
      },
    ],
    price: {
      type: Number,
      required: true,
    },
    remarks: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GlobalPlan", globalCorporatePlanSchema);
