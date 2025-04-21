const mongoose = require("mongoose");
const Lab = require("../../../models/lab/lab.model");
const IndividualLabTest = require("../../../models/lab/individualLabTest.model");
const LabPackage = require("../../../models/lab/LabPackage.model");
const City = require("../../../models/lab/city.model");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");

/**
 * Get all tests offered by a specific lab
 * @route GET /api/labs/:labId/tests
 */
const getLabTests = async (req, res) => {
  try {
    const { labId } = req.params;
    const { category } = req.query;

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

    // Check if lab exists
    const lab = await Lab.findById(labId);
    if (!lab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // Build query
    const query = { lab: labId };
    if (category) {
      query.category = category;
    }

    // Get all tests for this lab with populated city details
    const tests = await IndividualLabTest.find(query)
      .select("testCode testName category description cityAvailability")
      .populate("cityAvailability.cityId")
      .lean();

    // Format the response
    const formattedTests = tests.map((test) => {
      const activeCities = test.cityAvailability.filter(
        (city) => city.isActive && city.isAvailable
      );

      return {
        ...test,
        cityAvailability: activeCities.map((city) => ({
          ...city,
          cityDetails: {
            _id: city.cityId._id,
            cityName: city.cityId.cityName,
            pincode: city.cityId.pincode,
          },
          priceForCorporate: city.prevaCarePriceForCorporate,
          priceForIndividual: city.prevaCarePriceForIndividual,
          sellingPrice: city.billingRate,
          discount: city.discountPercentage,
          homeCollectionCharge: city.homeCollectionCharge,
          homeCollectionAvailable: city.homeCollectionAvailable,
        })),
      };
    });

    return Response.success(
      res,
      { tests: formattedTests },
      200,
      "Lab tests retrieved successfully"
    );
  } catch (err) {
    console.error("Error in getLabTests:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

/**
 * Get all packages offered by a specific lab
 * @route GET /api/labs/:labId/packages
 */
const getLabPackages = async (req, res) => {
  try {
    const { labId } = req.params;
    const { category } = req.query;

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

    // Check if lab exists
    const lab = await Lab.findById(labId);
    if (!lab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // Build query
    const query = { labId: labId };
    if (category) {
      query.category = category;
    }

    // Get all packages for this lab with populated city details
    const packages = await LabPackage.find(query)
      .select(
        "packageCode packageName category description testIncluded cityAvailability"
      )
      .populate("cityAvailability.cityId")
      .lean();

    // Format the response
    const formattedPackages = packages.map((pkg) => {
      const activeCities = pkg.cityAvailability.filter((city) => city.isActive);

      return {
        ...pkg,
        cityAvailability: activeCities.map((city) => ({
          ...city,
          cityDetails: {
            _id: city.cityId._id,
            cityName: city.cityId.cityName,
            pincode: city.cityId.pincode,
          },
          priceForCorporate: city.prevaCarePriceForCorporate,
          priceForIndividual: city.prevaCarePriceForIndividual,
          sellingPrice: city.billingRate,
          discount: city.discountPercentage,
          homeCollectionCharge: city.homeCollectionCharge,
          homeCollectionAvailable: city.homeCollectionAvailable,
        })),
      };
    });

    return Response.success(
      res,
      { packages: formattedPackages },
      200,
      "Lab packages retrieved successfully"
    );
  } catch (err) {
    console.error("Error in getLabPackages:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

/**
 * Get all tests in a category from a lab
 * @route GET /api/labs/:labId/tests/by-category/:category
 */
const getLabTestsByCategory = async (req, res) => {
  try {
    const { labId, category } = req.params;

    if (!labId) {
      return Response.error(res, 400, AppConstant.FAILED, "Lab ID is required");
    }

    if (!category) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Category is required"
      );
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

    // Check if lab exists
    const lab = await Lab.findById(labId);
    if (!lab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // Get all tests for this lab in the specified category with populated city details
    const tests = await IndividualLabTest.find({ lab: labId, category })
      .select("testCode testName category description cityAvailability")
      .populate("cityAvailability.cityId")
      .lean();

    // Format the response
    const formattedTests = tests.map((test) => {
      const activeCities = test.cityAvailability.filter(
        (city) => city.isActive && city.isAvailable
      );

      return {
        ...test,
        cityAvailability: activeCities.map((city) => ({
          ...city,
          cityDetails: {
            _id: city.cityId._id,
            cityName: city.cityId.cityName,
            pincode: city.cityId.pincode,
          },
          priceForCorporate: city.prevaCarePriceForCorporate,
          priceForIndividual: city.prevaCarePriceForIndividual,
          sellingPrice: city.billingRate,
          discount: city.discountPercentage,
          homeCollectionCharge: city.homeCollectionCharge,
          homeCollectionAvailable: city.homeCollectionAvailable,
        })),
      };
    });

    return Response.success(
      res,
      { tests: formattedTests },
      200,
      "Lab tests retrieved successfully"
    );
  } catch (err) {
    console.error("Error in getLabTestsByCategory:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

/**
 * Get all packages in a category from a lab
 * @route GET /api/labs/:labId/packages/by-category/:category
 */
const getLabPackagesByCategory = async (req, res) => {
  try {
    const { labId, category } = req.params;

    if (!labId) {
      return Response.error(res, 400, AppConstant.FAILED, "Lab ID is required");
    }

    if (!category) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Category is required"
      );
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

    // Check if lab exists
    const lab = await Lab.findById(labId);
    if (!lab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // Get all packages for this lab in the specified category with populated city details
    const packages = await LabPackage.find({ labId: labId, category }).lean();

    // Format the response
    const formattedPackages = packages.map((pkg) => {
      const activeCities = pkg.cityAvailability.filter((city) => city.isActive);

      return {
        ...pkg,
        cityAvailability: activeCities.map((city) => ({
          ...city,
          cityDetails: {
            _id: city.cityId._id,
            cityName: city.cityId.cityName,
            pincode: city.cityId.pincode,
          },
          priceForCorporate: city.prevaCarePriceForCorporate,
          priceForIndividual: city.prevaCarePriceForIndividual,
          sellingPrice: city.billingRate,
          discount: city.discountPercentage,
          homeCollectionCharge: city.homeCollectionCharge,
          homeCollectionAvailable: city.homeCollectionAvailable,
        })),
      };
    });

    return Response.success(
      res,
      { packages: formattedPackages },
      200,
      "Lab packages retrieved successfully"
    );
  } catch (err) {
    console.error("Error in getLabPackagesByCategory:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

/**
 * Get home collection availability for a lab
 * @route GET /api/labs/:labId/home-collection
 */
const getLabHomeCollection = async (req, res) => {
  try {
    const { labId } = req.params;
    const { cityId, pinCode } = req.query;

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

    // Check if lab exists
    const lab = await Lab.findById(labId);
    if (!lab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // Prepare query conditions for city filtering
    let cityCondition = {};
    if (cityId) {
      if (!mongoose.Types.ObjectId.isValid(cityId)) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "Invalid city ID format"
        );
      }
      cityCondition = {
        "cityAvailability.cityId": new mongoose.Types.ObjectId(cityId),
      };
    } else if (pinCode) {
      // Lookup the city by pinCodes_excluded
      const city = await City.findOne({ pinCodes_excluded: pinCode });
      if (city) {
        cityCondition = { "cityAvailability.cityId": city._id };
      } else {
        // If no city found with this pinCode in the excluded list, use the legacy query
        cityCondition = { "cityAvailability.pinCode": pinCode };
      }
    }

    // Find all individual tests for this lab with home collection
    const individualTests = await IndividualLabTest.find({
      lab: labId,
      "cityAvailability.homeCollectionAvailable": true,
      "cityAvailability.isActive": true,
      ...cityCondition,
    }).select("testName testCode cityAvailability");

    // Find all packages for this lab with home collection
    const packages = await LabPackage.find({
      labId: labId,
      "cityAvailability.homeCollectionAvailable": true,
      "cityAvailability.isActive": true,
      ...cityCondition,
    }).select("packageName packageCode cityAvailability");

    // Extract unique cities with home collection availability
    const homeCollectionCities = new Map();

    // Process individual tests
    individualTests.forEach((test) => {
      test.cityAvailability.forEach((city) => {
        if (city.isActive && city.homeCollectionAvailable) {
          // Check if this city matches our filter criteria
          if (
            (cityId && city.cityId.toString() === cityId) ||
            (pinCode && city.pinCode === pinCode) ||
            (!cityId && !pinCode)
          ) {
            const cityKey = city.cityId.toString();

            if (!homeCollectionCities.has(cityKey)) {
              homeCollectionCities.set(cityKey, {
                cityId: city.cityId,
                cityName: city.cityName,
                pinCode: city.pinCode,
                homeCollectionAvailable: true,
                isActive: true,
                homeCollectionCharge: city.homeCollectionCharge,
                services: {
                  tests: [],
                  packages: [],
                },
              });
            }

            // Add test to this city's services
            homeCollectionCities.get(cityKey).services.tests.push({
              id: test._id,
              name: test.testName,
              code: test.testCode,
              homeCollectionCharge: city.homeCollectionCharge,
            });
          }
        }
      });
    });

    // Process packages
    packages.forEach((pkg) => {
      pkg.cityAvailability.forEach((city) => {
        if (city.isActive && city.homeCollectionAvailable) {
          // Check if this city matches our filter criteria
          if (
            (cityId && city.cityId.toString() === cityId) ||
            (pinCode && city.pinCode === pinCode) ||
            (!cityId && !pinCode)
          ) {
            const cityKey = city.cityId.toString();

            if (!homeCollectionCities.has(cityKey)) {
              homeCollectionCities.set(cityKey, {
                cityId: city.cityId,
                cityName: city.cityName,
                pinCode: city.pinCode,
                homeCollectionAvailable: true,
                isActive: true,
                homeCollectionCharge: city.homeCollectionCharge,
                services: {
                  tests: [],
                  packages: [],
                },
              });
            }

            // Add package to this city's services
            homeCollectionCities.get(cityKey).services.packages.push({
              id: pkg._id,
              name: pkg.packageName,
              code: pkg.packageCode,
              homeCollectionCharge: city.homeCollectionCharge,
            });
          }
        }
      });
    });

    // Convert map to array for response
    const homeCollectionDetails = Array.from(homeCollectionCities.values());

    return Response.success(
      res,
      {
        labId: labId,
        labName: lab.labName,
        homeCollection: homeCollectionDetails,
      },
      200,
      "Home collection details retrieved successfully"
    );
  } catch (err) {
    console.error("Error in getLabHomeCollection:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

module.exports = {
  getLabTests,
  getLabPackages,
  getLabTestsByCategory,
  getLabPackagesByCategory,
  getLabHomeCollection,
};
