const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const IndividualLabTest = require("../../../../models/lab/individualLabTest.model");
const {
  individualLabTestValidationSchema,
} = require("../../../../validators/lab/individualLabTest.validator");

const createIndividualLabTest = async (req, res) => {
  try {
    // Validate request body
    const { error } = individualLabTestValidationSchema.validate(req.body);
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
    const existingLabPackage = await IndividualLabTest.findOne({
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
    const newLabPackage = new IndividualLabTest({
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

const updateIndividualLabTest = async (req, res) => {
  try {
    const { labTestId } = req.params;
    if (!labTestId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "labTest Id is missing!"
      );
    }

    // Validate request body
    // const { error } = labPackageValidationSchema.validate(req.body);
    // if (error) {
    //   return Response.error(
    //     res,
    //     400,
    //     AppConstant.FAILED,
    //     error.message || "Validation failed!"
    //   );
    // }

    // If category is being updated, convert to lowercase
    if (req.body.category) {
      req.body.category = req.body.category.toLowerCase();
    }

    // Check if updating would create a duplicate
    if (req.body.testName || req.body.category || req.body.lab) {
      const existingPackage = await IndividualLabTest.findOne({
        _id: { $ne: labTestId },
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

    const updatedPackage = await IndividualLabTest.findOneAndUpdate(
      { _id: labTestId },
      { $set: req.body },
      { new: true }
    );

    if (!updatedPackage) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Lab package not found!"
      );
    }

    return Response.success(
      res,
      updatedPackage,
      200,
      "Lab package updated successfully!"
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

module.exports = { createIndividualLabTest, updateIndividualLabTest };
