const corporatePlanModel = require("../../models/corporates/corporatePlan.model");
const BooleanFeature = require("../../models/plans/BooleanFeature.model");
const CountFeature = require("../../models/plans/CountFeature.model");
const AppConstant = require("../../utils/AppConstant");
const Response = require("../../utils/Response");

// Helper function to create a BooleanFeature if it doesn't exist
const tryCreateBooleanFeature = async (
  featureName,
  type = "others",
  subType = "others"
) => {
  try {
    if (!featureName) {
      console.log(
        "Warning: Attempted to create boolean feature with empty name"
      );
      return null;
    }

    console.log(
      `Attempting to create boolean feature | Name: ${featureName} | Type: ${type} | SubType: ${subType}`
    );

    // Keep original name for creation, use lowercase only for searching
    const originalName = featureName;
    const lowerCaseName = featureName.toLowerCase();

    // Check if the feature already exists (case-insensitive search)
    let feature = await BooleanFeature.findOne({
      name: new RegExp(`^${lowerCaseName}$`, "i"),
    });
    console.log(
      `Boolean feature search result by name: ${
        feature ? "Found existing" : "Not found"
      }`
    );

    if (feature) {
      console.log(
        `Found existing boolean feature | ID: ${feature._id} | Current Type: ${feature.type} | Current SubType: ${feature.subType}`
      );

      // Update the type and subType if they are different
      if (feature.type !== type || feature.subType !== subType) {
        feature.type = type;
        feature.subType = subType;
        console.log(
          `Updating boolean feature | ID: ${feature._id} | New Type: ${type} | New SubType: ${subType}`
        );
        await feature.save();
        console.log(
          `Boolean feature updated successfully | ID: ${feature._id}`
        );
      }

      return feature._id;
    } else {
      // Create a new feature
      console.log(
        `Creating new boolean feature | Name: ${originalName} | Type: ${type} | SubType: ${subType}`
      );

      const newFeature = new BooleanFeature({
        name: originalName, // Use original case
        status: false,
        type: type,
        subType: subType,
      });

      // Print the feature before saving
      console.log(
        `New boolean feature to be saved:`,
        JSON.stringify(newFeature, null, 2)
      );

      try {
        const savedFeature = await newFeature.save();
        console.log(
          `Boolean feature saved successfully | ID: ${savedFeature._id} | Type: ${savedFeature.type} | SubType: ${savedFeature.subType}`
        );

        // Verify that the feature was saved by querying it again
        const verifyFeature = await BooleanFeature.findById(savedFeature._id);
        if (verifyFeature) {
          console.log(
            `Verified boolean feature exists in DB | ID: ${verifyFeature._id} | Type: ${verifyFeature.type} | SubType: ${verifyFeature.subType}`
          );
        } else {
          console.log(
            `WARNING: Could not verify boolean feature with ID: ${savedFeature._id}`
          );
        }

        return savedFeature._id;
      } catch (saveError) {
        console.error("Error saving boolean feature:", saveError);
        console.error("Error details:", saveError.message);
        if (saveError.errors) {
          Object.keys(saveError.errors).forEach((field) => {
            console.error(
              `Field "${field}" error:`,
              saveError.errors[field].message
            );
          });
        }

        // If we get a duplicate key error, try to find the feature again
        if (saveError.code === 11000) {
          console.log(
            "Duplicate key error - trying to find existing feature again"
          );

          // Wait a moment and try again
          await new Promise((resolve) => setTimeout(resolve, 500));

          feature = await BooleanFeature.findOne({
            name: new RegExp(`^${lowerCaseName}$`, "i"),
          });
          if (feature) {
            console.log(
              `Found existing boolean feature after duplicate error | ID: ${feature._id}`
            );
            return feature._id;
          }
        }

        return null;
      }
    }
  } catch (error) {
    console.error("Exception in tryCreateBooleanFeature:", error);
    console.error("Stack trace:", error.stack);
    return null;
  }
};

