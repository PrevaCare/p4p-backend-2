const corporatePlanModel = require("../../models/corporates/corporatePlan.model");
const BooleanFeature = require("../../models/plans/BooleanFeature.model");
const CountFeature = require("../../models/plans/CountFeature.model");
const AppConstant = require("../../utils/AppConstant");
const Response = require("../../utils/Response");

// Helper function to create or update a BooleanFeature
const tryCreateBooleanFeature = async (
  featureName,
  type = "Others",
  subType = "Others"
) => {
  try {
    if (!featureName) {
      console.log(
        "Warning: Attempted to create boolean feature with empty name"
      );
      return null;
    }

    console.log(
      `Finding or creating boolean feature: ${featureName} (${type}/${subType})`
    );

    // Check if feature already exists by name (case-insensitive)
    let existingFeature = await BooleanFeature.findOne({
      name: new RegExp(`^${featureName}$`, "i"),
    });

    if (existingFeature) {
      console.log(`Found existing boolean feature: ${existingFeature._id}`);

      // Update type and subType if different
      if (
        existingFeature.type !== type ||
        existingFeature.subType !== subType
      ) {
        console.log(
          `Updating feature type/subType from ${existingFeature.type}/${existingFeature.subType} to ${type}/${subType}`
        );
        existingFeature.type = type;
        existingFeature.subType = subType;
        await existingFeature.save();
      }

      return existingFeature._id;
    } else {
      // Create new feature
      console.log(
        `Creating new boolean feature: ${featureName} (${type}/${subType})`
      );
      const newFeature = new BooleanFeature({
        name: featureName,
        status: true,
        type: type,
        subType: subType,
      });

      const savedFeature = await newFeature.save();
      console.log(`Created new boolean feature with ID: ${savedFeature._id}`);
      return savedFeature._id;
    }
  } catch (error) {
    console.error(`Error in tryCreateBooleanFeature: ${error.message}`);
    return null;
  }
};

// Helper function to create or update a CountFeature
const tryCreateCountFeature = async (
  featureName,
  defaultCount = 0,
  type = "Others",
  subType = "Others"
) => {
  try {
    if (!featureName) {
      console.log("Warning: Attempted to create count feature with empty name");
      return null;
    }

    console.log(
      `Finding or creating count feature: ${featureName} (${type}/${subType})`
    );

    // Check if feature already exists by name (case-insensitive)
    let existingFeature = await CountFeature.findOne({
      name: new RegExp(`^${featureName}$`, "i"),
    });

    if (existingFeature) {
      console.log(`Found existing count feature: ${existingFeature._id}`);

      // Update type and subType if different
      if (
        existingFeature.type !== type ||
        existingFeature.subType !== subType
      ) {
        console.log(
          `Updating feature type/subType from ${existingFeature.type}/${existingFeature.subType} to ${type}/${subType}`
        );
        existingFeature.type = type;
        existingFeature.subType = subType;
        await existingFeature.save();
      }

      return existingFeature._id;
    } else {
      // Create new feature
      console.log(
        `Creating new count feature: ${featureName} (${type}/${subType})`
      );
      const newFeature = new CountFeature({
        name: featureName,
        count: defaultCount,
        type: type,
        subType: subType,
      });

      const savedFeature = await newFeature.save();
      console.log(`Created new count feature with ID: ${savedFeature._id}`);
      return savedFeature._id;
    }
  } catch (error) {
    console.error(`Error in tryCreateCountFeature: ${error.message}`);
    return null;
  }
};

