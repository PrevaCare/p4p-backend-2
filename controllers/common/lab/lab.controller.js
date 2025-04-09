const { uploadToS3 } = require("../../../middlewares/uploads/awsConfig");
const Lab = require("../../../models/lab/lab.model");
const City = require("../../../models/lab/city.model");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const {
  labValidationSchema,
  updateLabValidationSchema,
} = require("../../../validators/lab/lab.validator");

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

    // Validate request body against schema
    const { error } = labValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed"
      );
    }

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
    const cityOperatedIn = req.body.cityOperatedIn || [];
    const availableCities = [];

    // Create or reuse cities
    for (const cityData of cityOperatedIn) {
      try {
        const normalizedCityName = cityData.cityName.toLowerCase().trim();
        const normalizedPincode = cityData.zipCode.trim();

        // Try to find existing city by pincode
        let city = await City.findOne({ pincode: normalizedPincode });

        if (city) {
          // Update city if it exists
          city = await City.findOneAndUpdate(
            { pincode: normalizedPincode },
            {
              $set: {
                cityName: normalizedCityName,
                isActive: true,
              },
            },
            { new: true }
          );
        } else {
          // Create new city if it doesn't exist
          city = await City.create({
            cityName: normalizedCityName,
            pincode: normalizedPincode,
            isActive: true,
          });
        }

        // Add to available cities
        availableCities.push({
          cityId: city._id,
          cityName: city.cityName,
          pinCode: city.pincode,
          isActive: true,
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

    // Create new lab with validated data
    const newLab = new Lab({
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
      availableCities,
    });

    // Save lab to database
    const savedLab = await newLab.save();

    // Populate city details in response
    const populatedLab = await Lab.findById(savedLab._id)
      .populate("availableCities.cityId")
      .exec();

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
    if (req.body.cityOperatedIn) {
      availableCities = [];
      for (const cityData of req.body.cityOperatedIn) {
        try {
          const normalizedCityName = cityData.cityName.toLowerCase().trim();
          const normalizedPincode = cityData.zipCode.trim();

          // Try to find existing city by pincode
          let city = await City.findOne({ pincode: normalizedPincode });

          if (city) {
            // Update city if it exists
            city = await City.findOneAndUpdate(
              { pincode: normalizedPincode },
              {
                $set: {
                  cityName: normalizedCityName,
                  isActive: true,
                },
              },
              { new: true }
            );
          } else {
            // Create new city if it doesn't exist
            city = await City.create({
              cityName: normalizedCityName,
              pincode: normalizedPincode,
              isActive: true,
            });
          }

          // Add to available cities
          availableCities.push({
            cityId: city._id,
            cityName: city.cityName,
            pinCode: city.pincode,
            isActive: true,
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
// get single lab by id
const getLabById = async (req, res) => {
  try {
    const { labId } = req.body;
    console.log(labId)
    if (!labId) {
      return Response.error(res, 404, AppConstant.FAILED, "labId is missing !");
    }

    const existingLab = await Lab.findOne({ _id: labId });
    if (!existingLab) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "lab not found with given labId !"
      );
    }
    return Response.success(res, existingLab, 200, "lab found with id !");
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

const getLabsByLocation = async (req, res) => {
  try {
    const { city, pinCode } = req.method === "GET" ? req.query : req.body;

    if (!city && !pinCode) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "City name or zipCode is required"
      );
    }

    let cityQuery = {};
    if (pinCode && city) {
      cityQuery.pincode = pinCode;
    } else if (pinCode) {
      cityQuery.pincode = pinCode;
    } else if (city) {
      cityQuery.cityName = { $regex: new RegExp(city, "i") };
    }

    console.log("cityQuery search completed: ", cityQuery);

    const matchingCities = await City.find(cityQuery);
    console.log("matchingCities: ", matchingCities);

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

    console.log("labs: ", labs);

    if (labs.length === 0) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "No labs found with the given criteria"
      );
    }

    return Response.success(
      res,
      labs,
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
  getLabById,
  updateLab,
  getLabsByLocation,
  getAllCities,
};
