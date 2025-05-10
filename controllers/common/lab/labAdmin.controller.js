const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Lab = require("../../../models/lab/lab.model");
const IndividualLabTest = require("../../../models/lab/individualLabTest.model");
const LabPackage = require("../../../models/lab/labPackage.model");
const {
  parseCSV,
  validateAndTransformCSVData,
  processCSVWithSchema,
} = require("../../../utils/csvParser");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const City = require("../../../models/lab/city.model");

// Test CSV Schema
const testCSVSchema = {
  // Required fields
  "Test Name": {
    required: true,
    type: "string",
    description: "Name of the test",
  },
  "Test Code": {
    required: true,
    type: "string",
    description: "Unique identifier for the test",
  },
  "Billing Rate": {
    required: true,
    type: "number",
    description: "Lab's selling price",
  },
  "Partner Rate": {
    required: true,
    type: "number",
    description: "Price offered to PrevaCare",
  },
  "PrevaCare Price": {
    required: true,
    type: "number",
    description: "Price charged by PrevaCare",
  },
  "Discount Price": {
    required: true,
    type: "number",
    description: "Discounted price",
  },

  // Optional fields
  Category: {
    required: false,
    type: "string",
    description: "Test category",
  },
  Description: {
    required: false,
    type: "string",
    description: "Details about the test",
  },
  "Age Group": {
    required: false,
    type: "string",
    default: "all age group",
    description: "Age range for which the test is applicable",
  },
  Gender: {
    required: false,
    type: "string",
    default: "both",
    description: "Gender specificity of the test",
  },
  "Samples Required": {
    required: false,
    type: "string",
    description: "List of samples needed for the test",
  },
  "Preparation Required": {
    required: false,
    type: "string",
    description: "Patient preparation instructions",
  },
  Location_place_name: {
    required: false,
    type: "string",
    description: "City/location name where test is available",
  },
  Location_pincode: {
    required: false,
    type: "string",
    description: "Postal code for the location",
  },
  "Home Collection Charges": {
    required: false,
    type: "number",
    description: "Fee for collecting samples at home",
  },
  "Home Collection available": {
    required: false,
    type: "boolean",
    description: "Whether home collection is available for this test",
  },
};

// Package CSV Schema
const packageCSVSchema = {
  // Required fields
  "Package Name": {
    required: true,
    type: "string",
    description: "Name of the package",
  },
  Category: {
    required: true,
    type: "string",
    description: "Package category",
  },
  "Package Code": {
    required: true,
    type: "string",
    description: "Unique identifier for the package",
  },
  "Tests Included": {
    required: true,
    type: "string",
    description: "List of tests in the package",
  },
  "Billing Rate": {
    required: true,
    type: "number",
    description: "Lab's selling price",
  },
  "Partner Rate": {
    required: true,
    type: "number",
    description: "Price offered to PrevaCare",
  },
  "PrevaCare Price": {
    required: true,
    type: "number",
    description: "Price charged by PrevaCare",
  },
  "Discount Price": {
    required: true,
    type: "number",
    description: "Discounted price",
  },

  // Optional fields
  Description: {
    required: false,
    type: "string",
    description: "Details about the package",
  },
  "Age Group": {
    required: false,
    type: "string",
    default: "all age group",
    description: "Age range for which the package is applicable",
  },
  Gender: {
    required: false,
    type: "string",
    default: "both",
    description: "Gender specificity of the package",
  },
  "Samples Required": {
    required: false,
    type: "string",
    description: "List of samples needed for the tests",
  },
  "Preparation Required": {
    required: false,
    type: "string",
    description: "Patient preparation instructions",
  },
  Location_place_name: {
    required: false,
    type: "string",
    description: "City/location name where package is available",
  },
  Location_pincode: {
    required: false,
    type: "string",
    description: "Postal code for the location",
  },
  "Home Collection Charges": {
    required: false,
    type: "number",
    description: "Fee for collecting samples at home",
  },
  "Home Collection available": {
    required: false,
    type: "boolean",
    description: "Whether home collection is available for this package",
  },
};

/**
 * Helper function to parse comma-separated values and validate array lengths
 */
