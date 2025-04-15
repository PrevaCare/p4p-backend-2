const { uploadToS3 } = require("../../../middlewares/uploads/awsConfig");
const Lab = require("../../../models/lab/lab.model");
const City = require("../../../models/lab/city.model");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const {
  labValidationSchema,
  updateLabValidationSchema,
} = require("../../../validators/lab/lab.validator");
const mongoose = require("mongoose");

const createLab = async (req, res) => {
  try {
    // Check if request body exists
    if (!req.body) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Request body is required"
      );
    }

    // Check if files exist and has logo
    if (!req.files || !req.files.logo || !req.files.logo[0]) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Logo file is required"
      );
    }

    // Get the logo file from the array
    const logo = req.files.logo[0];
    console.log("data", req.body);

    // Upload logo to AWS S3
    const uploadedLogo = await uploadToS3(logo);
    if (!uploadedLogo) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Logo failed to upload"
      );
    }

    // Process cities
    const availableCitiesInput = req.body.availableCities || [];
    const processedCities = [];

    console.log("Input availableCities:", JSON.stringify(availableCitiesInput));

    // Create or reuse cities
    for (const cityData of availableCitiesInput) {
      try {
        const normalizedCityName = cityData.cityName
          ? cityData.cityName.toLowerCase().trim()
          : "";
        const normalizedState = cityData.state
          ? cityData.state.toLowerCase().trim()
          : "";

        // Handle existing cityId case
        if (
          cityData.cityId &&
          mongoose.Types.ObjectId.isValid(cityData.cityId)
        ) {
          // Check if city with this ID exists
          const existingCity = await City.findById(cityData.cityId);
          if (existingCity) {
            // Use the existing city
            processedCities.push({
              cityId: existingCity._id,
              cityName: existingCity.cityName,
              state: existingCity.state,
              pinCodes_excluded: cityData.pinCodes_excluded || [],
              regions_excluded: cityData.regions_excluded || [],
              isActive:
                cityData.isActive !== undefined ? cityData.isActive : true,
            });
            continue;
          }
        }

        // If no valid cityId or city not found, proceed with name/state lookup
        if (!normalizedCityName || !normalizedState) {
          console.log("Skipping invalid city data:", cityData);
          continue;
        }
        let city;
        if (cityData.zipCode) {
          city = await City.findOne({
            cityName: normalizedCityName,
            state: normalizedState,
            pincode: cityData.zipCode,
          });
        }
        else {
          city = await City.findOne({
            cityName: normalizedCityName,
            state: normalizedState,
            pinCode_excluded: cityData.pinCode_excluded || [],
            regions_excluded: cityData.regions_excluded || [],
          });
        }
        console.log("city", city);

        if (city) {
          // Update city if it exists
          const pinCodes_excluded = cityData.pinCodes_excluded || [];
          if (pinCodes_excluded.length > 0) {
            city = await City.findOneAndUpdate(
              {
                cityName: normalizedCityName,
                state: normalizedState,
              },
              {
                $set: {
                  isActive: true,
                },
                $addToSet: {
                  pinCodes_excluded: { $each: pinCodes_excluded },
                },
              },
              { new: true }
            );
          }
        } else {
          // Create new city if it doesn't exist
          console.log("cityData", cityData);
          if (cityData.zipCode) {
            city = await City.create({
              cityName: normalizedCityName,
              state: normalizedState,
              pincode: cityData.zipCode,
              isActive: true,
            });
          }
          else {
            city = await City.create({
              cityName: normalizedCityName,
              state: normalizedState,
              pinCodes_excluded: cityData.pinCodes_excluded || [],
              regions_excluded: cityData.regions_excluded || [],
              isActive: true,
            });
          }
          console.log("city created", city);

        }

        // Add to available cities
        processedCities.push({
          cityId: city._id,
          cityName: city.cityName,
          state: city.state,
          pinCodes_excluded: cityData.pinCodes_excluded || [],
          regions_excluded: cityData.regions_excluded || [],
          isActive: cityData.isActive !== undefined ? cityData.isActive : true,
        });
      } catch (cityError) {
        console.error("Error processing city:", cityError);
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          `Error processing city: ${cityError.message}`
        );
      }
    }

    console.log("Processed cities:", JSON.stringify(processedCities));

    // Create lab data object
    const labData = {
      logo: uploadedLogo.Location,
      labName: req.body.labName,
      labPersonName: req.body.labPersonName,
      contactNumber: req.body.contactNumber,
      address: {
        name: req.body.address.name,
        street: req.body.address.street,
        city: req.body.address.city,
        state: req.body.address.state,
        zipCode: req.body.address.zipCode,
      },
      accountsDetail: req.body.accountsDetail || {},
    };

    // Create new lab with basic data first, then update with cities
    const newLab = new Lab(labData);
    const savedLab = await newLab.save();
    console.log("Lab saved with ID:", savedLab._id);

    // Now update with cities in a separate operation
    if (processedCities.length > 0) {
      console.log("Updating lab with cities...");
      await Lab.findByIdAndUpdate(
        savedLab._id,
        { $set: { availableCities: processedCities } },
        { new: true }
      );
    }

    // Fetch the updated lab with cities
    const populatedLab = await Lab.findById(savedLab._id)
      .populate("availableCities.cityId")
      .exec();

    console.log("Final lab document:", JSON.stringify(populatedLab));

    return Response.success(res, populatedLab, 201, "Lab created successfully");
  } catch (err) {
    console.error("Error in createLab:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

const updateLab = async (req, res) => {
  try {
    const { labId } = req.params;
    console.log(labId);
    // Check if lab exists
    const existingLab = await Lab.findById(labId);
    if (!existingLab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // Validate request body against schema
    const { error } = updateLabValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed"
      );
    }

    // Handle logo update if provided
    let logoUrl = existingLab.logo;
    if (req.files && req.files.logo && req.files.logo[0]) {
      const uploadedLogo = await uploadToS3(req.files.logo[0]);
      if (uploadedLogo) {
        logoUrl = uploadedLogo.Location;
      }
    }

    // Process cities if provided
    let availableCities = existingLab.availableCities;
    if (req.body.availableCities) {
      availableCities = [];
      for (const cityData of req.body.availableCities) {
        try {
          // Handle existing cityId case
          if (
            cityData.cityId &&
            mongoose.Types.ObjectId.isValid(cityData.cityId)
          ) {
            // Check if city with this ID exists
            const existingCity = await City.findById(cityData.cityId);
            if (existingCity) {
              // Use the existing city
              availableCities.push({
                cityId: existingCity._id,
                cityName: existingCity.cityName,
                state: existingCity.state,
                pinCodes_excluded: cityData.pinCodes_excluded || [],
                regions_excluded: cityData.regions_excluded || [],
                isActive:
                  cityData.isActive !== undefined ? cityData.isActive : true,
              });
              continue;
            }
          }

          const normalizedCityName = cityData.cityName.toLowerCase().trim();
          const normalizedState = cityData.state.toLowerCase().trim();

          // If no valid cityId or city not found, proceed with name/state lookup
          let city = await City.findOne({
            cityName: normalizedCityName,
            state: normalizedState,
          });

          if (city) {
            // Update city if it exists
            const pinCodes_excluded = cityData.pinCodes_excluded || [];
            if (pinCodes_excluded.length > 0) {
              city = await City.findOneAndUpdate(
                {
                  cityName: normalizedCityName,
                  state: normalizedState,
                },
                {
                  $set: {
                    isActive: true,
                  },
                  $addToSet: {
                    pinCodes_excluded: { $each: pinCodes_excluded },
                  },
                },
                { new: true }
              );
            }
          } else {
            // Create new city if it doesn't exist
            city = await City.create({
              cityName: normalizedCityName,
              state: normalizedState,
              pinCodes_excluded: cityData.pinCodes_excluded || [],
              isActive: true,
            });
          }

          // Add to available cities
          availableCities.push({
            cityId: city._id,
            cityName: city.cityName,
            state: city.state,
            pinCodes_excluded: cityData.pinCodes_excluded || [],
            regions_excluded: cityData.regions_excluded || [],
            isActive:
              cityData.isActive !== undefined ? cityData.isActive : true,
          });
        } catch (cityError) {
          console.error("Error processing city:", cityError);
          // Continue with other cities if one fails
        }
      }
    }

    // Update lab with validated data
    const updatedLab = await Lab.findByIdAndUpdate(
      labId,
      {
        $set: {
          logo: logoUrl,
          labName: req.body.labName,
          labPersonName: req.body.labPersonName,
          contactNumber: req.body.contactNumber,
          address: req.body.address,
          accountsDetail: req.body.accountsDetail,
          availableCities,
        },
      },
      { new: true }
    ).populate("availableCities.cityId");

    return Response.success(res, updatedLab, 200, "Lab updated successfully");
  } catch (err) {
    console.error("Error in updateLab:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

// get all labs
const getAllLabs = async (req, res) => {
  try {
    const exisitingAllLabs = await Lab.find({});
    return Response.success(
      res,
      exisitingAllLabs,
      200,
      "all labs found successfully!"
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

// Get single lab by id
const getLabDetailsById = async (req, res) => {
  try {
    const { labId } = req.params;

    console.log("Requested lab ID:", labId);

    if (!labId) {
      return Response.error(res, 400, AppConstant.FAILED, "Lab ID is required");
    }

    // Validate labId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(labId)) {
      console.error(`Invalid Lab ID format: ${labId}`);
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid Lab ID format"
      );
    }

    // Find lab by ID and populate city details
    const lab = await Lab.findById(labId).populate("availableCities.cityId");

    if (!lab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // Count tests and packages for this lab (if those collections exist)
    let testsCount = 0;
    let packagesCount = 0;

    try {
      if (mongoose.model("IndividualLabTest")) {
        testsCount = await mongoose
          .model("IndividualLabTest")
          .countDocuments({ lab: labId });
      }
    } catch (err) {
      console.log("IndividualLabTest model not found, skipping count");
    }

    try {
      if (mongoose.model("LabPackage")) {
        packagesCount = await mongoose
          .model("LabPackage")
          .countDocuments({ labId: labId });
      }
    } catch (err) {
      console.log("LabPackage model not found, skipping count");
    }

    // Format the lab details
    const labDetails = lab.toObject();

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
    console.error("Error in getLabDetailsById:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

const getLabsByLocation = async (req, res) => {
  try {
    const { cityName, state } = req.body;

    if (!cityName && !state) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "City name, state is required"
      );
    }

    let cityQuery = {};

    // Build query based on provided parameters
    if (cityName && state) {
      // If both city and state are provided, search for exact match
      cityQuery = {
        cityName: cityName.toLowerCase(),
        state: state.toLowerCase(),
      };
    } else if (cityName) {
      // If only city is provided, search using regex for flexible matching
      cityQuery.cityName = { $regex: new RegExp(cityName, "i") };
    } else if (state) {
      // If only state is provided, search by state
      cityQuery.state = { $regex: new RegExp(state, "i") };
    }

    console.log("cityQuery search criteria:", cityQuery);

    const matchingCities = await City.find(cityQuery);
    console.log("matchingCities found:", matchingCities.length);

    if (matchingCities.length === 0) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "No cities found with the given criteria"
      );
    }

    const cityIds = matchingCities.map((city) => city._id);

    const labs = await Lab.find({
      "availableCities.cityId": { $in: cityIds },
      "availableCities.isActive": true,
    }).populate("availableCities.cityId");

    // Filter out labs that might have pinCode exclusion if pinCode was provided
    let filteredLabs = labs;

    console.log("labs found:", filteredLabs.length);

    if (filteredLabs.length === 0) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "No labs found with the given criteria"
      );
    }

    return Response.success(
      res,
      filteredLabs,
      200,
      "Labs found with the given criteria"
    );
  } catch (error) {
    console.error("Error fetching labs:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error"
    );
  }
};

// Add a new function to get all cities
const getAllCities = async (req, res) => {
  try {
    const cities = await City.find({}).sort({ cityName: 1 });
    return Response.success(res, cities, 200, "Cities retrieved successfully");
  } catch (err) {
    console.error("Error in getAllCities:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

module.exports = {
  createLab,
  getAllLabs,
  getLabDetailsById,
  updateLab,
  getLabsByLocation,
  getAllCities,
};
