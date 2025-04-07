const router = require("express").Router();

const {
  deleteLabById,
} = require("../../../controllers/auth/deleteUser.controller.js");
const {
  createIndividualLabTest,
  searchIndividualLabTest,
  getTestsByCategory,
  getAllTestOfParticularLab,
  getTestByCategoryOfPaticularLab,
} = require("../../../controllers/common/lab/individualLabTest/individualLabTest.controller.js");
const {
  createLab,
  getAllLabs,
  getLabById,
  updateLab,
  getLabsByLocation
} = require("../../../controllers/common/lab/lab.controller.js");
const {
  getAllCategoryOfPackageOfParticularLab,
  getAllTestOfParticularCategoryOfPackageOfParticularLab,
  getSingleLabPackageById,
  updateLabPackageById,
  deleteLabPackageById,
  searchLabPackages,
  getPackagesByCategory,
  getAllPackagesOfParticularLab,
  getPackagesByCategoryOfPaticularLab
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

// router.post(
//   "/admin/lab",
//   verifyToken,
//   checkPermissions("CREATE", "Employee"),
//   createLab
// );
router.post(
  "/admin/lab",
  upload.fields([{ name: "logo", maxCount: 1 }]),
  verifyToken,
  // checkPermissions("CREATE", "Employee"),
  createLab
);
// update
router.patch(
  "/admin/lab/:labId",
  upload.fields([{ name: "logo", maxCount: 1 }]),
  verifyToken,
  // checkPermissions("UPDATE", "Employee"),
  updateLab
);

//
router.get(
  "/admin/labs",
  verifyToken,
  // checkPermissions("READ", "Employee"), // admin and doctor
  getAllLabs
);

router.post(
  "/admin/labs/location",
  verifyToken,
  // checkPermissions("READ", "Employee"), // admin and doctor
  getLabsByLocation
);
// get single lab by id
router.post(
  "/admin/lab-detail",
  verifyToken,
  // checkPermissions("READ", "Employee"), // admin and doctor
  getLabById
);

// lab package -- create
router.post(
  "/admin/lab/pacakge",
  verifyToken,
  checkPermissions("CREATE", "Employee"),
  createLabPackage
);
router.patch(
  "/admin/lab/pacakge/:packageId",
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
  getPackagesByCategory,
);
// lab package -- get category only
router.post(
  "/admin/lab/pacakge-single",
  verifyToken,
  // checkPermissions("READ", "Employee"),
  getSingleLabPackageById
);

// individual lab test
// lab package -- create
router.post(
  "/admin/lab/individual-test",
  verifyToken,
  // checkPermissions("CREATE", "Employee"),
  createIndividualLabTest
);

router.post(
  "/admin/tests/search",
  verifyToken,
  // checkPermissions("CREATE", "Employee"),
  searchIndividualLabTest
);

router.get(
  "/admin/tests/byCategory",
  verifyToken,
  // checkPermissions("CREATE", "Employee"),
  getTestsByCategory
);

router.get(
  "/admin/labs/:labId/tests",
  verifyToken,
  // checkPermissions("CREATE", "Employee"),
  getAllTestOfParticularLab
);

router.get(
  "/admin/labs/:labId/packages",
  verifyToken,
  // checkPermissions("CREATE", "Employee"),
  getAllPackagesOfParticularLab
);

router.get(
  "/admin/labs/:labId/test/by-category/:category",
  verifyToken,
  // checkPermissions("CREATE", "Employee"),
  getTestByCategoryOfPaticularLab
);

router.get(
  "/admin/labs/:labId/packages/by-category/:category",
  verifyToken,
  // checkPermissions("CREATE", "Employee"),
  getPackagesByCategoryOfPaticularLab
);

router.delete("/admin/lab/:labId", verifyAndSuperAdmin, deleteLabById);
module.exports = router;