const parseAndValidateCityArrays = (item) => {
  // Split comma-separated values into arrays
  const cityNames = item["Location_place_name"]
    ? item["Location_place_name"].split(",").map((name) => name.trim())
    : [];
  const pincodes = item["Location_pincode"]
    ? item["Location_pincode"].split(",").map((code) => code.trim())
    : [];
  const homeCollectionCharges = item["Home Collection Charges"]
    ? item["Home Collection Charges"]
        .split(",")
        .map((charge) => parseFloat(charge.trim()) || 0)
    : [];
  const homeCollectionAvailable = item["Home Collection available"]
    ? item["Home Collection available"].split(",").map((avail) => {
        const val = avail.trim().toLowerCase();
        return val === "true" || val === "yes" || val === "1";
      })
    : [];

  // Validate array lengths
  const maxLength = Math.max(
    cityNames.length,
    pincodes.length,
    homeCollectionCharges.length,
    homeCollectionAvailable.length
  );

  // Pad shorter arrays with default values
  while (cityNames.length < maxLength) cityNames.push("");
  while (pincodes.length < maxLength) pincodes.push("");
  while (homeCollectionCharges.length < maxLength)
    homeCollectionCharges.push(0);
  while (homeCollectionAvailable.length < maxLength)
    homeCollectionAvailable.push(false);

  return {
    cityNames,
    pincodes,
    homeCollectionCharges,
    homeCollectionAvailable,
    isValid:
      cityNames.length === pincodes.length &&
      cityNames.length === homeCollectionCharges.length &&
      cityNames.length === homeCollectionAvailable.length,
  };
};

/**
 * Helper function to process city availability for a test/package
 */
const processCityAvailability = (labPartner, item, isPackage = false) => {
  const cityAvailability = [];
  const {
    cityNames,
    pincodes,
    homeCollectionCharges,
    homeCollectionAvailable,
    isValid,
  } = parseAndValidateCityArrays(item);

  if (!isValid) {
    console.warn(
      `Invalid city data format in ${isPackage ? "package" : "test"} row: ${
        item[isPackage ? "Package Code" : "Test Code"]
      }`
    );
    return cityAvailability;
  }

  // Process each city
  for (let i = 0; i < cityNames.length; i++) {
    if (!cityNames[i] || !pincodes[i]) continue; // Skip empty entries

    // Find matching city in lab partner's available cities
    const existingCity = labPartner.availableCities?.find(
      (city) =>
        city.cityName.toLowerCase().trim() ===
          cityNames[i].toLowerCase().trim() && city.PinCode === pincodes[i]
    );

    if (existingCity) {
      // Calculate discount percentage
      const prevaCarePriceForCorporate = parseFloat(
        item["PrevaCare Price for Corporate"] || 0
      );
      const prevaCarePriceForIndividual = parseFloat(
        item["PrevaCare Price for Individual"] || 0
      );
      const discountPrice = parseFloat(item["Discount Price"] || 0);
      const discountPercentage =
        prevaCarePriceForCorporate > 0
          ? Math.round(
              ((prevaCarePriceForCorporate - discountPrice) /
                prevaCarePriceForCorporate) *
                100
            )
          : 0;

      cityAvailability.push({
        cityId: existingCity._id,
        isAvailable: true,
        labSellingPrice: parseFloat(item["Billing Rate"] || 0),
        offeredPriceToPrevaCare: parseFloat(item["Partner Rate"] || 0),
        prevaCarePriceForCorporate: parseFloat(prevaCarePriceForCorporate || 0),
        prevaCarePriceForIndividual: parseFloat(
          prevaCarePriceForIndividual || 0
        ),
        discountPercentage: discountPercentage,
        homeCollectionCharge: homeCollectionCharges[i],
        homeCollectionAvailable: homeCollectionAvailable[i],
      });
    } else {
      console.warn(
        `City not found for lab partner: ${cityNames[i]} (${pincodes[i]})`
      );
    }
  }

  return cityAvailability;
};

/**
 * Helper function to find or create a city
 */
const findOrCreateCity = async (cityName, pincode) => {
  if (!cityName) {
    throw new Error("City name is required");
  }

  const normalizedCityName = cityName.toLowerCase().trim();

  try {
    // Find city by name
    let city = await City.findOne({ cityName: normalizedCityName });

    if (city) {
      // Update pinCodes_excluded if pincode is provided
      if (pincode) {
        city = await City.findOneAndUpdate(
          { cityName: normalizedCityName },
          {
            $addToSet: {
              pinCodes_excluded: pincode.trim(),
            },
          },
          { new: true }
        );
      }
    } else {
      // Create new city
      city = await City.create({
        cityName: normalizedCityName,
        pinCodes_excluded: pincode ? [pincode.trim()] : [],
      });
    }

    return city;
  } catch (error) {
    console.error(`Error finding/creating city ${cityName}:`, error);
    throw error;
  }
};

