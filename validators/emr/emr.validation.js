// const Joi = require("joi");

// // Joi schema for Address
// const addressSchema = Joi.object({
//   name: Joi.string().required(),
//   street: Joi.string().required(),
//   city: Joi.string().required(),
//   state: Joi.string().required(),
//   zipCode: Joi.string().required(),
// });

// // Joi schema for General Physical Examination
// const generalPhysicalExaminationSchema = Joi.object({
//   PR: Joi.number().optional().allow(""),
//   BP: Joi.object({
//     sys: Joi.number().allow("", null),
//     dia: Joi.number().allow("", null),
//   }),
//   volume: Joi.string().optional().allow(""),
//   regularity: Joi.string().optional().allow(""),
//   character: Joi.string().optional().allow(""),
//   temperature: Joi.string().optional().allow(""),
//   RR: Joi.number().optional().allow("", null),
//   SPO2: Joi.number().optional().allow("", null),
//   radioFemoralDelay: Joi.string().optional().allow(""),
//   height: Joi.number().optional().allow("", null),
//   weight: Joi.number().optional().allow("", null),
//   BMI: Joi.number().optional().allow("", null),
//   pallor: Joi.string().optional().allow(""),
//   icterus: Joi.string().optional().allow(""),
//   cyanosis: Joi.string().optional().allow(""),
//   clubbing: Joi.string().optional().allow(""),
//   lymphadenopathy: Joi.string().optional().allow(""),
//   edema: Joi.string().optional().allow(""),
//   JVP: Joi.string().optional().allow(""),
// });

// // Joi schema for Systemic Examination
// const systemicExaminationSchema = Joi.object({
//   respiratorySystem: Joi.string(),
//   CVS: Joi.string(),
//   CNS: Joi.string(),
//   PA: Joi.string(),
//   otherSystemicFindings: Joi.string(),
// });

// // Joi schema for Treatment
// const treatmentSchema = Joi.object({
//   drugName: Joi.string(),
//   frequency: Joi.string(),
//   takingSince: Joi.date(),
//   deaseaseSufferingFrom: Joi.string(),
//   provisinalDiagonosis: Joi.string(),
//   dateOfProvisinalDiagonosis: Joi.string(),
//   referalNeeded: Joi.boolean(),
//   notes: Joi.string(),
// });

// // Joi schema for History
// const historySchema = Joi.object({
//   chiefComplaint: Joi.string(),
//   historyOfPresentingIllness: Joi.string(),
//   pastHistory: Joi.array().items(
//     Joi.object({
//       _id: Joi.string().optional(),
//       sufferingFrom: Joi.string().optional().allow(""),
//       drugName: Joi.array().items(Joi.string().optional().allow("")).optional(),
//       freequency: Joi.array()
//         .items(Joi.string().optional().allow(""))
//         .optional(),
//       readings: Joi.string().optional().allow(""),
//       pastHistoryNotes: Joi.string().optional().allow(""),
//     })
//   ),
//   allergies: Joi.array()
//     .items(
//       Joi.object({
//         allergyName: Joi.string().optional().allow(""),
//         pastAllergyDrugName: Joi.array()
//           .items(Joi.string().optional().allow(""))
//           .optional(),
//         pastAllergyFreequency: Joi.array()
//           .items(Joi.string().optional().allow(""))
//           .optional(),
//         advisedBy: Joi.string().optional().allow(""),
//         advise: Joi.string().optional().allow(""),
//         adviseAllergyDrugName: Joi.array()
//           .items(Joi.string().optional().allow(""))
//           .optional(),
//         adviseAllergyFreequency: Joi.array()
//           .items(Joi.string().optional().allow(""))
//           .optional(),
//       })
//     )
//     .optional(),
//   // sufferingFrom: Joi.string(),
//   // drugName: Joi.array().items(Joi.string()),
//   previousSurgeries: Joi.string(),
//   habits: Joi.object({
//     smoking: Joi.boolean().default(false),
//     packYears: Joi.number().allow("", null),
//     alcohol: Joi.boolean().default(false),
//     alcoholDetails: Joi.string().allow(""),
//     qntPerWeek: Joi.number().allow("", null),
//     substanceAbuse: Joi.string(),
//   }),
//   bowelAndBladder: Joi.string(),
//   appetite: Joi.string(),
//   sleep: Joi.number().allow(""),
//   stressScreening: Joi.object({
//     desc: Joi.string().optional().allow(""),
//     recomendation: Joi.string().optional().allow(""),
//     score: Joi.number().optional().allow("", 0),
//   }),
//   depressionScreening: Joi.object({
//     desc: Joi.string().optional().allow(""),
//     recomendation: Joi.string().optional().allow(""),
//     score: Joi.number().allow("", 0),
//   }),

