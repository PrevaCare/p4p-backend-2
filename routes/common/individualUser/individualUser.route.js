const {
  getAllIndividualUsers,
  getSingleIndividualUserById,
} = require("../../../controllers/common/individualUser/getIndividualUser.controller");
const {
  updateIndividualUserById,
} = require("../../../controllers/common/individualUser/individualUser.controller");
const {
  addIndividualUserPlan,
  getAllIndividualUserPlansToShowOnDashboard,
  getSingleIndividualUserPlanIndividualUserPlanId,
} = require("../../../controllers/common/individualUser/individualUserPlan/individualUserPlan.controller");
const { verifyToken } = require("../../../middlewares/jwt/permission");
const { upload } = require("../../../middlewares/uploads/multerConfig");

const router = require("express").Router();

router.get("/common/individual-users", verifyToken, getAllIndividualUsers);
router.post(
  "/common/individual-users-detail-page",
  verifyToken,
  getSingleIndividualUserById
);

// update an employee by id
router.patch(
  "/common/individual-users/:individualUserId",
  verifyToken,
  upload.fields([{ name: "profileImg", maxCount: 1 }]),
  // checkPermissions("UPDATE", "Employee"),
  updateIndividualUserById
);

// <============ Individual User Plan ===========>
router.post("/individual-user/plans", verifyToken, addIndividualUserPlan);
router.post(
  "/individual-user/plans-dashboard",
  verifyToken,
  getAllIndividualUserPlansToShowOnDashboard
);
router.post(
  "/individual-user/plans-dashboard/single",
  verifyToken,
  getSingleIndividualUserPlanIndividualUserPlanId
);

module.exports = router;
