const Joi = require("joi");

const addressSchema = Joi.object({
  name: Joi.string().optional(),
  street: Joi.string().optional(),
  city: Joi.string().optional(),
  state: Joi.string().optional(),
  pincode: Joi.string()
    .pattern(/^\d{5,6}$/)
    .optional(),
}).optional();

// const pregnancyDataSchema = Joi.object({
//   isFirstPregnancy: Joi.boolean().optional(),
//   noOfTimePregnant: Joi.number().integer().min(0).optional(),
//   noOfLivingChild: Joi.number().integer().min(0).optional(),
//   noOfAbortion: Joi.number().integer().min(0).optional(),
//   monthOfGestation: Joi.number().integer().min(0).max(9).optional(),
//   prescription: Joi.string().optional(),
//   lastMestrualPeriod: Joi.date().optional(),
//   ultrasoundScan: Joi.string().optional(),
//   trimesterScreening: Joi.string().optional(),
//   otherReport: Joi.string().optional(),
//   currentMedicines: Joi.string().optional(),
//   bloodGroup: Joi.string().valid("A+", "B+", "AB+", "O+", "A-", "B-", "AB-", "O-").optional(),
//   partnerBloodGroup: Joi.string().valid("A+", "B+", "AB+", "O+", "A-", "B-", "AB-", "O-").optional(),
//   listOfComplications: Joi.string().optional(),
// }).optional();

const employeeUpdateSchema = Joi.object({
  //   profileImg: Joi.string().optional(),
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().optional(),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional(),
  gender: Joi.string().valid("M", "F", "O").optional(),
  //   corporate: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional(),
  address: addressSchema,
  isMarried: Joi.boolean().optional(),
  age: Joi.number().integer().min(0).optional(),
  weight: Joi.number().integer().min(0).optional(),
  jobProfile: Joi.string().optional(),
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
      "ADM",
      "QA",
      "PR",
      "BD",
      "T&D"
    )
    .optional(),
  //   activityLevel: Joi.string().optional(),
  //   isSmoke: Joi.boolean().optional(),
  //   isDrink: Joi.boolean().optional(),
  //   sleepHours: Joi.number().min(0).max(24).optional(),
  //   cronicDiseases: Joi.string().optional(),
  //   currentMedication: Joi.string().optional(),
  //   allergicSubstance: Joi.string().optional(),
  //   pregnancyData: pregnancyDataSchema,
  assignedDoctors: Joi.array().items(Joi.string()).optional(),
});

module.exports = { employeeUpdateSchema };
