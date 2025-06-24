const PlanCategory = require("../../models/plans/planCategory.model");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const { handleFileUpload } = require("../../middlewares/uploads/awsConfig");

// Create a new plan category
exports.createPlanCategory = catchAsync(async (req, res, next) => {
  const { name, description, displayOrder } = req.body;

  if (!name) {
    return next(new AppError("Category name is required", 400));
  }

  let imageUrl = "";
  if (req.file) {
    try {
      imageUrl = await handleFileUpload(req.file);
    } catch (error) {
      return next(
        new AppError("Failed to upload image. Please try again.", 500)
      );
    }
  }

  const newCategory = await PlanCategory.create({
    name,
    description,
    image: imageUrl,
    displayOrder: displayOrder || 0,
  });

  res.status(201).json({
    status: "success",
    data: {
      category: newCategory,
    },
  });
});

// Get all plan categories
exports.getAllPlanCategories = catchAsync(async (req, res, next) => {
  const { search = "" } = req.query;

  const query = { isActive: true };
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const categories = await PlanCategory.find(query).sort({ displayOrder: 1 });

  res.status(200).json({
    status: "success",
    results: categories.length,
    data: {
      categories,
    },
  });
});

// Get a single plan category
exports.getPlanCategory = catchAsync(async (req, res, next) => {
  const category = await PlanCategory.findById(req.params.id);

  if (!category) {
    return next(new AppError("No category found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      category,
    },
  });
});

// Update a plan category
exports.updatePlanCategory = catchAsync(async (req, res, next) => {
  const updateData = { ...req.body };

  if (req.file) {
    try {
      updateData.image = await handleFileUpload(req.file);
    } catch (error) {
      return next(
        new AppError("Failed to upload image. Please try again.", 500)
      );
    }
  }

  const updatedCategory = await PlanCategory.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedCategory) {
    return next(new AppError("No category found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      category: updatedCategory,
    },
  });
});

// Soft delete a plan category
exports.deletePlanCategory = catchAsync(async (req, res, next) => {
  const category = await PlanCategory.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!category) {
    return next(new AppError("No category found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: null,
  });
});

// Update display order of plan categories
exports.updateCategoriesOrder = catchAsync(async (req, res, next) => {
  const { categories } = req.body;

  if (!categories || !Array.isArray(categories)) {
    return next(new AppError("Categories array is required", 400));
  }

  const updatePromises = categories.map((category, index) => {
    return PlanCategory.findByIdAndUpdate(
      category._id,
      { displayOrder: index + 1 },
      { new: true, runValidators: true }
    );
  });

  const updatedCategories = await Promise.all(updatePromises);

  res.status(200).json({
    status: "success",
    data: {
      categories: updatedCategories,
    },
  });
}); 