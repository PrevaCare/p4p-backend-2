const router = require("express").Router();
const { verifyToken } = require("../../../middlewares/jwt/permission");
const { checkRoleAccess } = require("../../../middlewares/jwt/roleAccess");
const {
  checkPatientSelfAccess,
} = require("../../../middlewares/jwt/patientAccess");

const {
  createCoronaryHeartDisease,
  getDataToCreateCoronaryHeartDisease,
  getCoronaryDataScoreAndDateByEmployeeId,
} = require("../../../controllers/patient/riskAssessments/coronaryHeartDisease.controller");

const {
  createDiabeticRiskCalculator,
  getAllDiabeticRiskCalculatorDateAndRisk,
} = require("../../../controllers/patient/riskAssessments/diabeticRiskCalculator.controller");

const {
  createStrokeRiskCalculator,
  getAllStrokeRiskCalculatorDateAndLowerHigherVal,
} = require("../../../controllers/patient/riskAssessments/strokeRiskCalculate.controller");

const {
  createLiverRiskCalculator,
  getAllLiverRiskCalculator,
} = require("../../../controllers/patient/riskAssessments/liverRiskCalculate.controller");

const {
  createStressRiskCalculator,
  getAllStressRiskCalculator,
} = require("../../../controllers/patient/riskAssessments/stressRiskCalculate.controller");

const {
  createDepressionRiskCalculator,
  getAllDepressionRiskCalculator,
} = require("../../../controllers/patient/riskAssessments/depressionRiskCalculate.controller");

// Common middleware for all routes
const patientRiskAssessmentMiddleware = [
  verifyToken,
  checkRoleAccess(["IndividualUser", "Employee"]),
  checkPatientSelfAccess,
];

// Coronary Heart Disease Routes
router.post(
  "/app/patient/coronaryheart-diseases",
  patientRiskAssessmentMiddleware,
  createCoronaryHeartDisease
);

router.get(
  "/app/patient/coronaryheart-diseases",
  patientRiskAssessmentMiddleware,
  getCoronaryDataScoreAndDateByEmployeeId
);

// Diabetic Risk Calculator Routes
router.post(
  "/app/patient/diabetic-risk-calc",
  patientRiskAssessmentMiddleware,
  createDiabeticRiskCalculator
);

router.post(
  "/app/patient/diabetic-risk-calcs",
  patientRiskAssessmentMiddleware,
  getAllDiabeticRiskCalculatorDateAndRisk
);

// Stroke Risk Calculator Routes
router.post(
  "/app/patient/stroke-risk-calc",
  patientRiskAssessmentMiddleware,
  createStrokeRiskCalculator
);

router.post(
  "/app/patient/stroke-risk-calcs",
  patientRiskAssessmentMiddleware,
  getAllStrokeRiskCalculatorDateAndLowerHigherVal
);

// Liver Risk Calculator Routes
router.post(
  "/app/patient/liver-risk-calc",
  patientRiskAssessmentMiddleware,
  createLiverRiskCalculator
);

router.post(
  "/app/patient/liver-risk-calcs",
  patientRiskAssessmentMiddleware,
  getAllLiverRiskCalculator
);

// Stress Risk Calculator Routes
router.post(
  "/app/patient/stress-risk-calc",
  patientRiskAssessmentMiddleware,
  createStressRiskCalculator
);

router.post(
  "/app/patient/stress-risk-calcs",
  patientRiskAssessmentMiddleware,
  getAllStressRiskCalculator
);

// Depression Risk Calculator Routes
router.post(
  "/app/patient/depression-risk-calc",
  patientRiskAssessmentMiddleware,
  createDepressionRiskCalculator
);

router.post(
  "/app/patient/depression-risk-calcs",
  patientRiskAssessmentMiddleware,
  getAllDepressionRiskCalculator
);

module.exports = router;
