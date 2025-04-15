const router = require("express").Router();
const {
  importLabTests,
  importLabPackages,
  updateLabPartnerCityStatus,
  updateTestAvailabilityInCity,
  updatePackageAvailabilityInCity,
} = require("../../../controllers/common/lab/labAdmin.controller.js");
const {
  getLabDetailsById,
} = require("../../../controllers/common/lab/lab.controller.js");
const { csvUpload } = require("../../../utils/csvParser.js");
const {
  checkPermissions,
  verifyToken,
} = require("../../../middlewares/jwt/permission.js");

/**
 * Get lab details by ID
 * GET /admin/lab/:labId
 * Requirements: Auth token
 */
// router.post(
//   "/admin/lab/:labId",
//   verifyToken,
//   checkPermissions("READ", "Employee"),
//   getLabDetailsById
// );

/**
 * Import tests from CSV for a lab partner
 * POST /admin/lab-partner/import-tests
 * Requirements: Auth token, CSV file, Lab partner ID
 */
router.post(
  "/admin/lab-partner/import-tests",
  verifyToken,
  checkPermissions("CREATE", "Employee"),
  csvUpload.single("csvFile"),
  importLabTests
);

/**
 * Import packages from CSV for a lab partner
 * POST /admin/lab-partner/import-packages
 * Requirements: Auth token, CSV file, Lab partner ID
 */
router.post(
  "/admin/lab-partner/import-packages",
  verifyToken,
  checkPermissions("CREATE", "Employee"),
  csvUpload.single("csvFile"),
  importLabPackages
);

/**
 * Enable/disable a city for a lab partner
 * PATCH /admin/lab-partner/:partnerId/city/:cityId/change-status
 * Requirements: Auth token, Partner ID, City ID, Status (boolean)
 * Body format: { status: boolean }
 */
router.patch(
  "/admin/lab-partner/:partnerId/city/:cityId/change-status",
  verifyToken,
  checkPermissions("UPDATE", "Employee"),
  updateLabPartnerCityStatus
);

/**
 * Update test availability and pricing for multiple cities
 * PATCH /admin/lab-partner/:labpartnerId/tests/:testId/cities/change-status
 * Requirements: Auth token, Partner/Test IDs, Array of city updates
 * Body format: Array of objects with:
 * - cityId or pinCode
 * - status (boolean)
 * - Optional when status is true: labSellingPrice, offeredPriceToPrevaCare,
 *   prevaCarePrice, discountPercentage, homeCollectionCharge, homeCollectionAvailable
 */
router.patch(
  "/admin/lab-partner/:labpartnerId/tests/:testId/cities/change-status",
  verifyToken,
  checkPermissions("UPDATE", "Employee"),
  updateTestAvailabilityInCity
);

/**
 * Update package availability and pricing in a city
 * PATCH /admin/lab-partner/:partnerId/packages/:packageId/cities/:cityId
 * Requirements: Auth token, Partner/Package/City IDs, Availability
 * Optional parameters: labSellingPrice, offeredPriceToPrevaCare, prevaCarePrice,
 * discountPercentage, homeCollectionCharge, homeCollectionAvailable
 * Note: When availability is true, all pricing fields are required
 */
router.patch(
  "/admin/lab-partner/:labpartnerId/packages/:packageId/cities/change-status",
  verifyToken,
  checkPermissions("UPDATE", "Employee"),
  updatePackageAvailabilityInCity
);

module.exports = router;
