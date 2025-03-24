const mongoose = require("mongoose");

const insuranceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    insuranceName: {
      type: String,
      required: true,
    },
    insuranceFile: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Insurance", insuranceSchema);
