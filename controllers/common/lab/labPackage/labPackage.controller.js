const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const LabPackage = require("../../../../models/lab/labPackage/addLabPackage.model");
const {
  labPackageValidationSchema,
} = require("../../../../validators/lab/labPackage/labPackage.validator");
const Lab = require("../../../../models/lab/lab.model");
const City = require("../../../../models/lab/city.model");

const createLabPackage = async (req, res) => {
  // console.log("createLabPackage called with body:", JSON.stringify(req.body));

  try {
    // Parse and validate request body
    const {
      labId,
      packageCode,
      packageName,
      category,
      desc,
      testIncluded,
      sampleRequired,
      preparationRequired,
      gender,
      ageGroup,
      cityAvailability,
    } = req.body;

    // Basic validation
    if (!labId) {
      return Response.error(res, 400, AppConstant.FAILED, "Lab ID is required");
    }

    if (!packageCode) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Package code is required"
      );
    }

    if (!packageName) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Package name is required"
      );
    }

    if (!category) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Category is required"
      );
    }

    if (
      !testIncluded ||
      !Array.isArray(testIncluded) ||
      testIncluded.length === 0
    ) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "At least one test must be included in the package"
      );
    }

    // Check if lab exists
    const lab = await Lab.findById(labId);
    if (!lab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // Check if package code already exists
    const existingPackage = await LabPackage.findOne({ packageCode });
    if (existingPackage) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "A package with this package code already exists"
      );
    }

    // Process cityAvailability data
    const processedCityAvailability = [];

    if (cityAvailability && cityAvailability.length > 0) {
      for (const cityData of cityAvailability) {
        let city = await City.findOne({ pincode: cityData.pinCode });

        // If city does not exist, create it
        if (!city) {
          city = new City({
            cityName: cityData.cityName,
            pincode: cityData.pinCode,
          });
          await city.save(); // Save the new city to the database
        }
        console.log("city", city);
        // Add city details to processedCityAvailability
        processedCityAvailability.push({
          cityId: city._id, // Use the city ID
          cityName: city.cityName,
          pinCode: city.pincode,
          billingRate: cityData.billingRate,
          partnerRate: cityData.partnerRate,
          prevaCarePrice: cityData.prevaCarePrice,
          discountPercentage: cityData.discountPercentage,
          homeCollectionCharge: cityData.homeCollectionCharge,
          homeCollectionAvailable: cityData.homeCollectionAvailable,
          isActive: cityData.isActive,
        });
      }
    }

    // Process test included data
    const processedTestIncluded = testIncluded.map((test) => {
      if (typeof test === "string") {
        // If test is just a string, convert to object format
        return { test, parameters: [] };
      } else if (typeof test === "object") {
        // Ensure test has the required 'test' field
        if (!test.test) {
          throw new Error(
            'Each test must have a "test" field with the test name'
          );
        }
        // Ensure parameters is an array
        return {
          test: test.test,
          parameters: Array.isArray(test.parameters) ? test.parameters : [],
        };
      }
    });

    // Create new lab package
    const newPackage = new LabPackage({
      labId,
      packageCode,
      packageName,
      category: category.toLowerCase(),
      desc: desc || "",
      testIncluded: processedTestIncluded,
      sampleRequired: Array.isArray(sampleRequired) ? sampleRequired : [],
      preparationRequired: Array.isArray(preparationRequired)
        ? preparationRequired
        : [],
      gender: gender || "both",
      ageGroup: ageGroup || "all age group",
      cityAvailability: processedCityAvailability,
    });

    const savedPackage = await newPackage.save();

    return Response.success(
      res,
      savedPackage,
      201,
      "Lab package created successfully"
    );
  } catch (err) {
    console.error("Error creating lab package:", err);

    // Handle Mongoose validation errors
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        `Validation error: ${errors.join(", ")}`
      );
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "A package with the same package code already exists"
      );
    }

    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