/**
 * Import tests from CSV for a lab partner
 * @route POST /admin/lab-partner/import-tests
 */
const importLabTests = async (req, res) => {
  try {
    const { labId } = req.body;
    console.log("Starting importLabTests with labId:", labId);

    // Validate required fields
    if (!labId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Lab partner ID is required"
      );
    }

    if (!req.file) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "CSV file is required"
      );
    }

    // Find the lab partner
    const labPartner = await Lab.findById(labId);
    if (!labPartner) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Lab partner not found"
      );
    }

    // Parse CSV file
    const csvData = await parseCSV(req.file.path);
    console.log(`Parsed ${csvData.length} rows from CSV file`);

    // Group rows by test code
    const testGroups = new Map();
    for (const row of csvData) {
      const testCode = row["Test Code"];
      if (!testCode) continue;

      if (!testGroups.has(testCode)) {
        testGroups.set(testCode, []);
      }
      testGroups.get(testCode).push(row);
    }
    console.log(`Grouped into ${testGroups.size} unique test codes`);

    // Initialize results tracking
    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    // Prepare bulk operations array
    const bulkOps = [];

    // Process each test group
    for (const [testCode, testRows] of testGroups) {
      try {
        console.log(
          `Processing test code: ${testCode} with ${testRows.length} rows`
        );
        const firstRow = testRows[0];
        const cityAvailability = [];

        // Process each row for city availability
        for (const row of testRows) {
          try {
            const cityName = row["Location_place_name"];
            const pincode = row["Location_pincode"];

            if (!cityName || !pincode) {
              console.log(
                `Skipping row for test ${testCode} - missing city name or pincode`
              );
              continue;
            }

            // Find or create the city
            let city = await City.findOne({
              cityName: cityName.toLowerCase().trim(),
              pincode: pincode.trim(),
            });

            if (!city) {
              console.log(`Creating new city: ${cityName} (${pincode})`);
              city = await City.create({
                cityName: cityName.toLowerCase().trim(),
                pincode: pincode.trim(),
                isActive: true,
              });
            }

            // Calculate discount percentage
            const prevaCarePriceForCorporate = parseFloat(
              row["PrevaCare Price for Corporate"] || 0
            );
            const prevaCarePriceForIndividual = parseFloat(
              row["PrevaCare Price for Individual"] || 0
            );
            const discountPrice = parseFloat(row["Discount Price"] || 0);
            const discountPercentage =
              prevaCarePriceForCorporate > 0
                ? Math.round(
                    ((prevaCarePrice - discountPrice) / prevaCarePrice) * 100
                  )
                : 0;

            // Parse home collection availability and charge
            const homeCollectionValue =
              row["Home Collection Available"] ||
              row["Home Collection available"];
            const homeCollectionCharge = parseFloat(
              row["Home Collection Charge"] ||
                row["Home Collection Charges"] ||
                0
            );

            const cityData = {
              cityId: city._id,
              isAvailable: true,
              isActive: true,
              billingRate: parseFloat(row["Billing Rate"] || 0), // Match schema field name
              partnerRate: parseFloat(row["Partner Rate"] || 0), // Match schema field name
              prevaCarePriceForCorporate: prevaCarePriceForCorporate,
              prevaCarePriceForIndividual: prevaCarePriceForIndividual,
              discountPercentage: discountPercentage,
              homeCollectionCharge: homeCollectionCharge,
              homeCollectionAvailable:
                homeCollectionValue === "TRUE" ||
                homeCollectionValue === "Yes" ||
                homeCollectionValue === true,
            };

            console.log(
              `Adding city availability for ${cityName} (${pincode}):`,
              JSON.stringify(cityData)
            );
            cityAvailability.push(cityData);
          } catch (error) {
            console.error(
              `Error processing city for test ${testCode}: ${error.message}`
            );
            results.errors.push(
              `Error processing city for test ${testCode}: ${error.message}`
            );
          }
        }

        if (cityAvailability.length === 0) {
          console.log(`Skipping test ${testCode} - no valid cities`);
          results.skipped++;
          continue;
        }

        const testData = {
          testName: firstRow["Test Name"],
          testCode: testCode,
          category: firstRow["Category"]?.toLowerCase() || "general",
          desc: firstRow["Description"] || "", // Match schema field name
          ageGroup: firstRow["Age Group"] || "all age group",
          gender: firstRow["Gender"] || "both",
          lab: labId,
          sampleRequired: firstRow["Samples Required"]
            ? firstRow["Samples Required"].split(",").map((s) => s.trim())
            : [],
          preparationRequired: firstRow["Preparation Required"]
            ? firstRow["Preparation Required"].split(",").map((s) => s.trim())
            : [],
          cityAvailability: cityAvailability,
          isActive: true,
        };

        console.log(
          `Test data prepared for ${testCode}:`,
          JSON.stringify({
            testName: testData.testName,
            testCode: testData.testCode,
            category: testData.category,
            citiesCount: testData.cityAvailability.length,
          })
        );

        // Add to bulk operation
        bulkOps.push({
          updateOne: {
            filter: { testCode: testCode, lab: labId },
            update: { $set: testData },
            upsert: true,
          },
        });
      } catch (error) {
        console.error(`Error processing test ${testCode}: ${error.message}`);
        results.errors.push(
          `Error processing test ${testCode}: ${error.message}`
        );
        results.skipped++;
      }
    }

    // Execute bulk operation
    if (bulkOps.length > 0) {
      try {
        console.log(`Executing bulk operation for ${bulkOps.length} tests`);
        const bulkResult = await IndividualLabTest.bulkWrite(bulkOps, {
          ordered: false,
        });
        console.log("Bulk operation result:", JSON.stringify(bulkResult));
        results.imported = bulkResult.upsertedCount || 0;
        results.updated = bulkResult.modifiedCount || 0;
      } catch (error) {
        console.error("Bulk operation error:", error);
        results.errors.push(`Bulk operation error: ${error.message}`);
      }
    }

    // Remove the temporary file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.log(
      `Import completed: imported=${results.imported}, updated=${results.updated}, skipped=${results.skipped}`
    );
    return Response.success(
      res,
      {
        ...results,
        message: `Successfully imported ${results.imported} tests, updated ${results.updated} tests, skipped ${results.skipped}`,
        errors: results.errors,
      },
      200,
      "Tests imported successfully"
    );
  } catch (error) {
    console.error("Error in importLabTests:", error);
    // Clean up uploaded file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error"
    );
  }
};

