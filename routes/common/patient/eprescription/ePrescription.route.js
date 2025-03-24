const {
  createEMRPDF,
} = require("../../../../controllers/common/corporates/employees/emr/generateEMRPdf.controller");
const {
  getListOfExistingPatientEprescription,
} = require("../../../../controllers/common/corporates/employees/existingPatientEPrescription/existingPatientEprescription.controller");
const {
  createEPrescription,
} = require("../../../../controllers/patient/eprescription/eprescription.controller");
const {
  getAllEPrescriptionListPaginatedByUserId,
} = require("../../../../controllers/patient/eprescription/getEprescription.controller");
const { verifyToken } = require("../../../../middlewares/jwt/permission");

const router = require("express").Router();

router.post("/admin/eprescription", createEPrescription);

// emr pdf
router.post("/admin/emr-pdf", createEMRPDF);
// <======== mobile app routes ========>
router.post(
  "/app/users/eprescriptions",
  verifyToken,
  getListOfExistingPatientEprescription
);

// paginated eprescriptoins
router.post(
  "/admin/patient/eprescription-list",
  getAllEPrescriptionListPaginatedByUserId
);

module.exports = router;
