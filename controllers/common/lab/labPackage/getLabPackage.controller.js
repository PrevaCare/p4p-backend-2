const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const LabPackage = require("../../../../models/lab/labPackage/addLabPackage.model");
const LapPackage = require("../../../../models/lab/labPackage/addLabPackage.model");
const Lab = require("../../../../models/lab/lab.model");
const mongoose = require("mongoose");

const getAllCategoryOfPackageOfParticularLab = async (req, res) => {
  try {
    // Validate request body
    const { labId } = req.body;
    if (!labId) {
      return Response.error(res, 404, AppConstant.FAILED, "labId is missing !");
    }

    const allCategories = await LabPackage.find({
      labId: new mongoose.Types.ObjectId(labId),
    }).select("_id category");

    const uniqueCategories = [];
    const seenCategories = new Set();

    allCategories.forEach((item) => {
      if (!seenCategories.has(item.category)) {
        seenCategories.add(item.category);
        uniqueCategories.push({
          _id: item._id,
          category: item.category,
        });
      }
    });
    // Return success response
    return Response.success(
      res,
      uniqueCategories,
      200,
      "All Category of Lab packages found  successfully !"
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

const getAllTestOfParticularCategoryOfPackageOfParticularLab = async (
  req,
  res
) => {
  try {
    const { labId, category } = req.body;

    // Add logging
    console.log("Search parameters:", { labId, category });

    // Perform a direct find without any transformations
    const documents = await LabPackage.find({
      lab: labId,
      category: category,
    });

    console.log(`Found ${documents.length} documents`);

    // Just return exactly what we found
    return Response.success(res, documents, 200, "Raw documents returned");
  } catch (err) {
    console.error("Error:", err);
    return Response.error(res, 500, AppConstant.FAILED, err.message);
  }
};

const getSingleLabPackageDetailsById = async (req, res) => {
  try {
    const { packageId } = req.query;
    const { labId } = req.params;

    // Strict validation for required fields
    if (!packageId || packageId.trim() === "") {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "packageId is required!"
      );
    }

    if (!labId || labId.trim() === "") {
      return Response.error(res, 400, AppConstant.FAILED, "labId is required!");
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid packageId format"
      );
    }

    if (!mongoose.Types.ObjectId.isValid(labId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid labId format"
      );
    }

    // Convert string IDs to ObjectIds
    const packageObjectId = new mongoose.Types.ObjectId(packageId);
    const labObjectId = new mongoose.Types.ObjectId(labId);

    console.log("Searching for package with:", {
      packageId: packageObjectId,
      labId: labObjectId,
    });

    // Find the package with both packageId and labId
    const existingPackage = await LabPackage.findOne({
      _id: packageObjectId,
      labId: labObjectId,
    })
      .populate({
        path: "cityAvailability.cityId",
        model: "City",
        select: "-__v",
      });

    console.log("Found package:", existingPackage);

    if (!existingPackage) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "No package found with given packageId and labId"
      );
    }

    // Return success response with package details
    return Response.success(
      res,
      existingPackage,
      200,
      "Package details found successfully!"
    );
  } catch (err) {
    console.error("Error in getSingleLabPackageDetailsById:", err);
    if (err.name === "CastError") {
      return Response.error(res, 400, AppConstant.FAILED, "Invalid ID format");
    }
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

const updateLabPackageById = async (req, res) => {
  try {
    const { packageId } = req.params;
    const updateData = req.body;

    if (!packageId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Package ID is required"
      );
    }

    console.log(`Updating package with ID: ${packageId}`, updateData);

    // Find and update the package
    const updatedPackage = await LabPackage.findByIdAndUpdate(
      packageId,
      updateData,
      { new: true } // Return the updated document
    );

    if (!updatedPackage) {
      return Response.error(res, 404, AppConstant.FAILED, "Package not found");
    }

    return Response.success(
      res,
      updatedPackage,
      200,
      "Package updated successfully"
    );
  } catch (err) {
    console.error("Error updating package:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

const deleteLabPackageById = async (req, res) => {
  try {
    const { packageId } = req.params;

    if (!packageId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Package ID is required"
      );
    }

    console.log(`Deleting package with ID: ${packageId}`);

    // Find and delete the package
    const deletedPackage = await LabPackage.findByIdAndDelete(packageId);

    if (!deletedPackage) {
      return Response.error(res, 404, AppConstant.FAILED, "Package not found");
    }

    return Response.success(
      res,
      { _id: packageId },
      200,
      "Package deleted successfully"
    );
  } catch (err) {
    console.error("Error deleting package:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

// Controller for searching lab packages by city name
const searchLabPackages = async (req, res) => {
  try {
    const {
      name, // testName search
      category, // category search
      ageGroup, // ageGroup search
      gender, // gender search
      minPrice, // minimum prevaCarePrice
      maxPrice, // maximum prevaCarePrice
      city, // city name for availability search\
      zipCode,
      home_collection, // filter by home collection included packages
    } = req.body;

    // Build the search query object
    const query = {};

    // Add filters based on provided parameters
    if (name) {
      query.testName = { $regex: new RegExp(name, "i") }; // Case-insensitive search
    }

    if (category) {
      query.category = { $regex: new RegExp(category, "i") };
    }

    if (ageGroup) {
      query.ageGroup = { $regex: new RegExp(ageGroup, "i") };
    }

    if (gender) {
      // Handle gender search (both, male, female)
      if (gender.toLowerCase() === "both") {
        // If searching for 'both', find packages for both or either gender
        query.gender = { $in: ["both", "male", "female"] };
      } else {
        // If searching for specific gender, find packages for that gender or 'both'
        query.gender = { $in: [gender.toLowerCase(), "both"] };
      }
    }

    // Handle price range for prevaCarePrice
    if (minPrice || maxPrice) {
      query.prevaCarePrice = {};

      if (minPrice) {
        query.prevaCarePrice.$gte = Number(minPrice);
      }

      if (maxPrice) {
        query.prevaCarePrice.$lte = Number(maxPrice);
      }
    }

    // Add city filter if city parameter was provided
    if (city) {
      query["cityAvailability.city"] = { $regex: new RegExp(city, "i") };
    }

    if (zipCode) {
      query["cityAvailability.zipCode"] = { $regex: new RegExp(zipCode, "i") };
    }

    // Handle home collection filter
    if (home_collection !== undefined) {
      query.homeCollectionChargeIncluded = home_collection === true;
    }

    // Execute the search query with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find lab packages with populated lab reference
    const labPackages = await LabPackage.find(query)
      .populate("lab", "labName logo") // Populate lab information
      .skip(skip)
      .limit(limit)
      .sort({ testName: 1 });

    // Get total count for pagination info
    const totalPackages = await LabPackage.countDocuments(query);

    // Return response
    return res.status(200).json({
      success: true,
      count: labPackages.length,
      total: totalPackages,
      totalPages: Math.ceil(totalPackages / limit),
      currentPage: page,
      data: labPackages,
    });
  } catch (error) {
    console.error("Error searching lab packages:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getPackagesByCategory = async (req, res) => {
  try {
    const { category } = req.query;

    // Validate that category parameter is provided
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category parameter is required",
      });
    }

    // Build the search query with case-insensitive category search
    const query = {
      category: { $regex: new RegExp(category, "i") },
    };

    // Handle pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find tests matching the category
    const tests = await LabPackage.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });

    // Get total count for pagination
    const totalTests = await LabPackage.countDocuments(query);

    // Return response with pagination metadata
    return res.status(200).json({
      success: true,
      count: tests.length,
      total: totalTests,
      totalPages: Math.ceil(totalTests / limit),
      currentPage: page,
      data: tests,
    });
  } catch (error) {
    console.error("Error fetching tests by category:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getAllPackagesOfParticularLab = async (req, res) => {
  try {
    const { labId } = req.params;

    // Validate labId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(labId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lab ID format",
      });
    }

    // Check if lab exists
    const lab = await Lab.findById(labId);
    if (!lab) {
      return res.status(404).json({
        success: false,
        message: "Lab not found",
      });
    }
    const labIdobj = new mongoose.Types.ObjectId(labId);
    console.log(labIdobj);
    const packages = await LabPackage.find({ lab: labIdobj });
    return res.status(200).json({
      success: true,
      count: packages.length,
      data: packages,
    });
  } catch (error) {
    console.error("Error fetching lab Packages:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const getPackagesByCategoryOfPaticularLab = async (req, res) => {
  try {
    const { labId, category } = req.params;

    // Validate labId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(labId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lab ID format",
      });
    }
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "category is required",
      });
    }

    // Check if lab exists
    const lab = await Lab.findById(labId);
    if (!lab) {
      return res.status(404).json({
        success: false,
        message: "Lab not found",
      });
    }
    const labIdobj = new mongoose.Types.ObjectId(labId);
    console.log(labIdobj);
    const packages = await LabPackage.find({
      lab: labIdobj,
      category: { $regex: new RegExp(category, "i") },
    });
    return res.status(200).json({
      success: true,
      count: packages.length,
      data: packages,
    });
  } catch (error) {
    console.error("Error fetching lab Packages:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  getAllCategoryOfPackageOfParticularLab,
  getAllTestOfParticularCategoryOfPackageOfParticularLab,
  getSingleLabPackageDetailsById,
  deleteLabPackageById,
  updateLabPackageById,
  searchLabPackages,
  getPackagesByCategory,
  getAllPackagesOfParticularLab,
  getPackagesByCategoryOfPaticularLab,
};
