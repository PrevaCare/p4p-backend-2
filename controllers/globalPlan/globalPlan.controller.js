const AppConstant = require("../../utils/AppConstant");
const Response = require("../../utils/Response");
const GlobalPlan = require("../../models/plans/GlobalPlan.model");
const BooleanFeature = require("../../models/plans/BooleanFeature.model");
const CountFeature = require("../../models/plans/CountFeature.model");
const {
  addGlobalPlanSchema,
  updateGlobalPlanSchema,
} = require("../../validators/globalPlan/addGlobalPlan.validator");
const { uploadToS3 } = require("../../middlewares/uploads/awsConfig");

// Helper function to create a BooleanFeature if it doesn't exist
const tryCreateBooleanFeature = async (featureName) => {
  try {
    if (!featureName) {
      console.error("tryCreateBooleanFeature: Feature name is null or empty");
      return null;
    }

    const lowerCaseName = featureName.toLowerCase();
    console.log(
      `tryCreateBooleanFeature: Searching for feature: "${lowerCaseName}"`
    );

    let feature = await BooleanFeature.findOne({ name: lowerCaseName });

    if (feature) {
      console.log(
        `tryCreateBooleanFeature: Found existing feature with ID: ${feature._id}`
      );
      return feature._id;
    }

    console.log(
      `tryCreateBooleanFeature: Creating new feature: "${lowerCaseName}"`
    );
    const newFeature = new BooleanFeature({
      name: lowerCaseName,
      status: false,
    });

    const savedFeature = await newFeature.save();
    console.log(
      `tryCreateBooleanFeature: Created new feature with ID: ${savedFeature._id}`
    );

    return savedFeature._id;
  } catch (error) {
    console.error(`tryCreateBooleanFeature error for "${featureName}":`, error);
    return null;
  }
};

