const {
  getAllSchools,
} = require("../../../controllers/common/schools/viewSchools.controller");
const { checkPermissions } = require("../../../middlewares/jwt/permission");
const { verifyToken } = require("../../../middlewares/jwt/permission");
const { verifyAndDoctor } = require("../../../middlewares/jwt/verifyToken");

const router = require("express").Router();

router.get(
  "/common/schools",
  verifyToken,
  checkPermissions("READ", "School"),
  getAllSchools
);

module.exports = router; // Corrected export statement
