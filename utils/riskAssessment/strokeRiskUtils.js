/**
 * Determine risk level based on average of lower and higher risk scores
 * @param {number} lowerRiskScore - Lower bound risk score
 * @param {number} higherRiskScore - Higher bound risk score
 * @returns {string} Risk level category (Low, Moderate, High)
 */
const determineStrokeRiskLevel = (lowerRiskScore, higherRiskScore) => {
  // Calculate mean of lower and higher risk scores
  const meanScore = (lowerRiskScore + higherRiskScore) / 2;

  if (meanScore < 25) {
    return "Low";
  } else if (meanScore >= 25 && meanScore <= 50) {
    return "Moderate";
  } else {
    return "High";
  }
};

module.exports = {
  determineStrokeRiskLevel,
};
