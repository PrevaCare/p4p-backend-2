const router = require("express").Router();
const {
  getTestDetails,
  getPackageDetails,
  getLabDetails,
  getCategories,
  getTestsByLocation,
  getPackagesByLocation,
} = require("../../../controllers/common/lab/labDetails.controller.js");
const {
  checkPermissions,
  verifyToken,
} = require("../../../middlewares/jwt/permission.js");

/**
 * Get comprehensive details about a specific test
 * @route GET /api/tests/:testCode/details
 * Requirements: testCode, Authentication
 * Access: Authenticated users only
 */
router.get(
  "/api/tests/:testCode/details",
  verifyToken, // Require authentication
  getTestDetails
);

/**
 * Get comprehensive details about a package
 * @route GET /api/packages/:packageCode/details
 * Requirements: packageCode, Authentication
 * Access: Authenticated users only
 */
router.get(
  "/api/packages/:packageCode/details",
  verifyToken, // Require authentication
  getPackageDetails
);

/**
 * Get details about a specific lab
 * @route GET /api/labs/:labId/details
 * Requirements: labId, Authentication
 * Access: Authenticated users only
 */
router.get(
  "/api/labs/:labId/details",
  verifyToken, // Require authentication
  getLabDetails
);

/**
 * Get all available categories
 * @route GET /api/categories
 * Requirements: type ("test" or "package"), Authentication
 * Access: Authenticated users only
 */
router.get(
  "/api/categories",
  verifyToken, // Require authentication
  getCategories
);

/**
 * Find all tests in a location
 * @route GET /api/tests/by-location
 * Requirements: city/pincode, category (optional), home_collection (optional), Authentication
 * Access: Authenticated users only
 */
router.get(
  "/api/tests/by-location",
  verifyToken, // Require authentication
  getTestsByLocation
);

/**
 * Find all packages in a location
 * @route GET /api/packages/by-location
 * Requirements: city/pincode, category (optional), home_collection (optional), Authentication
 * Access: Authenticated users only
 */
router.get(
  "/api/packages/by-location",
  verifyToken, // Require authentication
  getPackagesByLocation
);

module.exports = router;
