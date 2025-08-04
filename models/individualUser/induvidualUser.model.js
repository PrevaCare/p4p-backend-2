const mongoose = require("mongoose");
const User = require("../common/user.model");
//
const AddressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String },
});
const IndividualUserSchema = new mongoose.Schema({
  profileImg: {
    type: String,
  },
  firstName: {
    type: String,
    trim: true,
    required: [true, "firstName is required !"],
  },
  lastName: {
    type: String,
    trim: true,
    required: [true, "lastName is required !"],
  },
  gender: {
    type: String,
    enum: ["M", "F", "O"],
    required: [true, "gender is required !"],
  },
  address: AddressSchema,
  isMarried: {
    type: Boolean,
    // required: true,
  },
  age: {
    type: Number,
    // required: true,
  },
  weight: {
    type: Number,
    // required: true,
  },
  height: {
    type: Number,
    // required: true,
  },
  jobProfile: {
    type: String,
    // required: true,
  },
  assignedDoctors: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
  ],
});

const IndividualUser = User.discriminator(
  "IndividualUser",
  IndividualUserSchema
);
module.exports = IndividualUser;

// email
// phone
// role
// profileImg
// firstName
// lastName
// gender
// address
// isMarried
// age
// weight
// jobProfile
// activityLevel //
// isSmoke
// isDrink
// sleepHours
// allergicSubstance

// const HistorySchema = new mongoose.Schema({
//   chiefComplaint: { type: String },
//   historyOfPresentingIllness: { type: String },
//   pastHistory: [
//     {
//       sufferingFrom: { type: String },
//       drugName: [String],
//       freequency: [String],
//       readings: { type: String },
//       pastHistoryNotes: { type: String },
//     },
//   ],
//   allergies: [
//     {
//       // isAllergy: false,
//       allergyName: String,
//       pastAllergyDrugName: [String],
//       pastAllergyFreequency: [String],
//       advisedBy: { type: String },
//       advise: { type: String },
//       adviseAllergyDrugName: [String],
//       adviseAllergyFreequency: [String],
//     },
//   ],
//   // sufferingFrom: { type: String },
//   // drugName: [{ type: String }],
//   previousSurgeries: { type: String },
//   habits: {
//     smoking: { type: Boolean, default: false },
//     packYears: { type: Number },
//     alcohol: { type: Boolean, default: false },
//     alcoholDetails: { type: String },
//     qntPerWeek: { type: Number },
//     substanceAbuse: { type: String },
//   },
//   bowelAndBladder: { type: String },
//   appetite: { type: String },
//   sleep: { type: Number },
//   stressScreening: {
//     desc: { type: String },
//     recomendation: { type: String },
//     score: { type: Number },
//   },
//   depressionScreening: {
//     desc: { type: String },
//     recomendation: { type: String },
//     score: { type: Number },
//   },
//   mentalHealthAssessment: { type: String },
// });
