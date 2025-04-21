const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const IndividualLabTest = require("../../../../models/lab/individualLabTest.model");
const Lab = require("../../../../models/lab/lab.model");
const City = require("../../../../models/lab/city.model");
const mongoose = require("mongoose");
const cacheManager = require("../../../../utils/cacheManager");
const {
  individualLabTestValidationSchema,
} = require("../../../../validators/lab/individualLabTest.validator");

/**
 * Create a new individual lab test
 * @route POST /admin/lab/test/create
 */
const createIndividualLabTest = async (req, res) => {
  try {
    const {
      lab,
      category,
      testName,
      testCode,
      desc,
      testIncluded,
      sampleRequired,
      preparationRequired,
      gender,
      ageGroup,
      cityAvailability = [],
    } = req.body;

    console.log("Request body for creating lab test:", req.body);

    // Basic validation checks
    if (!lab || !testName || !testCode || !category) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Required fields missing: lab, testName, testCode, and category are required"
      );
    }

    // Validate lab ID
    if (!mongoose.Types.ObjectId.isValid(lab)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid Lab ID format"
      );
    }

    // Check if lab exists
    const labExists = await Lab.findById(lab);
    if (!labExists) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // Check if a test with the same code already exists for this lab
    const existingTest = await IndividualLabTest.findOne({
      testCode: testCode.trim(),
      lab,
    });

    if (existingTest) {
      return Response.error(
        res,
        409,
        AppConstant.FAILED,
        "A test with this code already exists for this lab!"
      );
    }

    // Process city availability
    const processedCityAvailability = [];
    const unavailableCities = [];
    const errors = [];

    if (cityAvailability && cityAvailability.length > 0) {
      // Get lab's available cities
      const labAvailableCities = labExists.availableCities || [];

      for (const cityData of cityAvailability) {
        try {
          let cityId = cityData.cityId;
          let cityDocument;
          let matchingLabCity;

          // Case 1: Direct cityId is provided
          if (cityId && mongoose.Types.ObjectId.isValid(cityId)) {
            cityDocument = await City.findById(cityId);
            if (!cityDocument) {
              errors.push(`City with ID ${cityId} does not exist`);
              continue;
            }

            matchingLabCity = labAvailableCities.find(
              (city) => city.cityId.toString() === cityId.toString()
            );
          }
          // Case 2: cityName and state are provided
          else if (cityData.cityName && cityData.state) {
            const normalizedCityName = cityData.cityName.toLowerCase().trim();
            const normalizedState = cityData.state.toLowerCase().trim();

            console.log(
              "Looking for city:",
              normalizedCityName,
              normalizedState
            );

            matchingLabCity = labAvailableCities.find(
              (city) =>
                city.cityName.toLowerCase().trim() === normalizedCityName &&
                city.state.toLowerCase().trim() === normalizedState
            );

            if (!matchingLabCity) {
              // Try to find if the city exists in the City collection
              cityDocument = await City.findOne({
                cityName: normalizedCityName,
                state: normalizedState,
              });

              if (cityDocument) {
                unavailableCities.push(
                  `${cityData.cityName}, ${cityData.state}`
                );
                continue; // Skip this city as it's not in lab's available cities
              } else {
                errors.push(
                  `City ${cityData.cityName}, ${cityData.state} not found in database`
                );
                continue;
              }
            } else {
              cityId = matchingLabCity.cityId;
              cityDocument = await City.findById(cityId);

              if (!cityDocument) {
                errors.push(
                  `City referenced in lab's availableCities does not exist in City collection`
                );
                continue;
              }
            }
          } else {
            errors.push(
              "Each city must have either a valid cityId or both cityName and state"
            );
            continue;
          }

          // Validate required pricing fields
          if (!cityData.billingRate) {
            errors.push(
              `City-specific lab selling price (billingRate) is required for ${cityDocument.cityName}`
            );
            continue;
          }

          if (!cityData.partnerRate) {
            errors.push(
              `City-specific offered price to PrevaCare (partnerRate) is required for ${cityDocument.cityName}`
            );
            continue;
          }

          if (!cityData.prevaCarePriceForCorporate) {
            errors.push(
              `City-specific PrevaCare price for Corporate (prevaCarePriceForCorporate) is required for ${cityDocument.cityName}`
            );
            continue;
          }

          if (!cityData.discountPercentage && cityData.discountPercentage !== 0) {
            errors.push(
              `City-specific discount percentage is required for ${cityDocument.cityName}`
            );
            continue;
          }

          // Add to processed list with all required fields
          const cityEntry = {
            cityId: cityDocument._id,
            cityName: cityDocument.cityName,
            state: cityDocument.state,
            pinCodes_excluded: cityData.pinCodes_excluded || [],
            regions_excluded: cityData.regions_excluded || [],
            isActive: cityData.isActive !== false,
            billingRate: parseFloat(cityData.billingRate || 0),
            partnerRate: parseFloat(cityData.partnerRate || 0),
            prevaCarePriceForCorporate: parseFloat(cityData.prevaCarePriceForCorporate || 0),
            prevaCarePriceForIndividual: parseFloat(cityData.prevaCarePriceForIndividual || 0),
            discountPercentage: parseFloat(cityData.discountPercentage || 0),
            homeCollectionCharge: parseFloat(cityData.homeCollectionCharge || 0),
            homeCollectionAvailable:
              cityData.homeCollectionAvailable !== undefined
                ? Boolean(cityData.homeCollectionAvailable)
                : parseFloat(cityData.homeCollectionCharge || 0) > 0,
          };

          processedCityAvailability.push(cityEntry);
        } catch (cityError) {
          console.error("Error processing city:", cityError);
          errors.push(`Error processing city: ${cityError.message}`);
        }
      }
    }

    // Return errors if any
    if (errors.length > 0) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        `Validation errors: ${errors.join("; ")}`
      );
    }

    // Return warning if some cities are unavailable
    if (unavailableCities.length > 0) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        `Your lab does not deliver to these cities: ${unavailableCities.join(
          ", "
        )}. Please add these cities to the parent lab first.`
      );
    }

    // Process testIncluded if provided
    let processedTestIncluded = testIncluded;
    if (testIncluded && Array.isArray(testIncluded)) {
      processedTestIncluded = testIncluded.map((test) => ({
        test: typeof test === "string" ? test : test.test || "",
        parameters: Array.isArray(test.parameters) ? test.parameters : [],
      }));
    }
    console.log("processedTestIncluded", processedTestIncluded);

    // Create new lab test
    const newLabTest = new IndividualLabTest({
      lab,
      testName: testName.trim(),
      testCode: testCode.trim(),
      desc: desc || "",
      category: category.toLowerCase().trim(),
      testIncluded: processedTestIncluded[0],
      sampleRequired: sampleRequired || [],
      preparationRequired: preparationRequired || [],
      gender: gender || "both",
      ageGroup: ageGroup || "all age group",
      cityAvailability: processedCityAvailability,
    });

    const savedTest = await newLabTest.save();

    return Response.success(
      res,
      savedTest,
      201,
      "Lab test created successfully!"
    );
  } catch (err) {
    console.error("Error creating lab test:", err);

    // Handle duplicate key error
    if (err.code === 11000) {
      return Response.error(
        res,
        409,
        AppConstant.FAILED,
        "Duplicate entry found"
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

/**
 * Update an individual lab test
 * @route PATCH /admin/lab/test/:testId
 */
const updateIndividualLabTest = async (req, res) => {
  try {
    const { testId } = req.params;
    if (!testId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Test ID is missing!"
      );
    }

    // Validate request body
    const { error } = individualLabTestValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    // If category is being updated, convert to lowercase
    if (req.body.category) {
      req.body.category = req.body.category.toLowerCase();
    }

    // Check if updating would create a duplicate test code
    if (req.body.testCode) {
      const existingTest = await IndividualLabTest.findOne({
        _id: { $ne: testId },
        testCode: req.body.testCode,
        lab: req.body.lab || undefined,
      });

      if (existingTest) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "A test with this code already exists!"
        );
      }
    }

    const updatedTest = await IndividualLabTest.findOneAndUpdate(
      { _id: testId },
      { $set: req.body },
      { new: true }
    ).populate("lab", "name email phone address logo");

    if (!updatedTest) {
      return Response.error(res, 404, AppConstant.FAILED, "Test not found!");
    }

    return Response.success(
      res,
      updatedTest,
      200,
      "Test updated successfully!"
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

/**
 * Delete an individual lab test
 * @route DELETE /admin/lab/test/:testId
 */
const deleteIndividualLabTest = async (req, res) => {
  try {
    const { testId } = req.params;
    if (!testId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Test ID is missing!"
      );
    }

    const test = await IndividualLabTest.findById(testId);
    if (!test) {
      return Response.error(res, 404, AppConstant.FAILED, "Test not found!");
    }

    // Delete the test
    await test.remove();

    // Update lab's test count
    await Lab.findByIdAndUpdate(test.lab, { $inc: { testCount: -1 } });

    return Response.success(res, null, 200, "Test deleted successfully!");
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

/**
 * Search for individual lab tests
 * @route POST /admin/tests/search
 */
const searchIndividualLabTest = async (req, res) => {
  try {
    const {
      name,
      category,
      code,
      minPrice,
      maxPrice,
      city,
      zipCode,
      home_collection,
    } = req.body;

    // Build the search query object
    const query = {};

    // Add filters based on provided parameters
    if (name) {
      query.testName = { $regex: new RegExp(name, "i") };
    }

    if (category) {
      query.category = { $regex: new RegExp(category, "i") };
    }

    if (code) {
      query.testCode = { $regex: new RegExp(code, "i") };
    }

    // Handle price range
    if (minPrice || maxPrice) {
      query.prevaCarePriceForCorporate = {};
      if (minPrice) query.prevaCarePriceForCorporate.$gte = Number(minPrice);
      if (maxPrice) query.prevaCarePriceForCorporate.$lte = Number(maxPrice);
    }

    // Handle location search
    if (city || zipCode) {
      const cityQuery = {};
      if (city) {
        cityQuery.cityName = { $regex: new RegExp(city, "i") };
      }
      if (zipCode) {
        cityQuery.pincode = zipCode;
      }

      const cities = await City.find(cityQuery);
      const cityIds = cities.map((city) => city._id);

      query["cityAvailability.cityId"] = { $in: cityIds };
    }

    // Handle home collection filter
    if (home_collection !== undefined) {
      query["cityAvailability.homeCollectionAvailable"] =
        home_collection === "true";
    }

    // Execute the search query with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const tests = await IndividualLabTest.find(query)
      .populate("lab", "name email phone address logo")
      .populate("cityAvailability.cityId")
      .skip(skip)
      .limit(limit)
      .sort({ testName: 1 });

    // Get total count for pagination info
    const totalTests = await IndividualLabTest.countDocuments(query);

    return Response.success(
      res,
      {
        tests,
        pagination: {
          total: totalTests,
          totalPages: Math.ceil(totalTests / limit),
          currentPage: page,
          perPage: limit,
        },
      },
      200,
      "Tests retrieved successfully"
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

/**
 * Get tests by category
 * @route GET /admin/tests/byCategory
 */
const getTestsByCategory = async (req, res) => {
  try {
    const { category } = req.query;

    if (!category) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Category is required"
      );
    }

    const tests = await IndividualLabTest.find({
      category: { $regex: new RegExp(category, "i") },
    })
      .populate("lab", "name email phone address logo")
      .populate("cityAvailability.cityId")
      .sort({ testName: 1 });

    return Response.success(
      res,
      { tests },
      200,
      "Tests retrieved successfully"
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

/**
 * Get all tests for a particular lab
 * @route GET /admin/labs/:labId/tests
 */
const getAllTestOfParticularLab = async (req, res) => {
  try {
    const { labId } = req.params;
    // Add pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(labId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid lab ID format"
      );
    }

    // Check if lab exists with minimal projection
    const lab = await Lab.findById(labId, "_id labName");
    if (!lab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // Use projection to select only needed fields
    // Use lean() for better performance
    const tests = await IndividualLabTest.find({ lab: labId })
      .select(
        "testCode testName category sampleRequired preparationRequired cityAvailability"
      )
      .populate("cityAvailability.cityId", "cityName state")
      .lean()
      .skip(skip)
      .limit(limit)
      .sort({ testName: 1 });

    // Get total count for pagination info
    const totalTests = await IndividualLabTest.countDocuments({ lab: labId });

    return Response.success(
      res,
      {
        tests,
        pagination: {
          total: totalTests,
          totalPages: Math.ceil(totalTests / limit),
          currentPage: page,
          perPage: limit,
        },
      },
      200,
      "Tests retrieved successfully"
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

/**
 * Get tests by category for a particular lab
 * @route GET /admin/labs/:labId/test/by-category/:category
 */
const getTestByCategoryOfPaticularLab = async (req, res) => {
  try {
    const { labId, category } = req.params;
    // Add pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(labId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid lab ID format"
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

    // Check if lab exists with minimal projection
    const lab = await Lab.findById(labId, "_id labName");
    if (!lab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // Build query with case-insensitive category search
    const query = {
      lab: labId,
      category: { $regex: new RegExp(category, "i") },
    };

    // Use projection to select only needed fields
    // Use lean() for better performance
    const tests = await IndividualLabTest.find(query)
      .select(
        "testCode testName category sampleRequired preparationRequired cityAvailability"
      )
      .populate("cityAvailability.cityId", "cityName pincode")
      .lean()
      .skip(skip)
      .limit(limit)
      .sort({ testName: 1 });

    // Get total count for pagination info
    const totalTests = await IndividualLabTest.countDocuments(query);

    return Response.success(
      res,
      {
        tests,
        pagination: {
          total: totalTests,
          totalPages: Math.ceil(totalTests / limit),
          currentPage: page,
          perPage: limit,
        },
      },
      200,
      "Tests retrieved successfully"
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

const getAllCategoriesOfTestsOfParticularLab = async (req, res) => {
  try {
    const { labId } = req.body;
    if (!labId) {
      return Response.error(res, 404, AppConstant.FAILED, "labId is missing !");
    }

    if (!mongoose.Types.ObjectId.isValid(labId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid lab ID format"
      );
    }

    // Check cache first
    const cacheKey = `lab_categories_${labId}`;
    const cachedCategories = cacheManager.get(cacheKey);

    // if (cachedCategories) {
    //   console.log(`Cache hit for ${cacheKey}`);
    //   return Response.success(
    //     res,
    //     cachedCategories,
    //     200,
    //     "All categories of lab tests found successfully (cached)!"
    //   );
    // }

    // console.log(`Cache miss for ${cacheKey}, fetching from database`);

    // Use MongoDB aggregation for better performance
    const categories = await IndividualLabTest.aggregate([
      {
        $match: {
          lab: new mongoose.Types.ObjectId(labId),
          isActive: true,
        },
      },
      { $group: { _id: "$category" } },
      { $project: { _id: 0, category: "$_id" } },
      { $sort: { category: 1 } },
    ]);

    // Store in cache for 30 minutes
    cacheManager.set(cacheKey, categories, 30 * 60);

    // Return success response
    return Response.success(
      res,
      categories,
      200,
      "All categories of lab tests found successfully!"
    );
  } catch (err) {
    console.error("Error in getAllCategoriesOfTestsOfParticularLab:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

module.exports = {
  createIndividualLabTest,
  updateIndividualLabTest,
  deleteIndividualLabTest,
  searchIndividualLabTest,
  getTestsByCategory,
  getAllTestOfParticularLab,
  getTestByCategoryOfPaticularLab,
  getAllCategoriesOfTestsOfParticularLab,
};
