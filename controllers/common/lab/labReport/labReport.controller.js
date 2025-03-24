const { uploadToS3 } = require("../../../../middlewares/uploads/awsConfig");
const User = require("../../../../models/common/user.model");
const LabReport = require("../../../../models/lab/labReport/labReport.model");
const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const {
  labReportValidationSchema,
} = require("../../../../validators/lab/labReport/labReport.validator");

const createlabReport = async (req, res) => {
  try {
    // const { _id } = req.user;
    const labReportFile = req.files.labReportFile[0];
    if (!labReportFile) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "labReportFile is required !"
      );
    }

    const { error } = labReportValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation failed !"
      );
    }

    // find whether user has assinged general physician or not
    const user = await User.findById(req.body.user).populate({
      path: "assignedDoctors",
      select: "firstName lastName specialization",
    });
    // console.log(user);
    //
    if (!user.assignedDoctors || user.assignedDoctors.length === 0) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "no doctor assigned to this user !"
      );
    }

    const assignedGeneralPhysicianDoctor = user.assignedDoctors.filter(
      (doctor) => {
        return doctor.specialization === "General Physician";
      }
    );

    if (
      !assignedGeneralPhysicianDoctor ||
      assignedGeneralPhysicianDoctor.length === 0
    ) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "no general physician doctor assigned to this employee !"
      );
    }
    // console.log(assignedGeneralPhysicianDoctor);

    // return;

    // upload to aws -- lab file
    const uploadedLabReportFile = await uploadToS3(labReportFile);
    if (!uploadedLabReportFile) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "lab report failed to upload !"
      );
    }

    const newLabReport = new LabReport({
      ...req.body,
      user: req.body.user,
      doctor: assignedGeneralPhysicianDoctor[0]._id,
      labReportFile: uploadedLabReportFile.Location,
    });
    const savedLabReport = await newLabReport.save();
    return Response.success(
      res,
      savedLabReport,
      201,
      "Lab report created successfully !"
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

module.exports = { createlabReport };