/**
 * Import packages data from CSV for a lab partner
 * @route POST /admin/lab-partner/import-packages
 */
const importLabPackages = async (req, res) => {
  try {
    // Validation
    if (!req.file) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "CSV file is required"
      );
    }

    const { labId } = req.body;
    if (!labId) {
      return Response.error(res, 400, AppConstant.FAILED, "Lab ID is required");
    }

    // Check if lab exists
    const lab = await Lab.findById(labId);
    if (!lab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // Parse the CSV file
    const csvData = await parseCSV(req.file.path);
    console.log("CSV Data received:", csvData.length);

    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    // Group rows by Package Code
    const packageGroups = {};

    for (const row of csvData) {
      const packageCode = row["Package Code"]?.trim();

      if (!packageCode) {
        results.errors.push("Row skipped: Package Code is required");
        results.skipped++;
        continue;
      }

      if (!packageGroups[packageCode]) {
        packageGroups[packageCode] = [];
      }

      packageGroups[packageCode].push(row);
    }

    console.log(
      `Grouped ${csvData.length} rows into ${
        Object.keys(packageGroups).length
      } packages`
    );

    // Process each package group
    console.log(
      `Processing ${Object.keys(packageGroups).length} packages one by one`
    );

    for (const [packageCode, rows] of Object.entries(packageGroups)) {
      try {
        console.log(
          `Processing package: ${packageCode} with ${rows.length} cities`
        );

        // Use the first row for common package data
        const firstRow = rows[0];
        const packageName = firstRow["Package Name"]?.trim();

        if (!packageName) {
          results.errors.push(
            `Package Name is required for code ${packageCode}`
          );
          results.skipped++;
          continue;
        }

        // Process city availability for all rows in this package
        const cityAvailabilityArray = [];

        for (const row of rows) {
          try {
            // Find or create city
            const cityName = row["Location_place_name"]?.trim();
            const pincode = row["Location_pincode"]?.trim();

            if (!cityName || !pincode) {
              console.warn(
                `Skipping city entry with missing data for package ${packageCode}`
              );
              continue;
            }

            let city = await City.findOne({
              cityName: cityName.toLowerCase(),
              pinCode: pincode,
            });

            if (!city) {
              city = await City.create({
                cityName: cityName.toLowerCase(),
                pincode: pincode,
                isActive: true,
              });
            }

            // Calculate prices for this city
            const billingRate = parseFloat(row["Billing Rate"]) || 0;
            const partnerRate = parseFloat(row["Partner Rate"]) || 0;
            const prevaCarePriceForCorporate =
              parseFloat(row["PrevaCare Price for Corporate"]) || 0;
            const prevaCarePriceForIndividual =
              parseFloat(row["PrevaCare Price for Individual"]) || 0;
            const discountPrice =
              parseFloat(row["Discount Price"]) || prevaCarePrice;
            const discountPercentage =
              prevaCarePriceForCorporate > 0
                ? Math.round(
                    ((prevaCarePrice - discountPrice) / prevaCarePrice) * 100
                  )
                : 0;

            // Add this city to the availability array
            cityAvailabilityArray.push({
              cityId: city._id,
              cityName: city.cityName,
              pinCode: city.pincode,
              isAvailable: true,
              billingRate: billingRate,
              partnerRate: partnerRate,
              prevaCarePriceForCorporate: prevaCarePriceForCorporate,
              prevaCarePriceForIndividual: prevaCarePriceForIndividual,
              discountPrice: discountPrice,
              discountPercentage: discountPercentage,
              homeCollectionCharge:
                parseFloat(row["Home Collection Charges"]) || 0,
              homeCollectionAvailable:
                row["Home Collection available"] === "TRUE",
              isActive: true,
            });
          } catch (cityError) {
            console.error(
              `Error processing city for package ${packageCode}:`,
              cityError
            );
          }
        }

        if (cityAvailabilityArray.length === 0) {
          results.errors.push(
            `No valid cities found for package ${packageCode}`
          );
          results.skipped++;
          continue;
        }

        // Parse tests included
        const testsIncluded = firstRow["Tests Included"]
          ? firstRow["Tests Included"]
              .split(",")
              .map((test) => test.trim())
              .filter((test) => test)
              .map((test) => ({
                test: test,
                parameters: [],
              }))
          : [];

        console.log("Raw package data for:", {
          packageCode,
          firstRow: JSON.stringify(firstRow),
          cityCount: cityAvailabilityArray.length,
        });

        // Create complete package data
        const packageData = {
          labId: labId,
          packageName: packageName,
          packageCode: packageCode,
          PackageCode: packageCode,
          category: firstRow["Category"]?.trim() || "General",
          desc: firstRow["Description"]?.trim() || "",
          ageGroup: firstRow["Age Group"]?.trim() || "all age group",
          gender: firstRow["Gender"]?.trim() || "both",
          sampleRequired: firstRow["Samples Required"]
            ? firstRow["Samples Required"].split(",").map((s) => s.trim())
            : [],
          preparationRequired: firstRow["Preparation Required"]
            ? firstRow["Preparation Required"].split(",").map((s) => s.trim())
            : [],
          testIncluded: testsIncluded,
          cityAvailability: cityAvailabilityArray,
          isActive: true,
        };

        console.log("Final package data:", {
          packageCode: packageData.packageCode,
          labId: packageData.labId,
          cities: packageData.cityAvailability.length,
          tests: packageData.testIncluded.length,
        });

        // Instead of adding to bulkOps, do a direct update
        try {
          const result = await LabPackage.updateOne(
            {
              packageCode: packageCode,
              labId: labId,
            },
            { $set: packageData },
            { upsert: true }
          );

          if (result.upsertedCount) {
            results.imported++;
            console.log(`Imported package: ${packageCode}`);
          } else if (result.modifiedCount) {
            results.updated++;
            console.log(`Updated package: ${packageCode}`);
          }
        } catch (updateError) {
          console.error(`Error updating package ${packageCode}:`, updateError);
          results.errors.push(`${packageCode}: ${updateError.message}`);
          results.skipped++;
        }
      } catch (error) {
        console.error(`Error processing package ${packageCode}:`, error);
        results.errors.push(`${packageCode}: ${error.message}`);
        results.skipped++;
      }
    }

    // Clean up the temporary file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return Response.success(
      res,
      {
        ...results,
        message: `Successfully imported ${results.imported} packages, updated ${results.updated} packages, skipped ${results.skipped}`,
        errors: results.errors,
      },
      200,
      "Packages imported successfully"
    );
  } catch (error) {
    console.error("Error in importLabPackages:", error);
    // Clean up uploaded file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error"
    );
  }
};

