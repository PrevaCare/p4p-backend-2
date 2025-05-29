const router = require("express").Router();
const {
  getDashboardData,
  getRecentAddedUsers,
  getTeleconsultationData,
  getInPersonConsultationData,
  getCorporateSalesData,
  getIndividualSalesData,
} = require("../../controllers/superAdmin/dashboard");

router.get("/admin/dashboard", getDashboardData);
router.get("/admin/recent-users", getRecentAddedUsers);
router.get("/admin/teleconsultation-data", getTeleconsultationData);
router.get("/admin/in-person-consultation-data", getInPersonConsultationData);
router.get("/admin/corporate-sales-data", getCorporateSalesData);
router.get("/admin/individual-sales-data", getIndividualSalesData);
module.exports = router;
