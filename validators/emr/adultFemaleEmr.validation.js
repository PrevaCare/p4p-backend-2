const Joi = require("joi");

// Joi schema for Address
const addressSchema = Joi.object({
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  pincode: Joi.string().required(),
});

// Joi schema for General Physical Examination
const generalPhysicalExaminationSchema = Joi.object({
  PR: Joi.string(),
  BP: Joi.string(),
  volume: Joi.string(),
  regularity: Joi.string(),
  character: Joi.string(),
  temperature: Joi.number(),
  RR: Joi.number(),
  SPO2: Joi.string(),
  radioFemoralDelay: Joi.string(),
  height: Joi.number(),
  weight: Joi.number(),
  BMI: Joi.number(),
  pallor: Joi.string(),
  icterus: Joi.string(),
  cyanosis: Joi.string(),
  clubbing: Joi.string(),
  lymphadenopathy: Joi.string(),
  edema: Joi.string(),
  JVP: Joi.string(),
});

// Joi schema for Systemic Examination
const systemicExaminationSchema = Joi.object({
  respiratorySystem: Joi.string(),
  CVS: Joi.string(),
  CNS: Joi.string(),
  PA: Joi.string(),
  otherSystemicFindings: Joi.string(),
});

// Joi schema for Treatment
const treatmentSchema = Joi.object({
  drugName: Joi.string(),
  frequency: Joi.string(),
  takingSince: Joi.date(),
  // doseUnits: Joi.string(),
  // routeOfAdministration: Joi.string(),
  // howToTake: Joi.string(),
});

// Joi schema for History
const historySchema = Joi.object({
  chiefComplaint: Joi.string(),
  historyOfPresentingIllness: Joi.string(),
  complaints: Joi.array().items(
    Joi.object({
      chiefComplaint: Joi.string(),
      historyOfPresentingIllness: Joi.string(),
    })
  ),
  pastHistory: Joi.string(),
  previousSurgeries: Joi.string(),
  habits: Joi.object({
    smoking: Joi.boolean().default(false),
    packYears: Joi.number(),
    alcohol: Joi.boolean().default(false),
    alcoholDetails: Joi.string().allow(""),
    substanceAbuse: Joi.string(),
  }),
  bowelAndBladder: Joi.string(),
  appetite: Joi.string(),
  sleep: Joi.number(),
  depressionScreening: Joi.string(),
  mentalIllnessHistory: Joi.string(),
});

// Joi schema for Gynaecological History
const gynaecologicalHistorySchema = Joi.object({
  ageOfMenarche: Joi.string().optional().allow(""),
  cycleDuration: Joi.string().optional().allow(""),
  cycleRegularity: Joi.string().valid("regular", "irregular").optional(),
  daysOfBleeding: Joi.number().optional(),
  padsUsedPerDay: Joi.number().optional(),
  passageOfClots: Joi.string().optional(),
  complaints: Joi.string().optional(),
  previousHistory: Joi.string().optional(),
  obstetricHistory: Joi.object({
    // score: Joi.string().valid("G", "P", "L", "A"),
    gScore: Joi.number(),
    pScore: Joi.number(),
    lScore: Joi.number(),
    aScore: Joi.number(),
    partnerBloodGroup: Joi.string().valid(
      "A+",
      "B+",
      "AB+",
      "O+",
      "A-",
      "B-",
      "AB-",
      "O-"
    ),
    conceptions: Joi.array().items(
      Joi.object({
        ageAtConception: Joi.number(),
        modeOfConception: Joi.string(),
        complications: Joi.string(),
      })
    ),
    primigravidaWeeks: Joi.number().optional(),
    EDD: Joi.date().optional(),
    examination: Joi.string().optional(),
    USGScans: Joi.string().optional(),
    TDDoseTaken: Joi.string(),
    prenatalScreeningReports: Joi.string().optional(),
    prenatalVitamins: Joi.boolean().default(false).optional(),
    freshComplaint: Joi.string().optional(),
    nutritionalHistory: Joi.string().optional(),
    treatingGynaecologistName: Joi.string().optional(),
    gynaecologistAddress: addressSchema,
    modeOfDelivery: Joi.string().optional(),
  }),
}).optional();

// Joi schema for Adult Female EMR
const adultFemaleEMRCreateSchema = Joi.object({
  user: Joi.string().required(),
  basicInfo: Joi.object({
    name: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    maritalStatus: Joi.boolean(),
    bloodGroup: Joi.string().valid(
      "A+",
      "B+",
      "AB+",
      "O+",
      "A-",
      "B-",
      "AB-",
      "O-"
    ),
    address: addressSchema,
  }),
  history: historySchema,
  gynaecologicalHistory: gynaecologicalHistorySchema.optional(),
  generalPhysicalExamination: generalPhysicalExaminationSchema,
  systemicExamination: systemicExaminationSchema,
  currentTreatment: Joi.array().items(treatmentSchema),
  provisionalDiagnosis: Joi.string(),
  investigations: Joi.string(),
  advice: Joi.string(),
  referrals: Joi.string(),
  followUpSchedule: Joi.string(),
});

module.exports = adultFemaleEMRCreateSchema;
