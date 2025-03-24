const Employee = require("../../../models/patient/employee/employee.model.js");
const User = require("../../../models/common/user.model.js");
const Response = require("../../../utils/Response.js");
const AppConstant = require("../../../utils/AppConstant.js");
const EMR = require("../../../models/common/emr.model.js");
const {
  employeeUpdateSchema,
} = require("../../../validators/patient/employees/udpateEmployees.validator.js");
const { uploadToS3 } = require("../../../middlewares/uploads/awsConfig.js");
const {
  corporateUpdateSchema,
} = require("../../../validators/corporate/updateCorporate.validators.js");
const Corporate = require("../../../models/corporates/corporate.model.js");
const {
  updateCorporateGlobalPlans,
} = require("../../../validators/globalPlan/updateCorporatePlans.validator.js");
const userModel = require("../../../models/common/user.model.js");

// update employee
const updateCorporateById = async (req, res) => {
  try {
    const { corporateid } = req.params;
    if (!corporateid) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "corporateid  not found !"
      );
    }

    const { error } = corporateUpdateSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation failed !"
      );
    }

    // Check if phone or email already exists for another user
    const existingUser = await userModel.findOne({
      $and: [
        { _id: { $ne: corporateid } }, // Exclude the current doctorId
        { $or: [{ phone: req.body.phone }, { email: req.body.email }] }, // Check for existing phone or email
      ],
    });

    if (existingUser) {
      // console.log(existingUser);
      // console.log("req.body");
      // console.log(req.body.phone);
      // console.log(req.body.email);
      return Response.error(
        res,
        409,
        AppConstant.FAILED,
        "user already exists with this phone or email!"
      );
    }

    // let dataToUpdate = req.body;
    let logo = "";
    // check if profileImg also in file
    // console.log(req.files);
    if (req.files && req.files.logo && req.files.logo.length > 0) {
      const logoToUpload = req.files.logo[0];
      const logoUploaded = await uploadToS3(logoToUpload);
      logo = logoUploaded.Location;
    }

    //
    // console.log(dataToUpdate);
    const updatedCorporate = logo
      ? await Corporate.findByIdAndUpdate(
          corporateid,
          { $set: { ...req.body, logo } },
          { new: true }
        ).select("-accessToken -refreshToken")
      : await Corporate.findByIdAndUpdate(
          corporateid,
          { $set: req.body },
          { new: true }
        ).select("-accessToken -refreshToken");

    return Response.success(
      res,
      updatedCorporate,
      200,
      "Corporate updated successfully !"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error !"
    );
  }
};

// update plans only
const updateCorporatePlans = async (req, res) => {
  try {
    const { corporateId } = req.params;
    if (!corporateId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "corporateId is missing !"
      );
    }

    const { error } = updateCorporateGlobalPlans.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        err.message || "validation failed !"
      );
    }
    const updatedCorporatePlan = await Corporate.findByIdAndUpdate(
      { _id: corporateId },
      { $set: req.body },
      { new: true }
    );

    return Response.success(
      res,
      updatedCorporatePlan,
      200,
      "Corporate plan updated successfully !"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error !"
    );
  }
};

//
// const getAllCorporateCurrentPlans = async (req, res) => {
//   try {

//   } catch (err) {
//     return Response.error(
//       res,
//       500,
//       AppConstant.FAILED,
//       err.message || "Internal server error !"
//     );
//   }
// };

module.exports = { updateCorporateById, updateCorporatePlans };
