const mongoose = require("mongoose");
const User = require("../common/user.model");

const ExperienceSchema = new mongoose.Schema({
  organization: { type: String, required: true },
  designation: { type: String, required: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date },
  currentlyWorking: { type: Boolean, default: false },
});

const EducationSchema = new mongoose.Schema({
  university: {
    type: String,
    // required: true,
  },
  degree: {
    type: String,
    // required: true,
  },
  course: {
    type: String,
    // required: true,
  },
  startAt: {
    type: Date,
    required: true,
  },
  endAt: {
    type: Date,
    // required: true,
  },
});

const AddressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String },
});
const OnlineConsultationAddressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String },
});

const DoctorSchema = new mongoose.Schema({
  profileImg: { type: String, required: true },
  bio: { type: String, trim: true, default: null },
  eSign: { type: String },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: {
    type: String,
    enum: ["M", "F", "O"],
    required: true,
  },
  noOfYearExperience: {
    type: Number,
    default: 0,
  },
  address: AddressSchema,

  previousWorkExperience: [ExperienceSchema],
  education: [EducationSchema],
  specialization: {
    type: String,
    required: true,
  },
  consultationFees: {
    type: Number,
  },
  availableDays: {
    type: [String],
    enum: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  },
  medicalRegistrationNumber: {
    type: String,
    unique: true,
    // required: true,
  },
  medicalRegistrationProof: {
    type: String,
  },
  medicalDegreeProof: {
    type: String,
  },
  consultationInterestedIn: {
    type: String,
    enum: ["offline", "online", "both"],
    default: "both",
  },
  offlineConsultationAddress: [OnlineConsultationAddressSchema],
});

const Doctor = User.discriminator("Doctor", DoctorSchema);
module.exports = Doctor;
