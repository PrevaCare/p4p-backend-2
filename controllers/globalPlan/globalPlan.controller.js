const AppConstant = require("../../utils/AppConstant");
const Response = require("../../utils/Response");
const GlobalPlan = require("../../models/plans/GlobalPlan.model");
const {
  addGlobalPlanSchema,
  updateGlobalPlanSchema,
} = require("../../validators/globalPlan/addGlobalPlan.validator");

// create
const addGlobalPlan = async (req, res) => {
  try {
    // Validate request body
    // const { error } = addGlobalPlanSchema.validate(req.body);
    // if (error) {
    //   return Response.error(
    //     res,
    //     400,
    //     AppConstant.FAILED,
    //     err.message || "validation failed"
    //   );
    // }
    const lowerCaseName = req.body.name && req.body.name.toLowerCase();
    const lowerCaseCategory =
      req.body.category && req.body.category.toLowerCase();

    const alreadyExistingPlan = await GlobalPlan.findOne({
      name: lowerCaseName,
    });

    if (alreadyExistingPlan) {
      return Response.error(
        res,
        409,
        AppConstant.FAILED,
        `${alreadyExistingPlan.name} is already exist !`
      );
    }

    const newGlobalPlan = new GlobalPlan({
      ...req.body,
      name: lowerCaseName,
      category: lowerCaseCategory,
    });
    const savedGlobalPlab = await newGlobalPlan.save();

    // Return success response
    return Response.success(
      res,
      savedGlobalPlab,
      201,
      "Global plan created successfully !"
    );
  } catch (err) {
    // Handle any errors
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
// update
const updateGlobalPlan = async (req, res) => {
  try {
    // Validate request body
    const { globalPlanId } = req.params;
    if (!globalPlanId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "globalPlanId is missing !"
      );
    }
    const { error } = updateGlobalPlanSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        err.message || "validation failed"
      );
    }

    const dataToBeUpdated = req.body.name
      ? { ...req.body, name: req.body.name.toLowerCase() }
      : req.body;

    const updatedGlobalPackage = await GlobalPlan.findByIdAndUpdate(
      { _id: globalPlanId },
      { $set: dataToBeUpdated },
      { new: true }
    );

    // Return success response
    return Response.success(
      res,
      updatedGlobalPackage,
      201,
      "Global plan updated successfully !"
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

const getAllGlobalPlans = async (req, res) => {
  try {
    const existingAllGlobalPlans = await GlobalPlan.find({});

    // Return success response
    return Response.success(
      res,
      existingAllGlobalPlans,
      200,
      "All Global plan found !"
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
const getAllGlobalPlansCategory = async (req, res) => {
  try {
    const { search } = req.query;
    const query = search ? { category: { $regex: search, $options: "i" } } : {};
    const allMaterials = await GlobalPlan.find(query, "category -_id");

    return Response.success(
      res,
      allMaterials,
      200,
      AppConstant.SUCCESS,
      "All category hsnNumber found successfully!"
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

const getAllBooleanFeatureNamesGlobalPlans = async (req, res) => {
  try {
    const { search } = req.query;

    const pipeline = [
      // Unwind the booleanFeatureList array
      { $unwind: "$booleanFeatureList" },

      // If search parameter exists, filter by name
      ...(search
        ? [
            {
              $match: {
                "booleanFeatureList.name": {
                  $regex: `^${search}`, // Matches names starting with the search term
                  $options: "i",
                },
              },
            },
          ]
        : []),

      // Group by feature name to get unique names
      {
        $group: {
          _id: "$booleanFeatureList.name",
          name: { $first: "$booleanFeatureList.name" },
        },
      },

      // Sort alphabetically
      { $sort: { name: 1 } },

      // Project to final format
      {
        $project: {
          _id: 0,
          name: 1,
        },
      },
    ];

    const allBooleanFeatureListNames = await GlobalPlan.aggregate(pipeline);

    return Response.success(
      res,
      allBooleanFeatureListNames,
      200,
      AppConstant.SUCCESS,
      "All boolean feature list names found successfully!"
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
const getAllCountFeatureNamesGlobalPlans = async (req, res) => {
  try {
    const { search } = req.query;

    const pipeline = [
      // Unwind the booleanFeatureList array
      { $unwind: "$countFeatureList" },

      // If search parameter exists, filter by name
      ...(search
        ? [
            {
              $match: {
                "countFeatureList.name": {
                  $regex: `^${search}`, // Matches names starting with the search term
                  $options: "i",
                },
              },
            },
          ]
        : []),

      // Group by feature name to get unique names
      {
        $group: {
          _id: "$countFeatureList.name",
          name: { $first: "$countFeatureList.name" },
        },
      },

      // Sort alphabetically
      { $sort: { name: 1 } },

      // Project to final format
      {
        $project: {
          _id: 0,
          name: 1,
        },
      },
    ];

    const allBooleanFeatureListNames = await GlobalPlan.aggregate(pipeline);

    return Response.success(
      res,
      allBooleanFeatureListNames,
      200,
      AppConstant.SUCCESS,
      "All boolean feature list names found successfully!"
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

// get single global plan by id
const getGlobalPlanById = async (req, res) => {
  try {
    const { globalPlanId } = req.body;
    if (!globalPlanId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "globalPlanId is missing !"
      );
    }

    const existingGlobalPlan = await GlobalPlan.findById(globalPlanId);

    if (!existingGlobalPlan) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "globalPlan not found with given id !"
      );
    }
    return Response.success(
      res,
      existingGlobalPlan,
      200,
      "Global plan found with given Id !"
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
// delete  single global plan by id
const deleteGlobalPlanById = async (req, res) => {
  try {
    const { globalPlanId } = req.params;
    // console.log(globalPlanId);
    if (!globalPlanId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "globalPlanId is missing !"
      );
    }

    const existingGlobalPlan = await GlobalPlan.findByIdAndDelete(globalPlanId);

    return Response.success(
      res,
      existingGlobalPlan,
      200,
      "Global plan deleted with given Id !"
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
// get all global plan to show on dashboard
const getAllGlobalPlansToShowOnDashboardForIndividualUser = async (
  req,
  res
) => {
  try {
    const existingAllCorporatePlans = await GlobalPlan.find(
      {},
      "name category totalCount usedCount booleanFeatureList countFeatureList"
    );

    // Return success response
    return Response.success(
      res,
      existingAllCorporatePlans,
      200,
      "All Global plans found !"
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

module.exports = {
  addGlobalPlan,
  getAllGlobalPlans,
  getGlobalPlanById,
  updateGlobalPlan,
  deleteGlobalPlanById,
  getAllGlobalPlansCategory,
  getAllBooleanFeatureNamesGlobalPlans,
  getAllCountFeatureNamesGlobalPlans,
  getAllGlobalPlansToShowOnDashboardForIndividualUser,
};
