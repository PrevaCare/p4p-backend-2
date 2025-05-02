const DoctorCategory = require("../../../models/common/doctor.categories.model");
const Doctor = require("../../../models/doctors/doctor.model");
const AppError = require("../../../utils/appError");
const catchAsync = require("../../../utils/catchAsync");
const { handleFileUpload } = require("../../../middlewares/uploads/awsConfig");

// Create a new doctor category with image upload
exports.createDoctorCategory = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;

  if (!name) {
    return next(new AppError("Name is required", 400));
  }

  // Handle image upload if file is provided
  let imageUrl = "";
  if (req.file) {
    try {
      imageUrl = await handleFileUpload(req.file);
    } catch (error) {
      console.error("Error uploading image to S3:", error);
      return next(
        new AppError("Failed to upload image. Please try again.", 500)
      );
    }
  }

  const newCategory = await DoctorCategory.create({
    name,
    image: imageUrl,
    description,
  });

  res.status(201).json({
    status: "success",
    data: {
      category: newCategory,
    },
  });
});

// Get all doctor categories
exports.getAllDoctorCategories = catchAsync(async (req, res, next) => {
  const categories = await DoctorCategory.find({ isActive: true });

  res.status(200).json({
    status: "success",
    results: categories.length,
    data: {
      categories,
    },
  });
});

// Get a specific doctor category
exports.getDoctorCategory = catchAsync(async (req, res, next) => {
  const category = await DoctorCategory.findById(req.params.id);

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

// Update a doctor category with image upload
exports.updateDoctorCategory = catchAsync(async (req, res, next) => {
  const updateData = { ...req.body };

  // Handle image upload if file is provided
  if (req.file) {
    try {
      updateData.image = await handleFileUpload(req.file);
    } catch (error) {
      console.error("Error uploading image to S3:", error);
      return next(
        new AppError("Failed to upload image. Please try again.", 500)
      );
    }
  }

  const updatedCategory = await DoctorCategory.findByIdAndUpdate(
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

// Delete a doctor category (soft delete by setting isActive to false)
exports.deleteDoctorCategory = catchAsync(async (req, res, next) => {
  const category = await DoctorCategory.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    {
      new: true,
    }
  );

  if (!category) {
    return next(new AppError("No category found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: null,
  });
});

// Hard delete a doctor category (for admin use only)
exports.hardDeleteDoctorCategory = catchAsync(async (req, res, next) => {
  const category = await DoctorCategory.findByIdAndDelete(req.params.id);

  if (!category) {
    return next(new AppError("No category found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Find doctors by category name
exports.findDoctorsByCategory = catchAsync(async (req, res, next) => {
  const { categoryName } = req.params;

  if (!categoryName) {
    return next(new AppError("Category name is required", 400));
  }

  // First find the category by name
  const category = await DoctorCategory.findOne({
    name: { $regex: new RegExp(categoryName, "i") },
    isActive: true,
  });

  if (!category) {
    return next(new AppError("No category found with that name", 404));
  }

  // Find doctors by specialization field that matches the category name
  // Using case-insensitive regex match for better flexibility
  const doctors = await Doctor.find({
    specialization: { $regex: new RegExp(category.name, "i") },
  }).select(
    "firstName lastName profileImg specialization bio consultationFees"
  );

  res.status(200).json({
    status: "success",
    results: doctors.length,
    data: {
      category,
      doctors,
    },
  });
});

// Find doctors directly by specialization
exports.findDoctorsBySpecialization = catchAsync(async (req, res, next) => {
  const { specialization } = req.params;

  if (!specialization) {
    return next(new AppError("Specialization is required", 400));
  }

  // Find doctors by specialization using case-insensitive search
  const doctors = await Doctor.find({
    specialization: { $regex: new RegExp(specialization, "i") },
  }).select(
    "firstName lastName profileImg specialization bio consultationFees"
  );

  res.status(200).json({
    status: "success",
    results: doctors.length,
    data: {
      doctors,
    },
  });
});
