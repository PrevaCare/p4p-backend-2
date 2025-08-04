const Response = require("../../utils/Response");
const AppConstant = require("../../utils/AppConstant");
const City = require("../../models/lab/city.model");
const Lab = require("../../models/lab/lab.model");
const mongoose = require("mongoose");

/**
 * Validates a single city entry
 * @param {Object} city City data object
 * @returns {Object} Validation result with isValid and error properties
 */
const validateCityData = (city) => {
  // Check required fields
  if (!city.cityName || !city.state) {
    return {
      isValid: false,
      error: "City name and state are required",
    };
  }

  // Normalize inputs
  city.cityName = city.cityName.toLowerCase().trim();
  city.state = city.state.toLowerCase().trim();

  // Validate pinCodes if provided
  if (city.pinCodes_excluded && Array.isArray(city.pinCodes_excluded)) {
    // Multiple pincodes validation
    for (const pinCode of city.pinCodes_excluded) {
      if (!/^\d{6}$/.test(pinCode.trim())) {
        return {
          isValid: false,
          error: `Invalid pincode format in excluded list: ${pinCode}. Must be 6 digits.`,
        };
      }
    }
  }

  return { isValid: true };
};

/**
 * Checks for duplicate city+state combinations within an array
 * @param {Array} cities Array of city objects
 * @returns {Object} Validation result with isDuplicate and error properties
 */
const checkDuplicateCities = (cities) => {
  const cityStateMap = new Map();

  for (const city of cities) {
    const key = `${city.cityName.toLowerCase().trim()}|${city.state
      .toLowerCase()
      .trim()}`;

    if (cityStateMap.has(key)) {
      return {
        isDuplicate: true,
        error: `Duplicate city and state combination found: ${city.cityName}, ${city.state}`,
      };
    }

    cityStateMap.set(key, true);
  }

  return { isDuplicate: false };
};

/**
 * Validates lab data before creation
 */
const validateAddLabData = async (req, res, next) => {
  try {
    // Check for logo file
    if (!req.files || !req.files.logo || !req.files.logo[0]) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Logo file is required"
      );
    }

    // Validate basic lab info
    const { labName, labPersonName, contactNumber, address, availableCities } =
      req.body;

    if (!labName || !labName.trim()) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Lab name is required"
      );
    }

    if (!labPersonName || !labPersonName.trim()) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Lab person name is required"
      );
    }

    if (
      contactNumber &&
      (contactNumber.length !== 10 || !/^\d+$/.test(contactNumber))
    ) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Contact number must be 10 digits"
      );
    }

    // Validate address
    if (!address) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Address is required"
      );
    }

    const requiredAddressFields = [
      "name",
      "street",
      "city",
      "state",
      "pincode",
    ];
    for (const field of requiredAddressFields) {
      if (!address[field] || !address[field].trim()) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          `Address ${field} is required`
        );
      }
    }

    // Validate pincode format in address
    if (!/^\d{6}$/.test(address.pincode.trim())) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        `Invalid pincode format in address: ${address.pincode}. Must be 6 digits.`
      );
    }

    // Validate availableCities array
    if (
      !availableCities ||
      !Array.isArray(availableCities) ||
      availableCities.length === 0
    ) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "At least one city is required"
      );
    }

    // Check for duplicate city+state combinations
    const duplicateCheck = checkDuplicateCities(availableCities);
    if (duplicateCheck.isDuplicate) {
      return Response.error(res, 400, AppConstant.FAILED, duplicateCheck.error);
    }

    // Validate each city entry
    for (const city of availableCities) {
      // Validate city data
      const cityValidation = validateCityData(city);
      if (!cityValidation.isValid) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          cityValidation.error
        );
      }

      // Find existing city by cityName and state
      const existingCity = await City.findOne({
        cityName: city.cityName.toLowerCase().trim(),
        state: city.state.toLowerCase().trim(),
      });

      if (existingCity) {
        // Store the existing city ID in the city object for later use
        city.cityId = existingCity._id;
      }
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

/**
 * Validates lab data before updating
 */
