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

module.exports = { createInsurance };
