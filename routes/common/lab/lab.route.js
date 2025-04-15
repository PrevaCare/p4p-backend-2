const router = require("express").Router();
const {
  validateAddLabData,
  validateLabUpdateData,
} = require("../../../middlewares/validation/labValidation");

const {
  searchRateLimit,
  retrievalRateLimit,
  modificationRateLimit,
  uploadRateLimit,
} = require("../../../helper/rateLimitOnRoute/labApiRateLimit.route");

const {
  deleteLabById,
} = require("../../../controllers/auth/deleteUser.controller.js");
const {
  createIndividualLabTest,
  searchIndividualLabTest,
  getTestsByCategory,
  getAllTestOfParticularLab,
  getTestByCategoryOfPaticularLab,
  getAllCategoriesOfTestsOfParticularLab,
  updateIndividualLabTest,
  deleteIndividualLabTest,
} = require("../../../controllers/common/lab/individualLabTest/individualLabTest.controller.js");
const {
  createLab,
  getAllLabs,
  getLabDetailsById,
  updateLab,
  getLabsByLocation,
  getAllCities,
} = require("../../../controllers/common/lab/lab.controller.js");
const {
  getAllCategoryOfPackageOfParticularLab,
  getAllTestOfParticularCategoryOfPackageOfParticularLab,
  getSingleLabPackageDetailsById,
  updateLabPackageById,
  deleteLabPackageById,
  searchLabPackages,
  getPackagesByCategory,
  getAllPackagesOfParticularLab,
  getPackagesByCategoryOfPaticularLab,
} = require("../../../controllers/common/lab/labPackage/getLabPackage.controller.js");
const {
  createLabPackage,
  updateLabPackage,
} = require("../../../controllers/common/lab/labPackage/labPackage.controller.js");
const {
  checkPermissions,
  verifyToken,
} = require("../../../middlewares/jwt/permission.js");
const {
  verifyAndSuperAdmin,
} = require("../../../middlewares/jwt/verifyToken.js");
const { upload } = require("../../../middlewares/uploads/multerConfig.js");

/**
 * Core Lab Management Routes
 */

// Create new lab
router.post(
  "/admin/lab/create",
  verifyToken,
  checkPermissions("CREATE", "Employee"),
  upload.fields([{ name: "logo", maxCount: 1 }]),
  validateAddLabData,
  createLab
);

// Update existing lab
router.put(
  "/admin/lab/:labId/update",
  verifyToken,
  checkPermissions("UPDATE", "Employee"),
  upload.fields([{ name: "logo", maxCount: 1 }]),
  validateLabUpdateData,
  updateLab
);

// Get all labs
router.get(
  "/admin/labs",
  verifyToken,
  checkPermissions("READ", "Employee"),
  getAllLabs
);

// Get lab by ID
// router.get(
//   "/admin/lab/:labId",
//   verifyToken,
//   checkPermissions("READ", "Employee"),
//   getLabDetailsById
// );

// Get labs by location
router.get(
  "/admin/labs/by-location",
  verifyToken,
  checkPermissions("READ", "Employee"),
  getLabsByLocation
);

// Delete lab
router.delete(
  "/admin/lab/:labId/delete",
  verifyToken,
  verifyAndSuperAdmin,
  deleteLabById
);

// Get all cities
router.get("/admin/cities", verifyToken, getAllCities);

// lab package -- create
router.post(
  "/admin/lab/pacakge/create",
  verifyToken,
  checkPermissions("CREATE", "Employee"),
  createLabPackage
);
router.patch(
  "/admin/lab/pacakge/:packageId/update",
  verifyToken,
  // checkPermissions("CREATE", "Employee"),
  updateLabPackage
);
// lab package -- get category only
router.post(
  "/admin/lab/pacakge/categories",
  verifyToken,
  // checkPermissions("READ", "Employee"),
  getAllCategoryOfPackageOfParticularLab
);

// Update package details by packageId
router.patch(
  "/admin/lab/pacakge/update/:packageId",
  verifyToken,
  // checkPermissions("UPDATE", "Employee"),
  updateLabPackageById
);

// Delete package details by packageId
router.delete(
  "/admin/lab/pacakge/delete/:packageId",
  verifyToken,
  // checkPermissions("DELETE", "Employee"),
  deleteLabPackageById
);

// lab package -- create
router.post(
  "/admin/lab/pacakge/packages",
  verifyToken,
  // checkPermissions("READ", "Employee"),
  getAllTestOfParticularCategoryOfPackageOfParticularLab
);

router.post(
  "/admin/packages/search",
  verifyToken,
  // checkPermissions("READ", "Employee"),
  searchLabPackages
);

router.get(
  "/admin/packages/byCategory",
  verifyToken,
  // checkPermissions("READ", "Employee"),
  getPackagesByCategory
);

// Add this validation middleware
const validatePackageDetailsRequest = (req, res, next) => {
  const { packageId, labId } = req.body;

  if (!packageId || packageId.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "packageId is required",
    });
  }

  if (!labId || labId.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "labId is required",
    });
  }

  next();
};

// Update the package-single route
// router.post(
//   "/admin/lab/package-single",
//   verifyToken,
//   // validatePackageDetailsRequest,
//   getSingleLabPackageDetailsById
// );
router.get(
  "/admin/lab/:labId/singlepackageinfo",
  verifyToken,
  // validatePackageDetailsRequest,
  getSingleLabPackageDetailsById
);

// Individual lab test routes
router.post(
  "/admin/lab/test/create",
  verifyToken,
  checkPermissions("CREATE", "Employee"),
  modificationRateLimit,
  createIndividualLabTest
);

router.patch(
  "/admin/lab/test/:testId",
  verifyToken,
  checkPermissions("UPDATE", "Employee"),
  updateIndividualLabTest
);

router.delete(
  "/admin/lab/test/:testId",
  verifyToken,
  checkPermissions("DELETE", "Employee"),
  deleteIndividualLabTest
);

router.post(
  "/admin/tests/search",
  verifyToken,
  checkPermissions("READ", "Employee"),
  searchRateLimit,
  searchIndividualLabTest
);

router.get(
  "/admin/tests/byCategory",
  verifyToken,
  checkPermissions("READ", "Employee"),
  retrievalRateLimit,
  getTestsByCategory
);

router.get(
  "/admin/labs/:labId/tests",
  verifyToken,
  checkPermissions("READ", "Employee"),
  retrievalRateLimit,
  getAllTestOfParticularLab
);

router.get(
  "/admin/labs/:labId/test/by-category/:category",
  verifyToken,
  checkPermissions("READ", "Employee"),
  retrievalRateLimit,
  getTestByCategoryOfPaticularLab
);

router.get(
  "/admin/labs/:labId/packages",
  verifyToken,
  // checkPermissions("CREATE", "Employee"),
  retrievalRateLimit,
  getAllPackagesOfParticularLab
);

router.get(
  "/admin/labs/:labId/packages/by-category/:category",
  verifyToken,
  // checkPermissions("CREATE", "Employee"),
  retrievalRateLimit,
  getPackagesByCategoryOfPaticularLab
);

// Get all categories of tests for a particular lab
router.post(
  "/admin/lab/test/categories",
  verifyToken,
  getAllCategoriesOfTestsOfParticularLab
);

// Get detailed lab information by ID
router.get(
  "/admin/lab/:labId/details",
  verifyToken,
  checkPermissions("READ", "Employee"),
  getLabDetailsById
);

module.exports = router;
