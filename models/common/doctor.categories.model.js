const mongoose = require("mongoose");

const doctorCategoriesSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
    },
    image: {
      type: String,
      // required: [true, "Category image is required"],
      default: "",
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
doctorCategoriesSchema.index({ name: 1 });

const DoctorCategory = mongoose.model("DoctorCategory", doctorCategoriesSchema);

module.exports = DoctorCategory;
