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
} = require("../controllers/user/appUser.controller.js");
const { getUserById } = require("../controllers/user/getUser.controller.js");
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
router.post(
  "/admin/register",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "medicalRegistrationProof", maxCount: 1 },
    { name: "medicalDegreeProof", maxCount: 1 },
    { name: "profileImg", maxCount: 1 },
    { name: "pregnancyData[ultrasoundScan]", maxCount: 1 },
    { name: "pregnancyData[otherReport]", maxCount: 1 },
    { name: "pregnancyData[trimesterScreening]", maxCount: 1 },
    { name: "currentReport", maxCount: 3 },
  ]),

  // verifySuperAdmin,
  verifyToken,
  register
);

// individual user register
router.post(
  "/individual/user/register",
  upload.fields([{ name: "profileImg", maxCount: 1 }]),
  // verifyToken, -- here instead check whether registering user is individual user.
  register
);
// router.post(
//   "/admin/corporate/register",
//   // upload.fields([{ name: "logo", maxCount: 1 }]),

//   // upload.fields([{ name: "medicalRegistrationProof", maxCount: 1 }]),
//   // upload.fields([{ name: "medicalDegreeProof", maxCount: 1 }]),

//   // verifySuperAdmin,
//   register
// );
// router.post(
//   "/admin/doctor/register",
//   upload.fields([
//     { name: "medicalRegistrationProof", maxCount: 1 },
//     { name: "medicalDegreeProof", maxCount: 1 },
//   ]),
// upload.fields([{ name: "medicalDegreeProof", maxCount: 1 }]),

// verifySuperAdmin,
//   register
// );
// router.post(
//   "/admin/register",
//   upload.fields([{ name: "logo", maxCount: 1 }]),
//   upload.fields([{ name: "medicalRegistrationProof", maxCount: 1 }]),
//   // upload.fields([{ name: "medicalDegreeProof", maxCount: 1 }]),

//   // verifySuperAdmin,
//   register
// );
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

module.exports = router;
