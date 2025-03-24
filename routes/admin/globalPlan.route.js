const router = require("express").Router();

const {
  addGlobalPlan,
  getAllGlobalPlans,
  getGlobalPlanById,
  updateGlobalPlan,
  deleteGlobalPlanById,
  getAllGlobalPlansCategory,
  getAllBooleanFeatureNamesGlobalPlans,
  getAllCountFeatureNamesGlobalPlans,
  getAllGlobalPlansToShowOnDashboardForIndividualUser,
} = require("../../controllers/globalPlan/globalPlan.controller.js");
const {
  checkPermissions,
  verifyToken,
} = require("../../middlewares/jwt/permission.js");

router.post(
  "/admin/global-plans",
  verifyToken,
  checkPermissions("CREATE", "Superadmin"),
  addGlobalPlan
);

// get all global plans
router.get(
  "/admin/global-plans",
  verifyToken,
  checkPermissions("READ", "Superadmin"),
  getAllGlobalPlans
);
// get all global plans = to show on dashboard for individual user

router.get(
  "/admin/global-plans/individual-user-dashboard",
  verifyToken,
  // checkPermissions("READ", "Superadmin"),
  getAllGlobalPlansToShowOnDashboardForIndividualUser
);
// update global plab by id
router.patch(
  "/admin/global-plans/:globalPlanId",
  verifyToken,
  checkPermissions("UPDATE", "Superadmin"),
  updateGlobalPlan
);
// delete
router.delete(
  "/admin/global-plans/:globalPlanId",
  verifyToken,
  checkPermissions("DELETE", "Superadmin"),
  deleteGlobalPlanById
);
// get single plan by id global plab by id
router.post(
  "/admin/global-plan",
  verifyToken,
  checkPermissions("READ", "Superadmin"),
  getGlobalPlanById
);
router.get(
  "/admin/global-plan/categories",
  verifyToken,
  checkPermissions("READ", "Superadmin"),
  getAllGlobalPlansCategory
);
router.get(
  "/admin/global-plan/boolean-featurelist",
  // verifyToken,
  // checkPermissions("READ", "Superadmin"),
  getAllBooleanFeatureNamesGlobalPlans
);

router.get(
  "/admin/global-plan/count-featurelist",
  // verifyToken,
  // checkPermissions("READ", "Superadmin"),
  getAllCountFeatureNamesGlobalPlans
);

module.exports = router;
