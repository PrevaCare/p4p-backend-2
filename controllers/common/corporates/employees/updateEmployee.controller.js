const Employee = require("../../../../models/patient/employee/employee.model.js");
const User = require("../../../../models/common/user.model.js");
const Response = require("../../../../utils/Response.js");
const AppConstant = require("../../../../utils/AppConstant.js");
const EMR = require("../../../../models/common/emr.model.js");
const {
  employeeUpdateSchema,
} = require("../../../../validators/patient/employees/udpateEmployees.validator.js");
const { uploadToS3 } = require("../../../../middlewares/uploads/awsConfig.js");
const userModel = require("../../../../models/common/user.model.js");

// update employee
const updateEmployeeById = async (req, res) => {
  try {
    const { employeeid } = req.params;
    if (!employeeid) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "employeeId  not found !"
      );
    }

    const { error } = employeeUpdateSchema.validate(req.body);
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
        { _id: { $ne: employeeid } }, // Exclude the current doctorId
        { $or: [{ phone: req.body.phone }, { email: req.body.email }] }, // Check for existing phone or email
      ],
    });
    // console.log(existingUser);

    if (existingUser) {
      return Response.error(
        res,
        409,
        AppConstant.FAILED,
        "user already exists with this phone or email!"
      );
    }

    // let dataToUpdate = req.body;
    let profileImg = "";
    // check if profileImg also in file
    // console.log(req.files);
    if (req.files && req.files.profileImg && req.files.profileImg.length > 0) {
      const profileImage = req.files.profileImg[0];
      const profileImageUploaded = await uploadToS3(profileImage);
      profileImg = profileImageUploaded.Location;
    }

    //
    // console.log(dataToUpdate);
    const updatedEmployee = profileImg
      ? await Employee.findByIdAndUpdate(
          employeeid,
          { $set: { ...req.body, profileImg } },
          { new: true }
        ).select("-accessToken -refreshToken")
      : await Employee.findByIdAndUpdate(
          employeeid,
          { $set: req.body },
          { new: true }
        ).select("-accessToken -refreshToken");

    return Response.success(
      res,
      updatedEmployee,
      200,
      "Employee updated successfully !"
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

module.exports = { updateEmployeeById };