//   mentalHealthAssessment: Joi.string(),
// });

// // immunizationSchema
// const ImmunizationSchema = Joi.object({
//   immunizationType: Joi.string()
//     .valid("up to date", "adding", "recommended")
//     .optional(),
//   vaccinationName: Joi.string().optional().allow(""),
//   totalDose: Joi.number().optional().default(1),
//   doseDates: Joi.array()
//     .items(
//       Joi.object({
//         date: Joi.string().optional().allow(""),
//         status: Joi.string().valid("due", "completed").optional(),
//       })
//     )
//     .optional(),
//   doctorName: Joi.string().optional().allow(""),
//   sideEffects: Joi.string().optional().allow(""),
//   immunizationNotes: Joi.string().optional().allow(""),
// });

// // Joi schema for Gynaecological History
// const gynaecologicalHistorySchema = Joi.object({
//   ageOfMenarche: Joi.number().allow("").optional(),
//   cycleDuration: Joi.number().allow("").optional(),
//   cycleRegularity: Joi.string().valid("regular", "irregular"),
//   daysOfBleeding: Joi.number().allow("").optional(),
//   padsUsedPerDay: Joi.number().allow("").optional(),
//   passageOfClots: Joi.string().allow("").optional(),
//   complaints: Joi.string().allow("").optional(),
//   previousHistory: Joi.string().allow("").optional(),
//   obstetricHistory: Joi.object({
//     // score: Joi.string().valid("G", "P", "L", "A"),
//     gScore: Joi.number().allow("").optional(),
//     pScore: Joi.number().allow("").optional(),
//     lScore: Joi.number().allow("").optional(),
//     aScore: Joi.number().allow("").optional(),
//     partnerBloodGroup: Joi.string()
//       .valid("A+", "B+", "AB+", "O+", "A-", "B-", "AB-", "O-", "not known")
//       .optional()
//       .allow(""),
//     conceptions: Joi.array()
//       .items(
//         Joi.object({
//           ageAtConception: Joi.number().allow("").optional(),
//           modeOfConception: Joi.string().allow("").optional(),
//           complications: Joi.string().allow("").optional(),
//           modeOfDelivery: Joi.string().allow("").optional(),
//         }).optional()
//       )
//       .optional(),

//     primigravidaWeeks: Joi.number().allow("").optional(),
//     EDD: Joi.date().allow("").optional(),
//     examination: Joi.string().allow("").optional(),
//     symptoms: Joi.string().allow("").optional(),
//     USGScans: Joi.string().allow("").optional(),
//     TDDoseTaken: Joi.string().allow("").optional(),
//     prenatalScreeningReports: Joi.string().allow("").optional(),
//     prenatalVitamins: Joi.boolean().default(false).allow("").optional(),
//     freshComplaint: Joi.string().allow("").optional(),
//     nutritionalHistory: Joi.string().allow("").optional(),
//     treatingGynaecologistName: Joi.string().allow("").optional(),
//     gynaecologistAddress: Joi.string().allow("").optional(),
//     // modeOfDelivery: Joi.string(),
//   }),
// });

