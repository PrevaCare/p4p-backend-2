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
  diagnosedIn: Joi.string().optional().allow(null, ""),
  onMedication: Joi.string()
    .valid("Yes", "No", "Diet controlled")
    .default("No"),
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
  isActive: Joi.boolean().default(true).optional(),
  referringDoctorName: Joi.string().optional().allow(null, ""),
  anyAdverseReactions: Joi.string().optional().allow(null, ""),
});

// Joi schema for surgical history medication
const surgicalMedicationSchema = Joi.object({
  medicationName: Joi.string().allow(null, ""),
  dosage: Joi.string().allow(null, ""),
  duration: Joi.string().allow(null, ""),
  adverseEffects: Joi.string().allow(null, ""),
  isContinued: Joi.boolean().default(true),
  discontinuedDays: Joi.string().allow(null, ""),
});

// Joi schema for surgical history blood transfusion
const bloodTransfusionSchema = Joi.object({
  required: Joi.boolean().default(false),
  units: Joi.number().allow(null),
  details: Joi.string().allow(null, "").default(""),
  patientBloodGroup: Joi.string()
    .valid("A+", "B+", "AB+", "O+", "A-", "B-", "AB-", "O-", "not known", "")
    .allow(null, "")
    .default(""),
  transfusedBloodGroup: Joi.string()
    .valid("A+", "B+", "AB+", "O+", "A-", "B-", "AB-", "O-", "not known", "")
    .allow(null, "")
    .default(""),
});

// Joi schema for surgical history surgeon
const surgeonSchema = Joi.object({
  name: Joi.string().allow(null, ""),
  specialization: Joi.string().allow(null, ""),
  contact: Joi.string().allow(null, ""),
});

// Joi schema for surgical history hospital
const hospitalSchema = Joi.object({
  name: Joi.string().allow(null, ""),
  location: Joi.string().allow(null, ""),
});

// Joi schema for insurance details
const insuranceSchema = Joi.object({
  covered: Joi.boolean().default(false),
  providerName: Joi.string().allow(null, ""),
  claimFiled: Joi.boolean().default(false),
  claimAmount: Joi.string().allow(null, ""),
  policyNumber: Joi.string().allow(null, ""),
});

// Joi schema for surgical history
const surgicalHistorySchema = Joi.object({
  surgeryName: Joi.string().allow(null, ""),
  indication: Joi.string().allow(null, ""),
  year: Joi.number().allow(null),
  procedureType: Joi.string().allow(null, ""),
  recoveryTime: Joi.string().allow(null, ""),
  complications: Joi.string().allow(null, ""),
  onMedication: Joi.string()
    .valid("Yes", "No", "Diet controlled")
    .default("No"),
  medications: Joi.array().items(surgicalMedicationSchema).optional(),
  bloodTransfusion: bloodTransfusionSchema.allow(null),
  surgeon: surgeonSchema.allow(null),
  hospital: hospitalSchema.allow(null),
  insurance: insuranceSchema.allow(null),
  notes: Joi.string().allow(null, ""),
  isActive: Joi.boolean().default(true),
});

// Joi schema for parent medication
const parentMedicationSchema = Joi.object({
  medicationName: Joi.string().allow(null, ""),
  duration: Joi.string().allow(null, ""),
  frequency: Joi.string().allow(null, ""),
  adverseEffects: Joi.string().allow(null, ""),
});

// Joi schema for parent surgical history medication
const parentSurgicalMedicationSchema = Joi.object({
  medicationName: Joi.string().allow(null, ""),
  duration: Joi.string().allow(null, ""),
  frequency: Joi.string().allow(null, ""),
});

