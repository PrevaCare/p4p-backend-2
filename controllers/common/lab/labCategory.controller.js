const labCategoryModel = require("../../../models/common/lab/labCategory.model");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const mongoose = require("mongoose");

// Create new lab category
const createLabCategory = async (req, res) => {
  try {
    const { name, logo, description } = req.body;
    const createdBy = req.user._id;

    const existingCategory = await labCategoryModel.findOne({ name });
    if (existingCategory) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Category with this name already exists"
      );
    }

    const newCategory = new labCategoryModel({
      name,
      logo,
      description,
      createdBy,
    });

    await newCategory.save();

    return Response.success(
      res,
      newCategory,
      201,
      AppConstant.SUCCESS,
      "Lab category created successfully"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

// Get all lab categories with pagination and search
const getAllLabCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const searchRegex = new RegExp(search, "i");

    const query = {
      $or: [{ name: searchRegex }, { description: searchRegex }],
    };

    const categories = await labCategoryModel
      .find(query)
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .select('-__v'); // Exclude version field

    const totalCount = await labCategoryModel.countDocuments(query);

    return Response.success(
      res,
      {
        categories,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Number(page),
        totalCategories: totalCount,
      },
      200,
      AppConstant.SUCCESS,
      "Lab categories retrieved successfully"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

// Update lab category
const updateLabCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, logo, description, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid category ID"
      );
    }

    const existingCategory = await labCategoryModel.findOne({
      name,
      _id: { $ne: id },
    });

    if (existingCategory) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Category with this name already exists"
      );
    }

    const updatedCategory = await labCategoryModel.findByIdAndUpdate(
      id,
      {
        name,
        logo,
        description,
        isActive,
      },
      { new: true }
    ).select('-__v'); // Exclude version field

    if (!updatedCategory) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Lab category not found"
      );
    }

    return Response.success(
      res,
      updatedCategory,
      200,
      AppConstant.SUCCESS,
      "Lab category updated successfully"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

// Delete lab category
const deleteLabCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid category ID"
      );
    }

    const deletedCategory = await labCategoryModel.findByIdAndDelete(id);

    if (!deletedCategory) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Lab category not found"
      );
    }

    return Response.success(
      res,
      null,
      200,
      AppConstant.SUCCESS,
      "Lab category deleted successfully"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

module.exports = {
  createLabCategory,
  getAllLabCategories,
  updateLabCategory,
  deleteLabCategory,
}; 