const {
  createHealthTracker,
  updateHealthTracker,
} = require("../../controllers/common/patient/healthTracker/healthTracker.controller");
const {
  createPatienBloodGlucose,
  getAllPatientBloodGlucoseByDateRange,
  createPatienBloodGlucoseGoal,
  getCurrentPatienBloodGlucoseGoalByPatientId,
} = require("../../controllers/common/patient/healthTracker/patientBloodGlucose.controller");
const {
  getCurrentPatientBmiGoal,
  getAllPatientBmisByDateRange,
  createPatientBmi,
  createPatientBmiGoal,
} = require("../../controllers/common/patient/healthTracker/patientBmi.controller");
const {
  createPatienBp,
  getAllPatientBpByDateRange,
  createPatienBpGoal,
  getCurrentPatienBpGoalByPatientId,
} = require("../../controllers/common/patient/healthTracker/patientBp.controller");
const {
  createPatientMood,
  getSingleMood,
  getAllMoodByDateRange,
} = require("../../controllers/common/patient/healthTracker/patientMood.controller");
const {
  createPatientPrGoal,
  createPatientPr,
  getCurrentPatientPrGoal,
  getAllPatientPrByDateRange,
} = require("../../controllers/common/patient/healthTracker/patientPr.controller");
const {
  createPatientSleepGoal,
  getCurrentPatientSleepGoal,
  createOrUpdatePatientSleep,
  getAllPatientSleepByDateRange,
} = require("../../controllers/common/patient/healthTracker/patientSleep.controller");
const {
  createWaterIntakeGoal,
  getCurrentWaterIntakeGoalByPatientId,
  createWaterIntake,
  getAllWaterIntakeByDateRange,
} = require("../../controllers/common/patient/healthTracker/patientWaterIntake.controller");
const {
  createPatientWeightGoal,
  createPatientWeight,
  getAllPatientWeightsByDateRange,
  getCurrentPatientWeightGoal,
} = require("../../controllers/common/patient/healthTracker/patientWeight.controller");
const {
  checkPermissions,
  verifyToken,
} = require("../../middlewares/jwt/permission");
const {
  verifyAndAuthoriseToken,
} = require("../../middlewares/jwt/verifyToken");

const {
  createPatientSpo2Goal,
  createPatientSpo2,
  getAllPatientSpo2ByDateRange,
  getCurrentPatientSpo2Goal,
} = require("../../controllers/common/patient/healthTracker/patientSpo2.controller");

const {
  createPatientStress,
  getLatestStress,
  getAllStressByDateRange,
} = require("../../controllers/common/patient/healthTracker/patientStress.controller");

const {
  createPatientDepression,
  getLatestDepression,
  getAllDepressionByDateRange,
} = require("../../controllers/common/patient/healthTracker/patientDepression.controller");

const router = require("express").Router();

router.post(
  "/app/healthtracker",
  verifyToken,
  checkPermissions("CREATE", "Employee"),
  createHealthTracker
);

router.patch(
  "/app/healthtracker",
  verifyToken,
  checkPermissions("CREATE", "Employee"),
  updateHealthTracker
);

// <====================  patient bp ===============>
// goal
router.post(
  "/app/healthtracker/patientbp-goal",
  // verifyToken,
  verifyAndAuthoriseToken,

  createPatienBpGoal
);
router.post(
  "/app/healthtracker/patientbp-goals",
  // verifyToken,
  verifyAndAuthoriseToken,

  getCurrentPatienBpGoalByPatientId
);
// bp
router.post("/app/healthtracker/patientbp", verifyToken, createPatienBp);

router.post(
  "/app/healthtracker/patientbps",
  // verifyToken,
  verifyAndAuthoriseToken,

  getAllPatientBpByDateRange
);

// <====================  patient spo2 ==============>

router.post(
  "/app/healthtracker/patient-spo2-goal",
  // verifyToken,
  verifyAndAuthoriseToken,
  createPatientSpo2Goal
);

router.post(
  "/app/healthtracker/patient-spo2",
  // verifyToken,
  verifyAndAuthoriseToken,
  createPatientSpo2
);

router.post(
  "/app/healthtracker/patient-spo2-goals",
  // verifyToken,
  verifyAndAuthoriseToken,
  getCurrentPatientSpo2Goal
);

router.post(
  "/app/healthtracker/patient-spo2s",
  // verifyToken,
  verifyAndAuthoriseToken,
  getAllPatientSpo2ByDateRange
);

// <====================  patient blood glucose ===============>

router.post(
  "/app/healthtracker/patient-blood-glucose-goal",
  verifyToken,
  verifyAndAuthoriseToken,

  createPatienBloodGlucoseGoal
);
router.post(
  "/app/healthtracker/patient-blood-glucose-goals",
  verifyToken,
  verifyAndAuthoriseToken,

  getCurrentPatienBloodGlucoseGoalByPatientId
);

