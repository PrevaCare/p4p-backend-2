const {
  getAllergiesFromLatestEmr,
  addAllergy,
} = require("../../../../controllers/patient/healthSummary/allergies.controller");
const {
  getCurrentConditionFromLatestEmr,
  addCurrentCondition,
} = require("../../../../controllers/patient/healthSummary/currentConditions.controller");
const {
  getImmunizationFromLatestEmr,
  addImmunization,
} = require("../../../../controllers/patient/healthSummary/immunization.controller");
const { upload } = require("../../../../middlewares/uploads/multerConfig");

const router = require("express").Router();

// <============ current conditions ==============>
// get current condition from the latest emr

router.post(
  "/patient/health-summary/current-conditions",
  getCurrentConditionFromLatestEmr
);
router.post(
  "/patient/health-summary/current-condition",
  upload.single("file"),
  addCurrentCondition
);

// <============ allergies ==============>

router.post(
  "/patient/health-summary/allergy",
  upload.single("file"),
  addAllergy
);
router.post("/patient/health-summary/allergies", getAllergiesFromLatestEmr);
// <============ immunizations ==============>

router.post(
  "/patient/health-summary/immunizations",
  getImmunizationFromLatestEmr
);
router.post(
  "/patient/health-summary/immunization",
  upload.single("file"),

  addImmunization
);

module.exports = router;
