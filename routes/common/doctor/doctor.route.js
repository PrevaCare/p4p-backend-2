const router = require("express").Router();
const { verifyToken } = require("../../../middlewares/jwt/permission");
const { checkRoleAccess } = require("../../../middlewares/jwt/roleAccess");
const {
  viewDoctorAvailability,
} = require("../../../controllers/common/doctor/doctorAvailability.controller");

// Doctor availability endpoint restricted to individual users and employees
router.post(
  "/app/doctor/availabilities",
  verifyToken,
  checkRoleAccess(["IndividualUser", "Employee"]),
  viewDoctorAvailability
);

module.exports = router;
