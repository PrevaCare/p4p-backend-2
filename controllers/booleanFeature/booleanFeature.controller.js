const AppConstant = require("../../utils/AppConstant");
const Response = require("../../utils/Response");
const BooleanFeature = require("../../models/plans/BooleanFeature.model");

// Create a new boolean feature
const addBooleanFeature = async (req, res) => {
  try {
    const { name, status } = req.body;

    if (!name) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Feature name is required"
      );
    }

    const lowerCaseName = name.toLowerCase();

    const existingFeature = await BooleanFeature.findOne({
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

    const newFeature = new BooleanFeature({
      name: lowerCaseName,
      status: status || false,
    });

    const savedFeature = await newFeature.save();

    return Response.success(
      res,
      savedFeature,
      201,
      "Boolean feature created successfully!"
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

// Get all boolean features
const getAllBooleanFeatures = async (req, res) => {
  try {
    const { search } = req.query;
    const query = search ? { name: { $regex: search, $options: "i" } } : {};

    const features = await BooleanFeature.find(query).sort({ name: 1 });

    return Response.success(
      res,
      features,
      200,
      "Boolean features retrieved successfully!"
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

// Get boolean feature by id
const getBooleanFeatureById = async (req, res) => {
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

    const feature = await BooleanFeature.findById(featureId);

    if (!feature) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Boolean feature not found!"
      );
    }

    return Response.success(
      res,
      feature,
      200,
      "Boolean feature retrieved successfully!"
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

// Update boolean feature
const updateBooleanFeature = async (req, res) => {
  try {
    const { featureId } = req.params;
    const { name, status } = req.body;

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
    if (status !== undefined) updateData.status = status;

    const updatedFeature = await BooleanFeature.findByIdAndUpdate(
      featureId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedFeature) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Boolean feature not found!"
      );
    }

    return Response.success(
      res,
      updatedFeature,
      200,
      "Boolean feature updated successfully!"
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

// Delete boolean feature
const deleteBooleanFeature = async (req, res) => {
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

    const deletedFeature = await BooleanFeature.findByIdAndDelete(featureId);

    if (!deletedFeature) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Boolean feature not found!"
      );
    }

    return Response.success(
      res,
      deletedFeature,
      200,
      "Boolean feature deleted successfully!"
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
  addBooleanFeature,
  getAllBooleanFeatures,
  getBooleanFeatureById,
  updateBooleanFeature,
  deleteBooleanFeature,
};
