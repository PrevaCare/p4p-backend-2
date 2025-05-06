/**
 * Patient Health Questionnaire (PHQ-9) Question Mapping
 * This file provides a mapping between question keys and their full text descriptions
 */

const phq9Questions = {
  interestPleasure: "Little interest or pleasure in doing things",
  downDepressedHopeless: "Feeling down, depressed, or hopeless",
  sleepIssues: "Trouble falling or staying asleep, or sleeping too much",
  tiredLowEnergy: "Feeling tired or having little energy",
  appetiteIssues: "Poor appetite or overeating",
  feelingBadFailure:
    "Feeling bad about yourself – or that you are a failure or have let yourself or your family down",
  concentrationIssues:
    "Trouble concentrating on things, such as reading the newspaper or watching television",
  movementIssues:
    "Moving or speaking so slowly that other people could have noticed? Or the opposite – being so fidgety or restless that you have been moving around a lot more than usual",
  selfHarmThoughts:
    "Thoughts that you would be better off dead or of hurting yourself in some way",
};

// Response options
const responseOptions = {
  0: "Not at all",
  1: "Several days",
  2: "More than half the days",
  3: "Nearly every day",
};

// Depression level interpretation
const depressionLevelInterpretation = {
  Minimal: {
    range: "0-4",
    description: "Minimal or none",
    recommendation: "Patient may not need depression treatment.",
  },
  Mild: {
    range: "5-9",
    description: "Mild depression",
    recommendation:
      "Use clinical judgment about treatment, based on patient's duration of symptoms and functional impairment.",
  },
  Moderate: {
    range: "10-14",
    description: "Moderate depression",
    recommendation:
      "Use clinical judgment about treatment, based on patient's duration of symptoms and functional impairment.",
  },
  ModeratelySevere: {
    range: "15-19",
    description: "Moderately severe depression",
    recommendation:
      "Treat using antidepressants, psychotherapy or a combination of treatment.",
  },
  Severe: {
    range: "20-27",
    description: "Severe depression",
    recommendation:
      "Treat using antidepressants with or without psychotherapy.",
  },
};

// Self-harm risk message
const selfHarmRiskMessage =
  "IMPORTANT: Patient indicated thoughts of self-harm or suicide. Immediate risk assessment is required.";

module.exports = {
  phq9Questions,
  responseOptions,
  depressionLevelInterpretation,
  selfHarmRiskMessage,
};
