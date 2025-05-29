const dayjs = require("dayjs");

const getFormattedBasicInfo = (userData, latestEmr) => ({
    name: `${userData.firstName} ${userData.lastName}`,
    age: userData.age || "",
    children: userData.children || 0,
    gender: userData.gender || "",
    phoneNumber: userData.phone || "",
    maritalStatus: userData.isMarried || false,
    bloodGroup: (latestEmr && latestEmr.bloodGroup) || "not known",
    address: {
      name: userData?.address?.name || "",
      street: userData?.address?.street || "",
      city: userData?.address?.city || "",
      state: userData?.address?.state || "",
      zipCode: userData?.address?.zipCode || "",
    },
  });
  
  const defaultHistory = (allergies) => ({
    chiefComplaint: "",
    historyOfPresentingIllness: "",
    pastHistory: [
      {
        sufferingFrom: "",
        drugName: [],
        freequency: [],
        readings: "",
        pastHistoryNotes: "",
      },
    ],
    surgicalHistory: [],
    allergies:
      allergies && allergies.length > 0
        ? {
            pastAllergyPrescription: allergies.map((item) => ({
              allergyName: item.allergyName || "",
              symptoms: [],
              diagnosedBy: item.advisedBy || "",
              triggers: [],
              pastAllergyNotes: item.advise || "",
              pastAllergyPrescriptionBy: "Doctor",
              drugs:
                item.pastAllergyDrugName && item.pastAllergyFreequency
                  ? item.pastAllergyDrugName.map((drug, index) => ({
                      drugName: drug,
                      isContinued: true,
                      frequency: item.pastAllergyFreequency[index] || "",
                      duration: "",
                      fetchedFromEMR: true,
                    }))
                  : [],
            })),
            newAllergyPrescription: [],
          }
        : {
            pastAllergyPrescription: [],
            newAllergyPrescription: [],
          },
    previousSurgeries: "",
    habits: {
      smoking: false,
      packYears: "",
      alcohol: false,
      alcoholDetails: "",
      qntPerWeek: "",
      substanceAbuse: "NONE",
    },
    bowelAndBladder: "NORMAL AND REGULAR",
    appetite: "ADEQUATE",
    sleep: "",
    depressionScreening: {
      desc: "",
      recomendation: "",
      score: "",
    },
    stressScreening: {
      desc: "",
      recomendation: "",
      score: "",
    },
    mentalHealthAssessment: "",
  });
  
  const getFormattedGeneralPhysicalExamination = (latestEmr) => ({
    PR: latestEmr?.generalPhysicalExamination?.PR || "",
    BP: {
      sys: latestEmr?.generalPhysicalExamination?.BP?.sys || "",
      dia: latestEmr?.generalPhysicalExamination?.BP?.dia || "",
    },
    volume: latestEmr?.generalPhysicalExamination?.volume || "full",
    regularity: latestEmr?.generalPhysicalExamination?.regularity || "regular",
    character: latestEmr?.generalPhysicalExamination?.character || "normal",
    temperature: latestEmr?.generalPhysicalExamination?.temperature || "afebrile",
    RR: latestEmr?.generalPhysicalExamination?.RR || "",
    SPO2: latestEmr?.generalPhysicalExamination?.SPO2 || "",
    radioFemoralDelay:
      latestEmr?.generalPhysicalExamination?.radioFemoralDelay || "NONE",
    height: latestEmr?.generalPhysicalExamination?.height || "",
    weight: latestEmr?.generalPhysicalExamination?.weight || "",
    pallor: latestEmr?.generalPhysicalExamination?.pallor || "absent",
    icterus: latestEmr?.generalPhysicalExamination?.icterus || "absent",
    cyanosis: latestEmr?.generalPhysicalExamination?.cyanosis || "absent",
    clubbing: latestEmr?.generalPhysicalExamination?.clubbing || "absent",
    lymphadenopathy:
      latestEmr?.generalPhysicalExamination?.edema || "absent", // Possible swap?
    edema:
      latestEmr?.generalPhysicalExamination?.lymphadenopathy || "absent", // Possible swap?
    JVP: latestEmr?.generalPhysicalExamination?.JVP || "not raised",
  });
  
  const getFormattedSystemicExamination = (latestEmr) => ({
    respiratorySystem:
      latestEmr?.systemicExamination?.respiratorySystem ||
      "normal vesicular breath sounds",
    CVS:
      latestEmr?.systemicExamination?.CVS || "S1 S2 PRESENT, NO ADDED SOUNDS",
    CNS:
      latestEmr?.systemicExamination?.CNS || "NO FOCAL NEUROLOGICAL DEFICIT",
    PA:
      latestEmr?.systemicExamination?.PA || "SOFT, NORMAL BOWEL SOUNDS PRESENT",
    otherSystemicFindings:
      latestEmr?.systemicExamination?.otherSystemicFindings || "NOTHING SIGNIFICANT",
  });
  
  const defaultGynaecologicalHistory = {
    ageOfMenarche: "",
    cycleDuration: "",
    cycleRegularity: "regular",
    daysOfBleeding: "",
    padsUsedPerDay: "",
    passageOfClots: "",
    complaints: "",
    previousHistory: "",
    obstetricHistory: {
      gScore: 0,
      pScore: 0,
      lScore: 0,
      aScore: "",
      partnerBloodGroup: "",
      conceptions: [
        {
          ageAtConception: "",
          modeOfConception: "",
          modeOfDelivery: "",
          complications: "",
        },
      ],
      primigravidaWeeks: "",
      isPregnant: false,
      EDD: "",
      symptoms: "",
      examination: "",
      USGScans: "due",
      TDDoseTaken: "",
      prenatalScreeningReports: "",
      prenatalVitamins: false,
      freshComplaint: "",
      nutritionalHistory: "",
      treatingGynaecologistName: "",
      gynaecologistAddress: "",
    },
  };

 const getFormattedDiagnosisData = (currentConditions = null) => {
  return currentConditions.length
    ? currentConditions.map((condition) => ({
        dateOfDiagnosis: condition.dateOfDiagnosis
          ? dayjs(condition.dateOfDiagnosis).format("YYYY-MM-DD")
          : "",
        diagnosisName: condition.diagnosisName || "",
        prescription: condition.prescription || [],
      }))
    : [
        {
          dateOfDiagnosis: "",
          diagnosisName: "",
          prescription: [],
        },
      ]
 }

 const defaultImmunization = [
  {
    immunizationType: "up to date",
    vaccinationName: "",
    totalDose: 1,
    doseDates: [
      {
        date: new Date(),
        status: "due",
      },
    ],
    doctorName: "",
    sideEffects: "",
    immunizationNotes: "",
  },
]
  
module.exports = {
  getFormattedBasicInfo,
  defaultHistory,
  getFormattedGeneralPhysicalExamination,
  getFormattedSystemicExamination,
  defaultGynaecologicalHistory,
  getFormattedDiagnosisData,
  defaultImmunization
};
  