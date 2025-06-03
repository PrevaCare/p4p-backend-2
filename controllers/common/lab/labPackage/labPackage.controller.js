const mongoose = require("mongoose");
const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const LabPackage = require("../../../../models/lab/labPackage.model");
const { uploadToS3 } = require("../../../../middlewares/uploads/awsConfig");
const {
  labPackageValidationSchema,
} = require("../../../../validators/lab/labPackage/labPackage.validator");
const Lab = require("../../../../models/lab/lab.model");
const City = require("../../../../models/lab/city.model");

/**
 * Create a new lab package
 * @route POST /admin/lab/pacakge/create
 */
const createLabPackage = async (req, res) => {
  try {
    const {
      labId,
      packageName,
      packageCode,
      desc,
      long_desc,
      category,
      gender,
      ageGroup,
    } = req.body;

    const body = req.body;
    const file = req.files.logo[0]; // This is your logo file
    // Convert stringified fields back to JSON
    const testIncluded = JSON.parse(body.testIncluded || "[]");
    const sampleRequired = JSON.parse(body.sampleRequired || "[]");
    const preparationRequired = JSON.parse(body.preparationRequired || "[]");
    const cityAvailability = JSON.parse(body.cityAvailability || "[]");

    // Validation checks for required fields
    if (!labId || !packageName || !packageCode || !category) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Required fields missing: labId, packageName, packageCode, and category are required"
      );
    }

    // Validate lab ID
    if (!mongoose.Types.ObjectId.isValid(labId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid Lab ID format"
      );
    }

    // Check if lab exists
    const lab = await Lab.findById(labId);
    if (!lab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // Check if package with same code already exists for this lab
    const existingPackage = await LabPackage.findOne({
      labId,
      packageCode: packageCode.trim(),
    });

    if (existingPackage) {
      return Response.error(
        res,
        409,
        AppConstant.FAILED,
        "Package with this code already exists for this lab"
      );
    }

    // Process city availability
    const processedCityAvailability = [];
    const unavailableCities = [];
    const errors = [];

    if (cityAvailability && cityAvailability.length > 0) {
      // Get lab's available cities
      const labAvailableCities = lab.availableCities || [];

      for (const cityData of cityAvailability) {
        try {
          let cityId = cityData.cityId;
          let cityDocument;
          let matchingLabCity;

          // Case 1: Direct cityId is provided
          if (cityId && mongoose.Types.ObjectId.isValid(cityId)) {
            cityDocument = await City.findById(cityId);
            if (!cityDocument) {
              errors.push(`City with ID ${cityId} does not exist`);
              continue;
            }

            // Check if this city is in lab's available cities
            matchingLabCity = labAvailableCities.find(
              (city) => city.cityId.toString() === cityId.toString()
            );
          }
          // Case 2: cityName and state are provided
          else if (cityData.cityName && cityData.state) {
            const normalizedCityName = cityData.cityName.toLowerCase().trim();
            const normalizedState = cityData.state.toLowerCase().trim();

            // Add debug logging
            console.log(
              "Looking for city:",
              normalizedCityName,
              normalizedState
            );
            console.log(
              "Available lab cities:",
              JSON.stringify(
                labAvailableCities.map((c) => ({
                  cityName: c.cityName.toLowerCase(),
                  state: c.state.toLowerCase(),
                  cityId: c.cityId,
                }))
              )
            );

            // Find matching city in lab's available cities by name and state - more flexible matching
            matchingLabCity = labAvailableCities.find(
              (city) =>
                city.cityName.toLowerCase().trim() === normalizedCityName &&
                city.state.toLowerCase().trim() === normalizedState
            );

            // If no match found with exact state name, try more flexible matching
            if (!matchingLabCity) {
              console.log("No exact match found, trying approximate matching");

              // Try to find cities with matching name first
              const nameMatchCities = labAvailableCities.filter(
                (city) =>
                  city.cityName.toLowerCase().trim() === normalizedCityName
              );

              if (nameMatchCities.length > 0) {
                console.log(
                  `Found ${nameMatchCities.length} cities with matching name but different state`
                );
                console.log(
                  "Available states for this city:",
                  nameMatchCities.map((c) => c.state.toLowerCase())
                );

                // Try to match with more relaxed state comparison (for minor spelling mistakes)
                for (const city of nameMatchCities) {
                  // Basic approximate string matching - if strings are similar enough
                  // This handles small typos like maharashtra vs maharastra
                  if (
                    stringSimilarity(
                      city.state.toLowerCase(),
                      normalizedState
                    ) > 0.85
                  ) {
                    console.log(
                      `Found approximate state match: ${city.state.toLowerCase()} ≈ ${normalizedState}`
                    );
                    matchingLabCity = city;
                    break;
                  }
                }

                // If still no match, report the mismatch
                if (!matchingLabCity) {
                  const availableStates = nameMatchCities
                    .map((c) => c.state.toLowerCase())
                    .join(", ");
                  errors.push(
                    `City "${cityData.cityName}" found, but state "${cityData.state}" doesn't match available states: ${availableStates}`
                  );
                  continue;
                }
              }
            }

            if (matchingLabCity) {
              cityId = matchingLabCity.cityId;
              cityDocument = await City.findById(cityId);

              if (!cityDocument) {
                errors.push(
                  `City referenced in lab's availableCities does not exist in City collection`
                );
                continue;
              }
            } else {
              // Try to find if the city exists in the City collection
              cityDocument = await City.findOne({
                cityName: normalizedCityName,
                state: normalizedState,
              });

              if (cityDocument) {
                unavailableCities.push(
                  `${cityData.cityName}, ${cityData.state}`
                );
                continue; // Skip this city as it's not in lab's available cities
              } else {
                errors.push(
                  `City ${cityData.cityName}, ${cityData.state} not found in database`
                );
                continue;
              }
            }
          } else {
            errors.push(
              "Each city must have either a valid cityId or both cityName and state"
            );
            continue;
          }

          // Validate required pricing fields
          if (!cityData.billingRate) {
            errors.push(
              `City-specific lab selling price (billingRate) is required for ${cityDocument.cityName}`
            );
            continue;
          }

          if (!cityData.partnerRate) {
            errors.push(
              `City-specific offered price to PrevaCare (partnerRate) is required for ${cityDocument.cityName}`
            );
            continue;
          }

          if (!cityData.prevaCarePriceForCorporate) {
            errors.push(
              `City-specific PrevaCare price for corporate (prevaCarePriceForCorporate) is required for ${cityDocument.cityName}`
            );
            continue;
          }
          if (!cityData.prevaCarePriceForIndividual) {
            errors.push(
              `City-specific PrevaCare price for individual (prevaCarePriceForIndividual) is required for ${cityDocument.cityName}`
            );
            continue;
          }

          if (
            !cityData.discountPercentage &&
            cityData.discountPercentage !== 0
          ) {
            errors.push(
              `City-specific discount percentage is required for ${cityDocument.cityName}`
            );
            continue;
          }

          // Add to processed list with all required fields according to the schema
          const cityEntry = {
            cityId: cityDocument._id,
            cityName: cityDocument.cityName,
            state: cityDocument.state,
            pinCodes_excluded: [],
            regions_excluded: [],
            isActive: cityData.isActive !== false, // Default to true
            billingRate: parseFloat(cityData.billingRate || 0),
            partnerRate: parseFloat(cityData.partnerRate || 0),
            prevaCarePriceForCorporate: parseFloat(
              cityData.prevaCarePriceForCorporate || 0
            ),
            prevaCarePriceForIndividual: parseFloat(
              cityData.prevaCarePriceForIndividual || 0
            ),
            discountPercentage: parseFloat(cityData.discountPercentage || 0),
            homeCollectionCharge: parseFloat(
              cityData.homeCollectionCharge || 0
            ),
            homeCollectionAvailable:
              cityData.homeCollectionAvailable !== undefined
                ? Boolean(cityData.homeCollectionAvailable)
                : parseFloat(cityData.homeCollectionCharge || 0) > 0,
          };

          // Handle pinCode if provided (add to excluded list or save as main pincode)
          if (cityData.pinCode) {
            // For now, we're not adding it to pinCodes_excluded but keeping track for future use
            console.log(
              `Pincode ${cityData.pinCode} provided for city ${cityDocument.cityName}`
            );
          }

          // Handle pinCodes_excluded if provided
          if (
            cityData.pinCodes_excluded &&
            Array.isArray(cityData.pinCodes_excluded)
          ) {
            cityEntry.pinCodes_excluded = cityData.pinCodes_excluded;
          }

          // Handle regions_excluded if provided
          if (
            cityData.regions_excluded &&
            Array.isArray(cityData.regions_excluded)
          ) {
            cityEntry.regions_excluded = cityData.regions_excluded;
          }

          processedCityAvailability.push(cityEntry);
        } catch (cityError) {
          console.error("Error processing city:", cityError);
          errors.push(`Error processing city: ${cityError.message}`);
        }
      }
    }

    // Return errors if any
    if (errors.length > 0) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        `Validation errors: ${errors.join("; ")}`
      );
    }

    // Return warning if some cities are unavailable
    if (unavailableCities.length > 0) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        `Your lab does not deliver to these cities: ${unavailableCities.join(
          ", "
        )}`
      );
    }

    // Process testIncluded if provided
    let processedTestIncluded = [];
    if (testIncluded && Array.isArray(testIncluded)) {
      processedTestIncluded = testIncluded.map((test) => {
        if (typeof test === "string") {
          return { test: test, parameters: [] };
        } else if (test.test) {
          return {
            test: Array.isArray(test.test) ? test.test : test.test,
            parameters: test.parameters || [],
          };
        } else if (test.tests) {
          return {
            test: Array.isArray(test.tests) ? test.tests : test.tests,
            parameters: test.parameters || [],
          };
        }
        return { tests: [], parameters: [] };
      });
    }
    console.log("processedTestIncluded", processedTestIncluded);

    // Create new lab package
    const logoUrl = await uploadToS3(file);
    console.log("logoUrl", logoUrl);

    const newLabPackage = new LabPackage({
      labId,
      logo: logoUrl.Location || "",
      packageName: packageName.trim(),
      packageCode: packageCode.trim(),
      desc: desc || "",
      long_desc: long_desc || "",
      category: category.trim(),
      testIncluded: processedTestIncluded,
      sampleRequired: sampleRequired || [],
      preparationRequired: preparationRequired || [],
      gender: gender || "both",
      ageGroup: ageGroup || "all age group",
      cityAvailability: processedCityAvailability,
    });

    const savedLabPackage = await newLabPackage.save();
    console.log("savedLabPackage", savedLabPackage);

    return Response.success(
      res,
      savedLabPackage,
      201,
      "Lab package created successfully"
    );
  } catch (err) {
    console.error("Error in createLabPackage:", err);

    // Handle duplicate key error
    if (err.code === 11000) {
      return Response.error(
        res,
        409,
        AppConstant.FAILED,
        "Duplicate entry found"
      );
    }

    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

/**
 * Update an existing lab package
 * @route PATCH /admin/lab/pacakge/:packageId/update
 */
const updateLabPackage = async (req, res) => {
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

    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid Package ID format"
      );
    }

    // Find the package
    const existingPackage = await LabPackage.findById(packageId);
    if (!existingPackage) {
      return Response.error(res, 404, AppConstant.FAILED, "Package not found");
    }

    // Process cities if provided
    if (
      updateData.cityAvailability &&
      Array.isArray(updateData.cityAvailability)
    ) {
      // Get the lab
      const lab = await Lab.findById(existingPackage.labId);
      if (!lab) {
        return Response.error(
          res,
          404,
          AppConstant.FAILED,
          "Associated lab not found"
        );
      }

      // Get lab available cities for validation
      const labAvailableCities = lab.availableCities || [];
      const labCityIds = labAvailableCities
        .map((city) => (city.cityId ? city.cityId.toString() : null))
        .filter((id) => id);

      const processedCityAvailability = [];
      const errors = [];

      for (const cityData of updateData.cityAvailability) {
        // Check required fields for each city
        if (!cityData.cityId) {
          errors.push(`City ID is required for all cities`);
          continue;
        }

        if (!mongoose.Types.ObjectId.isValid(cityData.cityId)) {
          errors.push(`Invalid City ID format: ${cityData.cityId}`);
          continue;
        }

        // Check if city is in lab's available cities
        if (!labCityIds.includes(cityData.cityId.toString())) {
          errors.push(`City ${cityData.cityId} is not available for this lab`);
          continue;
        }

        try {
          // Find city details
          const city = await City.findById(cityData.cityId);
          if (!city) {
            errors.push(`City not found: ${cityData.cityId}`);
            continue;
          }

          // Add city data with complete details
          processedCityAvailability.push({
            cityId: city._id,
            cityName: city.cityName,
            state: city.state,
            pinCodes_excluded: cityData.pinCodes_excluded || [],
            regions_excluded: cityData.regions_excluded || [],
            isActive: cityData.isActive !== false, // Default to true
            billingRate: parseFloat(cityData.billingRate || 0),
            partnerRate: parseFloat(cityData.partnerRate || 0),
            prevaCarePriceForCorporate: parseFloat(
              cityData.prevaCarePriceForCorporate || 0
            ),
            prevaCarePriceForIndividual: parseFloat(
              cityData.prevaCarePriceForIndividual || 0
            ),
            discountPercentage: parseFloat(cityData.discountPercentage || 0),
            homeCollectionCharge: parseFloat(
              cityData.homeCollectionCharge || 0
            ),
            homeCollectionAvailable:
              cityData.homeCollectionAvailable !== undefined
                ? Boolean(cityData.homeCollectionAvailable)
                : parseFloat(cityData.homeCollectionCharge || 0) > 0,
          });
        } catch (cityError) {
          console.error("Error processing city:", cityError);
          errors.push(
            `Error processing city ${cityData.cityId}: ${cityError.message}`
          );
        }
      }

      // Check if we have errors
      if (errors.length > 0) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          `Validation errors: ${errors.join("; ")}`
        );
      }

      // Replace the cityAvailability array
      updateData.cityAvailability = processedCityAvailability;
    }

    // Process testIncluded if provided
    if (updateData.testIncluded && Array.isArray(updateData.testIncluded)) {
      updateData.testIncluded = updateData.testIncluded.map((test) => {
        if (typeof test === "string") {
          return {
            tests: [test],
            parameters: [],
          };
        }
        return {
          tests: Array.isArray(test.tests) ? test.tests : [test.tests],
          parameters: test.parameters || [],
        };
      });
    }

    // Update the package
    const updatedPackage = await LabPackage.findByIdAndUpdate(
      packageId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return Response.success(
      res,
      updatedPackage,
      200,
      "Lab package updated successfully"
    );
  } catch (err) {
    console.error("Error in updateLabPackage:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

// Add this to fix existing documents with null packageName values
const migrateNullPackageNames = async () => {
  try {
    // Find all documents where packageName is null but testName exists
    const packagesToFix = await LabPackage.find({
      packageName: null,
      testName: { $ne: null },
    });

    for (const pkg of packagesToFix) {
      // Use the testName as packageName
      await LabPackage.updateOne(
        { _id: pkg._id },
        { $set: { packageName: pkg.testName } }
      );
    }

    console.log(
      `Fixed ${packagesToFix.length} packages with null packageName values`
    );
  } catch (error) {
    console.error("Migration error:", error);
  }
};

// You can call this function once from your main application setup
// migrateNullPackageNames();

// Helper function to calculate string similarity (Levenshtein distance based)
function stringSimilarity(str1, str2) {
  if (str1 === str2) return 1.0;

  const len1 = str1.length;
  const len2 = str2.length;

  // Quick length check - strings with very different lengths are unlikely to be typos
  if (Math.abs(len1 - len2) > 3) return 0;

  const maxLen = Math.max(len1, len2);

  // Calculate Levenshtein distance
  const levenshtein = (a, b) => {
    const matrix = Array(a.length + 1)
      .fill()
      .map(() => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[a.length][b.length];
  };

  const distance = levenshtein(str1, str2);
  return 1.0 - distance / maxLen;
}

module.exports = {
  createLabPackage,
  updateLabPackage,
};
