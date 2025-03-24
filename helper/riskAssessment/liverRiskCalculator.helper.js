// helpers/calculateLiverRisk.js
const calculateLiverRiskHelper = (riskFactors) => {
  let riskScore = 0;

  // Age risk
  if (riskFactors.age === "41-60") riskScore += 1;
  else if (riskFactors.age === "Over 60") riskScore += 2;

  // Risk reasons
  riskFactors.riskReasons.forEach((reason) => {
    if (reason === "I am overweight") riskScore += 2;
    if (reason === "I drink alcohol frequently") riskScore += 3;
    if (reason === "I have a hereditary or autoimmune condition")
      riskScore += 2;
  });

  // Medical conditions
  if (riskFactors.diabetes === "Yes") riskScore += 2;
  if (riskFactors.highBloodPressure === "Yes") riskScore += 1;

  // Exercise habits
  switch (riskFactors.exercise) {
    case "Never":
      riskScore += 3;
      break;
    case "Less than 1 Hour per Week":
      riskScore += 2;
      break;
    case "1-2 Hours per Week":
      riskScore += 1;
      break;
  }

  // Alcohol consumption
  switch (riskFactors.alcohol) {
    case "Over 4 Times per Week":
      riskScore += 4;
      break;
    case "2-3 Times per Week":
      riskScore += 3;
      break;
    case "2-4 Times per Month":
      riskScore += 2;
      break;
    case "Monthly or Less":
      riskScore += 1;
      break;
  }

  // Dietary habits
  const { dietaryHabits } = riskFactors;
  if (!dietaryHabits.regularMeals) riskScore += 1;
  if (dietaryHabits.frequentSnacks) riskScore += 1;
  if (dietaryHabits.processedFoods) riskScore += 2;
  if (dietaryHabits.sodaJuices) riskScore += 2;
  if (dietaryHabits.restaurantFood) riskScore += 1;

  // Determine risk level
  let riskLevel = "";
  if (riskScore > 15) riskLevel = "HIGH";
  else if (riskScore > 8) riskLevel = "MODERATE";
  else riskLevel = "LOW";

  return { riskScore, riskLevel };
};

module.exports = { calculateLiverRiskHelper };
