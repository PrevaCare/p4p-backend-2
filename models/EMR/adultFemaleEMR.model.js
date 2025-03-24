const mongoose = require("mongoose");
const EMR = require("../common/emr.model");

// const AddressSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   street: { type: String, required: true },
//   city: { type: String, required: true },
//   state: { type: String, required: true },
//   zipCode: { type: String, required: true },
// });
// Schema for Gynaecological History
const GynaecologicalHistorySchema = new mongoose.Schema({
  ageOfMenarche: { type: Number },
  cycleDuration: { type: Number },
  cycleRegularity: { type: String, enum: ["regular", "irregular"] },
  daysOfBleeding: { type: Number },
  padsUsedPerDay: { type: Number },
  passageOfClots: { type: String },
  complaints: { type: String },
  previousHistory: { type: String },
  obstetricHistory: {
    // score: { type: String, enum: ["G", "P", "L", "A"] },
    gScore: {
      type: Number,
    },
    pScore: {
      type: Number,
    },
    lScore: {
      type: Number,
    },
    aScore: {
      type: Number,
    },
    partnerBloodGroup: {
      type: String,
      // enum: ["A+", "B+", "AB+", "O+", "A-", "B-", "AB-", "O-", "not known"],
    },
    conceptions: [
      {
        ageAtConception: { type: Number },
        modeOfConception: { type: String },
        modeOfDelivery: { type: String },
        complications: { type: String },
      },
    ],
    isPregnant: { type: Boolean, default: false },
    primigravidaWeeks: { type: Number },
    EDD: { type: Date },
    symptoms: { type: String },
    examination: { type: String },
    USGScans: { type: String, enum: ["due", "uptodate"], default: "due" },
    TDDoseTaken: { type: String },
    prenatalScreeningReports: { type: String },
    prenatalVitamins: { type: Boolean, default: false },
    freshComplaint: { type: String },
    nutritionalHistory: { type: String },
    treatingGynaecologistName: { type: String },
    gynaecologistAddress: { type: String },
    // modeOfDelivery: { type: String },
  },
});

const AdultFemaleEMRSchema = new mongoose.Schema({
  gynaecologicalHistory: GynaecologicalHistorySchema,
});

// const AdultFemaleEMR = mongoose.model("AdultFemaleEMR", AdultFemaleEMRSchema)
const AdultFemaleEMR = EMR.discriminator("F", AdultFemaleEMRSchema);
module.exports = AdultFemaleEMR;
