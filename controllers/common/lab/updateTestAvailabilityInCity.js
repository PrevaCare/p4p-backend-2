const mongoose = require("mongoose");
const Lab = require("../../../models/lab/lab.model");
const IndividualLabTest = require("../../../models/lab/individualLabTest.model");
const City = require("../../../models/lab/city.model");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");

/**
 * Update test availability and pricing in a city
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateTestAvailabilityInCity = async (req, res) => {
  try {
    const { partnerId, testId, cityId } = req.params;
    const {
      availability,
      labSellingPrice,
      offeredPriceToPrevaCare,
      prevaCarePriceForCorporate,
      prevaCarePriceForIndividual,
      discountPercentage,
      homeCollectionCharge,
      homeCollectionAvailable,
    } = req.body;

    // Validate required fields
    if (!partnerId || !testId || !cityId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Partner ID, Test ID, and City ID are required"
      );
    }

    if (availability === undefined || availability === null) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Availability status is required (true/false)"
      );
    }

    // Validate pricing fields if availability is true
    if (Boolean(availability) === true) {
      if (
        !labSellingPrice ||
        !offeredPriceToPrevaCare ||
        !prevaCarePriceForCorporate ||
        !prevaCarePriceForIndividual ||
        !discountPercentage
      ) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "When test is available, all pricing fields are required (labSellingPrice, offeredPriceToPrevaCare, prevaCarePriceForCorporate, prevaCarePriceForIndividual, discountPercentage)"
        );
      }
    }

    // Ensure IDs are valid ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(partnerId) ||
      !mongoose.Types.ObjectId.isValid(testId) ||
      !mongoose.Types.ObjectId.isValid(cityId)
    ) {
      return Response.error(res, 400, AppConstant.FAILED, "Invalid ID format");
    }

    // Find the lab partner
    const labPartner = await Lab.findById(partnerId);
    if (!labPartner) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Lab partner not found"
      );
    }

    // Find the test in IndividualLabTest collection
    const testDoc = await IndividualLabTest.findOne({
      _id: testId,
      lab: partnerId,
    });

    if (!testDoc) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Test not found for this lab partner"
      );
    }

    // Find the city in the test's cityAvailability or in lab partner's availableCities
    let cityIndex = -1;

    // Check if cityAvailability array exists
    if (testDoc.cityAvailability && Array.isArray(testDoc.cityAvailability)) {
      cityIndex = testDoc.cityAvailability.findIndex(
        (location) => location.cityId && location.cityId.toString() === cityId
      );
    }

    // If city not found in test cityAvailability, check lab partner availableCities
    if (cityIndex === -1) {
      const partnerCityIndex = labPartner.availableCities
        ? labPartner.availableCities.findIndex(
            (city) => city.cityId && city.cityId.toString() === cityId
          )
        : -1;

      if (partnerCityIndex === -1) {
        // Try to find city in the City model
        const cityDoc = await City.findById(cityId);
        if (!cityDoc) {
          return Response.error(res, 404, AppConstant.FAILED, "City not found");
        }
      }

      // Add city to test cityAvailability with all required pricing fields
      if (!testDoc.cityAvailability) {
        testDoc.cityAvailability = [];
      }

      // Get city details
      const cityDoc = await City.findById(cityId);

      testDoc.cityAvailability.push({
        cityId: cityId,
        cityName: cityDoc.cityName,
        pinCode: cityDoc.pincode,
        isAvailable: Boolean(availability),
        isActive: true,
        billingRate: parseFloat(labSellingPrice || 0),
        partnerRate: parseFloat(offeredPriceToPrevaCare || 0),
        prevaCarePriceForCorporate: parseFloat(prevaCarePriceForCorporate || 0),
        prevaCarePriceForIndividual: parseFloat(prevaCarePriceForIndividual || 0),
        discountPercentage: parseFloat(discountPercentage || 0),
        homeCollectionCharge: parseFloat(homeCollectionCharge || 0),
        homeCollectionAvailable:
          Boolean(homeCollectionAvailable) ||
          parseFloat(homeCollectionCharge || 0) > 0,
      });
    } else {
      // Update existing city in cityAvailability
      testDoc.cityAvailability[cityIndex].isAvailable = Boolean(availability);
      testDoc.cityAvailability[cityIndex].isActive = true;

      // Update pricing fields if provided
      if (labSellingPrice !== undefined) {
        testDoc.cityAvailability[cityIndex].billingRate =
          parseFloat(labSellingPrice);
      }

      if (offeredPriceToPrevaCare !== undefined) {
        testDoc.cityAvailability[cityIndex].partnerRate = parseFloat(
          offeredPriceToPrevaCare
        );
      }

      if (prevaCarePriceForCorporate !== undefined) {
        testDoc.cityAvailability[cityIndex].prevaCarePriceForCorporate =
          parseFloat(prevaCarePriceForCorporate);
      }

      if (prevaCarePriceForIndividual !== undefined) {
        testDoc.cityAvailability[cityIndex].prevaCarePriceForIndividual =
          parseFloat(prevaCarePriceForIndividual);
      }

      if (discountPercentage !== undefined) {
        testDoc.cityAvailability[cityIndex].discountPercentage =
          parseFloat(discountPercentage);
      }

      if (homeCollectionCharge !== undefined) {
        testDoc.cityAvailability[cityIndex].homeCollectionCharge = parseFloat(
          homeCollectionCharge || 0
        );

        // If homeCollectionAvailable is not explicitly set, determine it based on charge
        if (homeCollectionAvailable === undefined) {
          testDoc.cityAvailability[cityIndex].homeCollectionAvailable =
            parseFloat(homeCollectionCharge || 0) > 0;
        }
      }

      if (homeCollectionAvailable !== undefined) {
        testDoc.cityAvailability[cityIndex].homeCollectionAvailable = Boolean(
          homeCollectionAvailable
        );
      }
    }

    // Save the updated test
    await testDoc.save();

    return Response.success(
      res,
      {
        labPartner: partnerId,
        test: {
          _id: testDoc._id,
          name: testDoc.testName,
          testCode: testDoc.testCode,
        },
        city: cityId,
        availability: Boolean(availability),
        pricing: {
          billingRate: testDoc.cityAvailability.find(
            (c) => c.cityId.toString() === cityId
          )?.billingRate,
          partnerRate: testDoc.cityAvailability.find(
            (c) => c.cityId.toString() === cityId
          )?.partnerRate,
          prevaCarePriceForCorporate: testDoc.cityAvailability.find(
            (c) => c.cityId.toString() === cityId
          )?.prevaCarePriceForCorporate,
          prevaCarePriceForIndividual: testDoc.cityAvailability.find(
            (c) => c.cityId.toString() === cityId
          )?.prevaCarePriceForIndividual,
          discountPercentage: testDoc.cityAvailability.find(
            (c) => c.cityId.toString() === cityId
          )?.discountPercentage,
          homeCollectionCharge: testDoc.cityAvailability.find(
            (c) => c.cityId.toString() === cityId
          )?.homeCollectionCharge,
          homeCollectionAvailable: testDoc.cityAvailability.find(
            (c) => c.cityId.toString() === cityId
          )?.homeCollectionAvailable,
        },
      },
      200,
      `Test availability and pricing in city updated successfully`
    );
  } catch (err) {
    console.error("Error in updateTestAvailabilityInCity:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

module.exports = updateTestAvailabilityInCity;
