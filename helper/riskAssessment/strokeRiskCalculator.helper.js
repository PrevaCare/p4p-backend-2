const calculateStrokeRiskHelper = (riskFactors) => {
  let higherRisk = 0;
  let lowerRisk = 0;

  Object.values(riskFactors).forEach((value) => {
    if (value === "higher") higherRisk += 1;
    if (value === "lower") lowerRisk += 1;
  });

  const desc =
    higherRisk > lowerRisk
      ? "You scored higher in the 'higher risk' column. It's recommended that you ask your health care professional about how you can reduce your risk."
      : "Your score indicates a lower risk, but always consult with a healthcare professional for a thorough assessment.";

  return {
    higherRiskScore: higherRisk,
    lowerRiskScore: lowerRisk,
    desc,
  };
};

module.exports = { calculateStrokeRiskHelper };