// Helper function to create a CountFeature if it doesn't exist
const tryCreateCountFeature = async (featureName, defaultCount = 0) => {
  try {
    if (!featureName) {
      console.error("tryCreateCountFeature: Feature name is null or empty");
      return null;
    }

    const lowerCaseName = featureName.toLowerCase();
    console.log(
      `tryCreateCountFeature: Searching for feature: "${lowerCaseName}"`
    );

    let feature = await CountFeature.findOne({ name: lowerCaseName });

    if (feature) {
      console.log(
        `tryCreateCountFeature: Found existing feature with ID: ${feature._id}`
      );
      return feature._id;
    }

    console.log(
      `tryCreateCountFeature: Creating new feature: "${lowerCaseName}"`
    );
    const newFeature = new CountFeature({
      name: lowerCaseName,
      count: defaultCount,
    });

    const savedFeature = await newFeature.save();
    console.log(
      `tryCreateCountFeature: Created new feature with ID: ${savedFeature._id}`
    );

    return savedFeature._id;
  } catch (error) {
    console.error(`tryCreateCountFeature error for "${featureName}":`, error);
    return null;
  }
};

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
    console.log("req.body ", req.body);
    console.log("req.files ", req.files);
    console.log("req.body ends");
    let {
      name,
      category,
      price,
      remarks,
      booleanFeatureList,
      countFeatureList,
    } = req.body;

    // Check if imagefile exists in req.files (multer adds this)
    if (
      !req.files ||
      !req.files.imagefile ||
      req.files.imagefile.length === 0
    ) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Image file is required"
      );
    }

    const imageFile = req.files.imagefile[0];
    console.log("Image file:", imageFile);

    // Upload image to S3
    let imageLink = "";
    try {
      const uploadResult = await uploadToS3(imageFile);
      imageLink = uploadResult.Location;
      req.body.imageLink = imageLink;
    } catch (err) {
      console.error("S3 upload error:", err);
      return Response.error(
        res,
        500,
        AppConstant.FAILED,
        "Error uploading image to S3"
      );
    }

    if (!name || !category || !price) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Name, category, and price are required"
      );
    }

    const lowerCaseName = name.toLowerCase();
    const lowerCaseCategory = category.toLowerCase();

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

    // Parse booleanFeatureList and countFeatureList from form data
    let booleanFeatureList_updated = booleanFeatureList || [];
    let countFeatureList_updated = countFeatureList || [];

    console.log("Original request.body:", JSON.stringify(req.body, null, 2));

    // Process booleanFeatureList - use both array format and indexed format
    booleanFeatureList = [];

    // Check if we have the array directly in the request body
    if (
      req.body.booleanFeatureList &&
      Array.isArray(req.body.booleanFeatureList)
    ) {
      console.log("Direct array format detected");
      for (const feature of req.body.booleanFeatureList) {
        try {
          if (!feature.name) continue;

          let featureId = feature.featureId;
          if (!featureId) {
            featureId = await tryCreateBooleanFeature(feature.name);
          }

          if (featureId) {
            booleanFeatureList.push({
              name: feature.name,
              status: !!feature.status,
              featureId,
            });
          }
        } catch (error) {
          console.error(`Error processing feature in array format:`, error);
        }
      }
    } else {
      // Process form-data format with indexed keys
      const booleanKeys = Object.keys(req.body).filter((key) =>
        key.startsWith("booleanFeatureList")
      );
      console.log("Boolean keys found:", booleanKeys);

      if (booleanKeys.length > 0) {
        // Check if we have the form-data format with indices
        const indexPattern = /booleanFeatureList\[(\d+)\]/;
        const indices = [
          ...new Set(
            booleanKeys.map((key) => {
              const match = key.match(indexPattern);
              return match ? parseInt(match[1]) : -1;
            })
          ),
        ].filter((idx) => idx !== -1);

        console.log("Indices found:", indices);

        if (indices.length > 0) {
          // Process using the indexed format
          for (let i = 0; i <= Math.max(...indices); i++) {
            const name = req.body[`booleanFeatureList[${i}][name]`];
            const status =
              req.body[`booleanFeatureList[${i}][status]`] === "true";
            const featureId = req.body[`booleanFeatureList[${i}][featureId]`];

            console.log(
              `Processing feature ${i}: name=${name}, status=${status}, featureId=${featureId}`
            );

            if (name) {
              try {
                let actualFeatureId = featureId;
                if (!actualFeatureId) {
                  actualFeatureId = await tryCreateBooleanFeature(name);
                  console.log(
                    `Created/found feature ID: ${actualFeatureId} for ${name}`
                  );
                }

                if (actualFeatureId) {
                  const featureToAdd = {
                    name,
                    status,
                    featureId,
                  };

                  console.log(`Adding feature to list:`, featureToAdd);
                  booleanFeatureList.push(featureToAdd);
                }
              } catch (error) {
                console.error(`Error processing feature ${name}:`, error);
              }
            }
          }
        }
      } else {
        console.log("No boolean features found in form data");
      }
    }

    console.log("Final booleanFeatureList:", booleanFeatureList);

    // Process countFeatureList
    const countKeys = Object.keys(req.body).filter((key) =>
      key.startsWith("countFeatureList")
    );
    console.log("Count keys found:", countKeys);
    console.log("All request keys:", Object.keys(req.body));

    // Initialize countFeatureList as an empty array
    countFeatureList = [];

    // Check if we have the array directly in the request body
    if (req.body.countFeatureList && Array.isArray(req.body.countFeatureList)) {
      console.log("Direct array format detected for countFeatureList");

      // Iterate through the array
      for (let i = 0; i < req.body.countFeatureList.length; i++) {
        const feature = req.body.countFeatureList[i];

        if (!feature || !feature.name) continue;

        try {
          const name = feature.name;
          // Ensure count is a number
          const count = parseInt(feature.count || "0", 10);

          console.log(`Processing count feature: name=${name}, count=${count}`);

          // Get or create feature ID
          let featureId = feature.featureId;
          if (!featureId) {
            featureId = await tryCreateCountFeature(name, count);
            console.log(
              `Created/found count feature ID: ${featureId} for ${name}`
            );
          }

          if (featureId) {
            countFeatureList.push({
              name,
              count,
              featureId,
            });
            console.log(
              `Added count feature with ID to list: ${name}, ${count}, ${featureId}`
            );
          } else {
            countFeatureList.push({ name, count });
            console.log(
              `Added count feature without ID to list: ${name}, ${count}`
            );
          }
        } catch (error) {
          console.error(`Error processing count feature:`, error);
        }
      }
    } else if (countKeys.length > 0) {
      // Process form-data with indexed keys
      try {
        const indexPattern = /countFeatureList\[(\d+)\]/;
        const indices = [
          ...new Set(
            countKeys.map((key) => {
              const match = key.match(indexPattern);
              return match ? parseInt(match[1], 10) : -1;
            })
          ),
        ].filter((idx) => idx !== -1);

        console.log("Count indices found:", indices);

        if (indices.length > 0) {
          for (let i = 0; i <= Math.max(...indices); i++) {
            const name = req.body[`countFeatureList[${i}][name]`];
            const countValue = req.body[`countFeatureList[${i}][count]`];
            const count = countValue ? parseInt(countValue, 10) : 0;
            const featureId = req.body[`countFeatureList[${i}][featureId]`];

            if (!name) continue;

            console.log(
              `Processing indexed count feature: name=${name}, count=${count}`
            );

            // Get or create feature ID
            let actualFeatureId = featureId;
            if (!actualFeatureId) {
              actualFeatureId = await tryCreateCountFeature(name, count);
              console.log(
                `Created/found count feature ID: ${actualFeatureId} for ${name}`
              );
            }

            if (actualFeatureId) {
              countFeatureList.push({
                name,
                count,
                featureId: actualFeatureId,
              });
              console.log(
                `Added indexed count feature with ID: ${name}, ${count}`
              );
            } else {
              countFeatureList.push({ name, count });
              console.log(
                `Added indexed count feature without ID: ${name}, ${count}`
              );
            }
          }
        }
      } catch (error) {
        console.error("Error processing indexed count features:", error);
      }
    }

    console.log("Final countFeatureList:", JSON.stringify(countFeatureList));

    const newGlobalPlan = new GlobalPlan({
      ...req.body,
      name: lowerCaseName,
      category: lowerCaseCategory,
      imageLink: imageLink,
      price,
      remarks,
      booleanFeatureList,
      countFeatureList,
    });

    const savedGlobalPlan = await newGlobalPlan.save();

    // Return success response
    return Response.success(
      res,
      savedGlobalPlan,
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

    // Handle booleanFeatureList updates if present
    if (
      req.body.booleanFeatureList &&
      Array.isArray(req.body.booleanFeatureList)
    ) {
      // Process each feature to ensure it has a featureId
      for (let i = 0; i < req.body.booleanFeatureList.length; i++) {
        const feature = req.body.booleanFeatureList[i];
        if (feature.name && !feature.featureId) {
          const featureId = await tryCreateBooleanFeature(feature.name);
          req.body.booleanFeatureList[i].featureId = featureId;
        }
      }
    }

    // Handle countFeatureList updates if present
    if (req.body.countFeatureList && Array.isArray(req.body.countFeatureList)) {
      // Process each feature to ensure it has a featureId
      for (let i = 0; i < req.body.countFeatureList.length; i++) {
        const feature = req.body.countFeatureList[i];
        if (feature.name && !feature.featureId) {
          const featureId = await tryCreateCountFeature(
            feature.name,
            feature.count || 0
          );
          req.body.countFeatureList[i].featureId = featureId;
        }
      }
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
    const query = search
      ? { name: { $regex: `^${search}`, $options: "i" } }
      : {};

    // First get features from the dedicated BooleanFeature collection
    const booleanFeatures = await BooleanFeature.find(query)
      .sort({ name: 1 })
      .select("name -_id");

    // If we have dedicated features, use those
    if (booleanFeatures.length > 0) {
      return Response.success(
        res,
        booleanFeatures,
        200,
        AppConstant.SUCCESS,
        "All boolean feature list names found successfully!"
      );
    }

    // Otherwise, fall back to the legacy method of aggregating from GlobalPlan
    const pipeline = [
      // Unwind the booleanFeatureList array
      { $unwind: "$booleanFeatureList" },

      // If search parameter exists, filter by name
      ...(search
        ? [
            {
              $match: {
                "booleanFeatureList.name": {
                  $regex: `^${search}`,
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
    const query = search
      ? { name: { $regex: `^${search}`, $options: "i" } }
      : {};

    // First get features from the dedicated CountFeature collection
    const countFeatures = await CountFeature.find(query)
      .sort({ name: 1 })
      .select("name -_id");

    // If we have dedicated features, use those
    if (countFeatures.length > 0) {
      return Response.success(
        res,
        countFeatures,
        200,
        AppConstant.SUCCESS,
        "All count feature list names found successfully!"
      );
    }

    // Otherwise, fall back to the legacy method of aggregating from GlobalPlan
    const pipeline = [
      // Unwind the countFeatureList array
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

    const allCountFeatureListNames = await GlobalPlan.aggregate(pipeline);

    return Response.success(
      res,
      allCountFeatureListNames,
      200,
      AppConstant.SUCCESS,
      "All count feature list names found successfully!"
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

// delete single global plan by id
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
