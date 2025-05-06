/**
 * Helper functions for stress risk calculation
 */

// Calculate PSS score from the question responses
const calculatePSSScore = (pssQuestions) => {
  // Questions 4, 5, 7, and 8 are positively stated items and are scored in reverse
  // (0=4, 1=3, 2=2, 3=1, 4=0)
  const reverseScoredQuestions = [
    "confidentHandling",
    "thingsGoingWell",
    "controlIrritations",
    "onTopOfThings",
  ];

  let totalScore = 0;

  // Calculate each question's contribution to the score
  Object.entries(pssQuestions).forEach(([key, value]) => {
    if (reverseScoredQuestions.includes(key)) {
      // Reverse scoring for positive items
      totalScore += 4 - value;
    } else {
      // Normal scoring for negative items
      totalScore += value;
    }
  });

  return totalScore;
};

// Determine stress level based on PSS score
const determineStressLevel = (pssScore) => {
  // Standard PSS score interpretation
  if (pssScore <= 13) {
    return "Low";
  } else if (pssScore <= 26) {
    return "Moderate";
  } else {
    return "High";
  }
};

// Main helper function for stress risk calculation
const calculateStressRiskHelper = (body) => {
  const { pssQuestions } = body;

  // Calculate PSS score
  const pssScore = calculatePSSScore(pssQuestions);

  // Determine stress level
  const stressLevel = determineStressLevel(pssScore);

  return {
    pssScore,
    stressLevel,
  };
};

module.exports = {
  calculateStressRiskHelper,
  calculatePSSScore,
  determineStressLevel,
};
