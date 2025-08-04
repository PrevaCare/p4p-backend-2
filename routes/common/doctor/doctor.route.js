const router = require("express").Router();
const { verifyToken } = require("../../../middlewares/jwt/permission");
const { checkRoleAccess } = require("../../../middlewares/jwt/roleAccess");
const {
  viewDoctorAvailability,
} = require("../../../controllers/common/doctor/doctorAvailability.controller");
const {
  getCategoryOfDoctor,
  getDoctorByCategory,
} = require("../../../controllers/doctors/viewDoctors");

// Doctor availability endpoint restricted to individual users and employees
router.post(
  "/app/doctor/availabilities",
  verifyToken,
  checkRoleAccess(["IndividualUser", "Employee"]),
  viewDoctorAvailability
);

// Doctor categories endpoint restricted to individual users and employees
router.get(
  "/app/doctor-categories",
  verifyToken,
  checkRoleAccess(["IndividualUser", "Employee"]),
  getCategoryOfDoctor
);

// Doctor by category endpoint restricted to individual users and employees
router.post(
  "/app/doctor-by-category",
  verifyToken,
  checkRoleAccess(["IndividualUser", "Employee"]),
  getDoctorByCategory
);

module.exports = router;
