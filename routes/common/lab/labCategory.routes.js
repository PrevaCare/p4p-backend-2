const express = require("express");
const router = express.Router();
const {
  createLabCategory,
  getAllLabCategories,
  updateLabCategory,
  deleteLabCategory,
} = require("../../../controllers/common/lab/labCategory.controller");
const {
  verifyToken,
  checkPermissions,
} = require("../../../middlewares/jwt/permission");

router.post(
  "/",
  verifyToken,
  checkPermissions("CREATE", "Employee"),
  createLabCategory
);
router.get("/", verifyToken, getAllLabCategories);
router.put(
  "/:id",
  verifyToken,
  checkPermissions("UPDATE", "Employee"),
  updateLabCategory
);
router.delete(
  "/:id",
  verifyToken,
  checkPermissions("DELETE", "Employee"),
  deleteLabCategory
);

module.exports = router;
