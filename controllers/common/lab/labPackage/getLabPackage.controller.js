const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const LabPackage = require("../../../../models/lab/LabPackage.model");
const LapPackage = require("../../../../models/lab/LabPackage.model");
const Lab = require("../../../../models/lab/lab.model");
const mongoose = require("mongoose");
const cacheManager = require("../../../../utils/cacheManager");

/**
 * Get all package categories for a specific lab
 * @route POST /admin/lab/pacakge/categories
 */
const getAllCategoryOfPackageOfParticularLab = async (req, res) => {
  try {
    const { labId } = req.body;

    // Validate labId
    if (!labId) {
      return Response.error(res, 400, AppConstant.FAILED, "Lab ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(labId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid Lab ID format"
      );
    }

    // Check if lab exists
    const labExists = await Lab.exists({ _id: labId });
    if (!labExists) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // Get distinct categories for this lab
    const categories = await LabPackage.distinct("category", { labId });
    console.log("categories", categories);

    return Response.success(
      res,
      { categories },
      200,
      "Package categories retrieved successfully"
    );
  } catch (err) {
    console.error("Error in getAllCategoryOfPackageOfParticularLab:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

const getAllTestOfParticularCategoryOfPackageOfParticularLab = async (
  req,
  res
) => {
  try {
    const { labId, category } = req.body;
    // Add pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!labId || !category) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Both labId and category are required"
      );
    }

    if (!mongoose.Types.ObjectId.isValid(labId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid lab ID format"
      );
    }

    // Build query with case-insensitive category search
    const query = {
      lab: new mongoose.Types.ObjectId(labId),
      category: { $regex: new RegExp(category, "i") },
    };

    // Use projection to select only needed fields
    // Use lean() for better performance
    const packages = await LabPackage.find(query)
      .select(
        "packageCode packageName category testIncluded sampleRequired preparationRequired cityAvailability"
      )
      .lean()
      .skip(skip)
      .limit(limit)
      .sort({ packageName: 1 });

    // Get total count for pagination info
    const totalPackages = await LabPackage.countDocuments(query);

    return Response.success(
      res,
      {
        packages,
        pagination: {
          total: totalPackages,
          totalPages: Math.ceil(totalPackages / limit),
          currentPage: page,
          perPage: limit,
        },
      },
      200,
      "Packages retrieved successfully"
    );
  } catch (err) {
    console.error("Error:", err);
    return Response.error(res, 500, AppConstant.FAILED, err.message);
  }
};

const getSingleLabPackageDetailsById = async (req, res) => {
  try {
    const { packageId } = req.query;
    const { labId } = req.params;
    console.log(packageId, labId);
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
    }).populate({
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
      name, // packageName search
      category, // category search
      ageGroup, // ageGroup search
      gender, // gender search
      minPrice, // minimum prevaCarePrice
      maxPrice, // maximum prevaCarePrice
      cityName, // city name for availability search
      state, // state for availability search
      zipCode, // zipCode filter
      homeAvailability, // filter by home collection availability
      isActive, // filter by active status
      minDiscount, // minimum discount percentage
    } = req.body;

    console.log("Search parameters:", req.body);

    // Build the search query object
    const query = {};

    // Add filters based on provided parameters
    if (name) {
      query.packageName = { $regex: new RegExp(name, "i") }; // Case-insensitive search for package name
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
    if (minPrice !== undefined || maxPrice !== undefined) {
      query["cityAvailability.prevaCarePriceForCorporate"] = {};

      if (minPrice !== undefined) {
        query["cityAvailability.prevaCarePriceForCorporate"].$gte =
          Number(minPrice);
      }

      if (maxPrice !== undefined) {
        query["cityAvailability.prevaCarePriceForCorporate"].$lte =
          Number(maxPrice);
      }
    }

    // Handle minimum discount percentage
    if (minDiscount !== undefined) {
      query["cityAvailability.discountPercentage"] = {
        $gte: Number(minDiscount),
      };
    }

    // Filter by active status if provided
    if (isActive !== undefined) {
      query["cityAvailability.isActive"] = isActive === true;
    }

    // Add city filters if provided
    let cityFilters = [];

    if (cityName || state) {
      // Create a city filter condition
      let cityFilter = {};

      if (cityName) {
        const normalizedCityName = cityName.toLowerCase().trim();
        cityFilter["cityAvailability.cityName"] = {
          $regex: new RegExp(normalizedCityName, "i"),
        };
      }

      if (state) {
        const normalizedState = state.toLowerCase().trim();
        cityFilter["cityAvailability.state"] = {
          $regex: new RegExp(normalizedState, "i"),
        };
      }

      cityFilters.push(cityFilter);
    }

    // Add zipCode filter if provided
    if (zipCode) {
      // Make sure zipCode is not in the excluded pincodes array
      cityFilters.push({
        "cityAvailability.pinCodes_excluded": { $not: { $in: [zipCode] } },
      });
    }

    // Add home collection availability filter if provided
    if (homeAvailability !== undefined) {
      cityFilters.push({
        "cityAvailability.homeCollectionAvailable": homeAvailability === true,
      });
    }

    // Add the city filters to the main query if any were created
    if (cityFilters.length > 0) {
      query.$and = cityFilters;
    }

    console.log("Final query:", JSON.stringify(query, null, 2));

    // Execute the search query with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find lab packages with populated lab reference
    const labPackages = await LabPackage.find(query)
      .populate("labId", "labName logo") // Populate lab information
      .skip(skip)
      .limit(limit)
      .sort({ packageName: 1 });

    // Get total count for pagination info
    const totalPackages = await LabPackage.countDocuments(query);

    // Return response using the Response utility
    return Response.success(
      res,
      {
        packages: labPackages,
        pagination: {
          count: labPackages.length,
          total: totalPackages,
          totalPages: Math.ceil(totalPackages / limit),
          currentPage: page,
          perPage: limit,
        },
      },
      200,
      "Packages retrieved successfully"
    );
  } catch (error) {
    console.error("Error searching lab packages:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error"
    );
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
    // Add pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Validate labId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(labId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lab ID format",
      });
    }

    // Check if lab exists with minimal projection
    const lab = await Lab.findById(labId, "_id labName");
    if (!lab) {
      return res.status(404).json({
        success: false,
        message: "Lab not found",
      });
    }

    const labIdobj = new mongoose.Types.ObjectId(labId);

    // Use projection to select only needed fields
    // Use lean() for better performance
    const packages = await LabPackage.find({ lab: labIdobj })
      .select(
        "packageCode packageName category testIncluded sampleRequired preparationRequired cityAvailability"
      )
      .lean()
      .skip(skip)
      .limit(limit)
      .sort({ packageName: 1 });

    // Get total count for pagination info
    const totalPackages = await LabPackage.countDocuments({ lab: labIdobj });

    return res.status(200).json({
      success: true,
      count: packages.length,
      total: totalPackages,
      totalPages: Math.ceil(totalPackages / limit),
      currentPage: page,
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
    // Add pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

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

    // Check if lab exists with minimal projection
    const lab = await Lab.findById(labId, "_id labName");
    if (!lab) {
      return res.status(404).json({
        success: false,
        message: "Lab not found",
      });
    }

    const labIdobj = new mongoose.Types.ObjectId(labId);

    // Build query with case-insensitive category search
    const query = {
      lab: labIdobj,
      category: { $regex: new RegExp(category, "i") },
    };

    // Use projection to select only needed fields
    // Use lean() for better performance
    const packages = await LabPackage.find(query)
      .select(
        "packageCode packageName category testIncluded sampleRequired preparationRequired cityAvailability"
      )
      .lean()
      .skip(skip)
      .limit(limit)
      .sort({ packageName: 1 });

    // Get total count for pagination info
    const totalPackages = await LabPackage.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: packages.length,
      total: totalPackages,
      totalPages: Math.ceil(totalPackages / limit),
      currentPage: page,
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

/**
 * Get all packages for a specific lab
 */
const getAllPackagesOfLab = async (req, res) => {
  try {
    const { labId } = req.query;
    // Add pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Validate labId
    if (!labId) {
      return Response.error(res, 400, AppConstant.FAILED, "Lab ID is required");
    }

    // Validate labId is a valid MongoDB ObjectId
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

    const labIdObj = new mongoose.Types.ObjectId(labId);

    // Use caching if available
    const cacheKey = `lab_packages_${labId}_${page}_${limit}`;
    const cachedData = await cacheManager.get(cacheKey);

    if (cachedData) {
      return Response.success(
        res,
        cachedData,
        200,
        "Lab packages retrieved from cache"
      );
    }

    // Use projection to select only needed fields
    const packages = await LabPackage.find({ labId: labIdObj })
      .select(
        "packageCode packageName category testIncluded sampleRequired preparationRequired cityAvailability normalPrice"
      )
      .skip(skip)
      .limit(limit)
      .sort({ packageName: 1 })
      .lean();

    // Get total count for pagination info
    const totalPackages = await LabPackage.countDocuments({ labId: labIdObj });

    const responseData = {
      packages,
      pagination: {
        total: totalPackages,
        totalPages: Math.ceil(totalPackages / limit),
        currentPage: page,
        perPage: limit,
      },
    };

    // Cache the result
    await cacheManager.set(cacheKey, responseData, 3600); // Cache for 1 hour

    return Response.success(
      res,
      responseData,
      200,
      "Lab packages retrieved successfully"
    );
  } catch (err) {
    console.error("Error in getAllPackagesOfLab:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
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
  getAllPackagesOfLab,
};
