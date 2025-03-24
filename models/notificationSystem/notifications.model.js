const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required !"],
    }, // Target user
    //   role: {
    //     type: String,
    //     enum: ["Doctor", "User", "Superadmin"],
    //     required: true,
    //   }, // Role of the recipient
    title: {
      type: String,
      trim: true,
      required: [true, "title is required !"],
    },
    message: { type: String, required: [true] },
    data: { type: Object },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
