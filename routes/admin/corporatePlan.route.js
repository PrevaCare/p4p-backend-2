const router = require("express").Router();

const {
  addCorporatePlan,
  getAllCorporatePlans,
  getAllCorporatePlansToShowOnDashboard,
  getSingleCorporatePlanByCorporatePlanId,
  getSingleCorporatePlanByCorporatePlanIdAllFields,
  deleteCorporatePlanById,
} = require("../../controllers/corporatePlan/corporatePlan.controller.js");
const {
  checkPermissions,
  verifyToken,
} = require("../../middlewares/jwt/permission.js");

router.post(
  "/admin/corporate-plans",
  verifyToken,
  checkPermissions("CREATE", "Superadmin"),
  addCorporatePlan
);
router.get(
  "/admin/corporate-plans",
  verifyToken,
  // checkPermissions("CREATE", "Superadmin"),
  getAllCorporatePlans
);
router.post(
  "/admin/corporate-plans/dashboardcard",
  verifyToken,
  // checkPermissions("CREATE", "Superadmin"),
  getAllCorporatePlansToShowOnDashboard
);
router.post(
  "/admin/corporate-plans/single",
  verifyToken,
  // checkPermissions("CREATE", "Superadmin"),
  getSingleCorporatePlanByCorporatePlanId
);
router.post(
  "/admin/corporate-plans/single-all-fields",
  verifyToken,
  // checkPermissions("CREATE", "Superadmin"),
  getSingleCorporatePlanByCorporatePlanIdAllFields
);
router.delete(
  "/admin/corporate-plans/:corporatePlanId",
  verifyToken,
  // checkPermissions("CREATE", "Superadmin"),
  deleteCorporatePlanById
);

module.exports = router;
