const { boolean } = require("joi");
const mongoose = require("mongoose");

// Schema for Address
const AddressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
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
  temperatureVal: { type: Number },
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
  doctorNotes: { type: String },
  showInEPrescription: {
    type: Boolean,
    default: true,
  },
});

// Schema for Systemic Examination
const SystemicExaminationSchema = new mongoose.Schema({
  respiratorySystem: { type: String },
  CVS: { type: String },
  CNS: { type: String },
  PA: { type: String },
  otherSystemicFindings: { type: String },
});

// Schema for Surgical History
const SurgicalHistorySchema = new mongoose.Schema({
  surgeryName: { type: String },
  indication: { type: String },
  year: { type: Number },
  procedureType: { type: String },
  recoveryTime: { type: String },
  complications: { type: String },
  onMedication: {
    type: String,
    enum: ["Yes", "No", "Diet controlled"],
    default: "No",
  },
  medications: [
    {
      medicationName: { type: String },
      dosage: { type: String },
      duration: { type: String },
      adverseEffects: { type: String },
      isContinued: { type: Boolean, default: true },
      discontinuedDays: { type: String },
    },
  ],
  bloodTransfusion: {
    required: { type: Boolean, default: false },
    units: { type: Number },
    details: { type: String, default: "" },
    patientBloodGroup: {
      type: String,
      enum: ["A+", "B+", "AB+", "O+", "A-", "B-", "AB-", "O-", "not known", ""],
      default: "",
    },
    transfusedBloodGroup: {
      type: String,
      enum: ["A+", "B+", "AB+", "O+", "A-", "B-", "AB-", "O-", "not known", ""],
      default: "",
    },
  },
  surgeon: {
    name: { type: String },
    specialization: { type: String },
    contact: { type: String },
  },
  hospital: {
    name: { type: String },
    location: { type: String },
  },
  insurance: {
    covered: { type: Boolean, default: false },
    providerName: { type: String },
    claimFiled: { type: Boolean, default: false },
    claimAmount: { type: String },
    policyNumber: { type: String },
  },
  notes: { type: String },
  isActive: { type: Boolean, default: true },
});

// Schema for Family History
const FamilyHistorySchema = new mongoose.Schema({
  father: {
    isAlive: { type: Boolean, default: true },
    condition: { type: String },
    diagnosisTimeframe: { type: String },
    onMedication: {
      type: String,
      enum: ["Yes", "No", "Diet controlled"],
      default: "No",
    },
    medications: [
      {
        medicationName: { type: String },
        duration: { type: String },
        frequency: { type: String },
        adverseEffects: { type: String },
      },
    ],
    surgicalHistory: [
      {
        procedureName: { type: String },
        indication: { type: String },
        doctorName: { type: String },
        hospital: { type: String },
        year: { type: Number },
        insuranceCovered: { type: Boolean, default: false },
        insuranceProvider: { type: String },
        claimFiled: { type: Boolean, default: false },
        claimAmount: { type: String },
        policyNumber: { type: String },
        onMedication: {
          type: String,
          enum: ["Yes", "No", "Diet controlled"],
          default: "No",
        },
        medications: [
          {
            medicationName: { type: String },
            duration: { type: String },
            frequency: { type: String },
          },
        ],
      },
    ],
    reasonOfDeath: { type: String },
    yearOfDeath: { type: Number },
  },
  mother: {
    isAlive: { type: Boolean, default: true },
    condition: { type: String },
    diagnosisTimeframe: { type: String },
    onMedication: {
      type: String,
      enum: ["Yes", "No", "Diet controlled"],
      default: "No",
    },
    medications: [
      {
        medicationName: { type: String },
        duration: { type: String },
        frequency: { type: String },
        adverseEffects: { type: String },
      },
    ],
    surgicalHistory: [
      {
        procedureName: { type: String },
        indication: { type: String },
        doctorName: { type: String },
        hospital: { type: String },
        year: { type: Number },
        insuranceCovered: { type: Boolean, default: false },
        insuranceProvider: { type: String },
        claimFiled: { type: Boolean, default: false },
        claimAmount: { type: String },
        policyNumber: { type: String },
        onMedication: {
          type: String,
          enum: ["Yes", "No", "Diet controlled"],
          default: "No",
        },
        medications: [
          {
            medicationName: { type: String },
            duration: { type: String },
            frequency: { type: String },
          },
        ],
      },
    ],
    reasonOfDeath: { type: String },
    yearOfDeath: { type: Number },
  },
  familyConditions: {
    suddenCardiacDeath: { type: Boolean, default: false },
    diabetes: { type: Boolean, default: false },
    hypertension: { type: Boolean, default: false },
    alzheimers: { type: Boolean, default: false },
    parkinsonsDisease: { type: Boolean, default: false },
    liverCirrhosis: { type: Boolean, default: false },
    cancer: { type: Boolean, default: false },
    notes: { type: String },
  },
});

// Schema for History
const HistorySchema = new mongoose.Schema({
  chiefComplaint: { type: String },
  historyOfPresentingIllness: { type: String },
  complaints: {
    type: Array,
    default: [],
  },
  pastHistory: [
    {
      sufferingFrom: { type: String },
      diagnosedIn: { type: String },
      onMedication: {
        type: String,
        enum: ["Yes", "No", "Diet controlled"],
        default: "No",
      },
      drugName: [String],
      frequency: [String],
      fetchedFromEMR: { type: Boolean, default: true },
      prescribedBy: { type: String, default: "Doctor" },
      isActive: [Boolean],
      referringDoctorName: { type: String },
      pastHistoryNotes: { type: String },
      anyAdverseReactions: { type: String },
    },
  ],
  surgicalHistory: [SurgicalHistorySchema],
  familyHistory: FamilyHistorySchema,
  allergies: {
    // isAllergy: false,
    pastAllergyPrescription: [
      {
        allergyName: String,
        symptoms: [String],
        diagnosedBy: String,
        triggers: [String],
        pastAllergyNotes: String,
        pastAllergyPrescriptionBy: {
          type: String,
          enum: ["Doctor", "Patient"],
          required: true,
          default: "Doctor",
        },
        drugs: [
          {
            drugName: String,
            isContinued: { type: Boolean, default: true },
            frequency: String,
            duration: String,
            fetchedFromEMR: { type: Boolean, default: true },
          },
        ],
      },
    ],
    newAllergyPrescription: [
      {
        allergyName: String,
        symptoms: [String],
        diagnosedBy: String,
        triggers: [String],
        pastAllergyNotes: String,
        pastAllergyPrescriptionBy: {
          type: String,
          enum: ["Doctor", "Patient"],
          required: true,
          default: "Doctor",
        },
        drugs: [
          {
            drugName: String,
            isContinued: { type: Boolean, default: true },
            frequency: String,
            duration: String,
            fetchedFromEMR: { type: Boolean, default: true },
          },
        ],
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
    link: { type: String },
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
    diagnosis: {
      type: [diagnosisSchema],
      // required: true,
    },
    advice: { type: String },
    referrals: { type: String },
    followUpSchedule: { type: String },
    doctorNotes: { type: String },
    consultationMode: { type: String, enum: ["on site", "online", "home"] },
    emrPdfFileUrl: { type: String },
  },
  { timestamps: true }
);

const EMR = mongoose.model("EMR", EMRSchema);

module.exports = EMR;