// Helper function to create a CountFeature if it doesn't exist
const tryCreateCountFeature = async (
  featureName,
  defaultCount = 0,
  type = "others",
  subType = "others"
) => {
  try {
    if (!featureName) {
      console.log("Warning: Attempted to create count feature with empty name");
      return null;
    }

    console.log(
      `Attempting to create count feature | Name: ${featureName} | Count: ${defaultCount} | Type: ${type} | SubType: ${subType}`
    );

    // Keep original name for creation, use lowercase only for searching
    const originalName = featureName;
    const lowerCaseName = featureName.toLowerCase();

    // Check if the feature already exists (case-insensitive search)
    let feature = await CountFeature.findOne({
      name: new RegExp(`^${lowerCaseName}$`, "i"),
    });
    console.log(
      `Count feature search result by name: ${
        feature ? "Found existing" : "Not found"
      }`
    );

    if (feature) {
      console.log(
        `Found existing count feature | ID: ${feature._id} | Current Type: ${feature.type} | Current SubType: ${feature.subType}`
      );

      // Update the type and subType if they are different
      if (feature.type !== type || feature.subType !== subType) {
        feature.type = type;
        feature.subType = subType;
        console.log(
          `Updating count feature | ID: ${feature._id} | New Type: ${type} | New SubType: ${subType}`
        );
        await feature.save();
        console.log(`Count feature updated successfully | ID: ${feature._id}`);
      }

      return feature._id;
    } else {
      // Create a new feature
      console.log(
        `Creating new count feature | Name: ${originalName} | Count: ${defaultCount} | Type: ${type} | SubType: ${subType}`
      );

      const newFeature = new CountFeature({
        name: originalName, // Use original case
        count: defaultCount,
        type: type,
        subType: subType,
      });

      // Print the feature before saving
      console.log(
        `New count feature to be saved:`,
        JSON.stringify(newFeature, null, 2)
      );

      try {
        const savedFeature = await newFeature.save();
        console.log(
          `Count feature saved successfully | ID: ${savedFeature._id} | Type: ${savedFeature.type} | SubType: ${savedFeature.subType}`
        );

        // Verify that the feature was saved by querying it again
        const verifyFeature = await CountFeature.findById(savedFeature._id);
        if (verifyFeature) {
          console.log(
            `Verified count feature exists in DB | ID: ${verifyFeature._id} | Type: ${verifyFeature.type} | SubType: ${verifyFeature.subType}`
          );
        } else {
          console.log(
            `WARNING: Could not verify count feature with ID: ${savedFeature._id}`
          );
        }

        return savedFeature._id;
      } catch (saveError) {
        console.error("Error saving count feature:", saveError);
        console.error("Error details:", saveError.message);
        if (saveError.errors) {
          Object.keys(saveError.errors).forEach((field) => {
            console.error(
              `Field "${field}" error:`,
              saveError.errors[field].message
            );
          });
        }

        // If we get a duplicate key error, try to find the feature again
        if (saveError.code === 11000) {
          console.log(
            "Duplicate key error - trying to find existing feature again"
          );

          // Wait a moment and try again
          await new Promise((resolve) => setTimeout(resolve, 500));

          feature = await CountFeature.findOne({
            name: new RegExp(`^${lowerCaseName}$`, "i"),
          });
          if (feature) {
            console.log(
              `Found existing count feature after duplicate error | ID: ${feature._id}`
            );
            return feature._id;
          }
        }

        return null;
      }
    }
  } catch (error) {
    console.error("Exception in tryCreateCountFeature:", error);
    console.error("Stack trace:", error.stack);
    return null;
  }
};

