const mongoose = require("mongoose");
const User = require("./common/user.model");

const SuperadminSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
});

const Superadmin = User.discriminator("Superadmin", SuperadminSchema);
module.exports = Superadmin;
