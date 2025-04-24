const User = require("../../models/common/user.model.js");
const Employee = require("../../models/patient/employee/employee.model.js");
const IndividualUser = require("../../models/individualUser/induvidualUser.model.js");
const Corporate = require("../../models/corporates/corporate.model.js");
const Response = require("../../utils/Response.js");
const AppConstant = require("../../utils/AppConstant.js");
const mongoose = require("mongoose");
const CryptoJS = require("crypto-js");
const { uploadToS3 } = require("../../middlewares/uploads/awsConfig.js");

/**
 * Controller to change user type between Employee and IndividualUser
 * If changing from IndividualUser to Employee, requires corporate and department
 * If changing from Employee to IndividualUser, removes corporate related fields
 */
const changeUserType = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId, newRole, corporate, department, jobProfile } = req.body;

    // Validate request
    if (!userId || !newRole) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "userId and newRole are required!"
      );
    }

    // Check if newRole is valid (only Employee or IndividualUser allowed)
    if (newRole !== "Employee" && newRole !== "IndividualUser") {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "newRole must be either 'Employee' or 'IndividualUser'"
      );
    }

    // Find user by id
    const existingUser = await User.findById(userId).session(session);
    if (!existingUser) {
      await session.abortTransaction();
      return Response.error(res, 404, AppConstant.FAILED, "User not found!");
    }

    // Check current role - can only convert between Employee and IndividualUser
    if (
      existingUser.role !== "Employee" &&
      existingUser.role !== "IndividualUser"
    ) {
      await session.abortTransaction();
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        `Cannot change user type from ${existingUser.role} to ${newRole}`
      );
    }

    // Check if newRole is the same as current role
    if (existingUser.role === newRole) {
      await session.abortTransaction();
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        `User is already a ${newRole}`
      );
    }

    // Get user's details from their current model
    let userDetails;
    if (existingUser.role === "Employee") {
      userDetails = await Employee.findById(userId).session(session);
    } else {
      userDetails = await IndividualUser.findById(userId).session(session);
    }

    if (!userDetails) {
      await session.abortTransaction();
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        `User details not found for role ${existingUser.role}`
      );
    }

    // Create new user instance based on new role
    let newUserData = {
      email: existingUser.email,
      phone: existingUser.phone,
      password: existingUser.password,
      role: newRole,
      accessToken: existingUser.accessToken,
      refreshToken: existingUser.refreshToken,
      profileImg: userDetails.profileImg,
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      gender: userDetails.gender,
      address: userDetails.address,
      isMarried: userDetails.isMarried || false,
      age: userDetails.age || 0,
      weight: userDetails.weight || 0,
      assignedDoctors: userDetails.assignedDoctors || [],
    };

    // Handle role-specific changes
    if (newRole === "Employee") {
      // Converting from IndividualUser to Employee
      if (!corporate) {
        await session.abortTransaction();
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "corporate ID is required when converting to Employee"
        );
      }

      if (!department) {
        await session.abortTransaction();
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "department is required when converting to Employee"
        );
      }

      // Validate corporate exists
      const corporateExists = await Corporate.findById(corporate).session(
        session
      );
      if (!corporateExists) {
        await session.abortTransaction();
        return Response.error(
          res,
          404,
          AppConstant.FAILED,
          "Corporate not found"
        );
      }

      // Add Employee-specific fields
      newUserData.corporate = corporate;
      newUserData.department = department;
      newUserData.jobProfile =
        jobProfile || userDetails.jobProfile || "Not specified";
    }

    // Delete old user data
    if (existingUser.role === "Employee") {
      await Employee.findByIdAndDelete(userId).session(session);
    } else {
      await IndividualUser.findByIdAndDelete(userId).session(session);
    }

    // Create new user with converted role
    let newUser;
    if (newRole === "Employee") {
      newUser = new Employee(newUserData);
    } else {
      newUser = new IndividualUser(newUserData);
    }

    // Save new user
    await newUser.save({ session });

    // Commit transaction
    await session.commitTransaction();

    return Response.success(
      res,
      {
        _id: newUser._id,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
      200,
      `User successfully converted from ${existingUser.role} to ${newRole}`
    );
  } catch (err) {
    // Abort transaction on error
    await session.abortTransaction();
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  } finally {
    session.endSession();
  }
};

module.exports = { changeUserType };