// // prescribedTreatment
// // const prescribedTreatment = Joi.object({
// //   _id: Joi.string().optional(),
// //   dateOfDiagonosis: Joi.string().allow("").optional(),
// //   diagonosisName: Joi.string().allow("").optional(),
// //   investigations: Joi.string().allow("").optional(),
// //   drugName: Joi.string().allow("").optional(),
// //   frequency: Joi.string().allow("").optional(),
// //   duration: Joi.string().allow("").optional(),
// //   quantity: Joi.string().allow("").optional(),
// //   advice: Joi.string().allow("").optional(),
// //   routeOfAdministration: Joi.string().allow("").optional(),
// //   howToTake: Joi.string().allow("").optional(),
// // });

// // diagonosis

// const prescriptionSchema = Joi.object({
//   investigations: Joi.string().optional(),
//   drugName: Joi.string().optional(),
//   freequency: Joi.string().optional(),
//   duration: Joi.string().optional(),
//   quantity: Joi.string().optional(),
//   advice: Joi.string().optional(),
//   routeOfAdministration: Joi.string().optional(),
//   howToTake: Joi.string().optional(),
// });

// const diagnosisSchema = Joi.object({
//   dateOfDiagnosis: Joi.string().optional().allow(""),
//   diagnosisName: Joi.string().optional().allow(""),
//   prescription: Joi.array().items(prescriptionSchema).optional(),
// });

// // Base schema for both male and female EMR
// const EMRValidationSchema = Joi.object({
//   user: Joi.any().required(),
//   // user: Joi.alternatives()
//   //   .try(
//   //     Joi.string(),
//   //     Joi.custom((value, helpers) => {
//   //       if (new mongoose.Types.ObjectId.isValid(value)) {
//   //         return value;
//   //       }
//   //       return helpers.error("any.invalid");
//   //     })
//   //   )
//   //   .required(),
//   basicInfo: Joi.object({
//     name: Joi.string().required(),
//     phoneNumber: Joi.string().required(),
//     age: Joi.number(),
//     children: Joi.number().allow(""),
//     maritalStatus: Joi.boolean(),
//     gender: Joi.string().valid("M", "F").required(),
//     bloodGroup: Joi.string().valid(
//       "A+",
//       "B+",
//       "AB+",
//       "O+",
//       "A-",
//       "B-",
//       "AB-",
//       "O-",
//       "not known"
//     ),
//     address: addressSchema,
//   }),
//   history: historySchema,
//   gynaecologicalHistory: Joi.when("basicInfo.gender", {
//     is: "F",
//     then: gynaecologicalHistorySchema,
//     otherwise: Joi.forbidden(),
//   }),
//   immunization: Joi.array()
//     .items(ImmunizationSchema)
//     .optional()
//     .allow(null)
//     .default(null),
//   generalPhysicalExamination: generalPhysicalExaminationSchema,
//   systemicExamination: systemicExaminationSchema,
//   currentTreatment: Joi.array().items(treatmentSchema),
//   // prescribedTreatment: Joi.array().items(prescribedTreatment).optional(),
//   diagnosis: Joi.array().items(diagnosisSchema).optional(),
//   // provisionalDiagnosis: Joi.string(),

//   // diagonosis: Joi.array().items(
//   //   Joi.object({
//   //     _id: Joi.string().optional(),
//   //     dateOfDiagonosis: Joi.string(),
//   //     diagonosisName: Joi.string(),
//   //   })
//   // ),
//   // investigations: Joi.array()
//   //   .items(Joi.string().optional().allow(""))
//   //   .optional(),
//   advice: Joi.string().allow("").optional(),
//   referrals: Joi.string().allow("").optional(),
//   followUpSchedule: Joi.string().allow("").optional(),
//   doctorNotes: Joi.string().allow(""),
//   // doctor: Joi.string().optional().allow(""),
//   doctor: Joi.any().required(),
//   consultationMode: Joi.string().optional().allow(""),
//   emrPdfFile: Joi.string().optional().allow(""),
// }).unknown(true);