/**
 * Enable/disable multiple cities for a lab partner
 * @route PATCH /admin/lab-partner/:partnerId/cities/change-status
 */
const updateLabPartnerCityStatus = async (req, res) => {
  try {
    const { partnerId, cityId } = req.params;
    const { status } = req.body;

    // Validate required fields
    if (!partnerId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Partner ID is required"
      );
    }

    if (!cityId) {
      return Response.error(res, 400, AppConstant.FAILED, "cityId is required");
    }

    if (status === undefined || status === null) {
      return Response.error(res, 400, AppConstant.FAILED, "Status is required");
    }

    // Ensure partnerId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid Partner ID format"
      );
    }
    console.log("cityId", cityId);
    // Ensure cityId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(cityId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid City ID format"
      );
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

    // Log the lab partner data for debugging
    console.log("Lab partner found:", partnerId);
    console.log(
      "Available cities count:",
      labPartner.availableCities ? labPartner.availableCities.length : 0
    );

    if (
      !labPartner.availableCities ||
      labPartner.availableCities.length === 0
    ) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Lab partner has no available cities"
      );
    }

    // Check if the city exists in the lab's available cities
    let cityFound = false;
    for (const city of labPartner.availableCities) {
      if (city.cityId && city.cityId.toString() === cityId) {
        city.isActive = status;
        cityFound = true;
        break;
      }
    }

    if (!cityFound) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "City not found in lab partner's available cities"
      );
    }

    // Save the updated lab partner
    await labPartner.save();

    return Response.success(
      res,
      {
        message: "City status updated successfully",
        partnerId,
        cityId,
        status,
      },
      200
    );
  } catch (error) {
    console.error("Error updating city status:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error"
    );
  }
};

