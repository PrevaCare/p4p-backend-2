const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const IndividualLabTest = require("../../../../models/lab/individualLabTest.model");
const Lab = require("../../../../models/lab/lab.model");
const City = require("../../../../models/lab/city.model");
const mongoose = require("mongoose");
const {
  individualLabTestValidationSchema,
} = require("../../../../validators/lab/individualLabTest.validator");

/**
 * Create a new individual lab test
 * @route POST /admin/lab/test/create
 */
const createIndividualLabTest = async (req, res) => {
  try {
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

    const { lab, category, testName, testCode } = req.body;
    const lowerCaseCategory = category.toLowerCase();

    // Check if lab exists
    const labExists = await Lab.findById(lab);
    if (!labExists) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // Check if a test with the same code already exists
    const existingTest = await IndividualLabTest.findOne({
      testCode,
      lab,
    });

    if (existingTest) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "A test with this code already exists for this lab!"
      );
    }

    // Create a new IndividualLabTest instance
    const newTest = new IndividualLabTest({
      ...req.body,
      category: lowerCaseCategory,
    });

    const savedTest = await newTest.save();

    // Update lab's test count
    await Lab.findByIdAndUpdate(lab, { $inc: { testCount: 1 } });

    return Response.success(
      res,
      savedTest,
      201,
      "Lab test created successfully!"
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
      query.prevaCarePrice = {};
      if (minPrice) query.prevaCarePrice.$gte = Number(minPrice);
      if (maxPrice) query.prevaCarePrice.$lte = Number(maxPrice);
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

    if (!mongoose.Types.ObjectId.isValid(labId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid lab ID format"
      );
    }

    const lab = await Lab.findById(labId);
    if (!lab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    const tests = await IndividualLabTest.find({ lab: labId })
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
 * Get tests by category for a particular lab
 * @route GET /admin/labs/:labId/test/by-category/:category
 */
const getTestByCategoryOfPaticularLab = async (req, res) => {
  try {
    const { labId, category } = req.params;

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

    const lab = await Lab.findById(labId);
    if (!lab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    const tests = await IndividualLabTest.find({
      lab: labId,
      category: { $regex: new RegExp(category, "i") },
    })
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

module.exports = {
  createIndividualLabTest,
  updateIndividualLabTest,
  deleteIndividualLabTest,
  searchIndividualLabTest,
  getTestsByCategory,
  getAllTestOfParticularLab,
  getTestByCategoryOfPaticularLab,
};
