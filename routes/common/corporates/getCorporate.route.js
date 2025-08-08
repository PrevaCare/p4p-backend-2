const router = require("express").Router();

const {
  getAllCorporateEmployees,
  getEmployeeEmrs,
  getListOfAssignedDoctorsOfEmployee,
  getAllCorporateEmployeesOfParticularCorporateById,
  getListOfAssignedDoctorsOfCorporate,
  healthScoreCalculationEmrData,
  getListOfAssignedDoctorsOfCorporateForDashboard,
  getListOfAssignedDoctorByPatientId,
  getCorrporateInfoByEmployeeId,
} = require("../../../controllers/common/corporates/employees/getEmployees.controller");
const {
  getAllCorporates,
  getSingleCorporateById,
} = require("../../../controllers/common/corporates/getCorporate.controller");
// const { createEMR } = require("../../controllers/patient/emr/emr.controller");
const { verifyAndDoctor } = require("../../../middlewares/jwt/verifyToken");
const {
  verifyToken,
  checkPermissions,
} = require("../../../middlewares/jwt/permission");
const {
  updateEmployeeById,
} = require("../../../controllers/common/corporates/employees/updateEmployee.controller");
const { upload } = require("../../../middlewares/uploads/multerConfig");
const {
  updateCorporateById,
} = require("../../../controllers/common/corporates/updateCorporate.controller");
const {
  createOrUpdateAndScore,
  getCorporateScoreByCalculatingEachEmployees,
  getLatestHealthScore,
} = require("../../../controllers/common/corporates/employees/healthScore/healthScore.controller");
const {
  downloadSampleHealthScoreTemplate,
  bulkCreateOrUpdateHealthScore,
} = require("../../../controllers/common/corporates/employees/healthScore/healthScoreGenerationThroughExcel.controller");
const {
  generateCorporateHealthCertificate,
  generateCorporateEmployeeFitnessCertificate,
} = require("../../../controllers/common/corporates/healthCertificate.controller");
const {
  healthTrackerController,
} = require("../../../controllers/common/patient/latestHealthData/getLatestHealthData.controller");

const {
  generateRiskAssessmentPDF,
} = require("../../../controllers/common/corporates/employees/emr/generateRiskAssessmentPdf.controller.js");
const {
  generateHealthAssessmentPDF,
} = require("../../../controllers/common/corporates/employees/emr/generateHealthAssessmentPdf.controller.js");
const { logRequest } = require("../../../middlewares/RequestLog");

// Risk Assessment PDF Route
router.post(
  "/common/generate-risk-assessment-pdf",
  verifyToken,
  generateRiskAssessmentPDF
);

// Health Assessment PDF Route
router.post(
  "/common/generate-health-assessment-pdf",
  verifyToken,
  generateHealthAssessmentPDF
);

router.get(
  "/common/corporates",
  verifyToken,
  checkPermissions("READ", "Corporate"),
  getAllCorporates
);
router.post(
  "/common/corporate",
  verifyToken,
  checkPermissions("READ", "Corporate"),
  getSingleCorporateById
);
// corporate dashboard health score data
router.get(
  "/common/corporate/dashboard-healthscore",
  verifyToken,
  checkPermissions("READ", "Corporate"),
  getCorporateScoreByCalculatingEachEmployees
);

// employees;
router.post(
  "/common/corporate/employees/emr-health-score-data",
  verifyToken,
  checkPermissions("READ", "Corporate"), // login user should have permission related to
  healthScoreCalculationEmrData
);
router.get(
  "/common/corporate/employees",
  verifyToken,
  checkPermissions("READ", "Corporate"), // login user should have permission related to
  getAllCorporateEmployees
);

// app
router.post(
  "/app/patient/assigned-doctors",
  verifyToken,
  // checkPermissions("READ", "Corporate"), // login user should have permission related to
  getListOfAssignedDoctorByPatientId
);
router.post(
  "/app/employee/corporate-info",
  verifyToken,
  // checkPermissions("READ", "Corporate"), // login user should have permission related to
  getCorrporateInfoByEmployeeId
);
// get employee and emr data for emr page in app
router.get(
  "/app/employee/emrs",
  verifyToken,
  checkPermissions("READ", "Employee"),
  getEmployeeEmrs
);
// router.post(
//   "/app/employees",
//   verifyToken,
//   // checkPermissions("READ", "Employee"),
//   healthTrackerController.getLatestHealthData
// );
// router.get(
//   "/app/employees-test-emr/:patientId",
//   // verifyToken,
//   // checkPermissions("READ", "Employee"),
//   healthTrackerController.getLatestHealthData
// );
router.post(
  "/app/patient/latest-health-data",
  verifyToken,
  logRequest,
  // checkPermissions("READ", "Employee"),
  healthTrackerController.getLatestHealthData
);
router.post(
  "/app/patient/health-scores",
  verifyToken,
  // checkPermissions("READ", "Employee"),
  healthTrackerController.getHealthScoreByPatientId
);

// get list of all the asssigned doctor of an employee
router.post(
  "/app/corporate-assigneddoctors",
  verifyToken,
  checkPermissions("READ", "Employee"),
  getListOfAssignedDoctorsOfEmployee
);
router.post(
  "/app/employees-assigneddoctors",
  verifyToken,
  checkPermissions("READ", "Employee"),
  getListOfAssignedDoctorsOfCorporateForDashboard
);
router.post(
  "/admin/corporates/assigneddoctors",
  verifyToken,
  checkPermissions("READ", "Corporate"),
  getListOfAssignedDoctorsOfCorporate
);
// particular corporate all employees
router.post(
  "/admin/corporate-employees",
  verifyToken,
  checkPermissions("READ", "Employee"),
  getAllCorporateEmployeesOfParticularCorporateById
);

// update an corporate by id
router.patch(
  "/admin/corporate/:corporateid",
  verifyToken,
  upload.fields([{ name: "logo", maxCount: 1 }]),
  checkPermissions("UPDATE", "Corporate"),
  updateCorporateById
);
// update an employee by id
router.patch(
  "/admin/employees/:employeeid",
  verifyToken,
  upload.fields([{ name: "profileImg", maxCount: 1 }]),
  checkPermissions("UPDATE", "Employee"),
  updateEmployeeById
);

// <============ health score ===========>
// health score create;
router.post(
  "/common/corporate/employees/health-score",
  verifyToken,
  checkPermissions("READ", "Corporate"), // login user should have permission related to
  createOrUpdateAndScore
);

router.get(
  "/common/corporate/employees/health-score/:userId",
  verifyToken,
  checkPermissions("READ", "Corporate"), // login user should have permission related to
  getLatestHealthScore
);

// generate bullk excel for corporate employee.

router.get(
  "/common/corporate/employees/health-score/download-sample-excel",
  verifyToken,
  // checkPermissions("READ", "Corporate"), // login user should have permission related to
  downloadSampleHealthScoreTemplate
);
router.post(
  "/common/corporate/employees/health-score/excel",
  verifyToken,
  // checkPermissions("READ", "Corporate"), // login user should have permission related to
  upload.single("file"),
  bulkCreateOrUpdateHealthScore
);

// <============ health Certificate ===========>
router.post(
  "/common/corporate/health-certificate-pdf",
  // verifyToken,
  // checkPermissions("READ", "Corporate"), // login user should have permission related to
  generateCorporateHealthCertificate
);
router.post(
  "/common/corporate/employee/fitness-certificate-pdf",
  // verifyToken,
  // checkPermissions("READ", "Corporate"), // login user should have permission related to
  generateCorporateEmployeeFitnessCertificate
);

module.exports = router;
