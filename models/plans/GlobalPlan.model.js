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
        featureId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "BooleanFeature",
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
        featureId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CountFeature",
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
