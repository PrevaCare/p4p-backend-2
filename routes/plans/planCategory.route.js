const express = require("express");
const router = express.Router();
const planCategoryController = require("../../controllers/plans/planCategory.controller");
const { upload } = require("../../middlewares/uploads/multerConfig");
const {
  verifyToken,
  verifyAndSuperAdmin
} = require("../../middlewares/jwt/verifyToken");

// Create a new plan category
router.post(
  "/",
  verifyAndSuperAdmin,
  upload.single("image"),
  planCategoryController.createPlanCategory
);

// Get all plan categories
router.get("/", planCategoryController.getAllPlanCategories);

// Update display order
router.patch(
  "/update-order",
  verifyAndSuperAdmin,
  planCategoryController.updateCategoriesOrder
);

// Get a single plan category
router.get("/:id", planCategoryController.getPlanCategory);

// Update a plan category
router.patch(
  "/:id",
  verifyAndSuperAdmin,
  upload.single("image"),
  planCategoryController.updatePlanCategory
);

// Soft delete a plan category
router.delete("/:id", verifyAndSuperAdmin, planCategoryController.deletePlanCategory);

module.exports = router; 