const mongoose = require("mongoose");
const User = require("../../common/user.model");

const AddressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
});
// const CurrentReport = new mongoose.Schema({
//   report: { type: String, required: true },
//   dischargeSummary: { type: String },
//   prescription: { type: String },
// });
// const PregnancyData = new mongoose.Schema({
//   isFirstPregnancy: { type: Boolean, default: true },
//   noOfTimePregnant: { type: Number },
//   noOfLivingChild: { type: Number },
//   noOfAbortion: { type: Number },
//   monthOfGestation: { type: Number },
//   prescription: { type: String },
//   lastMestrualPeriod: { type: Date },
//   ultrasoundScan: { type: String },
//   trimesterScreening: { type: String },
//   otherReport: { type: String },
//   currentMedicines: { type: String },
//   bloodGroup: {
//     type: String,
//     enum: ["A+", "B+", "AB+", "O+", "A-", "B-", "AB-", "O-"],
//   },
//   partnerBloodGroup: {
//     type: String,
//     enum: ["A+", "B+", "AB+", "O+", "A-", "B-", "AB-", "O-"],
//   },
//   listOfComplications: { type: String },
// });

const EmployeeSchema = new mongoose.Schema({
  profileImg: {
    type: String,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ["M", "F", "O"],
    required: true,
  },
  corporate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Corporate",
    required: [true, "corporate required"],
  },
  address: AddressSchema,
  isMarried: {
    type: Boolean,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  weight: {
    type: Number,
    // required: true,
  },
  jobProfile: {
    type: String,
    // required: true,
  },
  department: {
    type: String,
    enum: [
      "STAFF",
      "HR",
      "FIN",
      "IT",
      "MKT",
      "SLS",
      "OPS",
      "CS",
      "R&D",
      "ADM",
      "QA",
      "PR",
      "BD",
      "T&D",
    ],
    required: true,
  },
  // activityLevel: {
  //   type: String,
  //   // required: true,
  // },
  // isSmoke: {
  //   type: Boolean,
  //   default: false,
  // },
  // isDrink: {
  //   type: Boolean,
  //   default: false,
  // },
  // sleepHours: {
  //   type: Number,
  //   required: true,
  // },
  // cronicDiseases: {
  //   type: String,
  //   // required: true,
  // },
  // currentMedication: {
  //   type: String,
  //   // required: true,
  // },
  // allergicSubstance: {
  //   type: String,
  //   // required: true,
  // },
  // currentReport: [String],
  // pregnancyData: PregnancyData,
  assignedDoctors: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
  ],
  // plan: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "GlobalPlan",
  //   // required: true
  // },
});

const Employee = User.discriminator("Employee", EmployeeSchema);
module.exports = Employee;
