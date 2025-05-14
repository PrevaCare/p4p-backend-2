const Joi = require("joi");

// Joi schema for Address
const addressSchema = Joi.object({
  name: Joi.string().allow(null, "").required(),
  street: Joi.string().allow(null, "").required(),
  city: Joi.string().allow(null, "").required(),
  state: Joi.string().allow(null, "").required(),
  zipCode: Joi.string().allow(null, "").required(),
});

// Joi schema for General Physical Examination
const generalPhysicalExaminationSchema = Joi.object({
  PR: Joi.number().optional().allow(null, ""),
  BP: Joi.object({
    sys: Joi.number().allow(null, ""),
    dia: Joi.number().allow(null, ""),
  }),
  volume: Joi.string().optional().allow(null, ""),
  regularity: Joi.string().optional().allow(null, ""),
  character: Joi.string().optional().allow(null, ""),
  temperature: Joi.string().optional().allow(null, ""),
  RR: Joi.number().optional().allow(null, ""),
  SPO2: Joi.number().optional().allow(null, ""),
  radioFemoralDelay: Joi.string().optional().allow(null, ""),
  height: Joi.number().optional().allow(null, ""),
  weight: Joi.number().optional().allow(null, ""),
  BMI: Joi.number().optional().allow(null, ""),
  pallor: Joi.string().optional().allow(null, ""),
  icterus: Joi.string().optional().allow(null, ""),
  cyanosis: Joi.string().optional().allow(null, ""),
  clubbing: Joi.string().optional().allow(null, ""),
  lymphadenopathy: Joi.string().optional().allow(null, ""),
  edema: Joi.string().optional().allow(null, ""),
  JVP: Joi.string().optional().allow(null, ""),
});

// Joi schema for Systemic Examination
const systemicExaminationSchema = Joi.object({
  respiratorySystem: Joi.string().allow(null, ""),
  CVS: Joi.string().allow(null, ""),
  CNS: Joi.string().allow(null, ""),
  PA: Joi.string().allow(null, ""),
  otherSystemicFindings: Joi.string().allow(null, ""),
});

// Joi schema for past history items
const pastHistoryItemSchema = Joi.object({
  sufferingFrom: Joi.string().optional().allow(null, ""),
  drugName: Joi.array()
    .items(Joi.string().optional().allow(null, ""))
    .optional(),
  frequency: Joi.array()
    .items(Joi.string().optional().allow(null, ""))
    .optional(),
  readings: Joi.string().optional().allow(null, ""),
  pastHistoryNotes: Joi.string().optional().allow(null, ""),
  fetchedFromEMR: Joi.boolean().default(false),
  prescribedBy: Joi.string().valid("Doctor", "Patient").default("Doctor"),
});

// Joi schema for past allergy prescription
const pastAllergyPrescriptionSchema = Joi.object({
  allergyName: Joi.string().allow(null, ""),
  pastAllergyDrugName: Joi.string().allow(null, ""),
  pastAllergyFrequency: Joi.string().allow(null, ""),
  pastAllergyDuration: Joi.string().allow(null, ""),
  pastAllergyNotes: Joi.string().allow(null, ""),
  fetchedFromEMR: Joi.boolean().default(false),
  pastAllergyPrescriptionBy: Joi.string()
    .valid("Doctor", "Patient")
    .default("Doctor"),
});

// Joi schema for new allergy prescription
const newAllergyPrescriptionSchema = Joi.object({
  allergyName: Joi.string().allow(null, ""),
  allergyDrugName: Joi.string().allow(null, ""),
  allergyFrequency: Joi.string().allow(null, ""),
  allergyDuration: Joi.string().allow(null, ""),
  allergyNotes: Joi.string().allow(null, ""),
  allergyPrescriptionBy: Joi.string()
    .valid("Doctor", "Patient")
    .default("Doctor"),
});

// Joi schema for allergies
const allergiesSchema = Joi.object({
  pastAllergyPrescription: Joi.array()
    .items(pastAllergyPrescriptionSchema)
    .optional(),
  newAllergyPrescription: Joi.array()
    .items(newAllergyPrescriptionSchema)
    .optional(),
});

