const mongoose = require("mongoose");
const User = require("../common/user.model");

const CorporateSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    logo: { type: String },
    gstNumber: { type: String },
    addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Address" }], // Reference to Address schema
    department: { type: String, required: true },
    designation: { type: String, required: true },
    assignedDoctors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
      },
    ],
    // plans: [CorporatePlanSchema],
  }
  // { timestamps: true }
);

const Corporate = User.discriminator("Corporate", CorporateSchema);
module.exports = Corporate;
