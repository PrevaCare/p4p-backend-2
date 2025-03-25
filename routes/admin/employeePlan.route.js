const router = require("express").Router();

const {
  addEmployeePlan,
  getAllCorporateEmployeePlansToShowOnDashboard,
  getSingleCorporateEmployeePlanByEmployeePlanId,
  checkUserHasValidTeleConsultationPlan,
} = require("../../controllers/employeePlan/employeePlan.controller.js");
const {
  checkPermissions,
  verifyToken,
} = require("../../middlewares/jwt/permission.js");

router.post(
  "/admin/corporate/employee-plans",
  verifyToken,
  //   checkPermissions("CREATE", "Superadmin"),
  addEmployeePlan
);
// router.get(
//   "/admin/corporate-plans",
//   verifyToken,
//   checkPermissions("CREATE", "Superadmin"),
//   getAllCorporatePlans
// );
router.post(
  "/admin/corporate/employee-plans/dashboardcard",
  verifyToken,
  //   checkPermissions("CREATE", "Superadmin"),
  getAllCorporateEmployeePlansToShowOnDashboard
);
router.post(
  "/admin/corporate/employee-plans/single",
  verifyToken,
  // checkPermissions("CREATE", "Superadmin"),
  getSingleCorporateEmployeePlanByEmployeePlanId
);
router.post(
  "/app/patient/validate-tele-consultation-plan",
  verifyToken, // Modify to check if the doctor requests for the table-data for herself only
  // checkPermissions("CREATE", "Superadmin"),
  checkUserHasValidTeleConsultationPlan
);

// get all global plans
// router.get(
//   "/admin/global-plans",
//   verifyToken,
//   checkPermissions("READ", "Superadmin"),
//   getAllGlobalPlans
// );
// // update global plab by id
// router.patch(
//   "/admin/global-plans/:globalPlanId",
//   verifyToken,
//   checkPermissions("UPDATE", "Superadmin"),
//   updateGlobalPlan
// );
// // delete
// router.delete(
//   "/admin/global-plans/:globalPlanId",
//   verifyToken,
//   checkPermissions("DELETE", "Superadmin"),
//   deleteGlobalPlanById
// );
// // get single plan by id global plab by id
// router.post(
//   "/admin/global-plan",
//   verifyToken,
//   checkPermissions("READ", "Superadmin"),
//   getGlobalPlanById
// );
// router.get(
//   "/admin/global-plan/categories",
//   verifyToken,
//   // checkPermissions("READ", "Superadmin"),
//   getAllGlobalPlansCategory
// );

module.exports = router;
