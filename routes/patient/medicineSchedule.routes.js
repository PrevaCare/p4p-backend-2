const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middlewares/jwt/verifyToken");
const medicineScheduleController = require("../../controllers/patient/medicineSchedule.controller");

// 1. Get medicine schedules for Individual User - App API
router.get(
  "/app/medicine-schedules",
  verifyToken,
  medicineScheduleController.getMedicineSchedulesForUser
);

// 2. Create/update medicine schedule from EMR ID
router.post(
  "/app/medicine-schedules/emr/:emrId",
  verifyToken,
  medicineScheduleController.createOrUpdateScheduleFromEMR
);

// 3. Sync medicine schedule with updated EMR
router.put(
  "/app/medicine-schedules/emr/:emrId/sync",
  verifyToken,
  medicineScheduleController.syncScheduleWithEMR
);

// 4. Get medicine schedules from previous EMRs
router.get(
  "/app/medicine-schedules/emr-history",
  verifyToken,
  medicineScheduleController.getMedicineSchedulesFromEMRs
);

// 5. Add self-created medicine
router.post(
  "/app/medicine-schedules/medicine",
  verifyToken,
  medicineScheduleController.addSelfCreatedMedicine
);

// 6. Update medicine (both EMR and self-created)
router.put(
  "/app/medicine-schedules/:scheduleId/medicines/:medicineId",
  verifyToken,
  medicineScheduleController.updateMedicine
);

// 7. Delete medicine (only for self-created)
router.delete(
  "/app/medicine-schedules/:scheduleId/medicines/:medicineId",
  verifyToken,
  medicineScheduleController.deleteMedicine
);

// 8. Get medicine history
router.get(
  "/app/medicine-schedules/:scheduleId/medicines/:medicineId/history",
  verifyToken,
  medicineScheduleController.getMedicineHistory
);

// 9. Get corporate employee medicines from recent EMRs
router.get(
  "/corporate/employee/:employeeId/medicines",
  verifyToken,
  medicineScheduleController.getCorporateEmployeeMedicines
);

module.exports = router;