router.post(
  "/app/healthtracker/patient-blood-glucose",
  // verifyToken,
  // verifyAndAuthoriseToken,

  createPatienBloodGlucose
);

router.post(
  "/app/healthtracker/patient-blood-glucoses",
  // verifyToken,
  verifyAndAuthoriseToken,

  getAllPatientBloodGlucoseByDateRange
);

// <====================  water intake  ===============>
// goal
router.post(
  "/app/healthtracker/water-intake-goal",
  // verifyToken,
  verifyAndAuthoriseToken,

  createWaterIntakeGoal
);
router.post(
  "/app/healthtracker/water-intake-goals",
  // verifyToken,
  verifyAndAuthoriseToken,

  getCurrentWaterIntakeGoalByPatientId
);
// bp
router.post("/app/healthtracker/water-intake", verifyToken, createWaterIntake);

router.post(
  "/app/healthtracker/water-intakes",
  // verifyToken,
  verifyAndAuthoriseToken,

  getAllWaterIntakeByDateRange
);
// <====================  weight  ===============>

// goal
router.post(
  "/app/healthtracker/weight-goal",
  // verifyToken,
  verifyAndAuthoriseToken,

  createPatientWeightGoal
);
router.post(
  "/app/healthtracker/weight-goals",
  // verifyToken,
  verifyAndAuthoriseToken,

  getCurrentPatientWeightGoal
);

router.post("/app/healthtracker/weight", verifyToken, createPatientWeight);

router.post(
  "/app/healthtracker/weights",
  // verifyToken,
  verifyAndAuthoriseToken,

  getAllPatientWeightsByDateRange
);

// <====================  bmi  ===============>

// goal
router.post("/app/healthtracker/bmi-goal", verifyToken, createPatientBmiGoal);
router.post(
  "/app/healthtracker/bmi-goals",
  // verifyToken,
  verifyAndAuthoriseToken,

  getCurrentPatientBmiGoal
);

router.post("/app/healthtracker/bmi", verifyToken, createPatientBmi);

router.post(
  "/app/healthtracker/bmis",
  // verifyToken,
  verifyAndAuthoriseToken,

  getAllPatientBmisByDateRange
);

// <====================  pulse rate  ===============>

// goal
router.post(
  "/app/healthtracker/pr-goal",
  //  verifyToken,
  verifyAndAuthoriseToken,

  createPatientPrGoal
);
router.post(
  "/app/healthtracker/pr-goals",
  verifyAndAuthoriseToken,
  // verifyToken,
  getCurrentPatientPrGoal
);

router.post(
  "/app/healthtracker/pr",
  //  verifyToken,
  verifyAndAuthoriseToken,

  createPatientPr
);

router.post(
  "/app/healthtracker/prs",
  //  verifyToken,
  verifyAndAuthoriseToken,

  getAllPatientPrByDateRange
);
// <====================  sleep  ===============>

// goal
router.post(
  "/app/healthtracker/sleep-goal",
  // verifyToken,
  verifyAndAuthoriseToken,
  createPatientSleepGoal
);
router.post(
  "/app/healthtracker/sleep-goals",
  // verifyToken,
  verifyAndAuthoriseToken,
  getCurrentPatientSleepGoal
);

router.post(
  "/app/healthtracker/sleep",
  //  verifyToken,
  verifyAndAuthoriseToken,
  createOrUpdatePatientSleep
);

router.post(
  "/app/healthtracker/sleeps",
  // verifyToken,
  verifyAndAuthoriseToken,
  getAllPatientSleepByDateRange
);
// <====================  mood  ===============>
// goal
router.post(
  "/app/healthtracker/mood",
  // verifyToken,
  verifyAndAuthoriseToken,
  createPatientMood
);
router.post(
  "/app/healthtracker/mood-last",
  // verifyToken,
  verifyAndAuthoriseToken,
  getSingleMood
);

router.post(
  "/app/healthtracker/moods",
  // verifyToken,
  verifyAndAuthoriseToken,
  getAllMoodByDateRange
);

// <====================  stress  ===============>
router.post(
  "/app/healthtracker/stress",
  // verifyToken,
  verifyAndAuthoriseToken,
  createPatientStress
);

router.post(
  "/app/healthtracker/stress-last",
  // verifyToken,
  verifyAndAuthoriseToken,
  getLatestStress
);

router.post(
  "/app/healthtracker/stresses",
  // verifyToken,
  verifyAndAuthoriseToken,
  getAllStressByDateRange
);

// <====================  depression  ===============>
router.post(
  "/app/healthtracker/depression",
  // verifyToken,
  verifyAndAuthoriseToken,
  createPatientDepression
);

router.post(
  "/app/healthtracker/depression-last",
  // verifyToken,
  verifyAndAuthoriseToken,
  getLatestDepression
);

router.post(
  "/app/healthtracker/depressions",
  // verifyToken,
  verifyAndAuthoriseToken,
  getAllDepressionByDateRange
);

module.exports = router;