// Joi schema for History
const historySchema = Joi.object({
  chiefComplaint: Joi.string().allow(null, ""),
  historyOfPresentingIllness: Joi.string().allow(null, ""),
  pastHistory: Joi.array().items(pastHistoryItemSchema).optional(),
  allergies: allergiesSchema.allow(null),
  previousSurgeries: Joi.string().allow(null, ""),
  habits: Joi.object({
    smoking: Joi.boolean().default(false),
    packYears: Joi.number().allow(null, ""),
    alcohol: Joi.boolean().default(false),
    alcoholDetails: Joi.string().allow(null, ""),
    qntPerWeek: Joi.number().allow(null, ""),
    substanceAbuse: Joi.string().allow(null, ""),
  }),
  bowelAndBladder: Joi.string().allow(null, ""),
  appetite: Joi.string().allow(null, ""),
  sleep: Joi.number().allow(null, ""),
  stressScreening: Joi.object({
    desc: Joi.string().optional().allow(null, ""),
    recomendation: Joi.string().optional().allow(null, ""),
    score: Joi.number().optional().allow(null, ""),
  }),
  depressionScreening: Joi.object({
    desc: Joi.string().optional().allow(null, ""),
    recomendation: Joi.string().optional().allow(null, ""),
    score: Joi.number().allow(null, ""),
  }),
  mentalHealthAssessment: Joi.string().allow(null, ""),
});

// Joi schema for immunization dose dates
const doseDateSchema = Joi.object({
  date: Joi.date().allow(null),
  status: Joi.string().valid("due", "completed"),
});

// Joi schema for immunization
const immunizationSchema = Joi.object({
  immunizationType: Joi.string().valid("up to date", "adding", "recommended"),
  vaccinationName: Joi.string().trim().allow(null, ""),
  totalDose: Joi.number().default(1),
  doseDates: Joi.array().items(doseDateSchema),
  doctorName: Joi.string().trim().allow(null, ""),
  sideEffects: Joi.string().trim().allow(null, ""),
  immunizationNotes: Joi.string().trim().allow(null, ""),
});

// Joi schema for prescription
const prescriptionSchema = Joi.object({
  investigations: Joi.string().optional().allow(null, ""),
  drugName: Joi.string().optional().allow(null, ""),
  frequency: Joi.string().optional().allow(null, ""),
  duration: Joi.string().optional().allow(null, ""),
  quantity: Joi.string().optional().allow(null, ""),
  advice: Joi.string().optional().allow(null, ""),
  routeOfAdministration: Joi.string().optional().allow(null, ""),
  howToTake: Joi.string().optional().allow(null, ""),
});

// Joi schema for diagnosis
const diagnosisSchema = Joi.object({
  dateOfDiagnosis: Joi.string().optional().allow(null, ""),
  diagnosisName: Joi.string().optional().allow(null, ""),
  prescription: Joi.array().items(prescriptionSchema).optional().allow(null),
});

// Base schema for EMR
const EMRValidationSchema = Joi.object({
  user: Joi.any().required().allow(null),
  basicInfo: Joi.object({
    name: Joi.string().required().allow(null, ""),
    phoneNumber: Joi.string().required().allow(null, ""),
    age: Joi.number().allow(null, ""),
    children: Joi.number().allow(null, ""),
    maritalStatus: Joi.boolean().allow(null),
    gender: Joi.string().valid("M", "F").required().allow(null),
    bloodGroup: Joi.string()
      .valid("A+", "B+", "AB+", "O+", "A-", "B-", "AB-", "O-", "not known")
      .allow(null),
    address: addressSchema.allow(null),
  }),
  history: historySchema.allow(null),
  immunization: Joi.array().items(immunizationSchema).optional().allow(null),
  generalPhysicalExamination: generalPhysicalExaminationSchema.allow(null),
  systemicExamination: systemicExaminationSchema.allow(null),
  diagnosis: Joi.array().items(diagnosisSchema).optional().allow(null),
  advice: Joi.string().allow(null, "").optional(),
  referrals: Joi.string().allow(null, "").optional(),
  followUpSchedule: Joi.string().allow(null, "").optional(),
  doctorNotes: Joi.string().allow(null, ""),
  doctor: Joi.any().required().allow(null),
  consultationMode: Joi.string()
    .valid("on site", "online")
    .optional()
    .allow(null, ""),
  emrPdfFileUrl: Joi.string().optional().allow(null, ""),
}).unknown(true);

module.exports = { EMRValidationSchema };
