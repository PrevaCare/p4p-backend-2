const router = require("express").Router();
const {
  addCountFeature,
  getAllCountFeatures,
  getCountFeatureById,
  updateCountFeature,
  deleteCountFeature,
} = require("../../controllers/countFeature/countFeature.controller.js");
const {
  checkPermissions,
  verifyToken,
} = require("../../middlewares/jwt/permission.js");

// Create a new count feature
router.post(
  "/admin/count-features",
  verifyToken,
  checkPermissions("CREATE", "Superadmin"),
  addCountFeature
);

// Get all count features
router.get(
  "/admin/count-features",
  verifyToken,
  checkPermissions("READ", "Superadmin"),
  getAllCountFeatures
);

// Get count feature by id
router.get(
  "/admin/count-features/:featureId",
  verifyToken,
  checkPermissions("READ", "Superadmin"),
  getCountFeatureById
);

// Update count feature
router.patch(
  "/admin/count-features/:featureId",
  verifyToken,
  checkPermissions("UPDATE", "Superadmin"),
  updateCountFeature
);

// Delete count feature
router.delete(
  "/admin/count-features/:featureId",
  verifyToken,
  checkPermissions("DELETE", "Superadmin"),
  deleteCountFeature
);

module.exports = router;