// module.exports = { EMRValidationSchema };

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

// Joi schema for Treatment
const treatmentSchema = Joi.object({
  drugName: Joi.string().allow(null, ""),
  frequency: Joi.string().allow(null, ""),
  takingSince: Joi.date().allow(null, ""),
  deaseaseSufferingFrom: Joi.string().allow(null, ""),
  provisinalDiagonosis: Joi.string().allow(null, ""),
  dateOfProvisinalDiagonosis: Joi.string().allow(null, ""),
  referalNeeded: Joi.boolean().allow(null),
  notes: Joi.string().allow(null, ""),
});

// Joi schema for History
const historySchema = Joi.object({
  chiefComplaint: Joi.string().allow(null, ""),
  historyOfPresentingIllness: Joi.string().allow(null, ""),
  pastHistory: Joi.array().items(
    Joi.object({
      _id: Joi.string().optional().allow(null),
      sufferingFrom: Joi.string().optional().allow(null, ""),
      drugName: Joi.array()
        .items(Joi.string().optional().allow(null, ""))
        .optional(),
      freequency: Joi.array()
        .items(Joi.string().optional().allow(null, ""))
        .optional(),
      readings: Joi.string().optional().allow(null, ""),
      pastHistoryNotes: Joi.string().optional().allow(null, ""),
    })
  ),
  allergies: Joi.array()
    .items(
      Joi.object({
        allergyName: Joi.string().optional().allow(null, ""),
        pastAllergyDrugName: Joi.array()
          .items(Joi.string().optional().allow(null, ""))
          .optional(),
        pastAllergyFreequency: Joi.array()
          .items(Joi.string().optional().allow(null, ""))
          .optional(),
        advisedBy: Joi.string().optional().allow(null, ""),
        advise: Joi.string().optional().allow(null, ""),
        adviseAllergyDrugName: Joi.array()
          .items(Joi.string().optional().allow(null, ""))
          .optional(),
        adviseAllergyFreequency: Joi.array()
          .items(Joi.string().optional().allow(null, ""))
          .optional(),
      })
    )
    .optional(),
  previousSurgeries: Joi.string().allow(null, ""),
  habits: Joi.object({
    smoking: Joi.boolean().default(false).allow(null),
    packYears: Joi.number().allow(null, ""),
    alcohol: Joi.boolean().default(false).allow(null),
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
    score: Joi.number().optional().allow(null, "", 0),
  }),
  depressionScreening: Joi.object({
    desc: Joi.string().optional().allow(null, ""),
    recomendation: Joi.string().optional().allow(null, ""),
    score: Joi.number().allow(null, "", 0),
  }),
  mentalHealthAssessment: Joi.string().allow(null, ""),
});

// immunizationSchema
const ImmunizationSchema = Joi.object({
  immunizationType: Joi.string()
    .valid("up to date", "adding", "recommended")
    .optional()
    .allow(null),
  vaccinationName: Joi.string().optional().allow(null, ""),
  totalDose: Joi.number().optional().default(1).allow(null),
  doseDates: Joi.array()
    .items(
      Joi.object({
        date: Joi.string().optional().allow(null, ""),
        status: Joi.string().valid("due", "completed").optional().allow(null),
      })
    )
    .optional(),
  doctorName: Joi.string().optional().allow(null, ""),
  sideEffects: Joi.string().optional().allow(null, ""),
  immunizationNotes: Joi.string().optional().allow(null, ""),
});

