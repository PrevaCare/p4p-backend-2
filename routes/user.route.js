const router = require("express").Router();
const {
  register,
  login,
  logout,
  refreshAccessToken,
  forgotPassword,
  updatePassword,
  appLogin,
  verifyOtpAndLogin,
  registerIndividualUser,
} = require("../controllers/auth/auth.controller.js");
const {
  deleteEmployeeOrIndividualUser,
  deleteDoctorById,
  deleteCorporateUser,
} = require("../controllers/auth/deleteUser.controller.js");
const {
  getNotificationCountByUserId,
  getAllNotifications,
  markReadNotificationById,
} = require("../controllers/common/notifications/notifications.controller.js");
const {
  createPermissionsAndRoles,
} = require("../controllers/rolesAndPermission.controller.js");
const {
  getAppUserDetails,
  getUserPlans,
  updateUserDetails,
  getUserPackages
} = require("../controllers/user/appUser.controller.js");
const { getUserById } = require("../controllers/user/getUser.controller.js");
const {
  changeUserType,
} = require("../controllers/user/changeUserType.controller.js");
const {
  verifyToken,
  verifyAndSuperAdmin,
} = require("../middlewares/jwt/verifyToken");
const {
  verifyAndAuthoriseToken,
  verifySuperAdmin,
  verifyAndDoctor,
} = require("../middlewares/jwt/verifyToken");
const { upload } = require("../middlewares/uploads/multerConfig.js");

// Admin registration with multiple file uploads
const adminUploadFields = [
  { name: "logo", maxCount: 1 },
  { name: "medicalRegistrationProof", maxCount: 1 },
  { name: "medicalDegreeProof", maxCount: 1 },
  { name: "profileImg", maxCount: 1 },
  { name: "pregnancyData[ultrasoundScan]", maxCount: 1 },
  { name: "pregnancyData[otherReport]", maxCount: 1 },
  { name: "pregnancyData[trimesterScreening]", maxCount: 1 },
  { name: "currentReport", maxCount: 3 },
];

router.post(
  "/admin/register",
  upload.fields(adminUploadFields),
  verifyToken,
  register
);

// Individual user registration
router.post(
  "/individual/user/register",
  upload.fields([{ name: "profileImg", maxCount: 1 }]),
  verifyToken,
  register
);

router.post(
  "/individual/user/register/individualUser",
  upload.fields([{ name: "profileImg", maxCount: 1 }]),
  // verifyToken,
  registerIndividualUser
);

router.post("/admin/change-user-type", verifyAndSuperAdmin, changeUserType);

router.post("/admin/login", login);
router.post("/admin/logout", verifyAndAuthoriseToken, logout);
router.post(
  "/admin/refresh-token",
  verifyAndAuthoriseToken,
  refreshAccessToken
);

// forgot password
router.post("/admin/forgot-password", forgotPassword);
router.patch("/admin/update-password/:resetToken", updatePassword);

router.post("/admin/users", getUserById);

// app
router.post("/app/user/login", appLogin);
router.post("/app/user/verify-otp", verifyOtpAndLogin);

router.get("/app/user/details", verifyAndAuthoriseToken, getAppUserDetails);

//  roles and permissions
router.post(
  "/admin/permissions/create",
  verifyAndSuperAdmin,
  createPermissionsAndRoles
);

// delete user route
router.delete(
  "/admin/patient-delete/:patientId",
  verifyAndSuperAdmin,
  deleteEmployeeOrIndividualUser
);

router.delete(
  "/app/patient-delete/:patientId",
  verifyAndAuthoriseToken,
  deleteEmployeeOrIndividualUser
);

// doctor delete
router.delete(
  "/admin/doctor-delete/:doctorId",
  verifyAndSuperAdmin,
  deleteDoctorById
);
// corporate delete
router.delete(
  "/admin/corporate-delete/:corporateId",
  verifyAndSuperAdmin,
  deleteCorporateUser
);

//  notifications routes
router.get(
  "/admin/notification-counts",
  verifyToken,
  getNotificationCountByUserId
);
router.get("/admin/notifications", verifyToken, getAllNotifications);
router.post(
  "/admin/notifications-mark-read",
  verifyToken,
  markReadNotificationById
);

router.get(
  "/app/user-plans",
  verifyToken,
  getUserPlans // All the plans is grouped by service/package
)

router.get(
  "/app/user/packages",
  verifyToken,
  getUserPackages // Retrieved all the plans
)

router.post(
  "/app/user/update",
  verifyToken,
  upload.fields([{ name: "profileImg", maxCount: 1 }]),
  updateUserDetails
)

module.exports = router;
