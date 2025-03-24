const {
  getAllInstitutes,
} = require("../../../controllers/common/institute/getInstitute.controller");

const {
  verifyToken,
  checkPermissions,
} = require("../../../middlewares/jwt/permission");

const router = require("express").Router();

router.get(
  "/common/institutes",
  verifyToken,
  checkPermissions("READ", "Institute"),
  getAllInstitutes
);

module.exports = router; // Corrected export statement
