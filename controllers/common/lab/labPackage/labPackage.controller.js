const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const LabPackage = require("../../../../models/lab/labPackage/addLabPackage.model");
const {
  labPackageValidationSchema,
} = require("../../../../validators/lab/labPackage/labPackage.validator");

const createLabPackage = async (req, res) => {
  try {
    // Validate request body
    const { error } = labPackageValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    const { lab, category, testName } = req.body;
    const lowerCaseCategory = category.toLowerCase();

    // Check if a lab package with the same lab, category and test name already exists
    const existingLabPackage = await LabPackage.findOne({
      lab,
      category: lowerCaseCategory,
      testName,
    });

    if (existingLabPackage) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "A lab package with this lab, category and test name already exists!"
      );
    }

    // Create a new LabPackage instance
    const newLabPackage = new LabPackage({
      ...req.body,
      category: lowerCaseCategory,
    });

    const savedLabPackage = await newLabPackage.save();
    return Response.success(
      res,
      savedLabPackage,
      201,
      "Lab package created successfully!"
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

const updateLabPackage = async (req, res) => {
  try {
    const { packageId } = req.params;
    if (!packageId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Package Id is missing!"
      );
    }

    // Validate request body
    const { error } = labPackageValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    // If category is being updated, convert to lowercase
    if (req.body.category) {
      req.body.category = req.body.category.toLowerCase();
    }

    // Check if updating would create a duplicate
    if (req.body.testName || req.body.category || req.body.lab) {
      const existingPackage = await LabPackage.findOne({
        _id: { $ne: packageId },
        lab: req.body.lab || undefined,
        category: req.body.category || undefined,
        testName: req.body.testName || undefined,
      });

      if (existingPackage) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "A lab package with these details already exists!"
        );
      }
    }

    // First fetch the existing package
    const existingPackage = await LabPackage.findById(packageId);
    if (!existingPackage) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Lab package not found!"
      );
    }

    // Update the package using findByIdAndUpdate to avoid the schema validation for packageName
    // This approach directly updates only the fields provided in req.body
    const updatedPackage = await LabPackage.findByIdAndUpdate(
      packageId,
      { $set: req.body },
      { new: true }
    );

    // If there's still an issue with the packageName field being null in the database,
    // we need to handle it at the database level, not in the API
    // Consider running a separate migration to fix any null packageName values

    return Response.success(
      res,
      updatedPackage,
      200,
      "Lab package updated successfully!"
    );
  } catch (err) {
    console.error("Update lab package error:", err);

    // Handle duplicate key errors specifically
    if (err.code === 11000) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Duplicate key error: Another package with the same unique field already exists."
      );
    }

    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
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

module.exports = { createLabPackage, updateLabPackage };