// Joi schema for Gynaecological History
const gynaecologicalHistorySchema = Joi.object({
  ageOfMenarche: Joi.number().allow(null, "").optional(),
  cycleDuration: Joi.number().allow(null, "").optional(),
  cycleRegularity: Joi.string().valid("regular", "irregular").allow(null),
  daysOfBleeding: Joi.number().allow(null, "").optional(),
  padsUsedPerDay: Joi.number().allow(null, "").optional(),
  passageOfClots: Joi.string().allow(null, "").optional(),
  complaints: Joi.string().allow(null, "").optional(),
  previousHistory: Joi.string().allow(null, "").optional(),
  obstetricHistory: Joi.object({
    gScore: Joi.number().allow(null, "").optional(),
    pScore: Joi.number().allow(null, "").optional(),
    lScore: Joi.number().allow(null, "").optional(),
    aScore: Joi.number().allow(null, "").optional(),
    partnerBloodGroup: Joi.string()
      .valid("A+", "B+", "AB+", "O+", "A-", "B-", "AB-", "O-", "not known")
      .optional()
      .allow(null, ""),
    conceptions: Joi.array()
      .items(
        Joi.object({
          ageAtConception: Joi.number().allow(null, "").optional(),
          modeOfConception: Joi.string().allow(null, "").optional(),
          complications: Joi.string().allow(null, "").optional(),
          modeOfDelivery: Joi.string().allow(null, "").optional(),
        }).optional()
      )
      .optional(),
    primigravidaWeeks: Joi.number().allow(null, "").optional(),
    EDD: Joi.date().allow(null, "").optional(),
    examination: Joi.string().allow(null, "").optional(),
    symptoms: Joi.string().allow(null, "").optional(),
    USGScans: Joi.string().allow(null, "").optional(),
    TDDoseTaken: Joi.string().allow(null, "").optional(),
    prenatalScreeningReports: Joi.string().allow(null, "").optional(),
    prenatalVitamins: Joi.boolean().default(false).allow(null, "").optional(),
    freshComplaint: Joi.string().allow(null, "").optional(),
    nutritionalHistory: Joi.string().allow(null, "").optional(),
    treatingGynaecologistName: Joi.string().allow(null, "").optional(),
    gynaecologistAddress: Joi.string().allow(null, "").optional(),
  }),
});

const prescriptionSchema = Joi.object({
  investigations: Joi.string().optional().allow(null, ""),
  drugName: Joi.string().optional().allow(null, ""),
  freequency: Joi.string().optional().allow(null, ""),
  duration: Joi.string().optional().allow(null, ""),
  quantity: Joi.string().optional().allow(null, ""),
  advice: Joi.string().optional().allow(null, ""),
  routeOfAdministration: Joi.string().optional().allow(null, ""),
  howToTake: Joi.string().optional().allow(null, ""),
});

const diagnosisSchema = Joi.object({
  dateOfDiagnosis: Joi.string().optional().allow(null, ""),
  diagnosisName: Joi.string().optional().allow(null, ""),
  prescription: Joi.array().items(prescriptionSchema).optional().allow(null),
});

// Base schema for both male and female EMR
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
  gynaecologicalHistory: Joi.when("basicInfo.gender", {
    is: "F",
    then: gynaecologicalHistorySchema,
    otherwise: Joi.forbidden(),
  }).allow(null),
  immunization: Joi.array().items(ImmunizationSchema).optional().allow(null),
  generalPhysicalExamination: generalPhysicalExaminationSchema.allow(null),
  systemicExamination: systemicExaminationSchema.allow(null),
  currentTreatment: Joi.array().items(treatmentSchema).allow(null),
  diagnosis: Joi.array().items(diagnosisSchema).optional().allow(null),
  advice: Joi.string().allow(null, "").optional(),
  referrals: Joi.string().allow(null, "").optional(),
  followUpSchedule: Joi.string().allow(null, "").optional(),
  doctorNotes: Joi.string().allow(null, ""),
  doctor: Joi.any().required().allow(null),
  consultationMode: Joi.string().optional().allow(null, ""),
  emrPdfFile: Joi.string().optional().allow(null, ""),
}).unknown(true);

module.exports = { EMRValidationSchema };
