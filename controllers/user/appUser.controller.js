const User = require("../../models/common/user.model.js");
const HealthTracker = require("../../models/patient/healthTracker/healthTracker.model.js");

const Response = require("../../utils/Response.js");
const AppConstant = require("../../utils/AppConstant.js");
const EMR = require("../../models/common/emr.model.js");
const UserPlansBalance = require("../../models/corporates/individualPlan.model");
const { uploadToS3 } = require("../../middlewares/uploads/awsConfig.js");

const getAppUserDetails = async (req, res) => {
  try {
    const { _id } = req.user;

    const user = await User.findById(_id)
      .select("-password -accessToken -refreshToken")
      .populate({
        path: "assignedDoctors",
        select: "firstName lastName profileImg specialization",
      });
    if (!user) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation failed !"
      );
    }
    const userEMRDetail = await EMR.findOne(
      {
        user: _id,
      },
      "generalPhysicalExamination.BP generalPhysicalExamination.PR generalPhysicalExamination.SPO2 generalPhysicalExamination.height"
    ).sort({ createdAt: -1 });
    // const userEMRDetailsLen = userEMRDetails.length;
    // const userEMRDetail = userEMRDetails[userEMRDetailsLen - 1].toObject();
    // const plainUser = user.toObject();

    // health tracker data
    const today = new Date();
    const startDate = new Date(today);
    const endDate = new Date(today);

    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(59, 59, 59, 59);

    const healthTrackerData = await HealthTracker.findOne({
      user: req.user._id,
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    }).select("-user");
    const responseData = {
      userDetails: user || null,
      emrDetails: userEMRDetail || null,
      healthTracker: healthTrackerData ? healthTrackerData : null,
    };
    // below code should be replaced by middleware
    // if (user.role.includes("superadmin", "Doctor")) {
    //   return Response.error(
    //     res,
    //     403,
    //     AppConstant.FAILED,
    //     error.message || "You don't have permission to acess !"
    //   );
    // }
    return Response.success(
      res,
      responseData,
      200,
      "User found with given id !"
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

const getUserPlans = async (req, res) => {
  try {
    const userPlan = await UserPlansBalance.findOne({
      userId: req.user._id,
    });

    console.log({userPlan, user: req.user})
  
    const servicePlans = userPlan?.activeCountFeatures
      ?.filter(f => f.totalRemaining > 0 && new Date(f.expiresAt) > new Date()) // Filter out expired plans and those with no remaining units
      .map(f => ({
        service: f.featureName,
        type: f.type,
        totalAllowed: f.totalAllowed,
        totalUsed: f.totalUsed,
        totalRemaining: f.totalRemaining,
        expiredAt: f.expiresAt,
        planType: f.planType,
      }));
  
    return res.json({
      data: servicePlans,
      total: servicePlans?.length
    })
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error!'})
  }
};

const updateUserDetails = async (req, res) => {
  try {
  const { firstName, lastName, gender, age, weight, height, addressName, jobProfile, isMarried } = req.body;
  const userId = req.user._id
  const UserModel = req.user.role === 'Employee' ? require('../../models/patient/employee/employee.model.js') : require('../../models/individualUser/induvidualUser.model.js');

  const user = await UserModel.findById(userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found!' });
  }

  const files = req.files.profileImg

  let profileImgUrl = ""

  if (files && files?.length > 0) {
    try {
      const uploadedFile = await uploadToS3(files[0]);
      profileImgUrl = uploadedFile?.Location
    } catch (err) {
      return res.status(404).json({ message: 'Error occured in profile image processing'})
    }
  }

  if (addressName && user.address) user.address.name = addressName;
  if (street && user.address) user.address.street = street;
  if (city && user.address) user.address.city = city;
  if (state && user.address) user.address.state = state;
  if (zipCode && user.address) user.address.zipCode = zipCode;

  // Update other user details if provided
  if (profileImgUrl) user.profileImg = profileImgUrl;
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (gender) user.gender = gender;
  if (age) user.age = age;
  if (weight) user.weight = weight;
  if (height) user.height = height;
  if (jobProfile) user.jobProfile = jobProfile;
  if (isMarried) user.isMarried = !!isMarried;

   // Save the updated user details
   const updatedUser = await user.save();

   return res.status(200).json({
     message: 'User details updated successfully!',
     data: updatedUser,
   });
  } catch (err) {
    console.log({err})
    return res.status(500).json({ message: 'Internal server error!'})
  }
}

module.exports = {
  getAppUserDetails,
  getUserPlans,
  updateUserDetails
};
