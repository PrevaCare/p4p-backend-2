const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Lab = require("../../../models/lab/lab.model");
const IndividualLabTest = require("../../../models/lab/individualLabTest.model");
const LabPackage = require("../../../models/lab/labPackage/addLabPackage.model");
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
      `Invalid city data format in ${isPackage ? "package" : "test"} row: ${item[isPackage ? "Package Code" : "Test Code"]
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
      const prevaCarePrice = parseFloat(item["PrevaCare Price"] || 0);
      const discountPrice = parseFloat(item["Discount Price"] || 0);
      const discountPercentage =
        prevaCarePrice > 0
          ? Math.round(
            ((prevaCarePrice - discountPrice) / prevaCarePrice) * 100
          )
          : 0;

      cityAvailability.push({
        cityId: existingCity._id,
        isAvailable: true,
        labSellingPrice: parseFloat(item["Billing Rate"] || 0),
        offeredPriceToPrevaCare: parseFloat(item["Partner Rate"] || 0),
        prevaCarePrice: parseFloat(prevaCarePrice || 0),
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
  try {
    let city = await City.findOne({
      cityName: cityName.trim().toLowerCase(),
      pincode: pincode.trim(),
    });

    if (!city) {
      city = await City.create({
        cityName: cityName.trim().toLowerCase(),
        pincode: pincode.trim(),
      });
    }

    return city._id;
  } catch (error) {
    console.error(`Error finding/creating city: ${error.message}`);
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
            const prevaCarePrice = parseFloat(row["PrevaCare Price"] || 0);
            const discountPrice = parseFloat(row["Discount Price"] || 0);
            const discountPercentage =
              prevaCarePrice > 0
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
              prevaCarePrice: prevaCarePrice,
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
      `Grouped ${csvData.length} rows into ${Object.keys(packageGroups).length
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
              pinCode: pincode
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
            const prevaCarePrice = parseFloat(row["PrevaCare Price"]) || 0;
            const discountPrice =
              parseFloat(row["Discount Price"]) || prevaCarePrice;
            const discountPercentage =
              prevaCarePrice > 0
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
              prevaCarePrice: prevaCarePrice,
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
    const { partnerId } = req.params;
    const { cityUpdates } = req.body;

    // Validate required fields
    if (!partnerId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Partner ID is required"
      );
    }

    if (!Array.isArray(cityUpdates) || cityUpdates.length === 0) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "cityUpdates array is required and must not be empty"
      );
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

    // Initialize results tracking
    const results = {
      updated: [],
      failed: [],
    };

    // Log the lab partner data for debugging
    console.log("Lab partner found:", partnerId);
    console.log(
      "Available cities:",
      labPartner.availableCities ? labPartner.availableCities.length : 0
    );

    // Ensure availableCities exists
    if (!labPartner.availableCities) {
      labPartner.availableCities = [];
    }

    // Process each city update
    for (const update of cityUpdates) {
      try {
        const { cityId, pinCode, status } = update;

        if (!cityId && !pinCode) {
          results.failed.push({
            cityId,
            pinCode,
            error: "Either cityId or pinCode is required",
          });
          continue;
        }

        if (status === undefined || status === null) {
          results.failed.push({
            cityId,
            pinCode,
            error: "Status is required",
          });
          continue;
        }

        let cityIndex = -1;

        // Find city by ID
        if (cityId) {
          if (!mongoose.Types.ObjectId.isValid(cityId)) {
            results.failed.push({
              cityId,
              error: "Invalid City ID format",
            });
            continue;
          }

          // Check for exact string match
          cityIndex = labPartner.availableCities.findIndex(
            (city) => city._id.toString() === cityId
          );
        }
        // Find city by pinCode (check all variations of property names)
        else if (pinCode) {
          cityIndex = labPartner.availableCities.findIndex(
            (city) =>
              (city.pincode && city.pincode === pinCode) ||
              (city.pinCode && city.pinCode === pinCode) ||
              (city.PinCode && city.PinCode === pinCode)
          );

          // Log the search results for debugging
          console.log(
            `Searching for pinCode ${pinCode}, found at index: ${cityIndex}`
          );
          if (cityIndex >= 0) {
            console.log("Match found:", labPartner.availableCities[cityIndex]);
          }
        }

        if (cityIndex === -1) {
          // Check if the city exists in the Cities collection, but not linked to this lab
          if (cityId && mongoose.Types.ObjectId.isValid(cityId)) {
            const city = await City.findById(cityId);
            if (city) {
              // Add this city to the lab partner
              labPartner.availableCities.push({
                _id: city._id,
                cityId: city._id, // Required by schema validation
                cityName: city.cityName,
                pinCode: city.pincode, // Use pinCode (case sensitive) as required by schema
                PinCode: city.pincode, // Also keep PinCode for backward compatibility
                isActive: Boolean(status),
              });

              results.updated.push({
                cityId: city._id,
                cityName: city.cityName,
                pinCode: city.pincode,
                status: Boolean(status),
              });
              continue;
            }
          } else if (pinCode) {
            const city = await City.findOne({ pincode: pinCode });
            if (city) {
              // Add this city to the lab partner
              labPartner.availableCities.push({
                _id: city._id,
                cityId: city._id, // Required by schema validation
                cityName: city.cityName,
                pinCode: city.pincode, // Use pinCode (case sensitive) as required by schema
                PinCode: city.pincode, // Also keep PinCode for backward compatibility
                isActive: Boolean(status),
              });

              results.updated.push({
                cityId: city._id,
                cityName: city.cityName,
                pinCode: city.pincode,
                status: Boolean(status),
              });
              continue;
            }
          }

          // City not found at all
          results.failed.push({
            cityId,
            pinCode,
            error: "City not found for this lab partner",
          });
          continue;
        }

        // Update the city's status
        labPartner.availableCities[cityIndex].isActive = Boolean(status);

        results.updated.push({
          cityId: labPartner.availableCities[cityIndex]._id,
          cityName: labPartner.availableCities[cityIndex].cityName,
          pinCode:
            labPartner.availableCities[cityIndex].PinCode ||
            labPartner.availableCities[cityIndex].pincode,
          status: Boolean(status),
        });
      } catch (error) {
        results.failed.push({
          cityId: update.cityId,
          pinCode: update.pinCode,
          error: error.message,
        });
      }
    }

    // Save the updated lab partner if there were any successful updates
    if (results.updated.length > 0) {
      await labPartner.save();
    }

    return Response.success(
      res,
      {
        labPartner: labPartner._id,
        updatedCities: results.updated,
        failedUpdates: results.failed,
      },
      200,
      `Successfully updated ${results.updated.length} cities, failed to update ${results.failed.length} cities`
    );
  } catch (err) {
    console.error("Error in updateLabPartnerCityStatus:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

/**
 * Update test availability for multiple cities
 * @route PATCH /admin/lab-partner/:labpartnerId/tests/:testId/cities/change-status
 */
const updateTestAvailabilityInCity = async (req, res) => {
  try {
    const { labpartnerId, testId } = req.params;
    let cityUpdates = req.body;

    console.log(
      "Update request received:",
      JSON.stringify(
        {
          labpartnerId,
          testId,
          body: cityUpdates,
        },
        null,
        2
      )
    );

    // Convert single object to array for consistent processing
    if (!Array.isArray(cityUpdates)) {
      cityUpdates = [cityUpdates];
    }

    // Validate required fields
    if (!labpartnerId || !testId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Lab Partner ID and Test ID are required"
      );
    }

    if (cityUpdates.length === 0) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "cityUpdates data is required and must not be empty"
      );
    }

    // Validate IDs
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

    console.log(
      `Found test: ${testDoc.testName} (${testDoc.testCode}) with ${testDoc.cityAvailability?.length || 0
      } cities`
    );

    // Debug: Print all cities to verify reactivation city is found
    console.log("All cities in test before processing:");
    testDoc.cityAvailability.forEach((city, i) => {
      const cityId = city.cityId._id || city.cityId;
      console.log(
        `City ${i}: ID=${cityId}, name=${city.cityId.cityName || "Unknown"
        }, isActive=${city.isActive}`
      );
    });

    // Initialize results tracking
    const results = {
      updated: [],
      failed: [],
    };

    // Ensure cityAvailability exists
    if (!testDoc.cityAvailability) {
      testDoc.cityAvailability = [];
    }

    // Process each city update
    for (const update of cityUpdates) {
      try {
        console.log(`Processing update:`, JSON.stringify(update, null, 2));

        const { cityId, pinCode, status, homeCollectionAvailable } = update;

        // Validate required fields
        if (!cityId && !pinCode) {
          results.failed.push({
            error: "Either cityId or pinCode is required",
          });
          continue;
        }

        // Determine update type
        const isHomeCollectionOnlyUpdate =
          homeCollectionAvailable !== undefined && status === undefined;
        const isStatusUpdate = status !== undefined;

        // Find the city in cityAvailability array
        let cityIndex = -1;
        let foundCity = null;

        // Try to find by cityId
        if (cityId) {
          if (!mongoose.Types.ObjectId.isValid(cityId)) {
            results.failed.push({
              cityId,
              error: "Invalid City ID format",
            });
            continue;
          }

          // Check for the city in the array - with improved debugging
          console.log(`Searching for city with ID: ${cityId}`);
          testDoc.cityAvailability.forEach((city, i) => {
            const cityIdString = city.cityId._id
              ? city.cityId._id.toString()
              : city.cityId.toString();
            console.log(`Comparing with city[${i}]: ${cityIdString}`);
            if (cityIdString === cityId) {
              console.log(`Found match at index ${i}`);
            }
          });

          cityIndex = testDoc.cityAvailability.findIndex((city) => {
            // Handle both populated and non-populated cityId
            const cityIdString = city.cityId._id
              ? city.cityId._id.toString()
              : city.cityId.toString();
            return cityIdString === cityId;
          });

          console.log(`City index found: ${cityIndex}`);

          if (cityIndex === -1) {
            // City not in array, try to find it in the database
            foundCity = await City.findById(cityId);
            if (!foundCity) {
              results.failed.push({
                cityId,
                error: "City not found in database",
              });
              continue;
            }
            console.log(`Found city in database: ${foundCity.cityName}`);
          }
        }
        // Try to find by pinCode
        else if (pinCode) {
          cityIndex = testDoc.cityAvailability.findIndex((city) => {
            if (city.pinCode) {
              return city.pinCode === pinCode;
            } else if (city.cityId && city.cityId.pincode) {
              return city.cityId.pincode === pinCode;
            }
            return false;
          });

          if (cityIndex === -1) {
            // City not in array, try to find it in the database
            foundCity = await City.findOne({ pincode: pinCode });
            if (!foundCity) {
              results.failed.push({
                pinCode,
                error: "City not found in database",
              });
              continue;
            }
          }
        }

        // Handle status update (activate or deactivate)
        if (isStatusUpdate) {
          const isActive = Boolean(status);

          // If setting to active, validate pricing fields
          if (isActive && cityIndex === -1) {
            // Adding new city or reactivating a non-existing city
            const {
              labSellingPrice,
              offeredPriceToPrevaCare,
              prevaCarePrice,
              discountPercentage,
            } = update;

            if (
              !labSellingPrice ||
              !offeredPriceToPrevaCare ||
              !prevaCarePrice ||
              !discountPercentage
            ) {
              results.failed.push({
                cityId: foundCity._id,
                error:
                  "When adding a city, all pricing fields are required (labSellingPrice, offeredPriceToPrevaCare, prevaCarePrice, discountPercentage)",
              });
              continue;
            }

            // Add the new city to the array
            const homeCollectionCharge = update.homeCollectionCharge || 0;

            // Create new city entry
            const newCity = {
              cityId: foundCity._id,
              isAvailable: true,
              isActive: true,
              billingRate: parseFloat(labSellingPrice),
              partnerRate: parseFloat(offeredPriceToPrevaCare),
              prevaCarePrice: parseFloat(prevaCarePrice),
              discountPercentage: parseFloat(discountPercentage),
              homeCollectionCharge: parseFloat(homeCollectionCharge),
              homeCollectionAvailable:
                update.homeCollectionAvailable !== undefined
                  ? Boolean(update.homeCollectionAvailable)
                  : parseFloat(homeCollectionCharge) > 0,
            };

            console.log(
              `Adding new city: ${foundCity.cityName} with status=${isActive}`
            );
            testDoc.cityAvailability.push(newCity);

            results.updated.push({
              cityId: foundCity._id,
              cityName: foundCity.cityName,
              pinCode: foundCity.pincode,
              status: isActive,
              message: "City added successfully",
            });
          } else if (isActive && cityIndex >= 0) {
            // Reactivating existing city
            const {
              labSellingPrice,
              offeredPriceToPrevaCare,
              prevaCarePrice,
              discountPercentage,
            } = update;

            if (
              !labSellingPrice ||
              !offeredPriceToPrevaCare ||
              !prevaCarePrice ||
              !discountPercentage
            ) {
              results.failed.push({
                cityId: cityId || testDoc.cityAvailability[cityIndex].cityId,
                error:
                  "When reactivating a city, all pricing fields are required",
              });
              continue;
            }

            // Get city info for logs and response
            const cityObject = testDoc.cityAvailability[cityIndex].cityId;
            console.log("Found city object:", JSON.stringify(cityObject));

            const cityName = cityObject.cityName || "Unknown";
            const cityPincode = cityObject.pincode || "Unknown";
            const cityIdValue = cityObject._id || cityObject;

            console.log(`Reactivating city: ${cityName} (index ${cityIndex})`);

            // Before update
            console.log(
              "City before update:",
              JSON.stringify(testDoc.cityAvailability[cityIndex])
            );

            // Update the city data - explicitly update each field
            testDoc.cityAvailability[cityIndex].isActive = true;
            testDoc.cityAvailability[cityIndex].isAvailable = true;
            testDoc.cityAvailability[cityIndex].billingRate =
              parseFloat(labSellingPrice);
            testDoc.cityAvailability[cityIndex].partnerRate = parseFloat(
              offeredPriceToPrevaCare
            );
            testDoc.cityAvailability[cityIndex].prevaCarePrice =
              parseFloat(prevaCarePrice);
            testDoc.cityAvailability[cityIndex].discountPercentage =
              parseFloat(discountPercentage);

            if (update.homeCollectionCharge !== undefined) {
              testDoc.cityAvailability[cityIndex].homeCollectionCharge =
                parseFloat(update.homeCollectionCharge);
            }

            if (update.homeCollectionAvailable !== undefined) {
              testDoc.cityAvailability[cityIndex].homeCollectionAvailable =
                Boolean(update.homeCollectionAvailable);
            }

            // After update
            console.log(
              "City after update:",
              JSON.stringify(testDoc.cityAvailability[cityIndex])
            );

            // Add to results
            results.updated.push({
              cityId: cityIdValue,
              cityName: cityName,
              pinCode: cityPincode,
              status: true,
              message: "City reactivated and updated successfully",
            });
          } else if (!isActive && cityIndex >= 0) {
            // Deactivating existing city - JUST CHANGE isActive and isAvailable flags
            // Get city info before making changes
            const cityObject = testDoc.cityAvailability[cityIndex].cityId;
            const cityName = cityObject.cityName || "Unknown";
            const cityPincode = cityObject.pincode || "Unknown";
            const cityIdValue = cityObject._id || cityObject;

            console.log(
              `Deactivating city: ${cityName} (index ${cityIndex}) - PRESERVING ALL PRICING DATA`
            );

            // Log the city before deactivation for debugging
            console.log(
              "City before deactivation:",
              JSON.stringify(
                {
                  cityId: cityIdValue,
                  isActive: testDoc.cityAvailability[cityIndex].isActive,
                  isAvailable: testDoc.cityAvailability[cityIndex].isAvailable,
                  billingRate: testDoc.cityAvailability[cityIndex].billingRate,
                  partnerRate: testDoc.cityAvailability[cityIndex].partnerRate,
                },
                null,
                2
              )
            );

            // Update only these two flags, preserve all other data
            testDoc.cityAvailability[cityIndex].isActive = false;
            testDoc.cityAvailability[cityIndex].isAvailable = false;

            // Log the city after deactivation to confirm data is preserved
            console.log(
              "City after deactivation:",
              JSON.stringify(
                {
                  cityId: cityIdValue,
                  isActive: testDoc.cityAvailability[cityIndex].isActive,
                  isAvailable: testDoc.cityAvailability[cityIndex].isAvailable,
                  billingRate: testDoc.cityAvailability[cityIndex].billingRate,
                  partnerRate: testDoc.cityAvailability[cityIndex].partnerRate,
                },
                null,
                2
              )
            );

            results.updated.push({
              cityId: cityIdValue,
              cityName: cityName,
              pinCode: cityPincode,
              status: false,
              message: "City deactivated successfully",
            });
          } else if (!isActive && cityIndex === -1) {
            // City not in array, can't deactivate
            results.failed.push({
              cityId: cityId || (foundCity && foundCity._id),
              pinCode: pinCode,
              error: "Cannot deactivate a city that is not in the test",
            });
          }
        }
        // Handle homeCollectionAvailable update only
        else if (isHomeCollectionOnlyUpdate && cityIndex >= 0) {
          console.log(
            `Updating homeCollectionAvailable=${homeCollectionAvailable} for city at index ${cityIndex}`
          );

          testDoc.cityAvailability[cityIndex].homeCollectionAvailable = Boolean(
            homeCollectionAvailable
          );

          const cityObject = testDoc.cityAvailability[cityIndex].cityId;
          const cityName = cityObject.cityName || "Unknown";
          const cityPincode = cityObject.pincode || "Unknown";

          results.updated.push({
            cityId:
              testDoc.cityAvailability[cityIndex].cityId._id ||
              testDoc.cityAvailability[cityIndex].cityId,
            cityName: cityName,
            pinCode: cityPincode,
            status: testDoc.cityAvailability[cityIndex].isActive,
            homeCollectionAvailable:
              testDoc.cityAvailability[cityIndex].homeCollectionAvailable,
            message: "Home collection availability updated",
          });
        } else if (isHomeCollectionOnlyUpdate && cityIndex === -1) {
          results.failed.push({
            cityId: cityId || (foundCity && foundCity._id),
            pinCode: pinCode,
            error:
              "Cannot update home collection for a city that is not in the test",
          });
        }
      } catch (error) {
        console.error("Error processing city update:", error);
        results.failed.push({
          error: error.message,
        });
      }
    }

    // Before saving, log the final cityAvailability array with all cities
    console.log(
      `Final cityAvailability array (${testDoc.cityAvailability.length} cities):`
    );

    // Log each city to ensure all cities are still present, including inactive ones
    testDoc.cityAvailability.forEach((city, index) => {
      const cityIdValue = city.cityId._id || city.cityId;
      console.log(
        `City ${index}: ID=${cityIdValue}, isActive=${city.isActive}, isAvailable=${city.isAvailable}, billingRate=${city.billingRate}, partnerRate=${city.partnerRate}, prevaCarePrice=${city.prevaCarePrice}`
      );
    });

    // Only save if there are updates
    if (results.updated.length > 0) {
      // Important: Make sure to use the correct Mongoose save method to preserve the cityAvailability array
      const savedDoc = await testDoc.save({ validateModifiedOnly: true });

      // Verify all cities are present after save
      console.log(
        `After save: Total cities = ${savedDoc.cityAvailability.length}`
      );

      // Log each city after save to verify data is correctly saved
      savedDoc.cityAvailability.forEach((city, index) => {
        const cityIdValue = city.cityId._id || city.cityId;
        console.log(
          `Post-save City ${index}: ID=${cityIdValue}, isActive=${city.isActive}, isAvailable=${city.isAvailable}, billingRate=${city.billingRate}`
        );
      });
    }

    // Include detailed information about all cities in the response for debugging
    const cityDetails = testDoc.cityAvailability.map((city) => {
      const cityObj = city.cityId;
      return {
        cityId: cityObj._id || cityObj,
        cityName: cityObj.cityName || "Unknown",
        isActive: city.isActive,
        isAvailable: city.isAvailable,
        billingRate: city.billingRate,
        partnerRate: city.partnerRate,
        prevaCarePrice: city.prevaCarePrice,
      };
    });

    return Response.success(
      res,
      {
        labPartner: labpartnerId,
        test: {
          _id: testDoc._id,
          name: testDoc.testName,
          testCode: testDoc.testCode,
        },
        updatedCities: results.updated,
        failedUpdates: results.failed,
        cityCount: testDoc.cityAvailability.length,
        cityDetails: cityDetails, // Add this for debugging
      },
      200,
      `Successfully updated ${results.updated.length} cities, failed to update ${results.failed.length} cities`
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
    const { labpartnerId, packageId } = req.params;
    const cityUpdates = req.body;

    // Validate required fields
    if (!labpartnerId || !packageId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Lab Partner ID and Package ID are required"
      );
    }

    if (!Array.isArray(cityUpdates) || cityUpdates.length === 0) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "cityUpdates array is required and must not be empty"
      );
    }

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(labpartnerId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid Lab Partner ID format"
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
    const packageDoc = await LabPackage.findOne({
      _id: packageId,
      labId: labpartnerId,
    });

    if (!packageDoc) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Package not found for this lab partner"
      );
    }

    // Initialize results tracking
    const results = {
      updated: [],
      failed: [],
    };

    // Ensure cityAvailability exists
    if (!packageDoc.cityAvailability) {
      packageDoc.cityAvailability = [];
    }

    // Process each city update
    for (const update of cityUpdates) {
      try {
        const {
          cityId,
          pinCode,
          status,
          availability,
          labSellingPrice,
          offeredPriceToPrevaCare,
          prevaCarePrice,
          discountPercentage,
          homeCollectionCharge,
          homeCollectionAvailable,
        } = update;

        // Determine if we're just updating status or full availability
        const isStatusOnlyUpdate = status !== undefined && !availability;
        const isAvailable =
          status !== undefined ? Boolean(status) : Boolean(availability);

        // For status-only updates, we don't need all pricing fields
        if (!isStatusOnlyUpdate && isAvailable) {
          // Validate required fields for full availability updates
          if (
            !labSellingPrice ||
            !offeredPriceToPrevaCare ||
            !prevaCarePrice ||
            !discountPercentage
          ) {
            results.failed.push({
              cityId,
              pinCode,
              error:
                "When package is available, all pricing fields are required (labSellingPrice, offeredPriceToPrevaCare, prevaCarePrice, discountPercentage)",
            });
            continue;
          }
        }

        if (!cityId && !pinCode) {
          results.failed.push({
            cityId,
            pinCode,
            error: "Either cityId or pinCode is required",
          });
          continue;
        }

        let cityIndex = -1;
        let city = null;

        // Find city by ID in the package's cityAvailability
        if (cityId) {
          if (!mongoose.Types.ObjectId.isValid(cityId)) {
            results.failed.push({
              cityId,
              error: "Invalid City ID format",
            });
            continue;
          }

          cityIndex = packageDoc.cityAvailability.findIndex(
            (city) => city.cityId.toString() === cityId
          );

          // If not found in package, get city info from City collection
          if (cityIndex === -1) {
            city = await City.findById(cityId);
          }
        }
        // Find city by pinCode
        else if (pinCode) {
          cityIndex = packageDoc.cityAvailability.findIndex(
            (city) => city.pinCode === pinCode
          );

          // If not found in package, get city info from City collection
          if (cityIndex === -1) {
            city = await City.findOne({ pincode: pinCode });
          }
        }

        // If city not found anywhere
        if (cityIndex === -1 && !city) {
          results.failed.push({
            cityId,
            pinCode,
            error: "City not found",
          });
          continue;
        }

        // If we found the city in the database but not in the package
        if (cityIndex === -1 && city) {
          // For status-only updates, we need default pricing values
          const newCity = {
            cityId: city._id,
            cityName: city.cityName,
            pinCode: city.pincode,
            isActive: isAvailable,
            billingRate: parseFloat(labSellingPrice || 0),
            partnerRate: parseFloat(offeredPriceToPrevaCare || 0),
            prevaCarePrice: parseFloat(prevaCarePrice || 0),
            discountPercentage: parseFloat(discountPercentage || 0),
            homeCollectionCharge: parseFloat(homeCollectionCharge || 0),
            homeCollectionAvailable:
              homeCollectionAvailable ??
              parseFloat(homeCollectionCharge || 0) > 0,
          };

          // Only add city if we have full pricing information or it's a status-only update
          if (
            isStatusOnlyUpdate ||
            (labSellingPrice &&
              offeredPriceToPrevaCare &&
              prevaCarePrice &&
              discountPercentage)
          ) {
            packageDoc.cityAvailability.push(newCity);

            results.updated.push({
              cityId: city._id,
              cityName: city.cityName,
              pinCode: city.pincode,
              status: isAvailable,
              price: isStatusOnlyUpdate
                ? null
                : {
                  billingRate: newCity.billingRate,
                  partnerRate: newCity.partnerRate,
                  prevaCarePrice: newCity.prevaCarePrice,
                  discountPercentage: newCity.discountPercentage,
                },
            });
          } else {
            results.failed.push({
              cityId,
              pinCode,
              error: "Missing pricing information for new city",
            });
          }
          continue;
        }

        // Update existing city in package
        if (isStatusOnlyUpdate) {
          // Just update the status
          packageDoc.cityAvailability[cityIndex].isActive = isAvailable;
        } else {
          // Update all fields
          packageDoc.cityAvailability[cityIndex].isActive = isAvailable;

          if (labSellingPrice !== undefined)
            packageDoc.cityAvailability[cityIndex].billingRate =
              parseFloat(labSellingPrice);

          if (offeredPriceToPrevaCare !== undefined)
            packageDoc.cityAvailability[cityIndex].partnerRate = parseFloat(
              offeredPriceToPrevaCare
            );

          if (prevaCarePrice !== undefined)
            packageDoc.cityAvailability[cityIndex].prevaCarePrice =
              parseFloat(prevaCarePrice);

          if (discountPercentage !== undefined)
            packageDoc.cityAvailability[cityIndex].discountPercentage =
              parseFloat(discountPercentage);

          if (homeCollectionCharge !== undefined) {
            packageDoc.cityAvailability[cityIndex].homeCollectionCharge =
              parseFloat(homeCollectionCharge);
            if (homeCollectionAvailable === undefined) {
              packageDoc.cityAvailability[cityIndex].homeCollectionAvailable =
                parseFloat(homeCollectionCharge) > 0;
            }
          }

          if (homeCollectionAvailable !== undefined) {
            packageDoc.cityAvailability[cityIndex].homeCollectionAvailable =
              Boolean(homeCollectionAvailable);
          }
        }

        results.updated.push({
          cityId: packageDoc.cityAvailability[cityIndex].cityId,
          cityName: packageDoc.cityAvailability[cityIndex].cityName,
          pinCode: packageDoc.cityAvailability[cityIndex].pinCode,
          status: packageDoc.cityAvailability[cityIndex].isActive,
          price: isStatusOnlyUpdate
            ? null
            : {
              billingRate: packageDoc.cityAvailability[cityIndex].billingRate,
              partnerRate: packageDoc.cityAvailability[cityIndex].partnerRate,
              prevaCarePrice:
                packageDoc.cityAvailability[cityIndex].prevaCarePrice,
              discountPercentage:
                packageDoc.cityAvailability[cityIndex].discountPercentage,
            },
        });
      } catch (error) {
        console.error("Error processing city update:", error);
        results.failed.push({
          cityId: update.cityId,
          pinCode: update.pinCode,
          error: error.message,
        });
      }
    }

    // Save the updated package if there were any successful updates
    if (results.updated.length > 0) {
      await packageDoc.save();
    }

    return Response.success(
      res,
      {
        labPartner: labpartnerId,
        package: {
          _id: packageDoc._id,
          name: packageDoc.packageName,
        },
        updatedCities: results.updated,
        failedUpdates: results.failed,
      },
      200,
      `Successfully updated ${results.updated.length} cities, failed to update ${results.failed.length} cities`
    );
  } catch (err) {
    console.error("Error in updatePackageAvailabilityInCities:", err);
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
