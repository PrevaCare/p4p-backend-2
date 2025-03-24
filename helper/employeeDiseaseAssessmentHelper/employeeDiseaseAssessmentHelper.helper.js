const calculateRisk = (patientData) => {
  // console.log(object)
  // Destructure all required parameters with validation
  const {
    gender,
    age,
    race,
    systolicBP,
    onHypertensionMed,
    diabetes,
    smoker,
    hdlCholesterol,
    totalCholesterol,
  } = patientData;

  // Input validation
  // console.log(gender);
  // console.log(age);
  // console.log(race);
  // console.log(systolicBP);
  // console.log(hdlCholesterol);
  // console.log(totalCholesterol);
  // if (
  //   !gender ||
  //   !age ||
  //   !race ||
  //   !systolicBP ||
  //   !hdlCholesterol ||
  //   !totalCholesterol
  // ) {
  //   throw new Error("Missing required parameters for risk calculation");
  // }

  // const theme = useTheme();
  // const isMediumScreen = useMediaQuery(theme.breakpoints.down("md"));
  // const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const sexCode = gender === "F" ? 1 : 2;
  const onHypertensionMedCode = onHypertensionMed ? 1 : 0;
  const diabetesCode = diabetes ? 1 : 0;
  const smokerCode = smoker ? 1 : 0;
  const cholesterolRatio = totalCholesterol / hdlCholesterol;

  const logitFemale =
    -12.82311 +
    0.106501 * age +
    0.43244 * race +
    0.000056 * Math.pow(systolicBP, 2) +
    0.017666 * systolicBP +
    0.731678 * onHypertensionMedCode +
    0.94397 * diabetesCode +
    1.00979 * smokerCode +
    0.151318 * cholesterolRatio +
    -0.00858 * age * race +
    -0.003647 * systolicBP * onHypertensionMedCode +
    0.006208 * systolicBP * race +
    0.152968 * race * onHypertensionMedCode +
    -0.000153 * age * systolicBP +
    0.115232 * race * diabetesCode +
    -0.092231 * race * smokerCode +
    0.070498 * race * cholesterolRatio +
    -0.000173 * race * systolicBP * onHypertensionMedCode +
    -0.000094 * age * systolicBP * race;

  const logitMale =
    -11.67998 +
    0.0642 * age +
    0.482835 * race +
    -0.000061 * Math.pow(systolicBP, 2) +
    0.03895 * systolicBP +
    2.055533 * onHypertensionMedCode +
    0.842209 * diabetesCode +
    0.895589 * smokerCode +
    0.193307 * cholesterolRatio +
    -0.014207 * systolicBP * onHypertensionMedCode +
    0.011609 * systolicBP * race +
    -0.11946 * onHypertensionMedCode * race +
    0.000025 * age * systolicBP +
    -0.077214 * race * diabetesCode +
    -0.226771 * race * smokerCode +
    -0.117749 * race * cholesterolRatio +
    0.00419 * race * onHypertensionMedCode * systolicBP +
    -0.000199 * race * age * systolicBP;

  const riskFemale = 100 / (1 + Math.exp(-logitFemale));
  const riskMale = 100 / (1 + Math.exp(-logitMale));

  const risk =
    (sexCode === 1 ? riskFemale : 0) + (sexCode === 2 ? riskMale : 0);

  //   setRiskPercentage(+risk.toFixed(2));
  //   onCalculateCoronaryRisk(risk.toFixed(2));
  return +risk.toFixed(2);
};

module.exports = { calculateRisk };
