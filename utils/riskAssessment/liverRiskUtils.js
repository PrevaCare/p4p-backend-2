/**
 * Determine risk level based on risk score
 * @param {number} riskScore - The calculated risk score
 * @returns {string} Risk level category (Low, Moderate, High)
 */
const determineLiverRiskLevel = (riskScore) => {
  if (riskScore <= 25) {
    return "Low";
  } else if (riskScore > 25 && riskScore <= 50) {
    return "Moderate";
  } else {
    return "High";
  }
};

module.exports = {
  determineLiverRiskLevel,
};
