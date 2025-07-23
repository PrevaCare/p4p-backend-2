const router = require("express").Router();
const {
  createlabReport,
  getLabPartners,
  getLabPartnerPackages,
  getLabPartnerPackageById,
  getAllLabPartnerPackages
} = require("../../../../controllers/common/lab/labReport/labReport.controller.js");
const {
  createReport,
  getReportsByUser,
} = require("../../../../controllers/common/lab/labReport/report.controller.js");
const {
  createExistingPatientLabReport,
} = require("../../../../controllers/common/lab/labReport/ExistingPatientLabReport.controller.js");
const {
  getBothLabReportOfAllUsers,
  getAllLabReportFromP4p,
} = require("../../../../controllers/common/lab/labReport/getLabReport.controller.js");
const {
  getPaginatedLabReportsByUserId,
  getLabReportPdf,
  deleteLabReport,
} = require("../../../../controllers/common/lab/labReport/getPaginatedLabReport.controller.js");

const {
  checkPermissions,
  verifyToken,
} = require("../../../../middlewares/jwt/permission.js");
const {
  upload,
  pdfUpload,
  anyFileUpload,
} = require("../../../../middlewares/uploads/multerConfig.js");
const {
  uploadRateLimit,
  retrievalRateLimit,
} = require("../../../../helper/rateLimitOnRoute/labApiRateLimit.route.js");

router.post(
  "/app/lab-report",
  verifyToken,
  checkPermissions("CREATE", "Employee"),
  uploadRateLimit,
  createExistingPatientLabReport
);

router.get("/admin/lab-partners", verifyToken, checkPermissions('READ', 'Superadmin'), getLabPartners);
router.get("/admin/lab-partner-packages", verifyToken, checkPermissions('READ', 'Superadmin'), getAllLabPartnerPackages);
router.get("/app/lab-partners", verifyToken, getLabPartners);
router.get(
  "/app/lab-partner-packages/:labId",
  verifyToken,
  getLabPartnerPackages
);
router.get(
  "/app/lab-partners-package/:packageId",
  verifyToken,
  getLabPartnerPackageById
);
router.post(
  "/admin/lab-report",
  anyFileUpload.fields([
    { name: "logo", maxCount: 1 },
    { name: "labReportFile", maxCount: 1 },
  ]),
  verifyToken,
  // checkPermissions("CREATE", "Employee"), // admin and doctor
  uploadRateLimit,
  createlabReport
);

router.post(
  "/admin/report",
  anyFileUpload.fields([
    { name: "logo", maxCount: 1 },
    { name: "labReportFile" },
  ]),
  verifyToken,
  // checkPermissions("CREATE", "Employee"), // admin and doctor
  createReport
);

router.get(
  "/admin/reports/:userId",
  verifyToken,
  // checkPermissions("CREATE", "Employee"), // admin and doctor
  retrievalRateLimit,
  getReportsByUser
);

router.get(
  "/app/lab-reports",
  verifyToken,
  checkPermissions("READ", "Employee"),
  retrievalRateLimit,
  getBothLabReportOfAllUsers
);
//
router.get(
  "/admin/lab-reports",
  verifyToken,
  // checkPermissions("CREATE", "Employee"), // admin and doctor
  retrievalRateLimit,
  getBothLabReportOfAllUsers
);
router.get(
  "/admin/lab-reports-p4p",
  verifyToken,
  checkPermissions("READ", "Employee"), // admin and doctor
  retrievalRateLimit,
  getAllLabReportFromP4p
);

// New routes for paginated lab reports
router.get(
  "/admin/lab-reports/:userId",
  verifyToken,
  getPaginatedLabReportsByUserId
);

router.get("/admin/lab-report/:reportId/pdf", verifyToken, getLabReportPdf);

// Delete lab report route
router.delete(
  "/admin/lab-report/:reportId",
  verifyToken,
  // checkPermissions("DELETE", "Employee"), // admin, doctor, and super admin
  deleteLabReport
);

module.exports = router;
