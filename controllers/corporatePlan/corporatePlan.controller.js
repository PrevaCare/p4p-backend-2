const corporatePlanModel = require("../../models/corporates/corporatePlan.model");
const BooleanFeature = require("../../models/plans/BooleanFeature.model");
const CountFeature = require("../../models/plans/CountFeature.model");
const AppConstant = require("../../utils/AppConstant");
const Response = require("../../utils/Response");

// Helper function to create a BooleanFeature if it doesn't exist
const tryCreateBooleanFeature = async (featureName) => {
  try {
    if (!featureName) return null;
    const lowerCaseName = featureName.toLowerCase();
    let feature = await BooleanFeature.findOne({ name: lowerCaseName });
    if (feature) return feature._id;
    const newFeature = new BooleanFeature({
      name: lowerCaseName,
      status: false,
    });
    const savedFeature = await newFeature.save();
    return savedFeature._id;
  } catch (error) {
    return null;
  }
};

// Helper function to create a CountFeature if it doesn't exist
const tryCreateCountFeature = async (featureName, defaultCount = 0) => {
  try {
    if (!featureName) return null;
    const lowerCaseName = featureName.toLowerCase();
    let feature = await CountFeature.findOne({ name: lowerCaseName });
    if (feature) return feature._id;
    const newFeature = new CountFeature({
      name: lowerCaseName,
      count: defaultCount,
    });
    const savedFeature = await newFeature.save();
    return savedFeature._id;
  } catch (error) {
    return null;
  }
};

// create
const addCorporatePlan = async (req, res) => {
  try {
    const lowerCaseName = req.body.name && req.body.name.toLowerCase();
    const lowerCaseCategory =
      req.body.category && req.body.category.toLowerCase();

    const alreadyCorporatePlanExist = await corporatePlanModel.findOne({
      corporateId: req.body.corporateId,
      name: lowerCaseName,
      category: lowerCaseCategory,
    });

    if (alreadyCorporatePlanExist) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "plan already exist !"
      );
    }

    // Handle booleanFeatureList
    let booleanFeatureList = [];
    if (Array.isArray(req.body.booleanFeatureList)) {
      for (const feature of req.body.booleanFeatureList) {
        if (!feature.name) continue;
        let featureId = feature.featureId;
        if (!featureId) {
          featureId = await tryCreateBooleanFeature(feature.name);
        }
        booleanFeatureList.push({
          name: feature.name,
          status: feature.status === true || feature.status === "true",
          featureId,
        });
      }
    }

    // Handle countFeatureList
    let countFeatureList = [];
    if (Array.isArray(req.body.countFeatureList)) {
      for (const feature of req.body.countFeatureList) {
        if (!feature.name) continue;
        let featureId = feature.featureId;
        if (!featureId) {
          featureId = await tryCreateCountFeature(
            feature.name,
            feature.count || 0
          );
        }
        countFeatureList.push({
          name: feature.name,
          count: feature.count || 0,
          planType: feature.planType || "yearly",
          featureId,
        });
      }
    }

    const newCorporatePlan = new corporatePlanModel({
      ...req.body,
      name: lowerCaseName,
      category: lowerCaseCategory,
      booleanFeatureList,
      countFeatureList,
    });
    const savedCorporatePlan = await newCorporatePlan.save();

    // Return success response
    return Response.success(
      res,
      savedCorporatePlan,
      201,
      "Corporate plan created successfully !"
    );
  } catch (err) {
    if (err.name === "ValidationError") {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        err.message || "validation error !"
      );
    }
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

const getAllCorporatePlans = async (req, res) => {
  try {
    const existingAllCorporatePlans = await corporatePlanModel
      .find(
        { corporateId: { $ne: null } },
        "name category price totalCount usedCount duration status endDate"
      )
      .populate({
        path: "corporateId",
        select: "companyName logo",
        // match: { companyName: { $ne: null }, logo: { $ne: null } },
      });

    // Return success response
    return Response.success(
      res,
      existingAllCorporatePlans,
      200,
      "All Corporate plans found !"
    );
  } catch (err) {
    // Handle any errors
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};
const getAllCorporatePlansToShowOnDashboard = async (req, res) => {
  try {
    const { corporateId } = req.body;
    if (!corporateId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "corporate Id is missing !"
      );
    }
    const existingAllCorporatePlans = await corporatePlanModel.find(
      { corporateId },
      "name category totalCount usedCount booleanFeatureList countFeatureList"
    );

    // Return success response
    return Response.success(
      res,
      existingAllCorporatePlans,
      200,
      "All Corporate plans found !"
    );
  } catch (err) {
    // Handle any errors
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

// get corporate plan by plan id to show  single plan
const getSingleCorporatePlanByCorporatePlanId = async (req, res) => {
  try {
    const { corporatePlanId } = req.body;
    if (!corporatePlanId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "corporate Plan Id is missing !"
      );
    }
    const existingCorporatePlan = await corporatePlanModel
      .findOne(
        { _id: corporatePlanId },
        "name category totalCount usedCount duration status  booleanFeatureList countFeatureList startDate autoRenew paymentStatus endDate price billingCycle nextBillingDate"
      )
      .populate({
        path: "corporateId",
        populate: {
          path: "addresses",
          select: "name city",
        },
        select: "companyName logo email phone address",
      });

    // Return success response
    return Response.success(
      res,
      existingCorporatePlan,
      200,
      "Corporate plan found !"
    );
  } catch (err) {
    // Handle any errors
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

const getSingleCorporatePlanByCorporatePlanIdAllFields = async (req, res) => {
  try {
    const { corporatePlanId } = req.body;
    if (!corporatePlanId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "corporate plan id is missing !"
      );
    }
    const existingCorporatePlan = await corporatePlanModel.findById(
      corporatePlanId
    );

    return Response.success(
      res,
      existingCorporatePlan,
      200,
      "Corporate plan found successfully !"
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

// delete corporate plan by id

const deleteCorporatePlanById = async (req, res) => {
  try {
    const { corporatePlanId } = req.params;
    if (!corporatePlanId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "corporate plan id is missing !"
      );
    }
    const deletedCorporatePlan = await corporatePlanModel.findByIdAndDelete(
      corporatePlanId
    );

    return Response.success(
      res,
      deletedCorporatePlan,
      200,
      "Corporate plan deleted successfully !"
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
  addCorporatePlan,
  getAllCorporatePlans,
  getAllCorporatePlansToShowOnDashboard,
  getSingleCorporatePlanByCorporatePlanId,
  getSingleCorporatePlanByCorporatePlanIdAllFields,
  deleteCorporatePlanById,
};