// Joi schema for parent surgical history
const parentSurgicalHistorySchema = Joi.object({
  procedureName: Joi.string().allow(null, ""),
  indication: Joi.string().allow(null, ""),
  doctorName: Joi.string().allow(null, ""),
  hospital: Joi.string().allow(null, ""),
  year: Joi.number().allow(null),
  insuranceCovered: Joi.boolean().default(false),
  insuranceProvider: Joi.string().allow(null, ""),
  claimFiled: Joi.boolean().default(false),
  claimAmount: Joi.string().allow(null, ""),
  policyNumber: Joi.string().allow(null, ""),
  onMedication: Joi.string()
    .valid("Yes", "No", "Diet controlled")
    .default("No"),
  medications: Joi.array().items(parentSurgicalMedicationSchema).optional(),
});

// Joi schema for family history
const familyHistorySchema = Joi.object({
  father: Joi.object({
    isAlive: Joi.boolean().default(true),
    condition: Joi.string().allow(null, ""),
    diagnosisTimeframe: Joi.string().allow(null, ""),
    onMedication: Joi.string()
      .valid("Yes", "No", "Diet controlled")
      .default("No"),
    medications: Joi.array().items(parentMedicationSchema).optional(),
    surgicalHistory: Joi.array().items(parentSurgicalHistorySchema).optional(),
    reasonOfDeath: Joi.string().allow(null, ""),
    yearOfDeath: Joi.number().allow(null),
  }).allow(null),
  mother: Joi.object({
    isAlive: Joi.boolean().default(true),
    condition: Joi.string().allow(null, ""),
    diagnosisTimeframe: Joi.string().allow(null, ""),
    onMedication: Joi.string()
      .valid("Yes", "No", "Diet controlled")
      .default("No"),
    medications: Joi.array().items(parentMedicationSchema).optional(),
    surgicalHistory: Joi.array().items(parentSurgicalHistorySchema).optional(),
    reasonOfDeath: Joi.string().allow(null, ""),
    yearOfDeath: Joi.number().allow(null),
  }).allow(null),
  familyConditions: Joi.object({
    suddenCardiacDeath: Joi.boolean().default(false),
    diabetes: Joi.boolean().default(false),
    hypertension: Joi.boolean().default(false),
    alzheimers: Joi.boolean().default(false),
    parkinsonsDisease: Joi.boolean().default(false),
    liverCirrhosis: Joi.boolean().default(false),
    cancer: Joi.boolean().default(false),
    notes: Joi.string().allow(null, ""),
  }).allow(null),
}).allow(null);

// Joi schema for allergy drug
const allergyDrugSchema = Joi.object({
  drugName: Joi.string().allow(null, ""),
  isContinued: Joi.boolean().default(true),
  frequency: Joi.string().allow(null, ""),
  duration: Joi.string().allow(null, ""),
  fetchedFromEMR: Joi.boolean().default(true),
});

// Joi schema for past allergy prescription
const pastAllergyPrescriptionSchema = Joi.object({
  allergyName: Joi.string().allow(null, ""),
  symptoms: Joi.array().items(Joi.string().allow(null, "")).optional(),
  diagnosedBy: Joi.string().allow(null, ""),
  triggers: Joi.array().items(Joi.string().allow(null, "")).optional(),
  pastAllergyNotes: Joi.string().allow(null, ""),
  pastAllergyPrescriptionBy: Joi.string()
    .valid("Doctor", "Patient")
    .default("Doctor"),
  drugs: Joi.array().items(allergyDrugSchema).optional(),
});

// Joi schema for new allergy prescription
const newAllergyPrescriptionSchema = Joi.object({
  allergyName: Joi.string().allow(null, ""),
  symptoms: Joi.array().items(Joi.string().allow(null, "")).optional(),
  diagnosedBy: Joi.string().allow(null, ""),
  triggers: Joi.array().items(Joi.string().allow(null, "")).optional(),
  pastAllergyNotes: Joi.string().allow(null, ""),
  pastAllergyPrescriptionBy: Joi.string()
    .valid("Doctor", "Patient")
    .default("Doctor"),
  drugs: Joi.array().items(allergyDrugSchema).optional(),
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
  surgicalHistory: Joi.array().items(surgicalHistorySchema).optional(),
  familyHistory: familyHistorySchema.allow(null),
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
