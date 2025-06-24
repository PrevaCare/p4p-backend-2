const mongoose = require("mongoose");

const planCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
    },
    image: {
      type: String,
      default: "",
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

planCategorySchema.index({ name: 1 });
planCategorySchema.index({ displayOrder: 1 });

const PlanCategory = mongoose.model("PlanCategory", planCategorySchema);

module.exports = PlanCategory; 