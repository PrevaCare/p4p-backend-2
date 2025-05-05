/**
 * Determine risk level based on risk percentage
 * @param {number} riskPercentage - The calculated risk percentage
 * @returns {string} Risk level category (Low, Moderate, High, Very High)
 */
const determineRiskLevel = (riskPercentage) => {
  if (riskPercentage < 10) {
    return "Low";
  } else if (riskPercentage >= 10 && riskPercentage < 20) {
    return "Moderate";
  } else if (riskPercentage >= 20 && riskPercentage < 30) {
    return "High";
  } else {
    return "Very High";
  }
};

/**
 * Determine age group based on age
 * @param {number} age - The person's age
 * @returns {string} Age group category
 */
const determineAgeGroup = (age) => {
  if (age <= 30) {
    return "18-30";
  } else if (age > 30 && age <= 45) {
    return "31-45";
  } else if (age > 45 && age <= 60) {
    return "46-60";
  } else {
    return "61+";
  }
};

module.exports = {
  determineRiskLevel,
  determineAgeGroup,
};
