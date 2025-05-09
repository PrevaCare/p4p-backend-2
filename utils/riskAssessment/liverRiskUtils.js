/**
 * Determine risk level based on risk score
 * @param {number} riskScore - The calculated risk score
 * @returns {string} Risk level category (Low, Moderate, High)
 */
const determineLiverRiskLevel = (riskScore) => {
  if (riskScore <= 5) {
    return "Low";
  } else if (riskScore >= 6 && riskScore <= 12) {
    return "Moderate";
  } else {
    return "High"; // riskScore >= 13
  }
};

module.exports = {
  determineLiverRiskLevel,
};