// create
const addCorporatePlan = async (req, res) => {
  try {
    console.log("--------- CREATING NEW CORPORATE PLAN ---------");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    // For searching existing plans, use lowercase - but preserve original case for creation
    const originalName = req.body.name;
    const lowerCaseName = req.body.name && req.body.name.toLowerCase();

    const originalCategory = req.body.category;
    const lowerCaseCategory =
      req.body.category && req.body.category.toLowerCase();

    const alreadyCorporatePlanExist = await corporatePlanModel.findOne({
      corporateId: req.body.corporateId,
      name: new RegExp(`^${lowerCaseName}$`, "i"), // Case-insensitive search
      category: new RegExp(`^${lowerCaseCategory}$`, "i"), // Case-insensitive search
    });

    if (alreadyCorporatePlanExist) {
      console.log(
        "Corporate plan already exists:",
        alreadyCorporatePlanExist._id
      );
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "plan already exist !"
      );
    }

    // Handle booleanFeatureList
    console.log("Processing boolean features...");
    let booleanFeatureList = [];
    if (Array.isArray(req.body.booleanFeatureList)) {
      console.log(
        `Found ${req.body.booleanFeatureList.length} boolean features to process`
      );

      for (const feature of req.body.booleanFeatureList) {
        console.log(`Processing boolean feature: ${feature.name}`);

        if (!feature.name) {
          console.log("Skipping boolean feature with empty name");
          continue;
        }

        let featureId = feature.featureId;
        if (!featureId) {
          console.log(
            `Boolean feature doesn't have featureId, creating a new one...`
          );
          featureId = await tryCreateBooleanFeature(
            feature.name,
            feature.type || "others",
            feature.subType || "others"
          );
          console.log(`Created/Retrieved boolean feature ID: ${featureId}`);
        } else {
          console.log(`Using existing boolean feature ID: ${featureId}`);

          // Check if the feature exists and update if necessary
          try {
            // First try to find by ID
            let existingFeature = await BooleanFeature.findById(featureId);

            if (!existingFeature) {
              // If not found by ID, try to find by name
              console.log(
                `Boolean feature with ID ${featureId} not found, trying to find by name...`
              );
              existingFeature = await BooleanFeature.findOne({
                name: new RegExp(`^${feature.name}$`, "i"),
              });

              if (existingFeature) {
                console.log(
                  `Found boolean feature by name: ${existingFeature._id}`
                );
                // Use this feature ID instead
                featureId = existingFeature._id;
              }
            }

            if (existingFeature) {
              console.log(
                `Found existing boolean feature with ID ${existingFeature._id}`
              );
              if (
                feature.type &&
                feature.subType &&
                (existingFeature.type !== feature.type ||
                  existingFeature.subType !== feature.subType)
              ) {
                console.log(
                  `Updating existing boolean feature types: ${feature.type}/${feature.subType}`
                );
                existingFeature.type = feature.type;
                existingFeature.subType = feature.subType;
                await existingFeature.save();
              }
            } else {
              console.log(
                `Warning: Boolean feature with ID ${featureId} not found in database`
              );
              // Try to create a new feature with the specific ID
              try {
                console.log(
                  `Creating new boolean feature with specified ID ${featureId}`
                );
                const newFeature = new BooleanFeature({
                  _id: featureId,
                  name: feature.name, // Preserve original case
                  status: false,
                  type: feature.type || "others",
                  subType: feature.subType || "others",
                });
                await newFeature.save();
                console.log(
                  `Created missing boolean feature with ID ${featureId}`
                );
              } catch (creationError) {
                console.error(
                  `Error creating boolean feature with ID ${featureId}:`,
                  creationError.message
                );

                // If feature creation fails, create a new one without specifying ID
                console.log(
                  `Falling back to creating a new boolean feature without specific ID`
                );
                const fallbackFeature = new BooleanFeature({
                  name: `${feature.name}_${Date.now()}`, // Preserve original case, add timestamp
                  status: false,
                  type: feature.type || "others",
                  subType: feature.subType || "others",
                });

                try {
                  const savedFeature = await fallbackFeature.save();
                  console.log(
                    `Created fallback boolean feature with new ID: ${savedFeature._id}`
                  );
                  featureId = savedFeature._id;
                } catch (fallbackError) {
                  console.error(
                    `Error creating fallback boolean feature:`,
                    fallbackError.message
                  );
                  // Last resort - create a feature with a pure random name
                  try {
                    const lastResortFeature = new BooleanFeature({
                      name: `Feature_${Math.random()
                        .toString(36)
                        .substring(2, 15)}`, // Capitalize Feature
                      status: false,
                      type: feature.type || "others",
                      subType: feature.subType || "others",
                    });
                    const savedFeature = await lastResortFeature.save();
                    console.log(
                      `Created last resort boolean feature with ID: ${savedFeature._id}`
                    );
                    featureId = savedFeature._id;
                  } catch (lastError) {
                    console.error(
                      `Final attempt to create boolean feature failed:`,
                      lastError.message
                    );
                    // At this point we should skip this feature
                    featureId = null;
                  }
                }
              }
            }
          } catch (err) {
            console.error(
              `Error checking existing boolean feature: ${err.message}`
            );
            // Try to create a new feature as fallback
            try {
              console.log(
                `Falling back to creating a new boolean feature after error`
              );
              featureId = await tryCreateBooleanFeature(
                `${feature.name}_fallback`, // Preserve original case
                feature.type || "others",
                feature.subType || "others"
              );
              console.log(`Created fallback boolean feature ID: ${featureId}`);
            } catch (fallbackError) {
              console.error(
                `Error creating fallback boolean feature:`,
                fallbackError.message
              );
              featureId = null;
            }
          }
        }

        if (!featureId) {
          console.error(
            `Failed to create or retrieve boolean feature ID for: ${feature.name}`
          );
          continue;
        }

        // Verify that the feature exists in the database one last time before adding it
        try {
          const finalCheck = await BooleanFeature.findById(featureId);
          if (!finalCheck) {
            console.warn(
              `Final check failed: Boolean feature with ID ${featureId} not found in database`
            );
            console.log(`Creating an emergency replacement boolean feature...`);

            // Create an emergency replacement feature
            const emergencyFeature = new BooleanFeature({
              name: `Emergency_${feature.name}_${Date.now()}`, // Capitalize Emergency, preserve original case
              status: false,
              type: feature.type || "others",
              subType: feature.subType || "others",
            });

            const savedEmergency = await emergencyFeature.save();
            console.log(
              `Created emergency boolean feature with ID: ${savedEmergency._id}`
            );
            featureId = savedEmergency._id;
          }
        } catch (finalCheckError) {
          console.error(
            `Error during final boolean feature verification:`,
            finalCheckError.message
          );
          // Continue anyway, we've tried our best
        }

        const featureToAdd = {
          name: feature.name,
          status: feature.status === true || feature.status === "true",
          featureId,
          type: feature.type || "others",
          subType: feature.subType || "others",
        };

        console.log(
          `Adding boolean feature to list: ${JSON.stringify(
            featureToAdd,
            null,
            2
          )}`
        );
        booleanFeatureList.push(featureToAdd);
      }
    } else {
      console.log("No boolean features found in request");
    }

    // Handle countFeatureList
    console.log("Processing count features...");
    let countFeatureList = [];
    if (Array.isArray(req.body.countFeatureList)) {
      console.log(
        `Found ${req.body.countFeatureList.length} count features to process`
      );

      for (const feature of req.body.countFeatureList) {
        console.log(`Processing count feature: ${feature.name}`);

        if (!feature.name) {
          console.log("Skipping count feature with empty name");
          continue;
        }

        let featureId = feature.featureId;
        if (!featureId) {
          console.log(
            `Count feature doesn't have featureId, creating a new one...`
          );
          featureId = await tryCreateCountFeature(
            feature.name,
            feature.count || 0,
            feature.type || "others",
            feature.subType || "others"
          );
          console.log(`Created/Retrieved count feature ID: ${featureId}`);
        } else {
          console.log(`Using existing count feature ID: ${featureId}`);

          // Check if the feature exists and update if necessary
          try {
            // First try to find by ID
            let existingFeature = await CountFeature.findById(featureId);

            if (!existingFeature) {
              // If not found by ID, try to find by name
              console.log(
                `Count feature with ID ${featureId} not found, trying to find by name...`
              );
              existingFeature = await CountFeature.findOne({
                name: new RegExp(`^${feature.name}$`, "i"),
              });

              if (existingFeature) {
                console.log(
                  `Found count feature by name: ${existingFeature._id}`
                );
                // Use this feature ID instead
                featureId = existingFeature._id;
              }
            }

            if (existingFeature) {
              console.log(
                `Found existing count feature with ID ${existingFeature._id}`
              );
              if (
                feature.type &&
                feature.subType &&
                (existingFeature.type !== feature.type ||
                  existingFeature.subType !== feature.subType)
              ) {
                console.log(
                  `Updating existing count feature types: ${feature.type}/${feature.subType}`
                );
                existingFeature.type = feature.type;
                existingFeature.subType = feature.subType;
                await existingFeature.save();
              }
            } else {
              console.log(
                `Warning: Count feature with ID ${featureId} not found in database`
              );
              // Try to create a new feature with the specific ID
              try {
                console.log(
                  `Creating new count feature with specified ID ${featureId}`
                );
                const newFeature = new CountFeature({
                  _id: featureId,
                  name: feature.name, // Preserve original case
                  count: feature.count || 0,
                  type: feature.type || "others",
                  subType: feature.subType || "others",
                });
                await newFeature.save();
                console.log(
                  `Created missing count feature with ID ${featureId}`
                );
              } catch (creationError) {
                console.error(
                  `Error creating count feature with ID ${featureId}:`,
                  creationError.message
                );

                // If feature creation fails, create a new one without specifying ID
                console.log(
                  `Falling back to creating a new count feature without specific ID`
                );
                const fallbackFeature = new CountFeature({
                  name: `${feature.name}_${Date.now()}`, // Preserve original case, add timestamp
                  count: feature.count || 0,
                  type: feature.type || "others",
                  subType: feature.subType || "others",
                });

                try {
                  const savedFeature = await fallbackFeature.save();
                  console.log(
                    `Created fallback count feature with new ID: ${savedFeature._id}`
                  );
                  featureId = savedFeature._id;
                } catch (fallbackError) {
                  console.error(
                    `Error creating fallback count feature:`,
                    fallbackError.message
                  );
                  // Last resort - create a feature with a pure random name
                  try {
                    const lastResortFeature = new CountFeature({
                      name: `Feature_${Math.random()
                        .toString(36)
                        .substring(2, 15)}`, // Capitalize Feature
                      count: feature.count || 0,
                      type: feature.type || "others",
                      subType: feature.subType || "others",
                    });
                    const savedFeature = await lastResortFeature.save();
                    console.log(
                      `Created last resort count feature with ID: ${savedFeature._id}`
                    );
                    featureId = savedFeature._id;
                  } catch (lastError) {
                    console.error(
                      `Final attempt to create count feature failed:`,
                      lastError.message
                    );
                    // At this point we should skip this feature
                    featureId = null;
                  }
                }
              }
            }
          } catch (err) {
            console.error(
              `Error checking existing count feature: ${err.message}`
            );
            // Try to create a new feature as fallback
            try {
              console.log(
                `Falling back to creating a new count feature after error`
              );
              featureId = await tryCreateCountFeature(
                `${feature.name}_fallback`, // Preserve original case
                feature.count || 0,
                feature.type || "others",
                feature.subType || "others"
              );
              console.log(`Created fallback count feature ID: ${featureId}`);
            } catch (fallbackError) {
              console.error(
                `Error creating fallback count feature:`,
                fallbackError.message
              );
              featureId = null;
            }
          }
        }

        if (!featureId) {
          console.error(
            `Failed to create or retrieve count feature ID for: ${feature.name}`
          );
          continue;
        }

        // Verify that the feature exists in the database one last time before adding it
        try {
          const finalCheck = await CountFeature.findById(featureId);
          if (!finalCheck) {
            console.warn(
              `Final check failed: Count feature with ID ${featureId} not found in database`
            );
            console.log(`Creating an emergency replacement count feature...`);

            // Create an emergency replacement feature
            const emergencyFeature = new CountFeature({
              name: `Emergency_${feature.name}_${Date.now()}`, // Capitalize Emergency, preserve original case
              count: feature.count || 0,
              type: feature.type || "others",
              subType: feature.subType || "others",
            });

            const savedEmergency = await emergencyFeature.save();
            console.log(
              `Created emergency count feature with ID: ${savedEmergency._id}`
            );
            featureId = savedEmergency._id;
          }
        } catch (finalCheckError) {
          console.error(
            `Error during final count feature verification:`,
            finalCheckError.message
          );
          // Continue anyway, we've tried our best
        }

        const featureToAdd = {
          name: feature.name,
          count: feature.count || 0,
          planType: feature.planType || "yearly",
          featureId,
          type: feature.type || "others",
          subType: feature.subType || "others",
        };

        console.log(
          `Adding count feature to list: ${JSON.stringify(
            featureToAdd,
            null,
            2
          )}`
        );
        countFeatureList.push(featureToAdd);
      }
    } else {
      console.log("No count features found in request");
    }

    console.log("Creating new corporate plan model...");
    const newCorporatePlan = new corporatePlanModel({
      ...req.body,
      name: originalName, // Preserve original case
      category: originalCategory, // Preserve original case
      booleanFeatureList,
      countFeatureList,
    });

    console.log("Saving corporate plan...");
    const savedCorporatePlan = await newCorporatePlan.save();
    console.log(
      `Corporate plan saved successfully with ID: ${savedCorporatePlan._id}`
    );

    // Verify BooleanFeatures in database
    console.log("--------- VERIFYING FEATURES IN DATABASE ---------");
    for (const feature of booleanFeatureList) {
      const dbFeature = await BooleanFeature.findById(feature.featureId);
      console.log(
        `Boolean Feature | ID: ${feature.featureId} | Exists in DB: ${
          dbFeature ? "YES" : "NO"
        } | Type: ${dbFeature?.type} | SubType: ${dbFeature?.subType}`
      );
    }

    // Verify CountFeatures in database
    for (const feature of countFeatureList) {
      const dbFeature = await CountFeature.findById(feature.featureId);
      console.log(
        `Count Feature | ID: ${feature.featureId} | Exists in DB: ${
          dbFeature ? "YES" : "NO"
        } | Type: ${dbFeature?.type} | SubType: ${dbFeature?.subType}`
      );
    }

    console.log("--------- CORPORATE PLAN CREATION COMPLETE ---------");

    // Return success response
    return Response.success(
      res,
      savedCorporatePlan,
      201,
      "Corporate plan created successfully !"
    );
  } catch (err) {
    console.error("Error in addCorporatePlan:", err);
    console.error("Stack trace:", err.stack);

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
    // First get some raw data for debugging
    const sampleRawPlans = await corporatePlanModel
      .find({ corporateId: { $ne: null } })
      .limit(2);

    console.log(
      "Sample Raw Corporate Plans:",
      JSON.stringify(
        sampleRawPlans.map((plan) => ({
          id: plan._id,
          booleanFeatureList: plan.booleanFeatureList,
          countFeatureList: plan.countFeatureList,
        })),
        null,
        2
      )
    );

    const existingAllCorporatePlans = await corporatePlanModel
      .find(
        { corporateId: { $ne: null } },
        "name category price totalCount usedCount duration status endDate booleanFeatureList.name booleanFeatureList.status booleanFeatureList.featureId booleanFeatureList.type booleanFeatureList.subType countFeatureList.name countFeatureList.count countFeatureList.planType countFeatureList.featureId countFeatureList.type countFeatureList.subType"
      )
      .populate({
        path: "corporateId",
        select: "companyName logo",
        // match: { companyName: { $ne: null }, logo: { $ne: null } },
      });

    console.log(
      "Corporate Plans with Projection:",
      JSON.stringify(
        existingAllCorporatePlans.slice(0, 2).map((plan) => ({
          id: plan._id,
          booleanFeatureList: plan.booleanFeatureList,
          countFeatureList: plan.countFeatureList,
        })),
        null,
        2
      )
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
        404,
        AppConstant.FAILED,
        "corporate Id is missing !"
      );
    }

    // First get raw data for debugging
    const rawPlans = await corporatePlanModel.find({ corporateId });
    console.log(
      "Raw Corporate Plans:",
      JSON.stringify(
        rawPlans.map((plan) => ({
          id: plan._id,
          booleanFeatureList: plan.booleanFeatureList,
          countFeatureList: plan.countFeatureList,
        })),
        null,
        2
      )
    );

    // Then use projection
    const existingAllCorporatePlans = await corporatePlanModel.find(
      { corporateId },
      "name category totalCount usedCount booleanFeatureList.name booleanFeatureList.status booleanFeatureList.featureId booleanFeatureList.type booleanFeatureList.subType countFeatureList.name countFeatureList.count countFeatureList.planType countFeatureList.featureId countFeatureList.type countFeatureList.subType"
    );

    console.log(
      "Corporate Plans with Projection:",
      JSON.stringify(
        existingAllCorporatePlans.map((plan) => ({
          id: plan._id,
          booleanFeatureList: plan.booleanFeatureList,
          countFeatureList: plan.countFeatureList,
        })),
        null,
        2
      )
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
        404,
        AppConstant.FAILED,
        "corporate Plan Id is missing !"
      );
    }

    // Add a direct query first to check what's in the database
    const rawPlan = await corporatePlanModel.findById(corporatePlanId);
    console.log(
      "Raw Corporate Plan from DB:",
      JSON.stringify(
        {
          booleanFeatureList: rawPlan.booleanFeatureList,
          countFeatureList: rawPlan.countFeatureList,
        },
        null,
        2
      )
    );

    const existingCorporatePlan = await corporatePlanModel
      .findOne(
        { _id: corporatePlanId },
        "name category totalCount usedCount duration status booleanFeatureList.name booleanFeatureList.status booleanFeatureList.featureId booleanFeatureList.type booleanFeatureList.subType countFeatureList.name countFeatureList.count countFeatureList.planType countFeatureList.featureId countFeatureList.type countFeatureList.subType startDate autoRenew paymentStatus endDate price billingCycle nextBillingDate"
      )
      .populate({
        path: "corporateId",
        populate: {
          path: "addresses",
          select: "name city",
        },
        select: "companyName logo email phone address",
      });

    console.log(
      "Corporate Plan with Projection:",
      JSON.stringify(
        {
          booleanFeatureList: existingCorporatePlan.booleanFeatureList,
          countFeatureList: existingCorporatePlan.countFeatureList,
        },
        null,
        2
      )
    );

    // Return success response
    return Response.success(
      res,
      existingCorporatePlan,
      200,
      "Corporate plan found !"
    );
  } catch (err) {
    // Handle any errors
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
        404,
        AppConstant.FAILED,
        "corporate plan id is missing !"
      );
    }
    const existingCorporatePlan = await corporatePlanModel.findById(
      corporatePlanId
    );

    console.log(
      "Corporate Plan All Fields:",
      JSON.stringify(
        {
          booleanFeatureList: existingCorporatePlan.booleanFeatureList,
          countFeatureList: existingCorporatePlan.countFeatureList,
        },
        null,
        2
      )
    );

    return Response.success(
      res,
      existingCorporatePlan,
      200,
      "Corporate plan found successfully !"
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
