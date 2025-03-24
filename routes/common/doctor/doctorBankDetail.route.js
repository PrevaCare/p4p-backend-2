const {
  doctorBankDetailController,
} = require("../../../controllers/common/doctor/doctorBankDetail.controller");
const express = require("express");
const router = express.Router();
const {
  verifyToken,
  checkPermissions,
} = require("../../../middlewares/jwt/permission");

// create
router.post(
  "/common/doctor/bank-details",
  verifyToken,
  doctorBankDetailController.addBankDetail
);
// update
router.patch(
  "/common/doctor/bank-details/:doctorBankDetailId",
  verifyToken,
  doctorBankDetailController.updateBankDetailById
);

router.delete(
  "/common/doctor/bank-details/:doctorBankDetailId",
  verifyToken,
  doctorBankDetailController.deleteBankDetailById
);

router.get(
  "/common/doctor/bank-details/:doctorBankDetailId",
  verifyToken,
  doctorBankDetailController.getBankDetailById
);

router.get(
  "/common/doctor/bank-details",
  verifyToken,
  doctorBankDetailController.getAllBankDetails
);

router.get(
  "/common/doctor/bank-details/:doctorId/all",
  verifyToken,
  doctorBankDetailController.getBankDetailsByDoctorId
);

module.exports = router;