/**
 * Update test availability for multiple cities
 * @route PATCH /admin/lab-partner/:labpartnerId/tests/:testId/cities/change-status
 */
const updateTestAvailabilityInCity = async (req, res) => {
  try {
    const { labpartnerId, testId, cityId } = req.params;
    const updateData = req.body;

    console.log("Update request received for test availability:", {
      labpartnerId,
      testId,
      cityId,
      updateData,
    });

    // Validate required IDs
    if (!labpartnerId || !testId || !cityId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "labpartnerId, testId and cityId are required"
      );
    }

    // Validate ID formats
    if (!mongoose.Types.ObjectId.isValid(labpartnerId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid Lab Partner ID format"
      );
    }

    if (!mongoose.Types.ObjectId.isValid(testId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid Test ID format"
      );
    }

    if (!mongoose.Types.ObjectId.isValid(cityId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid City ID format"
      );
    }

    // Find the lab
    const lab = await Lab.findById(labpartnerId);
    if (!lab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // Find the test with populated city data
    const testDoc = await IndividualLabTest.findOne({
      _id: testId,
      lab: labpartnerId,
    }).populate("cityAvailability.cityId");

    if (!testDoc) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Test not found for this lab partner"
      );
    }

    // Find the city
    const city = await City.findById(cityId);
    if (!city) {
      return Response.error(res, 404, AppConstant.FAILED, "City not found");
    }

    // Check if this city is in the lab's available cities
    console.log("lab.availableCities", lab.availableCities, cityId);
    const isCityAvailableInLab = lab.availableCities.some(
      (availableCity) => availableCity.cityId.toString() === cityId
    );

    if (!isCityAvailableInLab) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "This city is not available for this lab"
      );
    }

    // Find if city already exists in test's cityAvailability
    const cityIndex = testDoc.cityAvailability.findIndex((city) => {
      // Handle both populated and non-populated cityId
      const cityIdString = city.cityId._id
        ? city.cityId._id.toString()
        : city.cityId.toString();
      return cityIdString === cityId;
    });

    // Extract fields from update data
    const {
      status,
      labSellingPrice,
      offeredPriceToPrevaCare,
      prevaCarePriceForCorporate,
      prevaCarePriceForIndividual,
      discountPercentage,
      homeCollectionCharge,
      homeCollectionAvailable,
    } = updateData;

    const isActive = status !== undefined ? Boolean(status) : true;

    // If isActive is true, validate all required pricing fields
    if (isActive === true) {
      if (!labSellingPrice) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "labSellingPrice is required when status is true"
        );
      }

      if (!offeredPriceToPrevaCare) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "offeredPriceToPrevaCare is required when status is true"
        );
      }

      if (!prevaCarePriceForCorporate) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "prevaCarePriceForCorporate is required when status is true"
        );
      }
      if (!prevaCarePriceForIndividual) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "prevaCarePriceForIndividual is required when status is true"
        );
      }
      if (discountPercentage === undefined && discountPercentage !== 0) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "discountPercentage is required when status is true"
        );
      }
    }

    // Prepare city data
    const cityData = {
      cityId: city._id,
      isAvailable: isActive,
      isActive: isActive,
    };

    // Only add pricing fields if isActive is true
    if (isActive !== false) {
      cityData.billingRate = parseFloat(labSellingPrice || 0);
      cityData.partnerRate = parseFloat(offeredPriceToPrevaCare || 0);
      cityData.prevaCarePriceForCorporate = parseFloat(
        prevaCarePriceForCorporate || 0
      );
      cityData.prevaCarePriceForIndividual = parseFloat(
        prevaCarePriceForIndividual || 0
      );
      cityData.discountPercentage = parseFloat(discountPercentage || 0);
      cityData.homeCollectionCharge = parseFloat(homeCollectionCharge || 0);

      // Set homeCollectionAvailable based on provided value or homeCollectionCharge
      cityData.homeCollectionAvailable =
        homeCollectionAvailable !== undefined
          ? Boolean(homeCollectionAvailable)
          : parseFloat(homeCollectionCharge || 0) > 0;
    }

    // Update or add city availability
    if (cityIndex !== -1) {
      // Update existing city
      if (isActive === false) {
        // If setting to inactive, only update isActive and isAvailable fields
        testDoc.cityAvailability[cityIndex].isActive = false;
        testDoc.cityAvailability[cityIndex].isAvailable = false;
      } else {
        // Otherwise update all fields
        Object.assign(testDoc.cityAvailability[cityIndex], cityData);
      }
      console.log(`Updated existing city at index ${cityIndex}`);
    } else {
      // Add new city
      testDoc.cityAvailability.push(cityData);
      console.log(`Added new city to cityAvailability array`);
    }

    // Save the updated test
    const savedTest = await testDoc.save();

    // Get the updated city data for response
    const updatedCityIndex = savedTest.cityAvailability.findIndex((city) => {
      const cityIdString = city.cityId._id
        ? city.cityId._id.toString()
        : city.cityId.toString();
      return cityIdString === cityId;
    });

    const updatedCity =
      updatedCityIndex !== -1
        ? savedTest.cityAvailability[updatedCityIndex]
        : null;

    return Response.success(
      res,
      {
        test: {
          _id: savedTest._id,
          name: savedTest.testName,
          testCode: savedTest.testCode,
        },
        updatedCity: updatedCity
          ? {
              cityId: city._id,
              cityName: city.cityName,
              state: city.state,
              isActive: updatedCity.isActive,
              isAvailable: updatedCity.isAvailable,
              billingRate: updatedCity.billingRate,
              partnerRate: updatedCity.partnerRate,
              prevaCarePrice: updatedCity.prevaCarePrice,
              discountPercentage: updatedCity.discountPercentage,
              homeCollectionCharge: updatedCity.homeCollectionCharge,
              homeCollectionAvailable: updatedCity.homeCollectionAvailable,
            }
          : null,
        cityCount: savedTest.cityAvailability.length,
      },
      200,
      `Successfully updated city availability for test`
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

/**
 * Update package availability in a city
 * @route PATCH /admin/lab-partner/:partnerId/packages/:packageId/cities/:cityId
 */
/**
 * Update package availability for multiple cities
 * @route PATCH /admin/lab-partner/:labpartnerId/packages/:packageId/cities/change-status
 */
const updatePackageAvailabilityInCity = async (req, res) => {
  try {
    const { labId, packageId, cityId } = req.params;
    const updateData = req.body;
    console.log("labId", labId);
    console.log("packageId", packageId);
    console.log("cityId", cityId);
    console.log("updateData", updateData);

    // Validate required IDs
    if (!labId || !packageId || !cityId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "labId, packageId and cityId are required"
      );
    }

    // Validate ID formats
    if (!mongoose.Types.ObjectId.isValid(labId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid labId format"
      );
    }

    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid packageId format"
      );
    }

    if (!mongoose.Types.ObjectId.isValid(cityId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid cityId format"
      );
    }

    // Find the lab
    const lab = await Lab.findById(labId);
    if (!lab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // Find the package
    const packageDoc = await LabPackage.findOne({
      _id: packageId,
      labId: labId,
    });

    if (!packageDoc) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Package not found for this lab"
      );
    }

    // Find the city
    const city = await City.findById(cityId);
    if (!city) {
      return Response.error(res, 404, AppConstant.FAILED, "City not found");
    }

    // Check if this city is in the lab's available cities
    const isCityAvailableInLab = lab.availableCities.some(
      (availableCity) => availableCity.cityId.toString() === cityId
    );

    if (!isCityAvailableInLab) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "This city is not available for this lab"
      );
    }

    // Find if city already exists in package's cityAvailability
    const cityIndex = packageDoc.cityAvailability.findIndex(
      (city) => city.cityId.toString() === cityId
    );

    // Extract fields from update data
    const {
      isActive,
      billingRate,
      partnerRate,
      prevaCarePriceForCorporate,
      prevaCarePriceForIndividual,
      discountPercentage,
      homeCollectionCharge,
      homeCollectionAvailable,
      pinCodes_excluded,
      regions_excluded,
    } = updateData;

    // If isActive is true, validate all required pricing fields
    if (isActive === true) {
      if (!billingRate) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "billingRate is required when isActive is true"
        );
      }

      if (!partnerRate) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "partnerRate is required when isActive is true"
        );
      }

      if (!prevaCarePriceForCorporate) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "prevaCarePriceForCorporate is required when isActive is true"
        );
      }
      if (!prevaCarePriceForIndividual) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "prevaCarePriceIndividual is required when isActive is true"
        );
      }

      if (discountPercentage === undefined && discountPercentage !== 0) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "discountPercentage is required when isActive is true"
        );
      }
    }

    // Prepare city data
    const cityData = {
      cityId: city._id,
      cityName: city.cityName,
      state: city.state,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      pinCodes_excluded: pinCodes_excluded || [],
      regions_excluded: regions_excluded || [],
    };

    // Only add pricing fields if isActive is true
    if (isActive !== false) {
      cityData.billingRate = parseFloat(billingRate || 0);
      cityData.partnerRate = parseFloat(partnerRate || 0);
      cityData.prevaCarePriceForCorporate = parseFloat(
        prevaCarePriceForCorporate || 0
      );
      cityData.prevaCarePriceForIndividual = parseFloat(
        prevaCarePriceForIndividual || 0
      );
      cityData.discountPercentage = parseFloat(discountPercentage || 0);
      cityData.homeCollectionCharge = parseFloat(homeCollectionCharge || 0);

      // Set homeCollectionAvailable based on provided value or homeCollectionCharge
      cityData.homeCollectionAvailable =
        homeCollectionAvailable !== undefined
          ? Boolean(homeCollectionAvailable)
          : parseFloat(homeCollectionCharge || 0) > 0;
    }

    // Update or add city availability
    if (cityIndex !== -1) {
      // Update existing city
      if (isActive === false) {
        // If setting to inactive, only update isActive field
        packageDoc.cityAvailability[cityIndex].isActive = false;
      } else {
        // Otherwise update all fields
        Object.assign(packageDoc.cityAvailability[cityIndex], cityData);
      }
    } else {
      // Add new city
      packageDoc.cityAvailability.push(cityData);
    }

    // Save the updated package
    await packageDoc.save();

    return Response.success(
      res,
      {
        package: packageDoc,
        updatedCity: {
          cityId: city._id,
          cityName: city.cityName,
          state: city.state,
          isActive: cityData.isActive,
          billingRate: cityData.billingRate,
          partnerRate: cityData.partnerRate,
          prevaCarePriceForCorporate: cityData.prevaCarePriceForCorporate,
          prevaCarePriceForIndividual: cityData.prevaCarePriceForIndividual,
          discountPercentage: cityData.discountPercentage,
          homeCollectionCharge: cityData.homeCollectionCharge,
          homeCollectionAvailable: cityData.homeCollectionAvailable,
        },
      },
      200,
      `Successfully updated city availability for package`
    );
  } catch (err) {
    console.error("Error in updatePackageAvailabilityInCity:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

module.exports = {
  importLabTests,
  importLabPackages,
  updateLabPartnerCityStatus,
  updateTestAvailabilityInCity,
  updatePackageAvailabilityInCity,
};
