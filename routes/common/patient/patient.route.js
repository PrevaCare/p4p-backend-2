const router = require("express").Router();

const {
  createEMR,
} = require("../../../controllers/common/patient/createEmr.controller");
const {
  deleteEmr,
  deleteEPrescription,
  deleteReport,
  deleteLabReport,
} = require("../../../controllers/common/patient/deleteMedicalRecords.controller");
const {
  getSingleEmployeesDetailById,
} = require("../../../controllers/patient/corporate/viewCorporateEmployees");
const {
  createInsurance,
  getAllUserInsurance
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

router.get(
  "/app/insurance",
  verifyToken,
  checkPermissions("CREATE", "Employee"), // wiil do later
  getAllUserInsurance
);
// create insurance
router.post(
  "/app/insurance",
  verifyToken,
  checkPermissions("CREATE", "Employee"), // wiil do later
  upload.fields([{ name: "insuranceFile", maxCount: 1 }]),
  createInsurance
);

// Delete medical records
router.delete("/admin/patient/emr/:emrId", verifyToken, deleteEmr);

router.delete(
  "/admin/patient/eprescription/:ePrescriptionId",
  verifyToken,
  deleteEPrescription
);

router.delete("/admin/report/:reportId", verifyToken, deleteReport);

router.delete("/admin/lab-report/:labReportId", verifyToken, deleteLabReport);

module.exports = router;
