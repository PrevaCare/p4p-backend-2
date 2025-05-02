const express = require("express");
const router = express.Router();
const doctorCategoriesController = require("../../../controllers/common/doctor/doctorCategories.controller");
const { upload } = require("../../../middlewares/uploads/multerConfig");
const {
  verifyToken,
  checkPermissions,
} = require("../../../middlewares/jwt/permission");

// Create a new doctor category with image upload (admin and superadmin only)
router.post(
  "/common/doctor/categories",
  verifyToken,
  upload.single("image"), // Handle image upload
  doctorCategoriesController.createDoctorCategory
);

// Get all doctor categories (public)
router.get(
  "/common/doctor/categories",
  doctorCategoriesController.getAllDoctorCategories
);

// Get a specific doctor category by ID (public)
router.get(
  "/common/doctor/categories/:id",
  doctorCategoriesController.getDoctorCategory
);

// Find doctors by category name (public)
router.get(
  "/common/doctor/by-category/:categoryName",
  doctorCategoriesController.findDoctorsByCategory
);

// Find doctors directly by specialization (public)
router.get(
  "/common/doctor/by-specialization/:specialization",
  doctorCategoriesController.findDoctorsBySpecialization
);

// Update a doctor category with image upload (admin and superadmin only)
router.patch(
  "/common/doctor/categories/:id",
  verifyToken,
  upload.single("image"), // Handle image upload
  doctorCategoriesController.updateDoctorCategory
);

// Soft delete a doctor category (admin and superadmin only)
router.delete(
  "/common/doctor/categories/:id",
  verifyToken,
  doctorCategoriesController.deleteDoctorCategory
);

// Hard delete a doctor category (admin and superadmin only)
router.delete(
  "/common/doctor/categories/:id/hard",
  verifyToken,
  doctorCategoriesController.hardDeleteDoctorCategory
);

module.exports = router;
