/**
 * Determine risk level based on average of lower and higher risk scores
 * @param {number} lowerRiskScore - Lower bound risk score
 * @param {number} higherRiskScore - Higher bound risk score
 * @returns {string} Risk level category (Low, Moderate, High)
 */
const determineStrokeRiskLevel = (lowerRiskScore, higherRiskScore) => {
  // Calculate total score (sum of lower and higher risk scores)
  const totalScore = lowerRiskScore + higherRiskScore;

  if (totalScore <= 2) {
    return "Low";
  } else if (totalScore >= 3 && totalScore <= 6) {
    return "Moderate";
  } else {
    return "High"; // totalScore >= 7
  }
};

module.exports = {
  determineStrokeRiskLevel,
};
