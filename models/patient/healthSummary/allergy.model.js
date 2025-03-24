const mongoose = require("mongoose");

const allergySchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required !"],
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    emrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EMR",
    },
    allergyName: String,
    pastAllergyDrugName: {
      type: [String],
      default: [],
    },
    pastAllergyFreequency: {
      type: [String],
      default: [],
    },
    advisedBy: { type: String },
    advise: { type: String },
    adviseAllergyDrugName: {
      type: [String],
      default: [],
    },
    adviseAllergyFreequency: {
      type: [String],
      default: [],
    },
    allergyFileUrl: { type: String },
  },
  { timestamp: true }
);

module.exports = mongoose.model("Allergy", allergySchema);
