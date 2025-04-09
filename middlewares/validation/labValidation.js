const Response = require("../../utils/Response");
const AppConstant = require("../../utils/AppConstant");
const City = require("../../models/lab/city.model");
const Lab = require("../../models/lab/lab.model");

const validateLabData = async (req, res, next) => {
  try {
    const { cityOperatedIn } = req.body;

    // Validate cityOperatedIn array
    if (
      !cityOperatedIn ||
      !Array.isArray(cityOperatedIn) ||
      cityOperatedIn.length === 0
    ) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "At least one city is required"
      );
    }

    // Validate each city entry
    for (const city of cityOperatedIn) {
      if (!city.cityName || !city.zipCode) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "City name and zipcode are required for each city"
        );
      }

      // Check zipcode format (6 digits)
      if (!/^\d{6}$/.test(city.zipCode.trim())) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          `Invalid zipcode format: ${city.zipCode}`
        );
      }

      // Find existing city by pincode
      const existingCity = await City.findOne({ pincode: city.zipCode.trim() });
      if (existingCity) {
        // Store the existing city ID in the city object for later use
        city.existingCityId = existingCity._id;
      }
    }

    // Check for duplicate pincodes within the request
    const pincodes = cityOperatedIn.map((city) => city.zipCode.trim());
    const uniquePincodes = new Set(pincodes);
    if (pincodes.length !== uniquePincodes.size) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Duplicate pincodes found in request"
      );
    }

    next();
  } catch (error) {
    console.error("Error in validateLabData:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      "Error validating lab data"
    );
  }
};

const validateLabUpdateData = async (req, res, next) => {
  try {
    const { labId } = req.params;
    const { cityOperatedIn } = req.body;

    // Check if lab exists
    const existingLab = await Lab.findById(labId);
    if (!existingLab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // If updating cities, validate them
    if (cityOperatedIn) {
      if (!Array.isArray(cityOperatedIn)) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "cityOperatedIn must be an array"
        );
      }

      for (const city of cityOperatedIn) {
        if (!city.cityName || !city.zipCode) {
          return Response.error(
            res,
            400,
            AppConstant.FAILED,
            "City name and zipcode are required for each city"
          );
        }

        // Check zipcode format
        if (!/^\d{6}$/.test(city.zipCode.trim())) {
          return Response.error(
            res,
            400,
            AppConstant.FAILED,
            `Invalid zipcode format: ${city.zipCode}`
          );
        }

        // Find existing city by pincode
        const existingCity = await City.findOne({
          pincode: city.zipCode.trim(),
        });
        if (existingCity) {
          // Store the existing city ID in the city object for later use
          city.existingCityId = existingCity._id;
        }
      }

      // Check for duplicate pincodes within the request
      const pincodes = cityOperatedIn.map((city) => city.zipCode.trim());
      const uniquePincodes = new Set(pincodes);
      if (pincodes.length !== uniquePincodes.size) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "Duplicate pincodes found in request"
        );
      }
    }

    next();
  } catch (error) {
    console.error("Error in validateLabUpdateData:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      "Error validating lab update data"
    );
  }
};

module.exports = {
  validateLabData,
  validateLabUpdateData,
};