const updateLabPackage = async (req, res) => {
  console.log("updateLabPackage called with body:", JSON.stringify(req.body));

  try {
    const { packageId } = req.params;
    if (!packageId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Package Id is missing!"
      );
    }

    // Check if package exists
    const existingLabPackage = await LabPackage.findById(packageId);
    if (!existingLabPackage) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Lab package not found!"
      );
    }

    // If category is being updated, convert to lowercase
    if (req.body.category) {
      req.body.category = req.body.category.toLowerCase();
    }

    // Check for unique constraint violations
    if (req.body.packageCode || req.body.labId) {
      // Create query to find potential duplicates
      const query = { _id: { $ne: packageId } }; // Not the current package

      if (req.body.packageCode) {
        query.packageCode = req.body.packageCode;
      }

      if (req.body.labId) {
        query.labId = req.body.labId;
      }

      // Check if a package with the same code/labId exists
      const existingPackage = await LabPackage.findOne(query);

      if (existingPackage) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "Package Code and LabId cannot be updated!"
        );
      }
    }

    // Process cityAvailability if included in the update
    if (req.body.cityAvailability && Array.isArray(req.body.cityAvailability)) {
      // Get lab details
      const labId = req.body.labId || existingLabPackage.labId;
      const lab = await Lab.findById(labId);

      if (!lab) {
        return Response.error(res, 404, AppConstant.FAILED, "Lab not found!");
      }

      // Get lab's available cities
      const labCities = new Map();
      if (lab.availableCities && lab.availableCities.length > 0) {
        lab.availableCities.forEach((city) => {
          if (city.cityId) {
            labCities.set(city.cityId.toString(), {
              isActive: city.isActive,
              cityName: city.cityName,
              pinCode: city.pinCode,
            });
          }
        });
      }

      // Validate each city in cityAvailability
      for (const cityData of req.body.cityAvailability) {
        if (!cityData.cityId) {
          return Response.error(
            res,
            400,
            AppConstant.FAILED,
            "City ID is required for all city availability entries"
          );
        }

        // Check if lab delivers to this city
        if (!labCities.has(cityData.cityId.toString())) {
          const city = await City.findById(cityData.cityId);
          const cityName = city ? city.cityName : "Unknown";

          return Response.error(
            res,
            400,
            AppConstant.FAILED,
            `This lab doesn't deliver to ${cityName} (ID: ${cityData.cityId}). Please update the lab's available cities first.`
          );
        }

        // Get city details if needed
        if (!cityData.cityName || !cityData.pinCode) {
          const city = await City.findById(cityData.cityId);
          if (!city) {
            return Response.error(
              res,
              404,
              AppConstant.FAILED,
              `City with ID ${cityData.cityId} not found`
            );
          }

          // Auto-fill city details
          cityData.cityName = cityData.cityName || city.cityName;
          cityData.pinCode = cityData.pinCode || city.pincode;
        }

        // Validate required pricing fields
        const requiredFields = [
          { field: "billingRate", name: "Billing rate" },
          { field: "partnerRate", name: "Partner rate" },
          { field: "prevaCarePrice", name: "PrevaCare price" },
          { field: "discountPercentage", name: "Discount percentage" },
        ];

        for (const { field, name } of requiredFields) {
          if (
            cityData[field] === undefined ||
            cityData[field] === null ||
            cityData[field] === ""
          ) {
            return Response.error(
              res,
              400,
              AppConstant.FAILED,
              `${name} is required for city ${cityData.cityName}`
            );
          }

          // Ensure numeric values
          cityData[field] = parseFloat(cityData[field]);
          if (isNaN(cityData[field])) {
            return Response.error(
              res,
              400,
              AppConstant.FAILED,
              `${name} must be a valid number for city ${cityData.cityName}`
            );
          }
        }

        // Set default values for optional fields
        if (cityData.homeCollectionCharge !== undefined) {
          cityData.homeCollectionCharge = parseFloat(
            cityData.homeCollectionCharge
          );
        }

        if (
          cityData.homeCollectionAvailable === undefined &&
          cityData.homeCollectionCharge !== undefined
        ) {
          cityData.homeCollectionAvailable = cityData.homeCollectionCharge > 0;
        }
      }
    }

    // Process testIncluded data if included in the update
    if (req.body.testIncluded && Array.isArray(req.body.testIncluded)) {
      req.body.testIncluded = req.body.testIncluded.map((test) => {
        if (typeof test === "string") {
          // If test is just a string, convert to object format
          return { test, parameters: [] };
        } else if (typeof test === "object") {
          // Ensure test has the required 'test' field
          if (!test.test) {
            throw new Error(
              'Each test must have a "test" field with the test name'
            );
          }
          // Ensure parameters is an array
          return {
            test: test.test,
            parameters: Array.isArray(test.parameters) ? test.parameters : [],
          };
        }
        return test;
      });
    }

    // Update the package
    const updatedPackage = await LabPackage.findByIdAndUpdate(
      packageId,
      { $set: req.body },
      { new: true }
    );

    return Response.success(
      res,
      updatedPackage,
      200,
      "Lab package updated successfully!"
    );
  } catch (err) {
    console.error("Error updating lab package:", err);

    // Handle validation errors
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        `Validation error: ${errors.join(", ")}`
      );
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Package Code and LabId must be unique!"
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

// Add this to fix existing documents with null packageName values
const migrateNullPackageNames = async () => {
  try {
    // Find all documents where packageName is null but testName exists
    const packagesToFix = await LabPackage.find({
      packageName: null,
      testName: { $ne: null },
    });

    for (const pkg of packagesToFix) {
      // Use the testName as packageName
      await LabPackage.updateOne(
        { _id: pkg._id },
        { $set: { packageName: pkg.testName } }
      );
    }

    console.log(
      `Fixed ${packagesToFix.length} packages with null packageName values`
    );
  } catch (error) {
    console.error("Migration error:", error);
  }
};

// You can call this function once from your main application setup
// migrateNullPackageNames();

module.exports = { createLabPackage, updateLabPackage };
