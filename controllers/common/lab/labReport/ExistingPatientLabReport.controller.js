const { uploadToS3 } = require("../../../../middlewares/uploads/awsConfig");
const ExistingPatientLabReport = require("../../../../models/lab/labReport/ExistingPatientLabReport.model");
const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const {
  createExistingPatientLabReportSchema,
} = require("../../../../validators/lab/labReport/existingPatientLabReport.validator");

const createExistingPatientLabReport = async (req, res) => {
  try {
    const { _id } = req.user;
    const labReportFile = req.files.labReportFile[0];
    if (!labReportFile) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "labReportFile is required !"
      );
    }
    const { error } = createExistingPatientLabReportSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation failed !"
      );
    }

    // upload to aws
    const uploadedLabReportFile = await uploadToS3(labReportFile);
    if (!uploadedLabReportFile) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "lab report failed to upload !"
      );
    }

    const newExistingPatientLabReport = new ExistingPatientLabReport({
      user: _id,
      labReportFile: uploadedLabReportFile.Location,
    });
    const savedExistingPatientLabReport =
      await newExistingPatientLabReport.save();
    return Response.success(
      res,
      savedExistingPatientLabReport,
      201,
      "Existing Patient Lab report created successfully !"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server failed !"
    );
  }
};

module.exports = { createExistingPatientLabReport };
