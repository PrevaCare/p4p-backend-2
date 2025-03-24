const Joi = require("joi");

const healthScoreValidation = Joi.object({
  // user: Joi.string().required(),
  user: Joi.any(),
  heartScore: Joi.object({
    totalCholesterol: Joi.number().required(),
    HDL: Joi.number().required(),
    LDL: Joi.number().required(),
    BP: Joi.object({
      sys: Joi.number().required(), // Systolic blood pressure
      dia: Joi.number().required(), // Diastolic blood pressure
    }).required(),
    PR: Joi.number().required(), // Pulse rate
    BMI: Joi.number().required(), // Body mass index
    alcoholIntake: Joi.boolean().default(false),
    smoking: Joi.boolean().default(false),
    overAllHeartScore: Joi.number().default(0),
  }).required(),
  gutScore: Joi.object({
    urea: Joi.number().required(),
    creatinine: Joi.number().required(),
    plasmaGlucose: Joi.number().required(),
    sleepingHours: Joi.number().required(),
    overAllGutScore: Joi.number().default(0),
  }).required(),
  mentalScore: Joi.object({
    phq9Score: Joi.number().required(), // PHQ-9 score for depression assessment
    stressRiskAssessmentScore: Joi.number().required(),
    overAllMentalScore: Joi.number().default(0),
  }).required(),
  metabolicScore: Joi.object({
    hemoglobin: Joi.number().required(),
    TLC: Joi.number().required(), // Total Leukocyte Count
    AST: Joi.number().required(), // Aspartate aminotransferase
    ALT: Joi.number().required(), // Alanine aminotransferase
    plasmaGlucose: Joi.number().required(),
    BMI: Joi.number().required(),
    overAllMetabolicScore: Joi.number().default(0),
  }).required(),
  overallHealthScore: Joi.number().default(0),
});

module.exports = { healthScoreValidation };
