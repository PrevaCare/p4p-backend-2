// helpers/calculateDiabeticRisk.js
const calculateDiabeticRiskHelper = (scores) => {
  const totalScore =
    scores.ageScore +
    scores.waistScore +
    scores.physicalActivityScore +
    scores.familyHistoryScore;

  let riskLevel = "";

  if (totalScore >= 60) {
    riskLevel =
      "Very HIGH RISK of having diabetes: Oral Glucose Tolerance Test (OGTT) is recommended to rule out diabetes. If this is not possible, at least a random blood sugar or a fasting blood sugar should be done.";
  } else if (totalScore >= 30 && totalScore <= 50) {
    riskLevel =
      "The risk of having diabetes is MODERATE: It is still recommended to have the above check up.";
  } else {
    riskLevel = "Risk of having diabetes is probably LOW.";
  }

  return { totalScore, riskLevel };
};

module.exports = { calculateDiabeticRiskHelper };
