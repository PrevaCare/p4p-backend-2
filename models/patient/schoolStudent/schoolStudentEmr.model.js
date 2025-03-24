const mongoose = require("mongoose");

// Schema for Address
const AddressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
});

// Schema for Parent/Guardian Information
const ParentGuardianInfoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  relationship: { type: String, required: true },
  contactDetails: { type: String, required: true },
});

// Schema for Birth History
const BirthHistorySchema = new mongoose.Schema({
  gestationalAge: { type: Number, required: true },
  birthWeight: { type: Number, required: true },
  deliveryMethod: {
    type: String,
    enum: ["vaginal", "cesarean"],
    required: true,
  },
  complicationsAtBirth: { type: String },
});

// Schema for Developmental History
const DevelopmentalHistorySchema = new mongoose.Schema({
  milestones: { type: String },
  developmentalDelays: { type: String },
});

// Schema for Past Medical History
const PastMedicalHistorySchema = new mongoose.Schema({
  chronicConditions: { type: String },
  hospitalizations: { type: String },
  surgeries: { type: String },
});

// Schema for Immunization History
const ImmunizationHistorySchema = new mongoose.Schema({
  vaccines: { type: String, required: true },
  dates: { type: Date, required: true },
});

// Schema for Anthropometric Measurements
const AnthropometricMeasurementsSchema = new mongoose.Schema({
  heightForAge: { type: Number },
  weightForAge: { type: Number },
  weightForHeight: { type: Number },
  midUpperArmCircumference: { type: Number },
});

// Schema for Body Mass Index (BMI)
const BMISchema = new mongoose.Schema({
  bmiForAge: { type: Number },
});

// Schema for Nutritional Assessment
const NutritionalAssessmentSchema = new mongoose.Schema({
  dietaryHistory: { type: String },
  nutritionalCounseling: { type: String },
  micronutrientDeficiencies: { type: String },
});

// Schema for Physical Examination
const PhysicalExaminationSchema = new mongoose.Schema({
  generalPhysicalExam: { type: String },
  visionScreening: { type: String },
  dentalExamination: { type: String },
  hearingAssessment: { type: String },
});

// Schema for Systems Review
const SystemsReviewSchema = new mongoose.Schema({
  cardiovascularSystem: { type: String },
  respiratorySystem: { type: String },
  abdominalExamination: { type: String },
  neurologicalExamination: { type: String },
  pediatricDepressionScreening: { type: String },
  mentalHealthDisorders: { type: String },
});

// Schema for Assessment and Plan
const AssessmentPlanSchema = new mongoose.Schema({
  diagnosis: { active: String, past: String },
  treatmentPlan: {
    prescribedMedications: {
      type: String,
    },
    dosage: {
      type: String,
    },
    freequency: {
      type: String,
    },
  },
  followUpPlan: {
    followUpVisit: String,
    referralToSpecialists: String,
  },
});

// Schema for School Student EMR
const SchoolStudentEMRSchema = new mongoose.Schema({
  basicInfo: {
    name: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ["M", "F", "O"], required: true },
    address: AddressSchema,
    contactInfo: { type: String, required: true },
    bloodGroup: {
      type: String,
      enum: ["A+", "B+", "AB+", "O+", "A-", "B-", "AB-", "O-"],
      required: true,
    },
    parentGuardianInfo: [ParentGuardianInfoSchema],
  },
  medicalHistory: {
    birthHistory: BirthHistorySchema,
    developmentalHistory: DevelopmentalHistorySchema,
    pastMedicalHistory: PastMedicalHistorySchema,
    immunizationHistory: [ImmunizationHistorySchema],
  },
  anthropometricMeasurements: AnthropometricMeasurementsSchema,
  BMI: BMISchema,
  nutritionalAssessment: NutritionalAssessmentSchema,
  physicalExamination: PhysicalExaminationSchema,
  systemsReview: SystemsReviewSchema,
  assessmentAndPlan: AssessmentPlanSchema,
});

const SchoolStudentEMR = mongoose.model(
  "SchoolStudentEMR",
  SchoolStudentEMRSchema
);

module.exports = SchoolStudentEMR;
