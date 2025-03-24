const mongoose = require("mongoose");

const RoleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  name: { type: String, required: true, unique: true },

  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
});

module.exports = mongoose.model("Role", RoleSchema);
