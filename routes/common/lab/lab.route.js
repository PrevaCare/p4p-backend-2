const router = require("express").Router();
const {
  validateLabData,
  validateLabUpdateData,
} = require("../../../middlewares/validation/labValidation");

const {
  deleteLabById,
} = require("../../../controllers/auth/deleteUser.controller.js");
const {
  createIndividualLabTest,
  searchIndividualLabTest,
  getTestsByCategory,
  getAllTestOfParticularLab,
  getTestByCategoryOfPaticularLab,
  updateIndividualLabTest,
  deleteIndividualLabTest,
} = require("../../../controllers/common/lab/individualLabTest/individualLabTest.controller.js");
const {
  createLab,
  getAllLabs,
  getLabById,
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
  "/admin/lab",
  verifyToken,
  checkPermissions("CREATE", "Employee"),
  upload.fields([{ name: "logo", maxCount: 1 }]),
  // validateLabData,
  createLab
);

// Update existing lab
router.patch(
  "/admin/lab/:labId",
  verifyToken,
  checkPermissions("UPDATE", "Employee"),
  upload.fields([{ name: "logo", maxCount: 1 }]),
  // validateLabUpdateData,
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
router.post(
  "/admin/lab/:labId",
  verifyToken,
  checkPermissions("READ", "Employee"),
  getLabById
);

// Get labs by location
router.post(
  "/admin/labs/location",
  verifyToken,
  checkPermissions("READ", "Employee"),
  getLabsByLocation
);

// Delete lab
router.delete(
  "/admin/lab/:labId",
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
  searchIndividualLabTest
);

router.get(
  "/admin/tests/byCategory",
  verifyToken,
  checkPermissions("READ", "Employee"),
  getTestsByCategory
);

router.get(
  "/admin/labs/:labId/tests",
  verifyToken,
  checkPermissions("READ", "Employee"),
  getAllTestOfParticularLab
);

router.get(
  "/admin/labs/:labId/test/by-category/:category",
  verifyToken,
  checkPermissions("READ", "Employee"),
  getTestByCategoryOfPaticularLab
);

router.get(
  "/admin/labs/:labId/packages",
  verifyToken,
  // checkPermissions("CREATE", "Employee"),
  getAllPackagesOfParticularLab
);

router.get(
  "/admin/labs/:labId/packages/by-category/:category",
  verifyToken,
  // checkPermissions("CREATE", "Employee"),
  getPackagesByCategoryOfPaticularLab
);

module.exports = router;
