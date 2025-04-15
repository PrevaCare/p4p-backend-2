const router = require("express").Router();
const {
  createlabReport,
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
  checkPermissions,
  verifyToken,
} = require("../../../../middlewares/jwt/permission.js");
const { upload } = require("../../../../middlewares/uploads/multerConfig.js");
const {
  searchRateLimit,
  retrievalRateLimit,
  modificationRateLimit,
  uploadRateLimit,
} = require("../../../../helper/rateLimitOnRoute/labApiRateLimit.route");

router.post(
  "/app/lab-report",
  verifyToken,
  checkPermissions("CREATE", "Employee"),
  uploadRateLimit,
  createExistingPatientLabReport
);
router.post(
  "/admin/lab-report",
  upload.fields([
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
  upload.fields([{ name: "logo", maxCount: 1 }, { name: "labReportFile" }]),
  verifyToken,
  // checkPermissions("CREATE", "Employee"), // admin and doctor
  uploadRateLimit,
  createReport
);

router.get(
  "/admin/reports/:userId",
  verifyToken,
  // checkPermissions("CREATE", "Employee"), // admin and doctor
  retrievalRateLimit,
  getReportsByUser
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

module.exports = router;
