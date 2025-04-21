const mongoose = require("mongoose");
const Lab = require("../../../models/lab/lab.model");
const IndividualLabTest = require("../../../models/lab/individualLabTest.model");
const LabPackage = require("../../../models/lab/LabPackage.model");
const City = require("../../../models/lab/city.model");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");

/**
 * Get comprehensive details about a specific test
 * @route GET /api/tests/:testCode/details
 */
const getTestDetails = async (req, res) => {
  try {
    const { testCode } = req.params;
    console.log("testCode", testCode);
    if (!testCode) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Test code is required"
      );
    }

    // Only populate the lab, not city availability
    const test = await IndividualLabTest.findOne({ testCode })
      .populate("lab", "name email phone address logo")
      .populate("cityAvailability.cityId");

    if (!test) {
      return Response.error(res, 404, AppConstant.FAILED, "Test not found");
    }

    // Get the test as a plain object
    const testObject = test.toObject();

    // Format city availability data
    if (testObject.cityAvailability && testObject.cityAvailability.length > 0) {
      testObject.cityAvailability = testObject.cityAvailability.map((city) => ({
        ...city,
        cityDetails: {
          _id: city.cityId._id,
          cityName: city.cityId.cityName,
          pincode: city.cityId.pincode,
        },
        // Add simplified pricing for front-end use
        priceForCorporate: city.prevaCarePriceForCorporate,
        priceForIndividual: city.prevaCarePriceForIndividual,
        sellingPrice: city.billingRate,
        discount: city.discountPercentage,
        homeCollectionCharge: city.homeCollectionCharge,
        homeCollectionAvailable: city.homeCollectionAvailable,
      }));
    }

    console.log(
      `Returning test with ${testObject.cityAvailability?.length || 0
      } cities (including inactive ones)`
    );

    return Response.success(
      res,
      testObject,
      200,
      "Test details retrieved successfully"
    );
  } catch (err) {
    console.error("Error in getTestDetails:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

/**
 * Get comprehensive details about a package
 * @route GET /api/packages/:packageCode/details
 */
const getPackageDetails = async (req, res) => {
  try {
    const { packageCode } = req.params;

    if (!packageCode) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Package code is required"
      );
    }

    // Populate both lab and city details
    const packageDetails = await LabPackage.findOne({ packageCode })
      .populate("labId", "name email phone address logo")
      .populate("cityAvailability.cityId");

    if (!packageDetails) {
      return Response.error(res, 404, AppConstant.FAILED, "Package not found");
    }

    // Get the package as a plain object
    const packageObject = packageDetails.toObject();

    // Format city availability data
    if (
      packageObject.cityAvailability &&
      packageObject.cityAvailability.length > 0
    ) {
      packageObject.cityAvailability = packageObject.cityAvailability
        .filter((city) => city.isActive)
        .map((city) => ({
          ...city,
          cityDetails: {
            _id: city.cityId._id,
            cityName: city.cityId.cityName,
            pincode: city.cityId.pincode,
          },
          // Add simplified pricing for front-end use
          priceForCorporate: city.prevaCarePriceForCorporate,
          priceForIndividual: city.prevaCarePriceForIndividual,
          sellingPrice: city.billingRate,
          discount: city.discountPercentage,
          homeCollectionCharge: city.homeCollectionCharge,
          homeCollectionAvailable: city.homeCollectionAvailable,
        }));
    }

    return Response.success(
      res,
      packageObject,
      200,
      "Package details retrieved successfully"
    );
  } catch (err) {
    console.error("Error in getPackageDetails:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

/**
 * Get details about a specific lab
 * @route GET /api/labs/:labId/details
 */
const getLabDetails = async (req, res) => {
  try {
    const { labId } = req.params;

    if (!labId) {
      return Response.error(res, 400, AppConstant.FAILED, "Lab ID is required");
    }

    // Ensure valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(labId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid lab ID format"
      );
    }

    // Populate city details
    const lab = await Lab.findById(labId).populate("availableCities.cityId");

    if (!lab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // Get count of tests and packages for this lab
    const testsCount = await IndividualLabTest.countDocuments({ lab: labId });
    const packagesCount = await LabPackage.countDocuments({ labId: labId });

    // Format the lab details
    const labDetails = lab.toObject();

    // Format available cities
    if (labDetails.availableCities && labDetails.availableCities.length > 0) {
      labDetails.availableCities = labDetails.availableCities
        .map((city) => ({
          cityId: city.cityId._id,
          cityName: city.cityId.cityName,
          state: city.cityId.state,
          pincode: city.cityId.pincode,
          pinCode_excluded: city.cityId.pinCode_excluded,
          regions_excluded: city.cityId.regions_excluded,
          isActive: city.isActive,
        }));
    }

    // Add counts to the response
    labDetails.testsCount = testsCount;
    labDetails.packagesCount = packagesCount;

    return Response.success(
      res,
      labDetails,
      200,
      "Lab details retrieved successfully"
    );
  } catch (err) {
    console.error("Error in getLabDetails:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

/**
 * Get all available categories
 * @route GET /api/categories
 */
const getCategories = async (req, res) => {
  try {
    const { type } = req.query;

    if (!type || (type !== "test" && type !== "package")) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Type is required and must be either 'test' or 'package'"
      );
    }

    let categories = [];

    if (type === "test") {
      // Get distinct categories from IndividualLabTest
      categories = await IndividualLabTest.distinct("category");
    } else if (type === "package") {
      // Get distinct categories from LabPackage
      categories = await LabPackage.distinct("category");
    }

    return Response.success(
      res,
      { categories },
      200,
      "Categories retrieved successfully"
    );
  } catch (err) {
    console.error("Error in getCategories:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

/**
 * Find all tests in a location
 * @route GET /api/tests/by-location
 */
const getTestsByLocation = async (req, res) => {
  try {
    const { city, pincode, category, home_collection } = req.query;

    if (!city && !pincode) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Either city or pincode is required"
      );
    }

    // Find the city in our database - now only search by cityName
    const cityDoc = await City.findOne({
      cityName: city?.toLowerCase(),
    });

    if (!cityDoc) {
      return Response.success(
        res,
        { tests: [] },
        200,
        "No tests found for this location"
      );
    }

    // Build the query
    const query = {
      "cityAvailability.cityId": cityDoc._id,
      "cityAvailability.isActive": true,
      "cityAvailability.isAvailable": true,
    };

    if (category) {
      query.category = category;
    }

    if (home_collection === "true") {
      query["cityAvailability.homeCollectionAvailable"] = true;
    }

    // Find tests
    const tests = await IndividualLabTest.find(query)
      .populate("lab", "name email phone address logo")
      .lean();

    // Format the response
    const formattedTests = tests.map((test) => {
      const cityAvailability = test.cityAvailability.find(
        (city) => city.cityId.toString() === cityDoc._id.toString()
      );

      return {
        ...test,
        cityAvailability: {
          ...cityAvailability,
          cityDetails: {
            _id: cityDoc._id,
            cityName: cityDoc.cityName,
            pinCode_excluded: cityDoc.pinCode_excluded,
          },
        },
      };
    });

    return Response.success(
      res,
      { tests: formattedTests },
      200,
      "Tests retrieved successfully"
    );
  } catch (err) {
    console.error("Error in getTestsByLocation:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

/**
 * Find all packages in a location
 * @route GET /api/packages/by-location
 */
const getPackagesByLocation = async (req, res) => {
  try {
    const { city, pincode, category, home_collection } = req.query;

    if (!city && !pincode) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Either city or pincode is required"
      );
    }

    // Find the city in our database - now only search by cityName
    const cityDoc = await City.findOne({
      cityName: city?.toLowerCase(),
    });

    if (!cityDoc) {
      return Response.success(
        res,
        { packages: [] },
        200,
        "No packages found for this location"
      );
    }

    // Build the query
    const query = {
      "cityAvailability.cityId": cityDoc._id,
      "cityAvailability.isActive": true,
    };

    if (category) {
      query.category = category;
    }

    if (home_collection === "true") {
      query["cityAvailability.homeCollectionAvailable"] = true;
    }

    // Find packages
    const packages = await LabPackage.find(query)
      .populate("labId", "name email phone address logo")
      .lean();

    // Format the response
    const formattedPackages = packages.map((pkg) => {
      const cityAvailability = pkg.cityAvailability.find(
        (city) => city.cityId.toString() === cityDoc._id.toString()
      );

      return {
        ...pkg,
        cityAvailability: {
          ...cityAvailability,
          cityDetails: {
            _id: cityDoc._id,
            cityName: cityDoc.cityName,
            pinCode_excluded: cityDoc.pinCode_excluded,
          },
        },
      };
    });

    return Response.success(
      res,
      { packages: formattedPackages },
      200,
      "Packages retrieved successfully"
    );
  } catch (err) {
    console.error("Error in getPackagesByLocation:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

module.exports = {
  getTestDetails,
  getPackageDetails,
  getLabDetails,
  getCategories,
  getTestsByLocation,
  getPackagesByLocation,
};
