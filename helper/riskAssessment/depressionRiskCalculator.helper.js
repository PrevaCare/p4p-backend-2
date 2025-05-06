/**
 * Helper functions for depression risk calculation using PHQ-9
 */

// Calculate PHQ-9 score from the question responses
const calculatePHQScore = (phqQuestions) => {
  let totalScore = 0;

  // Add up all question scores
  Object.values(phqQuestions).forEach((value) => {
    totalScore += value;
  });

  return totalScore;
};

// Determine depression level based on PHQ-9 score
const determineDepressionLevel = (phqScore) => {
  // Standard PHQ-9 score interpretation
  if (phqScore <= 4) {
    return "Minimal";
  } else if (phqScore <= 9) {
    return "Mild";
  } else if (phqScore <= 14) {
    return "Moderate";
  } else if (phqScore <= 19) {
    return "Moderately Severe";
  } else {
    return "Severe";
  }
};

// Main helper function for depression risk calculation
const calculateDepressionRiskHelper = (body) => {
  const { phqQuestions } = body;

  // Calculate PHQ-9 score
  const phqScore = calculatePHQScore(phqQuestions);

  // Determine depression level
  const depressionLevel = determineDepressionLevel(phqScore);

  return {
    phqScore,
    depressionLevel,
  };
};

module.exports = {
  calculateDepressionRiskHelper,
  calculatePHQScore,
  determineDepressionLevel,
};
