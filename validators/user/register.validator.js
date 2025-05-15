const Joi = require("joi");

const adminRegisterSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  phone: Joi.string().min(10).max(10).required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid("Superadmin").required(),
});
// corporate register schema
// Define the address schema
const addressSchema = Joi.object({
  name: Joi.string().required(),
  street: Joi.string().required(),
  phoneNumber: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  // country: Joi.string().required(),
  zipCode: Joi.string().required(),
  landmark: Joi.string().optional(),
});
const employeeAddressSchema = Joi.object({
  name: Joi.string().required(),
  street: Joi.string().required(),
  // phoneNumber: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  // country: Joi.string().required(),
  zipCode: Joi.string().required(),
  landmark: Joi.string().optional(),
});

// corporate plans
const corporatePlanSchema = Joi.object({
  plan: Joi.string().required(),
  totalCount: Joi.number().required(),
  usedCount: Joi.number().allow(null).optional(),
});

// Define the corporate registration schema
const corporateRegisterSchema = Joi.object({
  companyName: Joi.string().required(),
  // logo: Joi.string().required(),
  gstNumber: Joi.string().required(),
  department: Joi.string().required(),
  designation: Joi.string().required(),
  addresses: Joi.array().items(addressSchema).min(1).required(),
  phone: Joi.string().length(10).required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid("Corporate").required(),
  // assignedDoctors: Joi.array(),
  assignedDoctors: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)),
  plans: Joi.array().items(corporatePlanSchema).optional(),
});
// school schema
const classSchema = Joi.object({
  className: Joi.string()
    .valid(
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
      "XII"
    )
    .optional(),
  sections: Joi.array()
    .items(Joi.string().valid("A", "B", "C", "D"))
    .optional(),
});
const schoolRegisterSchema = Joi.object({
  schoolName: Joi.string().required(),
  // logo: Joi.string().required(),
  department: Joi.string().required(),
  designation: Joi.string().required(),
  addresses: Joi.array().items(addressSchema).min(1).required(),
  phone: Joi.string().length(10).required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid("School").required(),
  assignedDoctors: Joi.array(),
  classes: Joi.array().items(classSchema).optional(),
});

//
const instituteRegisterSchema = Joi.object({
  instituteName: Joi.string().required(),
  // logo: Joi.string().required(),
  department: Joi.string().required(),
  designation: Joi.string().required(),
  addresses: Joi.array().items(addressSchema).min(1).required(),
  phone: Joi.string().length(10).required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid("Institute").required(),
  assignedDoctors: Joi.array(),
});

// email and phone
const emailSchema = Joi.string()
  .trim()
  .email()
  .required()
  .regex(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
  .message("Invalid email format!");

const phoneSchema = Joi.string()
  .trim()
  .required()
  .regex(/^[0-9]{10,15}$/)
  .message("Invalid phone number format!");

const loginSchema = Joi.object({
  login: Joi.alternatives().try(emailSchema, phoneSchema).required(),
  password: Joi.string().min(3).max(20).required(),
});
// const appLoginSchema = Joi.object({
//   login: Joi.alternatives().try(emailSchema, phoneSchema).required(),
// });
const appLoginSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must be exactly 10 digits.",
      "string.empty": "Phone number is required.",
    }),
});

// for doctorschema

const ExperienceSchema = Joi.object({
  organization: Joi.string().required(),
  designation: Joi.string().required(),
  startAt: Joi.date().required(),
  endAt: Joi.date().allow(null),
  currentlyWorking: Joi.boolean().default(false),
});

const EducationSchema = Joi.object({
  university: Joi.string().optional().allow(""),
  degree: Joi.string().optional().allow(""),
  course: Joi.string().required(),
  startAt: Joi.date().required(),
  endAt: Joi.date().allow(null),
});

const AddressSchema = Joi.object({
  name: Joi.string().required(),
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zipCode: Joi.string().required(),
});
const OfflineConsultaionAddress = Joi.object({
  street: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zipCode: Joi.string().required(),
});

const DoctorRegistrationSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  bio: Joi.string().optional().allow(""),
  gender: Joi.string().valid("M", "F", "O").required(),
  noOfYearExperience: Joi.number().default(0),
  address: AddressSchema,
  previousWorkExperience: Joi.array().items(ExperienceSchema),
  education: Joi.array().items(EducationSchema).optional(),
  specialization: Joi.string().required(),
  consultationFees: Joi.number(),
  availableDays: Joi.array()
    .items(
      Joi.string().valid(
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      )
    )
    .default(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
  medicalRegistrationNumber: Joi.string().optional().allow(""),
  medicalRegistrationProof: Joi.string().allow(null, ""),
  medicalDegreeProof: Joi.string().allow(null, ""),
  consultationInterestedIn: Joi.string()
    .valid("offline", "online", "both")
    .default("both"),
  offlineConsultationAddress: Joi.array().items(OfflineConsultaionAddress),
  phone: Joi.string().length(10).required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid("Doctor").required(),
});

// module.exports = DoctorSchema;

