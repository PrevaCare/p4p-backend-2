/**
 * Perceived Stress Scale (PSS) Question Mapping
 * This file provides a mapping between question keys and their full text descriptions
 */

const pssQuestions = {
  unexpectedEvents:
    "In the last month, how often have you been upset because of something that happened unexpectedly?",
  controlImportantThings:
    "In the last month, how often have you felt that you were unable to control the important things in your life?",
  nervousStressed:
    "In the last month, how often have you felt nervous and stressed?",
  handleProblems:
    "In the last month, how often have you felt confident about your ability to handle your personal problems?",
  goingYourWay:
    "In the last month, how often have you felt that things were going your way?",
  copeWithThings:
    "In the last month, how often have you found that you could not cope with all the things that you had to do?",
  controlIrritations:
    "In the last month, how often have you been able to control irritations in your life?",
  onTopOfThings:
    "In the last month, how often have you felt that you were on top of things?",
  outsideControl:
    "In the last month, how often have you been angered because of things that happened that were outside of your control?",
  difficultiesPilingUp:
    "In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?",
};

// Response options
const responseOptions = {
  0: "Never",
  1: "Almost Never",
  2: "Sometimes",
  3: "Fairly Often",
  4: "Very Often",
};

// Questions requiring reverse scoring (positive statements)
const reverseScoreQuestions = [
  "handleProblems",
  "goingYourWay",
  "controlIrritations",
  "onTopOfThings",
];

// Stress level interpretation
const stressLevelInterpretation = {
  Low: {
    range: "0-13",
    description: "Low stress level",
    recommendation:
      "Great job maintaining a low stress level! Continue practicing relaxation techniques like mindfulness or meditation to keep your stress in check.",
  },
  Moderate: {
    range: "14-26",
    description: "Moderate stress level",
    recommendation:
      "Consider incorporating regular physical activity and deep-breathing exercises into your routine to manage stress more effectively.",
  },
  High: {
    range: "27-40",
    description: "High stress level",
    recommendation:
      "It's important to prioritize self-care. Try engaging in activities that you enjoy and consider seeking support from friends, family, or a mental health professional.",
  },
};

module.exports = {
  pssQuestions,
  responseOptions,
  reverseScoreQuestions,
  stressLevelInterpretation,
};