// create corporate plan
const addCorporatePlan = async (req, res) => {
  try {
    console.log("--------- CREATING NEW CORPORATE PLAN ---------");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const {
      corporateId,
      name,
      category,
      price,
      remarks,
      duration,
      totalEmployeeCount,
      billingCycle,
      booleanFeatureList = [],
      countFeatureList = [],
      assignedDoctor = [],
      assignedLabs = [],
    } = req.body;

    // Basic validation
    if (!corporateId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "corporateId is required!"
      );
    }

    if (
      !name ||
      !category ||
      !price ||
      !duration ||
      !totalEmployeeCount ||
      !billingCycle
    ) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "name, category, price, duration, totalEmployeeCount, billingCycle is required!"
      );
    }

    // Check if plan already exists
    const alreadyCorporatePlanExist = await corporatePlanModel.findOne({
      corporateId,
      name: new RegExp(`^${name}$`, "i"),
      category: new RegExp(`^${category}$`, "i"),
    });

    if (alreadyCorporatePlanExist) {
      console.log(
        "Corporate plan already exists:",
        alreadyCorporatePlanExist._id
      );
      return Response.error(
        res,
        409,
        AppConstant.FAILED,
        "Plan already exists!"
      );
    }

    // Process boolean features
    console.log("Processing boolean features...");
    const processedBooleanFeatures = [];

    // Handle booleanFeatureList which might be a JSON string
    let booleanFeatureArray = [];

    if (typeof booleanFeatureList === "string") {
      try {
        booleanFeatureArray = JSON.parse(booleanFeatureList);
        console.log(
          "Parsed boolean feature list from string:",
          booleanFeatureArray
        );
      } catch (err) {
        console.error("Error parsing boolean feature list string:", err);
        booleanFeatureArray = [];
      }
    } else if (Array.isArray(booleanFeatureList)) {
      booleanFeatureArray = booleanFeatureList;
    }

    if (booleanFeatureArray && booleanFeatureArray.length > 0) {
      console.log(`Processing ${booleanFeatureArray.length} boolean features`);

      for (const feature of booleanFeatureArray) {
        try {
          if (!feature.name) {
            console.log("Skipping boolean feature with empty name");
            continue;
          }

          console.log(`Processing boolean feature: ${feature.name}`);

          // Find or create the feature
          const featureId = await tryCreateBooleanFeature(
            feature.name,
            feature.type || "Others",
            feature.subType || "Others"
          );

          if (featureId) {
            processedBooleanFeatures.push({
              name: feature.name,
              status: feature.status === true || feature.status === "true",
              featureId: featureId,
              type: feature.type || "Others",
              subType: feature.subType || "Others",
            });
            console.log(
              `Added boolean feature: ${feature.name} with ID ${featureId}`
            );
          } else {
            console.error(
              `Failed to create/find boolean feature: ${feature.name}`
            );
          }
        } catch (error) {
          console.error(
            `Error processing boolean feature ${feature.name}:`,
            error
          );
        }
      }
    }

    // Process count features
    console.log("Processing count features...");
    const processedCountFeatures = [];

    // Handle countFeatureList which might be a JSON string
    let countFeatureArray = [];

    if (typeof countFeatureList === "string") {
      try {
        countFeatureArray = JSON.parse(countFeatureList);
        console.log(
          "Parsed count feature list from string:",
          countFeatureArray
        );
      } catch (err) {
        console.error("Error parsing count feature list string:", err);
        countFeatureArray = [];
      }
    } else if (Array.isArray(countFeatureList)) {
      countFeatureArray = countFeatureList;
    }

    if (countFeatureArray && countFeatureArray.length > 0) {
      console.log(`Processing ${countFeatureArray.length} count features`);

      for (const feature of countFeatureArray) {
        try {
          if (!feature.name) {
            console.log("Skipping count feature with empty name");
            continue;
          }

          console.log(`Processing count feature: ${feature.name}`);

          // Parse count
          const count = parseInt(feature.count) || 0;

          // Find or create the feature
          const featureId = await tryCreateCountFeature(
            feature.name,
            count,
            feature.type || "Others",
            feature.subType || "Others"
          );

          if (featureId) {
            processedCountFeatures.push({
              name: feature.name,
              count: count,
              planType: feature.planType || "Yearly",
              featureId: featureId,
              type: feature.type || "Others",
              subType: feature.subType || "Others",
            });
            console.log(
              `Added count feature: ${feature.name} with ID ${featureId}`
            );
          } else {
            console.error(
              `Failed to create/find count feature: ${feature.name}`
            );
          }
        } catch (error) {
          console.error(
            `Error processing count feature ${feature.name}:`,
            error
          );
        }
      }
    }

    // Create the corporate plan
    console.log("Creating corporate plan...");
    const newCorporatePlan = new corporatePlanModel({
      corporateId,
      name,
      category,
      price,
      remarks,
      duration,
      totalEmployeeCount,
      billingCycle,
      booleanFeatureList: processedBooleanFeatures,
      countFeatureList: processedCountFeatures,
      startDate: req.body.startDate || new Date(),
      status: req.body.status || "active",
    });

    const savedCorporatePlan = await newCorporatePlan.save();
    console.log(`Corporate plan saved with ID: ${savedCorporatePlan._id}`);

    // Return success response
    return Response.success(
      res,
      savedCorporatePlan,
      201,
      "Corporate plan created successfully!"
    );
  } catch (err) {
    console.error("Error in addCorporatePlan:", err);

    if (err.name === "ValidationError") {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        err.message || "Validation error!"
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
      .find({ corporateId: { $ne: null } })
      .populate({
        path: "corporateId",
        select: "companyName logo",
      });

    return Response.success(
      res,
      existingAllCorporatePlans,
      200,
      "All Corporate plans found!"
    );
  } catch (err) {
    console.error("Error in getAllCorporatePlans:", err);
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
        400,
        AppConstant.FAILED,
        "corporate Id is missing!"
      );
    }

    const existingAllCorporatePlans = await corporatePlanModel.find(
      { corporateId },
      "name category totalCount usedCount booleanFeatureList.name booleanFeatureList.status countFeatureList.name countFeatureList.count"
    );

    return Response.success(
      res,
      existingAllCorporatePlans,
      200,
      "Corporate plans found!"
    );
  } catch (err) {
    console.error("Error in getAllCorporatePlansToShowOnDashboard:", err);
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
        400,
        AppConstant.FAILED,
        "corporate Plan Id is missing!"
      );
    }

    const existingCorporatePlan = await corporatePlanModel
      .findOne(
        { _id: corporatePlanId },
        "name category totalCount usedCount duration status booleanFeatureList countFeatureList startDate autoRenew paymentStatus endDate price billingCycle nextBillingDate"
      )
      .populate({
        path: "corporateId",
        populate: {
          path: "addresses",
          select: "name city",
        },
        select: "companyName logo email phone address",
      });

    if (!existingCorporatePlan) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Corporate plan not found!"
      );
    }

    return Response.success(
      res,
      existingCorporatePlan,
      200,
      "Corporate plan found!"
    );
  } catch (err) {
    console.error("Error in getSingleCorporatePlanByCorporatePlanId:", err);
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
        400,
        AppConstant.FAILED,
        "corporate plan id is missing!"
      );
    }

    const existingCorporatePlan = await corporatePlanModel.findById(
      corporatePlanId
    );

    if (!existingCorporatePlan) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Corporate plan not found!"
      );
    }

    return Response.success(
      res,
      existingCorporatePlan,
      200,
      "Corporate plan found successfully!"
    );
  } catch (err) {
    console.error(
      "Error in getSingleCorporatePlanByCorporatePlanIdAllFields:",
      err
    );
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
        400,
        AppConstant.FAILED,
        "corporate plan id is missing!"
      );
    }

    const deletedCorporatePlan = await corporatePlanModel.findByIdAndDelete(
      corporatePlanId
    );

    if (!deletedCorporatePlan) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Corporate plan not found!"
      );
    }

    return Response.success(
      res,
      deletedCorporatePlan,
      200,
      "Corporate plan deleted successfully!"
    );
  } catch (err) {
    console.error("Error in deleteCorporatePlanById:", err);
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
