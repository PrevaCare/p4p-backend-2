const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middlewares/verifyToken');
const validator = require('../../middlewares/validator');
const {
  createUserMedicineScheduleSchema,
  updateUserMedicineScheduleSchema
} = require('../../validators/patient/userMedicineSchedule.validation');
const {
  getUserMedicineSchedules,
  createUserMedicineSchedule,
  updateUserMedicineSchedule,
  deleteUserMedicineSchedule
} = require('../../controllers/patient/userMedicineSchedule.controller');

// Get all medicine schedules for a user
router.get('/', verifyToken, getUserMedicineSchedules);

// Create a new medicine schedule
router.post(
  '/',
  verifyToken,
  validator(createUserMedicineScheduleSchema),
  createUserMedicineSchedule
);

// Update a medicine schedule
router.put(
  '/:scheduleId',
  verifyToken,
  validator(updateUserMedicineScheduleSchema),
  updateUserMedicineSchedule
);

// Delete a medicine schedule
router.delete('/:scheduleId', verifyToken, deleteUserMedicineSchedule);

module.exports = router;
