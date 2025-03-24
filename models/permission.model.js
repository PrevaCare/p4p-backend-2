const mongoose = require("mongoose");

const PermissionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  actions: {
    type: Map,
    of: [String], // e.g., { "read": ["Doctor", "Corporate"], "create": ["Admin", "Superadmin"] }
  },
  // Add other permission-related fields as needed
});

module.exports = mongoose.model("Permission", PermissionSchema);
