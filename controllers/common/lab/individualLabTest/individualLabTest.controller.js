const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const IndividualLabTest = require("../../../../models/lab/individualLabTest.model");
const Lab = require("../../../../models/lab/lab.model");
const mongoose = require('mongoose');
const {
  individualLabTestValidationSchema,
} = require("../../../../validators/lab/individualLabTest.validator");

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

    const { lab, category, testName } = req.body;
    const lowerCaseCategory = category.toLowerCase();

    // Check if a lab package with the same lab, category and test name already exists
    const existingLabPackage = await IndividualLabTest.findOne({
      lab,
      category: lowerCaseCategory,
      testName,
    });

    if (existingLabPackage) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "A lab package with this lab, category and test name already exists!"
      );
    }

    // Create a new LabPackage instance
    const newLabPackage = new IndividualLabTest({
      ...req.body,
      category: lowerCaseCategory,
    });

    const savedLabPackage = await newLabPackage.save();
    return Response.success(
      res,
      savedLabPackage,
      201,
      "Lab package created successfully!"
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

const updateIndividualLabTest = async (req, res) => {
  try {
    const { labTestId } = req.params;
    if (!labTestId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "labTest Id is missing!"
      );
    }

    // Validate request body
    // const { error } = labPackageValidationSchema.validate(req.body);
    // if (error) {
    //   return Response.error(
    //     res,
    //     400,
    //     AppConstant.FAILED,
    //     error.message || "Validation failed!"
    //   );
    // }

    // If category is being updated, convert to lowercase
    if (req.body.category) {
      req.body.category = req.body.category.toLowerCase();
    }

    // Check if updating would create a duplicate
    if (req.body.testName || req.body.category || req.body.lab) {
      const existingPackage = await IndividualLabTest.findOne({
        _id: { $ne: labTestId },
        lab: req.body.lab || undefined,
        category: req.body.category || undefined,
        testName: req.body.testName || undefined,
      });

      if (existingPackage) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "A lab package with these details already exists!"
        );
      }
    }

    const updatedPackage = await IndividualLabTest.findOneAndUpdate(
      { _id: labTestId },
      { $set: req.body },
      { new: true }
    );

    if (!updatedPackage) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Lab package not found!"
      );
    }

    return Response.success(
      res,
      updatedPackage,
      200,
      "Lab package updated successfully!"
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
      home_collection
    } = req.body;

    // Build the search query object
    const query = {};

    // Add filters based on provided parameters
    if (name) {
      query.testName = { $regex: new RegExp(name, 'i') }; // Case-insensitive search
    }

    if (category) {
      query.category = { $regex: new RegExp(category, 'i') };
    }

    if (code) {
      query.code = { $regex: new RegExp(code, 'i') };
    }

    // Handle price range
    if (minPrice || maxPrice) {
      query.prevaCarePrice = {}
      if (minPrice) query.prevaCarePrice.$gte = Number(minPrice);
      if (maxPrice) query.prevaCarePrice.$lte = Number(maxPrice);
    }

    // Handle location search
    if (city || zipCode) {
      // Build the filter for cityOperatedIn array
      const cityFilter = {};

      if (city) {
        cityFilter['cityOperatedIn.cityName'] = { $regex: new RegExp(city, 'i') };
      }

      if (zipCode) {
        cityFilter['cityOperatedIn.zipCode'] = zipCode;
      }

      // Apply the filters to the query
      Object.assign(query, cityFilter);
    }

    // Handle home collection filter
    if (home_collection) {
      query['home_collection.available'] = home_collection === 'true';
    }

    // Execute the search query with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const tests = await IndividualLabTest.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });

    // Get total count for pagination info
    const totalTests = await IndividualLabTest.countDocuments(query);

    // Return response
    return res.status(200).json({
      success: true,
      count: tests.length,
      total: totalTests,
      totalPages: Math.ceil(totalTests / limit),
      currentPage: page,
      data: tests
    });
  } catch (error) {
    console.error("Error searching tests:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const getTestsByCategory = async (req, res) => {
  try {
    const { category } = req.query;

    // Validate that category parameter is provided
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category parameter is required"
      });
    }

    // Build the search query with case-insensitive category search
    const query = {
      category: { $regex: new RegExp(category, 'i') }
    };

    // Handle pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find tests matching the category
    const tests = await IndividualLabTest.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });

    // Get total count for pagination
    const totalTests = await IndividualLabTest.countDocuments(query);

    // Return response with pagination metadata
    return res.status(200).json({
      success: true,
      count: tests.length,
      total: totalTests,
      totalPages: Math.ceil(totalTests / limit),
      currentPage: page,
      data: tests
    });

  } catch (error) {
    console.error("Error fetching tests by category:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

const getAllTestOfParticularLab = async (req, res) => {
  try {
    const { labId } = req.params;

    // Validate labId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(labId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lab ID format'
      });
    }

    // Check if lab exists
    const lab = await Lab.findById(labId);
    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }
    const labIdobj = new mongoose.Types.ObjectId(labId);
    console.log(labIdobj);
    const tests = await IndividualLabTest.find({ lab: labIdobj });
    return res.status(200).json({
      success: true,
      count: tests.length,
      data: tests
    });

  } catch (error) {
    console.error('Error fetching lab tests:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

const getTestByCategoryOfPaticularLab = async (req, res) => {
  try {
    const { labId,category } = req.params;

    // Validate labId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(labId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lab ID format'
      });
    }
    if(!category){
      return res.status(400).json({
        success: false,
        message: 'category is required'
      });
    }

    // Check if lab exists
    const lab = await Lab.findById(labId);
    if (!lab) {
      return res.status(404).json({
        success: false,
        message: 'Lab not found'
      });
    }
    const labIdobj = new mongoose.Types.ObjectId(labId);
    console.log(labIdobj);
    const tests = await IndividualLabTest.find({ lab: labIdobj, category: { $regex: new RegExp(category, 'i') } });
    return res.status(200).json({
      success: true,
      count: tests.length,
      data: tests
    });

  } catch (error) {
    console.error('Error fetching lab tests:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}

module.exports = { createIndividualLabTest, updateIndividualLabTest, searchIndividualLabTest, getTestsByCategory, getAllTestOfParticularLab,getTestByCategoryOfPaticularLab };
