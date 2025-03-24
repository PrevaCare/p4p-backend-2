const mongoose = require("mongoose");
const User = require("../../common/user.model");

const CurrentReport = new mongoose.Schema({
  reportUrl: { type: String, required: true },
  dischargeSummary: { type: String },
  prescription: { type: String },
});

const InstituteStudentSchema = new mongoose.Schema({
  profileImg: {
    type: String,
  },
  institute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Institute",
  },
  courseTaken: {
    type: String,
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
  currentReport: [CurrentReport],
  emr: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "emrRef",
  },
  emrRef: {
    type: String,
    enum: ["AdultMaleEMR", "AdultFemaleEMR"],
  },
});

InstituteStudentSchema.pre("save", function (next) {
  if (this.gender === "M") {
    this.emrRef = "AdultMaleEMR";
  } else if (this.gender === "F") {
    this.emrRef = "AdultFemaleEMR";
  } else {
    this.emrRef = null;
  }
  next();
});

const InstituteStudent = User.discriminator(
  "InstituteStudent",
  InstituteStudentSchema
);
module.exports = InstituteStudent;
