const {
  corporateDashboardStressLevelOfYourOrganization,
  corporateDashboard10YearASCVDOfYourOrganization,
  corporateDashboardExistingComorbiditiesOfYourOrganization,
  corporateDashboardMentalStressOfYourOrganization,
  corporateDashboardLabAnalysisReportOfYourOrganization,
} = require("../../../controllers/common/corporates/corporateDashboardGraph.controller");
const {
  corporateDashboardTable,
} = require("../../../controllers/common/corporates/corporateDashboardTable.controller");
const { verifyToken } = require("../../../middlewares/jwt/permission");

const router = require("express").Router();

// get corporate dashboard table
router.post(
  "/corporates/dashboard/top-employees",
  //   verifyToken,
  // checkPermissions("READ", "Corporate"), // login user should have permission related to
  corporateDashboardTable
);
router.post(
  "/corporates/dashboard/stress-level-organization",
  //   verifyToken,
  // checkPermissions("READ", "Corporate"), // login user should have permission related to
  corporateDashboardStressLevelOfYourOrganization
);
router.post(
  "/corporates/dashboard/ten-year-ascvd",
  //   verifyToken,
  // checkPermissions("READ", "Corporate"), // login user should have permission related to
  corporateDashboard10YearASCVDOfYourOrganization
);
router.post(
  "/corporates/dashboard/existing-combordities",
  //   verifyToken,
  // checkPermissions("READ", "Corporate"), // login user should have permission related to
  corporateDashboardExistingComorbiditiesOfYourOrganization
);
router.post(
  "/corporates/dashboard/mental-health-disorder",
  //   verifyToken,
  // checkPermissions("READ", "Corporate"), // login user should have permission related to
  corporateDashboardMentalStressOfYourOrganization
);
router.post(
  "/corporates/dashboard/lab-report-analysis",
  //   verifyToken,
  // checkPermissions("READ", "Corporate"), // login user should have permission related to
  corporateDashboardLabAnalysisReportOfYourOrganization
);
module.exports = router;