// school student
const schoolStudentRegisterSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  school: Joi.string().regex(/^[0-9a-fA-F]{24}$/), // Assuming MongoDB ObjectId
  phone: Joi.string().length(10).required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid("SchoolStudent").required(),
  class: Joi.string()
    .valid(
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
      "XII"
    )
    .required(),
  section: Joi.string().valid("A", "B", "C", "D").required(),
  gender: Joi.string().valid("M", "F", "O").required(),
  address: addressSchema,
  age: Joi.number().required(),
  weight: Joi.number().required(),
  activityLevel: Joi.string(), // Optional
  sleepHours: Joi.number().required(),
  cronicDiseases: Joi.string().required(),
  currentMedication: Joi.string().required(),
  allergicSubstance: Joi.string().required(),
}).unknown(true); // Allow unknown fields

// institute student

const currentReportSchema = Joi.object({
  reportUrl: Joi.string().required(),
  dischargeSummary: Joi.string(),
  prescription: Joi.string(),
});

const instituteStudentRegistrationSchema = Joi.object({
  // profileImg: Joi.string(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  school: Joi.string().regex(/^[0-9a-fA-F]{24}$/), // Assuming MongoDB ObjectId
  phone: Joi.string().length(10).required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  institute: Joi.string().regex(/^[0-9a-fA-F]{24}$/), // Assuming MongoDB ObjectId
  courseTaken: Joi.string().required(),
  gender: Joi.string().valid("M", "F", "O").required(),
  address: addressSchema,
  age: Joi.number().required(),
  weight: Joi.number().required(),
  activityLevel: Joi.string(), // Optional
  sleepHours: Joi.number().required(),
  cronicDiseases: Joi.string().required(),
  currentMedication: Joi.string().required(),
  allergicSubstance: Joi.string().required(),
  // currentReport: Joi.array().items(currentReportSchema),
  currentReport: Joi.array(),
}).unknown(true); // Allow unknown fields

// corporate employees

// const addressSchema = Joi.object({
//   name: Joi.string().required(),
//   street: Joi.string().required(),
//   city: Joi.string().required(),
//   state: Joi.string().required(),
//   zipCode: Joi.string().required()
// });

// const currentReportSchema = Joi.object({
//   reportUrl: Joi.string().required(),
//   dischargeSummary: Joi.string(),
//   prescription: Joi.string()
// });

const pregnancyDataSchema = Joi.object({
  isFirstPregnancy: Joi.boolean().default(true),
  noOfTimePregnant: Joi.number(),
  noOfLivingChild: Joi.number(),
  noOfAbortion: Joi.number(),
  monthOfGestation: Joi.number(),
  prescription: Joi.string(),
  lastMestrualPeriod: Joi.date(),
  ultrasoundScan: Joi.string(),
  trimesterScreening: Joi.string(),
  otherReport: Joi.string(),
  // currentMedicines: Joi.array().items(Joi.string()),
  currentMedicines: Joi.string(),
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
  // listOfComplications: Joi.array().items(Joi.string()),
  listOfComplications: Joi.string(),
});

const employeeRegisterSchema = Joi.object({
  // profileImg: Joi.string(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  // school: Joi.string().regex(/^[0-9a-fA-F]{24}$/), // Assuming MongoDB ObjectId
  phone: Joi.string().length(10).required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  gender: Joi.string().valid("M", "F", "O").required(),
  corporate: Joi.string().allow(""),
  // Assuming MongoDB ObjectId
  address: employeeAddressSchema,
  isMarried: Joi.boolean().required(),
  age: Joi.number().required(),
  weight: Joi.number().optional().allow(""),
  jobProfile: Joi.string(), // Optional
  department: Joi.string()
    .valid(
      "STAFF",
      "HR",
      "FIN",
      "IT",
      "MKT",
      "SLS",
      "OPS",
      "CS",
      "R&D",
      "MKT",
      "ADM",
      "QA",
      "PR",
      "BD",
      "T&D"
    )
    .required(),
  // plan
  plan: Joi.string().allow("").optional(),
  // activityLevel: Joi.string().optional().allow(""), // Optional
  // isSmoke: Joi.boolean().default(false),
  // isDrink: Joi.boolean().default(false),
  // sleepHours: Joi.number().optional().allow(""),
  // cronicDiseases: Joi.string().optional().allow(""),
  // currentMedication: Joi.string().optional().allow(""),
  // allergicSubstance: Joi.string().optional().allow(""),
  role: Joi.string().valid("Employee").required(),

  // currentReport: Joi.array(),
  // pregnancyData: Joi.when("gender", {
  //   is: "F",
  //   then: pregnancyDataSchema.optional(),
  //   otherwise: Joi.forbidden(),
  // }),
}).unknown(true); // Allow unknown fields

module.exports = {
  loginSchema,
  appLoginSchema,
  adminRegisterSchema,
  corporateRegisterSchema,
  DoctorRegistrationSchema,
  schoolRegisterSchema,
  instituteRegisterSchema,
  schoolStudentRegisterSchema,
  instituteStudentRegistrationSchema,
  employeeRegisterSchema,
};
