const router = require("express").Router();

const {
  createDoctorAvailability,
  viewDoctorAvailability,
  updateDoctorAvailabilityStatus,
} = require("../../controllers/common/doctor/doctorAvailability.controller.js");
const {
  getAllDoctors,
  getSingleDoctorDetail,
  deleteDoctorById,
  updateDoctorById,
  getDoctorNameAndIds,
  getCategoryOfDoctor,
  getDoctorByCategory,
} = require("../../controllers/doctors/viewDoctors.js");
const {
  verifyToken,
  checkPermissions,
} = require("../../middlewares/jwt/permission.js");
const { verifyAndSuperAdmin } = require("../../middlewares/jwt/verifyToken.js");
const { upload } = require("../../middlewares/uploads/multerConfig.js");

router.get(
  "/admin/doctors",
  verifyToken,
  // checkPermissions("GET", "Doctor"),
  getAllDoctors
);
router.get(
  "/admin/doctor-name-ids",
  verifyToken,
  // checkPermissions("GET", "Doctor"),
  getDoctorNameAndIds
);

router.get(
  "/admin/doctor-categories",
  verifyToken,
  getCategoryOfDoctor
);

router.get(
  "/admin/doctor-by-category",
  verifyToken,
  getDoctorByCategory
);

// get single doctor detail
router.post(
  "/admin/doctor",
  //  verifySuperAdmin,
  getSingleDoctorDetail
);

// update
router.patch(
  "/admin/doctors/:doctorId",
  upload.fields([
    { name: "medicalRegistrationProof", maxCount: 1 },
    { name: "medicalDegreeProof", maxCount: 1 },
    { name: "profileImg", maxCount: 1 },
    { name: "eSign", maxCount: 1 },
  ]),
  verifyToken,

  // checkPermissions("UPDATE", "Doctor"),
  updateDoctorById
);

// delete doctor
router.delete(
  "/admin/doctors/:doctorId",
  verifyAndSuperAdmin,
  // checkPermissions("DELETE", "Doctor"),
  deleteDoctorById
);

// <============= doctor availability routes =================>
// create
router.post(
  "/admin/doctor/availability",
  verifyToken,
  createDoctorAvailability
);
router.post(
  "/admin/doctor/availabilities",
  verifyToken,
  viewDoctorAvailability
);
router.patch(
  "/admin/doctor/availabilities/:doctorId",
  verifyToken,
  // checkPermissions("UPDATE", "Doctor"),
  updateDoctorAvailabilityStatus
);

module.exports = router; // Corrected export statement
