const {
  downloadSampleExcelFileToCreateEMR,
  createAllEmployeeEmrThroughExcel,
} = require("../../../controllers/common/corporates/employees/emr/createEmrThroughExcel.controller");
const {
  getEmrPdfByemrId,
  getEPrescriptionPdfById,
  getEmrPdfLinkByemrId,
  getEPrescriptionPdfLinkByemrId,
} = require("../../../controllers/common/corporates/employees/emr/generateEMRPdf.controller");
const {
  getSingleEmployeeAllEmrForCard,
  getIndividualEmployeeEmr,
  getLastEmrOfCorporateEmployee,
  getInitialEmrFormData,
} = require("../../../controllers/common/corporates/employees/emr/getEmployeesEmr.controller");
const {
  getListOfEMRsMobile,
  getAllEmrListPaginatedByUserId,
} = require("../../../controllers/common/corporates/employees/existingPatientEMR/existingPatientEMR.controller");
const {
  verifyToken,
  checkPermissions,
} = require("../../../middlewares/jwt/permission");
const { upload } = require("../../../middlewares/uploads/multerConfig");

const router = require("express").Router();

router.post(
  "/common/emrs",
  verifyToken,
  checkPermissions("READ", "Employee"),
  getSingleEmployeeAllEmrForCard
);

router.post(
  "/common/emr",
  verifyToken,
  // checkPermissions("READ", "Employee"),
  getIndividualEmployeeEmr
);
router.post(
  "/common/last-emr/employee",
  verifyToken,
  // checkPermissions("READ", "Employee"),
  getLastEmrOfCorporateEmployee
);

// list of mobile emrs
router.post(
  "/app/users/emrs",
  verifyToken,
  // checkPermissions("READ", "Employee"),
  getListOfEMRsMobile
);

// < ============== Medical records api's ============>
// paginated emr medical record admin
router.post(
  "/admin/patients/medical-records/emr-list",
  verifyToken,
  // checkPermissions("READ", "Employee"),
  getAllEmrListPaginatedByUserId
);

// sample csv download - to create emr

router.post(
  "/admin/corporate/emr-template",
  downloadSampleExcelFileToCreateEMR
);

router.post(
  "/admin/corporate/emr-thorugh-excel",
  upload.fields([{ name: "sampleemr", maxCount: 1 }]),
  verifyToken,
  createAllEmployeeEmrThroughExcel
);

// test emr pdf create usisng emrid
router.post("/admin/patient/emr-pdf-view", verifyToken, getEmrPdfByemrId);
router.post("/admin/patient/emr-pdf-link", verifyToken, getEmrPdfLinkByemrId);
router.post(
  "/admin/patient/eprescription-pdf-link",
  verifyToken,
  getEPrescriptionPdfLinkByemrId
);
router.post(
  "/admin/patient/eprescription-pdf-view",
  verifyToken,
  getEPrescriptionPdfById
);

router.post(
  "/admin/patient/emr-initialize",
  verifyToken,
  getInitialEmrFormData
);

module.exports = router;
