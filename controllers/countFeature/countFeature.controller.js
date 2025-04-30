const AppConstant = require("../../utils/AppConstant");
const Response = require("../../utils/Response");
const CountFeature = require("../../models/plans/CountFeature.model");

// Create a new count feature
const addCountFeature = async (req, res) => {
  try {
    const { name, count } = req.body;

    if (!name) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Feature name is required"
      );
    }

    const lowerCaseName = name.toLowerCase();

    const existingFeature = await CountFeature.findOne({
      name: lowerCaseName,
    });

    if (existingFeature) {
      return Response.error(
        res,
        409,
        AppConstant.FAILED,
        `Feature with name ${lowerCaseName} already exists!`
      );
    }

    const newFeature = new CountFeature({
      name: lowerCaseName,
      count: count || 0,
    });

    const savedFeature = await newFeature.save();

    return Response.success(
      res,
      savedFeature,
      201,
      "Count feature created successfully!"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

// Get all count features
const getAllCountFeatures = async (req, res) => {
  try {
    const { search } = req.query;
    const query = search ? { name: { $regex: search, $options: "i" } } : {};

    const features = await CountFeature.find(query).sort({ name: 1 });

    return Response.success(
      res,
      features,
      200,
      "Count features retrieved successfully!"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

// Get count feature by id
const getCountFeatureById = async (req, res) => {
  try {
    const { featureId } = req.params;

    if (!featureId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Feature ID is required!"
      );
    }

    const feature = await CountFeature.findById(featureId);

    if (!feature) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Count feature not found!"
      );
    }

    return Response.success(
      res,
      feature,
      200,
      "Count feature retrieved successfully!"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

// Update count feature
const updateCountFeature = async (req, res) => {
  try {
    const { featureId } = req.params;
    const { name, count } = req.body;

    if (!featureId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Feature ID is required!"
      );
    }

    const updateData = {};
    if (name) updateData.name = name.toLowerCase();
    if (count !== undefined) updateData.count = count;

    const updatedFeature = await CountFeature.findByIdAndUpdate(
      featureId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedFeature) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Count feature not found!"
      );
    }

    return Response.success(
      res,
      updatedFeature,
      200,
      "Count feature updated successfully!"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

// Delete count feature
const deleteCountFeature = async (req, res) => {
  try {
    const { featureId } = req.params;

    if (!featureId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Feature ID is required!"
      );
    }

    const deletedFeature = await CountFeature.findByIdAndDelete(featureId);

    if (!deletedFeature) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Count feature not found!"
      );
    }

    return Response.success(
      res,
      deletedFeature,
      200,
      "Count feature deleted successfully!"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

module.exports = {
  addCountFeature,
  getAllCountFeatures,
  getCountFeatureById,
  updateCountFeature,
  deleteCountFeature,
};
