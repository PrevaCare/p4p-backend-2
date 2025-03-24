const mongoose = require("mongoose");

const healthTrackerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    steps: {
      type: Number,
      default: 0,
    },
    caloriesBurnt: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const HealthTracker = mongoose.model("HealthTracker", healthTrackerSchema);

module.exports = HealthTracker;
