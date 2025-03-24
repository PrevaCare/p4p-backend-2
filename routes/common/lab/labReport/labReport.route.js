const router = require("express").Router();
const {
  createlabReport,
} = require("../../../../controllers/common/lab/labReport/labReport.controller.js");
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

router.post(
  "/app/lab-report",
  verifyToken,
  checkPermissions("CREATE", "Employee"),
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
  createlabReport
);

//
router.get(
  "/admin/lab-reports",
  verifyToken,
  // checkPermissions("CREATE", "Employee"), // admin and doctor
  getBothLabReportOfAllUsers
);
router.get(
  "/admin/lab-reports-p4p",
  verifyToken,
  checkPermissions("READ", "Employee"), // admin and doctor
  getAllLabReportFromP4p
);

module.exports = router;
