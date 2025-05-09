// helpers/calculateDiabeticRisk.js
const calculateDiabeticRiskHelper = (scores) => {
  const totalScore =
    scores.ageScore +
    scores.waistScore +
    scores.physicalActivityScore +
    scores.familyHistoryScore;

  let riskLevel = "";

  if (totalScore > 50) {
    riskLevel = "High";
  } else if (totalScore >= 30 && totalScore <= 50) {
    riskLevel = "Moderate";
  } else {
    riskLevel = "Low";
  }

  return { totalScore, riskLevel };
};

module.exports = { calculateDiabeticRiskHelper };
