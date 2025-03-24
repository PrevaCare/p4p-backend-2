const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const LabPackage = require("../../../../models/lab/labPackage/addLabPackage.model");
const LapPackage = require("../../../../models/lab/labPackage/addLabPackage.model");

const getAllCategoryOfPackageOfParticularLab = async (req, res) => {
  try {
    // Validate request body
    const { labId } = req.body;
    if (!labId) {
      return Response.error(res, 404, AppConstant.FAILED, "labId is missing !");
    }

    const allCategories = await LabPackage.find({ lab: labId }).select(
      "_id category"
    );

    const uniqueCategories = [];
    const seenCategories = new Set();

    allCategories.forEach((item) => {
      if (!seenCategories.has(item.category)) {
        seenCategories.add(item.category);
        uniqueCategories.push({
          _id: item._id,
          category: item.category,
        });
      }
    });
    // Return success response
    return Response.success(
      res,
      uniqueCategories,
      200,
      "All Category of Lab packages found  successfully !"
    );
  } catch (err) {
    // Handle any errors
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

const getAllTestOfParticularCategoryOfPackageOfParticularLab = async (
  req,
  res
) => {
  try {
    const { labId, category } = req.body;

    // Add logging
    console.log("Search parameters:", { labId, category });

    // Perform a direct find without any transformations
    const documents = await LabPackage.find({
      lab: labId,
      category: category,
    });

    console.log(`Found ${documents.length} documents`);

    // Just return exactly what we found
    return Response.success(res, documents, 200, "Raw documents returned");
  } catch (err) {
    console.error("Error:", err);
    return Response.error(res, 500, AppConstant.FAILED, err.message);
  }
};

//
const getSingleLabPackageById = async (req, res) => {
  try {
    const { packageId } = req.body;
    if (!packageId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "packageId is missing !"
      );
    }

    const existingPackage = await LapPackage.findById(packageId);
    if (!existingPackage) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "No package found with given packageId"
      );
    }

    // check if package exist and well-formed
    if (
      !existingPackage.packages ||
      !Array.isArray(existingPackage.packages) ||
      existingPackage.packages.length === 0
    ) {
      existingPackage.packages = [];
    }

    // Return success response
    return Response.success(
      res,
      existingPackage,
      200,
      "package found with given package Id !"
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

const updateLabPackageById = async (req, res) => {
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

    console.log(`Updating package with ID: ${packageId}`, updateData);

    // Find and update the package
    const updatedPackage = await LabPackage.findByIdAndUpdate(
      packageId,
      updateData,
      { new: true } // Return the updated document
    );

    if (!updatedPackage) {
      return Response.error(res, 404, AppConstant.FAILED, "Package not found");
    }

    return Response.success(
      res,
      updatedPackage,
      200,
      "Package updated successfully"
    );
  } catch (err) {
    console.error("Error updating package:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

const deleteLabPackageById = async (req, res) => {
  try {
    const { packageId } = req.params;

    if (!packageId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Package ID is required"
      );
    }

    console.log(`Deleting package with ID: ${packageId}`);

    // Find and delete the package
    const deletedPackage = await LabPackage.findByIdAndDelete(packageId);

    if (!deletedPackage) {
      return Response.error(res, 404, AppConstant.FAILED, "Package not found");
    }

    return Response.success(
      res,
      { _id: packageId },
      200,
      "Package deleted successfully"
    );
  } catch (err) {
    console.error("Error deleting package:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

module.exports = {
  getAllCategoryOfPackageOfParticularLab,
  getAllTestOfParticularCategoryOfPackageOfParticularLab,
  getSingleLabPackageById,
  deleteLabPackageById,
  updateLabPackageById,
};
