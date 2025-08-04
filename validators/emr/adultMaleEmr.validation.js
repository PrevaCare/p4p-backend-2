const Joi = require("joi");

// Joi schema for Address
const AddressSchema = Joi.object({
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  pincode: Joi.string().required(),
});

// Joi schema for General Physical Examination
const GeneralPhysicalExaminationSchema = Joi.object({
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
const SystemicExaminationSchema = Joi.object({
  respiratorySystem: Joi.string(),
  CVS: Joi.string(),
  CNS: Joi.string(),
  PA: Joi.string(),
  otherSystemicFindings: Joi.string(),
});

// Joi schema for Treatment
const TreatmentSchema = Joi.object({
  drugName: Joi.string().required(),
  frequency: Joi.string().required(),
  takingSince: Joi.date(),
});

// Joi schema for History
const HistorySchema = Joi.object({
  chiefComplaint: Joi.string(),
  historyOfPresentingIllness: Joi.string(),
  pastHistory: Joi.string(),
  complaints: Joi.array().items(
    Joi.object({
      chiefComplaint: Joi.string(),
      historyOfPresentingIllness: Joi.string(),
    })
  ),
  previousSurgeries: Joi.string(),
  habits: Joi.object({
    smoking: Joi.boolean().default(false),
    packYears: Joi.number(),
    alcohol: Joi.boolean().default(false),
    alcoholDetails: Joi.string(),
    substanceAbuse: Joi.string(),
  }),
  bowelAndBladder: Joi.string(),
  appetite: Joi.string(),
  sleep: Joi.number(),
  depressionScreening: Joi.string(),
  mentalHealthAssessment: Joi.string(),
});

// Joi schema for Adult Male EMR
const AdultMaleEMRCreateSchema = Joi.object({
  user: Joi.string().required(), // Assuming user ID is a string
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
    address: AddressSchema.required(),
  }),
  history: HistorySchema,
  generalPhysicalExamination: GeneralPhysicalExaminationSchema,
  systemicExamination: SystemicExaminationSchema,
  currentTreatment: Joi.array().items(TreatmentSchema),
  provisionalDiagnosis: Joi.string(),
  investigations: Joi.string(),
  advice: Joi.string(),
  referrals: Joi.string(),
  followUpSchedule: Joi.string(),
});

module.exports = {
  AdultMaleEMRCreateSchema,
};
