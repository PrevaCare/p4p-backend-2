const router = require("express").Router();

const {
  createEMR,
} = require("../../../controllers/common/patient/createEmr.controller");
const {
  getSingleEmployeesDetailById,
} = require("../../../controllers/patient/corporate/viewCorporateEmployees");
const {
  createInsurance,
} = require("../../../controllers/patient/insurance/insurance.controller");
const {
  verifyToken,
  checkPermissions,
} = require("../../../middlewares/jwt/permission");
const { verifyAndDoctor } = require("../../../middlewares/jwt/verifyToken");
const { upload } = require("../../../middlewares/uploads/multerConfig");

// create emr
router.post("/common/patients/create-emr", verifyAndDoctor, createEMR);

router.post(
  "/common/corporate-employee",
  verifyToken,
  checkPermissions("READ", "Corporate"),
  getSingleEmployeesDetailById
);

// create insurance
router.post(
  "/app/insurance",
  verifyToken,
  checkPermissions("CREATE", "Employee"), // wiil do later
  upload.fields([{ name: "insuranceFile", maxCount: 1 }]),
  createInsurance
);

module.exports = router;
