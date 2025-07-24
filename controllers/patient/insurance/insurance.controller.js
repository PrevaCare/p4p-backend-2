const { uploadToS3 } = require("../../../middlewares/uploads/awsConfig");
const Insurance = require("../../../models/patient/insurance/insurance.model");
const Response = require("../../../utils/Response");
const AppConstant = require("../../../utils/AppConstant");
const createInsurance = async (req, res) => {
  try {
    const { _id } = req.user;
    const { insuranceName } = req.body;
    const insuranceFile = req.files.insuranceFile[0];
    if (!insuranceFile) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "insuranceFile is required !"
      );
    }
    const uploadedInsurance = await uploadToS3(insuranceFile);

    const newInsurance = new Insurance({
      user: _id,
      insuranceName,
      insuranceFile: uploadedInsurance.Location,
    });
    const savedInsurance = await newInsurance.save();

    return Response.success(
      res,
      savedInsurance,
      201,
      "Insurance created successfully !"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal Server error !"
    );
  }
};

const getAllUserInsurance = async (req, res) => {
  try {
    const { _id } = req.user;  // Get user ID from authenticated user
    const { page = 1, limit = 10, search = '' } = req.query;  // Pagination & search query

    // Convert page and limit to integers
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    // Calculate the offset
    const skip = (pageNumber - 1) * pageSize;

    // Build the query to filter by user and insurance name
    const query = {
      user: _id,  // Filter by user
      insuranceName: { $regex: search, $options: 'i' },  // Case-insensitive search on insuranceName
    };

    // Fetch insurances with pagination and search
    const insurances = await Insurance.find(query)
      .skip(skip)  // Skip the previous pages
      .limit(pageSize)  // Limit the number of results
      .exec();

    // Fetch total count for pagination
    const totalCount = await Insurance.countDocuments(query);

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / pageSize);

    return Response.success(
      res,
      { insurances, totalCount, totalPages, currentPage: pageNumber },
      200,
      "Insurance retrieved successfully!"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal Server Error!"
    );
  }
};

module.exports = { createInsurance, getAllUserInsurance };
