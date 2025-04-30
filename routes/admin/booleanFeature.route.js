const router = require("express").Router();
const {
  addBooleanFeature,
  getAllBooleanFeatures,
  getBooleanFeatureById,
  updateBooleanFeature,
  deleteBooleanFeature,
} = require("../../controllers/booleanFeature/booleanFeature.controller.js");
const {
  checkPermissions,
  verifyToken,
} = require("../../middlewares/jwt/permission.js");

// Create a new boolean feature
router.post(
  "/admin/boolean-features",
  verifyToken,
  checkPermissions("CREATE", "Superadmin"),
  addBooleanFeature
);

// Get all boolean features
router.get(
  "/admin/boolean-features",
  verifyToken,
  checkPermissions("READ", "Superadmin"),
  getAllBooleanFeatures
);

// Get boolean feature by id
router.get(
  "/admin/boolean-features/:featureId",
  verifyToken,
  checkPermissions("READ", "Superadmin"),
  getBooleanFeatureById
);

// Update boolean feature
router.patch(
  "/admin/boolean-features/:featureId",
  verifyToken,
  checkPermissions("UPDATE", "Superadmin"),
  updateBooleanFeature
);

// Delete boolean feature
router.delete(
  "/admin/boolean-features/:featureId",
  verifyToken,
  checkPermissions("DELETE", "Superadmin"),
  deleteBooleanFeature
);

module.exports = router;
