const router = require("express").Router();
const { upload } = require("../../middlewares/uploads/multerConfig.js");

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
const BooleanFeature = require("../../models/plans/BooleanFeature.model.js");
const CountFeature = require("../../models/plans/CountFeature.model.js");

router.post(
  "/admin/global-plans",
  verifyToken,
  checkPermissions("CREATE", "Superadmin"),
  upload.fields([{ name: "imagefile", maxCount: 1 }]),
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

// Keep the original route to support existing clients
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
