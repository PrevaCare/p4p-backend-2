const router = require("express").Router();
const {
  getLabTests,
  getLabPackages,
  getLabTestsByCategory,
  getLabPackagesByCategory,
  getLabHomeCollection,
} = require("../../../controllers/common/lab/labUserFacing.controller.js");
const { verifyToken } = require("../../../middlewares/jwt/permission.js");

/**
 * Get all tests offered by a specific lab
 * @route GET /api/labs/:labId/tests
 * Requirements: labId, category (optional), Authentication
 * Access: Authenticated users only
 */
router.get("/api/labs/:labId/tests", verifyToken, getLabTests);

/**
 * Get all packages offered by a specific lab
 * @route GET /api/labs/:labId/packages
 * Requirements: labId, category (optional), Authentication
 * Access: Authenticated users only
 */
router.get("/api/labs/:labId/packages", verifyToken, getLabPackages);

/**
 * Get all tests in a category from a lab
 * @route GET /api/labs/:labId/tests/by-category/:category
 * Requirements: labId, category, Authentication
 * Access: Authenticated users only
 */
router.get(
  "/api/labs/:labId/tests/by-category/:category",
  verifyToken,
  getLabTestsByCategory
);

/**
 * Get all packages in a category from a lab
 * @route GET /api/labs/:labId/packages/by-category/:category
 * Requirements: labId, category, Authentication
 * Access: Authenticated users only
 */
router.get(
  "/api/labs/:labId/packages/by-category/:category",
  verifyToken,
  getLabPackagesByCategory
);

/**
 * Get home collection availability for a lab
 * @route GET /api/labs/:labId/home-collection
 * Requirements: labId, cityId (optional), Authentication
 * Access: Authenticated users only
 */
router.get(
  "/api/labs/:labId/home-collection",
  verifyToken,
  getLabHomeCollection
);

module.exports = router;
