const mongoose = require("mongoose");

const BannerSchema = new mongoose.Schema({
  image: {
    type: String, // URL or path to the image file
    required: true,
  },
  displayOrder: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ["lab-test", "doctor-appointment", "tele-consultation", "package"],
    required: true,
  },
  subtype: {
    type: String, // doctor category name, lab test -> package, lab partner, category like longevity
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor", // For lab tests associated with a lab partner
  },
  category: {
    type: String // normal category name like longevity or doctor category name
  },
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lab", // For lab tests associated with a lab partner
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Package", // For linking to a specific package
  },
  haveCTA: {
    type: Boolean,
    default: true, // Whether the banner has a call to action (CTA) or not
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

const Banner = mongoose.model("Banner", BannerSchema);
module.exports = Banner;
