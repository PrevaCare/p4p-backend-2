const mongoose = require("mongoose");
const User = require("../common/user.model");

const InstituteSchema = new mongoose.Schema({
  instituteName: {
    type: String,
    required: true,
  },
  logo: { type: String },
  addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Address" }],
  department: { type: String, required: true },
  designation: { type: String, required: true },
});

const Institute = User.discriminator("Institute", InstituteSchema);
module.exports = Institute;
