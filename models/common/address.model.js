const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  street: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  // country: { type: String, required: true },
  zipCode: { type: String, required: true },
  landmark: { type: String },
});

const Address = mongoose.model("Address", AddressSchema);

module.exports = Address;