const validateLabUpdateData = async (req, res, next) => {
  try {
    const { labId } = req.params;

    // Validate labId format
    if (!mongoose.Types.ObjectId.isValid(labId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid lab ID format"
      );
    }

    // Check if lab exists
    const existingLab = await Lab.findById(labId);
    if (!existingLab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // Validate basic lab info if provided
    if (req.body.labName && !req.body.labName.trim()) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Lab name cannot be empty"
      );
    }

    if (req.body.labPersonName && !req.body.labPersonName.trim()) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Lab person name cannot be empty"
      );
    }

    if (
      req.body.contactNumber &&
      (req.body.contactNumber.length !== 10 ||
        !/^\d+$/.test(req.body.contactNumber))
    ) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Contact number must be 10 digits"
      );
    }

    // Validate address if provided
    if (req.body.address) {
      const requiredAddressFields = [
        "name",
        "street",
        "city",
        "state",
        "pincode",
      ];
      for (const field of requiredAddressFields) {
        if (
          req.body.address[field] !== undefined &&
          !req.body.address[field].trim()
        ) {
          return Response.error(
            res,
            400,
            AppConstant.FAILED,
            `Address ${field} cannot be empty`
          );
        }
      }

      // Validate pincode format in address if provided
      if (
        req.body.address.pincode &&
        !/^\d{6}$/.test(req.body.address.pincode.trim())
      ) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          `Invalid pincode format in address: ${req.body.address.pincode}. Must be 6 digits.`
        );
      }
    }

    // If updating cities, validate them
    if (req.body.availableCities) {
      if (!Array.isArray(req.body.availableCities)) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "availableCities must be an array"
        );
      }

      if (req.body.availableCities.length === 0) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "At least one city is required when updating city list"
        );
      }

      // Check for duplicate city+state combinations
      const duplicateCheck = checkDuplicateCities(req.body.availableCities);
      if (duplicateCheck.isDuplicate) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          duplicateCheck.error
        );
      }

      // Validate each city entry
      for (const city of req.body.availableCities) {
        // Validate city data
        const cityValidation = validateCityData(city);
        if (!cityValidation.isValid) {
          return Response.error(
            res,
            400,
            AppConstant.FAILED,
            cityValidation.error
          );
        }

        // Find existing city by cityName and state
        const existingCity = await City.findOne({
          cityName: city.cityName.toLowerCase().trim(),
          state: city.state.toLowerCase().trim(),
        });

        if (existingCity) {
          // Store the existing city ID in the city object for later use
          city.cityId = existingCity._id;
        }
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

/**
 * Validates city data before creation/update
 */
const validateCityCreation = async (req, res, next) => {
  try {
    const { cityName, state, pinCodes_excluded, regions_excluded } = req.body;

    // Validate required fields
    if (!cityName || !cityName.trim()) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "City name is required"
      );
    }

    if (!state || !state.trim()) {
      return Response.error(res, 400, AppConstant.FAILED, "State is required");
    }

    // Normalize inputs
    const normalizedCityName = cityName.toLowerCase().trim();
    const normalizedState = state.toLowerCase().trim();

    // Check for existing city with same city+state
    const existingCity = await City.findOne({
      cityName: normalizedCityName,
      state: normalizedState,
    });

    if (existingCity && !req.params.cityId) {
      return Response.error(
        res,
        409,
        AppConstant.FAILED,
        `City ${cityName}, ${state} already exists`
      );
    }

    // Validate pinCodes_excluded if provided
    if (pinCodes_excluded) {
      if (!Array.isArray(pinCodes_excluded)) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "pinCodes_excluded must be an array"
        );
      }

      for (const pinCode of pinCodes_excluded) {
        if (!/^\d{6}$/.test(pinCode.trim())) {
          return Response.error(
            res,
            400,
            AppConstant.FAILED,
            `Invalid pincode format in excluded list: ${pinCode}. Must be 6 digits.`
          );
        }
      }
    }

    // Validate regions_excluded if provided
    if (regions_excluded && !Array.isArray(regions_excluded)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "regions_excluded must be an array"
      );
    }

    next();
  } catch (error) {
    console.error("Error in validateCityCreation:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      "Error validating city data"
    );
  }
};

/**
 * Validates city ID before operations
 */
const validateCityId = async (req, res, next) => {
  try {
    const { cityId } = req.params;

    // Validate cityId format
    if (!mongoose.Types.ObjectId.isValid(cityId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid city ID format"
      );
    }

    // Check if city exists
    const city = await City.findById(cityId);
    if (!city) {
      return Response.error(res, 404, AppConstant.FAILED, "City not found");
    }

    // Attach city to request for later use
    req.city = city;
    next();
  } catch (error) {
    console.error("Error in validateCityId:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      "Error validating city ID"
    );
  }
};

/**
 * Validates pincode format
 */
const validatePincode = (req, res, next) => {
  const { pincode } = req.params || req.query || req.body;

  if (pincode && !/^\d{6}$/.test(pincode.trim())) {
    return Response.error(
      res,
      400,
      AppConstant.FAILED,
      `Invalid pincode format: ${pincode}. Must be 6 digits.`
    );
  }

  next();
};

module.exports = {
  validateAddLabData,
  validateLabUpdateData,
  validateCityCreation,
  validateCityId,
  validatePincode,
};
