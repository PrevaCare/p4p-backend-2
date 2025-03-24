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
  zipCode: { type: String, required: true },
});
const OnlineConsultationAddressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
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
    enum: [
      "General Medicine",
      "Cardiology",
      "Endocrinology",
      "Dermatology",
      "Immunology",
      "Neurology",
      "Orthopedics",
      "Pediatrics",
      "Gynecology",
      "Urology",
      "Gastroenterology",
      "Pulmonology",
      "Psychiatry",
      "Rheumatology",
      "Oncology",
      "Nephrology",
      "Hematology",
      "Infectious Diseases",
      "ENT",
      "Allergy and Immunology",
      "Sexual Health Expert",
      "Obstetrics",
      "Vascular Surgery",
      "General Surgery",
      "Cosmetologist / Cosmetic Surgeon",
      "Plastic Surgeon",
      "Surgery with Specialisation",
      "Ayurvedic Health & Wellness",
      "Fitness Expert",
      "Clinical Nutrition",
      "Naturopathy",
      "Nutrition",
      "Dentists",
      "Physiotherapist",
      "Psychologists",
      "General Physician",
      "Sergeon",
      "Psychologist",
      "Cardiologist",
      "Psychiatrist",
      "Nutritionist",
      "Endocrinologist",
      "Fitness Expert",
    ],
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
