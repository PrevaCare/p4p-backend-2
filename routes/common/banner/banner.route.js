const router = require("express").Router();

const {
  createBanner,
  getBanners,
  updateBanner,
  deleteBanner,
  updateOrder,
} = require("../../../controllers/common/banner/banner.controller");
const {
  verifyToken,
  checkPermissions,
} = require("../../../middlewares/jwt/permission");
const { upload } = require("../../../middlewares/uploads/multerConfig");

router.get(
  "/common/banner/list",
  verifyToken,
  getBanners
);

router.post(
  "/common/banner/create",
  verifyToken,
  checkPermissions("CREATE", "Superadmin"),
  upload.fields([{ name: "image", maxCount: 1 }]),
  createBanner
);

router.post(
  "/common/banner/update/:bannerId",
  verifyToken,
  checkPermissions("UPDATE", "Superadmin"),
  upload.fields([{ name: "image", maxCount: 1 }]),
  updateBanner
);

router.delete(
  "/common/banner/:bannerId",
  verifyToken,
  checkPermissions("DELETE", "Superadmin"),
  deleteBanner
);

router.patch(
  "/common/banner/update-order",
  verifyToken,
  checkPermissions("DELETE", "Superadmin"),
  updateOrder
)


module.exports = router;
