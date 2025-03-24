const mongoose = require("mongoose");
const User = require("../../common/user.model");
const { required } = require("joi");

const SchoolStudentSchema = new mongoose.Schema({
  profileImg: {
    type: String,
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
  },
  class: {
    type: String,
    enum: [
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
      "XI",
      "XII",
    ],
    required: true,
  },
  section: {
    type: String,
    enum: ["A", "B", "C", "D"],
    required: true,
  },
  gender: {
    type: String,
    enum: ["M", "F", "O"],
    required: true,
  },
  address: AddressSchema,

  age: {
    type: Number,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  activityLevel: {
    type: String,
    // required: true,
  },
  sleepHours: {
    type: Number,
    required: true,
  },
  cronicDiseases: {
    type: String,
    required: true,
  },
  currentMedication: {
    type: String,
    required: true,
  },
  allergicSubstance: {
    type: String,
    required: true,
  },
  emr: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SchoolStudentEMR",
  },
});
const SchoolStudent = User.discriminator("SchoolStudent", SchoolStudentSchema);
module.exports = SchoolStudent;
