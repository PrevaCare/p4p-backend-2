const mongoose = require("mongoose");

// Schema for Address
const AddressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
});

// Schema for General Physical Examination
const GeneralPhysicalExaminationSchema = new mongoose.Schema({
  PR: { type: Number },
  BP: {
    sys: Number,
    dia: Number,
  },
  volume: { type: String },
  regularity: { type: String },
  character: { type: String },
  temperature: { type: String },
  RR: { type: Number },
  SPO2: { type: Number },
  radioFemoralDelay: { type: String },
  height: { type: Number },
  weight: { type: Number },
  BMI: { type: Number }, // auto calculate
  pallor: { type: String },
  icterus: { type: String },
  cyanosis: { type: String },
  clubbing: { type: String },
  lymphadenopathy: { type: String },
  edema: { type: String },
  JVP: { type: String },
});

// Schema for Systemic Examination
const SystemicExaminationSchema = new mongoose.Schema({
  respiratorySystem: { type: String },
  CVS: { type: String },
  CNS: { type: String },
  PA: { type: String },
  otherSystemicFindings: { type: String },
});

// Schema for Treatment
// const TreatmentSchema = new mongoose.Schema({
//   drugName: { type: String },
//   frequency: { type: String },
//   takingSince: Date,
// });

// Schema for History
const HistorySchema = new mongoose.Schema({
  chiefComplaint: { type: String },
  historyOfPresentingIllness: { type: String },
  pastHistory: [
    {
      sufferingFrom: { type: String },
      drugName: [String],
      frequency: [String],
      readings: { type: String },
      pastHistoryNotes: { type: String },
      fetchedFromEMR: { type: Boolean, default: false },
      prescribedBy: {
        type: String,
        enum: ["Doctor", "Patient"],
        required: true,
        default: "Doctor",
      },
    },
  ],
  allergies: {
    // isAllergy: false,
    pastAllergyPrescription: [
      {
        allergyName: String,
        pastAllergyDrugName: String,
        pastAllergyFrequency: String,
        pastAllergyDuration: String,
        pastAllergyNotes: String,
        fetchedFromEMR: { type: Boolean, default: false },
        pastAllergyPrescriptionBy: {
          type: String,
          enum: ["Doctor", "Patient"],
          required: true,
          default: "Doctor",
        },
      },
    ],
    newAllergyPrescription: [
      {
        allergyName: String,
        allergyDrugName: String,
        allergyFrequency: String,
        allergyDuration: String,
        allergyNotes: String,
        allergyPrescriptionBy: {
          type: String,
          enum: ["Doctor", "Patient"],
          required: true,
          default: "Doctor",
        },
      },
    ],
  },

  // sufferingFrom: { type: String },
  // drugName: [{ type: String }],
  previousSurgeries: { type: String },
  habits: {
    smoking: { type: Boolean, default: false },
    packYears: { type: Number },
    alcohol: { type: Boolean, default: false },
    alcoholDetails: { type: String },
    qntPerWeek: { type: Number },
    substanceAbuse: { type: String },
  },
  bowelAndBladder: { type: String },
  appetite: { type: String },
  sleep: { type: Number },
  stressScreening: {
    desc: { type: String },
    recomendation: { type: String },
    score: { type: Number },
  },
  depressionScreening: {
    desc: { type: String },
    recomendation: { type: String },
    score: { type: Number },
  },
  mentalHealthAssessment: { type: String },
});

//
// {
//   dateOfDiagnosis: "",
//   diagnosisName: "",
//   prescription: [
//     // {
//     //   investigations: "",
//     //   drugName: "",
//     //   freequency: "",
//     //   duration: "",
//     //   quantity: "",
//     //   advice: "",
//     //   routeOfAdministration: "",
//     //   howToTake: "",
//     // },
//   ],
// },
const prescriptionSchema = new mongoose.Schema({
  investigations: { type: String, trim: true },
  drugName: { type: String, trim: true },
  frequency: { type: String, trim: true },
  duration: { type: String, trim: true },
  quantity: { type: String, trim: true },
  advice: { type: String, trim: true },
  routeOfAdministration: { type: String, trim: true },
  howToTake: { type: String, trim: true },
});
// prescribed treatment
const diagnosisSchema = new mongoose.Schema({
  dateOfDiagnosis: { type: String, trim: true },
  diagnosisName: { type: String, trim: true },
  prescription: [prescriptionSchema],
});

// immunizations
const ImmunizationSchema = new mongoose.Schema({
  immunizationType: {
    type: String,
    enum: ["up to date", "adding", "recommended"],
  },
  vaccinationName: { type: String, trim: true },
  totalDose: { type: Number, default: 1 },
  doseDates: [
    {
      date: { type: Date },
      status: { type: String, enum: ["due", "completed"] },
    },
  ],
  doctorName: { type: String, trim: true },
  sideEffects: { type: String, trim: true },
  immunizationNotes: { type: String, trim: true },
});

// base schema
const EMRSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "doctor is required !"],
    },
    basicInfo: {
      name: { type: String, required: true },
      age: { type: Number },
      children: { type: Number },
      gender: {
        type: String,
        enum: ["M", "F"],
        required: true,
      },
      phoneNumber: { type: String, required: true },
      maritalStatus: { type: Boolean },
      bloodGroup: {
        type: String,
        enum: ["A+", "B+", "AB+", "O+", "A-", "B-", "AB-", "O-", "not known"],
      },
      address: AddressSchema,
    },
    history: HistorySchema,
    immunization: [ImmunizationSchema],
    generalPhysicalExamination: GeneralPhysicalExaminationSchema,
    systemicExamination: SystemicExaminationSchema,
    // currentTreatment: [
    //   {
    //     drugName: { type: String },
    //     // frequency: { type: String },
    //     // takingSince: Date,
    //     deaseaseSufferingFrom: { type: String },
    //     provisinalDiagonosis: { type: String },
    //     dateOfProvisinalDiagonosis: Date,
    //     referalNeeded: { type: Boolean, default: false },
    //     notes: { type: String },
    //   },
    // ],
    // provisionalDiagnosis: { type: String },

    // investigations: [{ type: String }],
    // diagonosis: [
    //   {
    //     dateOfDiagonosis: {
    //       type: Date,
    //       required: true,
    //     },
    //     diagonosisName: {
    //       type: String,
    //       required: true,
    //     },
    //   },
    // ],
    diagnosis: {
      type: [diagnosisSchema],
      // required: true,
    },
    advice: { type: String },
    referrals: { type: String },
    followUpSchedule: { type: String },
    doctorNotes: { type: String },
    consultationMode: { type: String, enum: ["on site", "online"] },
    emrPdfFileUrl: { type: String },
  },
  { timestamps: true }
);

const EMR = mongoose.model("EMR", EMRSchema);

module.exports = EMR;
