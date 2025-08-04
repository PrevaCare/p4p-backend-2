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

    const servicePlans = userPlan?.activeCountFeatures
      ?.filter(f => f.totalRemaining > 0 && new Date(f.expiresAt) > new Date()) // Filter out expired plans and those with no remaining units
      .reduce((acc, f) => {
        // Find if the service already exists in the accumulator
        const existingService = acc.find(service => service.service === f.featureName);

        if (existingService) {
          // If the service already exists, merge the counts
          existingService.totalAllowed += f.totalAllowed;
          existingService.totalUsed += f.totalUsed;
          existingService.totalRemaining += f.totalRemaining;
        } else {
          // If the service does not exist, add it to the accumulator
          acc.push({
            service: f.featureName,
            type: f.type,
            totalAllowed: f.totalAllowed,
            totalUsed: f.totalUsed,
            totalRemaining: f.totalRemaining
          });
        }

        return acc;
      }, []); // Initialize accumulator as an empty array
  
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
  const { firstName, lastName, email, gender, age, weight, height, addressName, street, state, city, pincode, jobProfile, isMarried } = req.body;
  const userId = req.user._id
  const UserModel = req.user.role === 'Employee' ? require('../../models/patient/employee/employee.model.js') : require('../../models/individualUser/induvidualUser.model.js');

  const user = await UserModel.findById(userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found!' });
  }

  if (email) {
    const emailUser = await User.findOne({ email })

    if (emailUser && user.email !== emailUser?.email) {
      return Response.error(res, 400, "Failure", 'User already exists with this email')
    }
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

  let changesMade = false;

  if (addressName && user.address?.name !== addressName) {
    user.address.name = addressName;
    changesMade = true;
  }
  if (street && user.address?.street !== street) {
    user.address.street = street;
    changesMade = true;
  }
  if (city && user.address?.city !== city) {
    user.address.city = city;
    changesMade = true;
  }
  if (state && user.address?.state !== state) {
    user.address.state = state;
    changesMade = true;
  }
  if (pincode && user.address?.pincode !== pincode) {
    user.address.pincode = pincode;
    changesMade = true;
  }

  // Update other fields only if they have changed
  if (profileImgUrl && user.profileImg !== profileImgUrl) {
    user.profileImg = profileImgUrl;
    changesMade = true;
  }
  if (email && user.email !== email) {
    user.email = email;
    changesMade = true;
  }
  if (firstName && user.firstName !== firstName) {
    user.firstName = firstName;
    changesMade = true;
  }
  if (lastName && user.lastName !== lastName) {
    user.lastName = lastName;
    changesMade = true;
  }
  if (gender && user.gender !== gender) {
    user.gender = gender;
    changesMade = true;
  }
  if (age && user.age !== age) {
    user.age = age;
    changesMade = true;
  }
  if (weight && user.weight !== weight) {
    user.weight = weight;
    changesMade = true;
  }
  if (height && user.height !== height) {
    user.height = height;
    changesMade = true;
  }
  if (jobProfile && user.jobProfile !== jobProfile) {
    user.jobProfile = jobProfile;
    changesMade = true;
  }
  if (isMarried && user.isMarried !== !!isMarried) {
    user.isMarried = !!isMarried;
    changesMade = true;
  }

  if (!changesMade) {
    return Response.error(
      res,
      400,
      AppConstant.FAILED,
      "No changes were made to the user details"
    );
  }

   // Save the updated user details
   const updatedUser = await user.save();

   const { accessToken, refreshToken, password, ...rest} = updatedUser.toObject()

   return res.status(200).json({
     message: 'User details updated successfully!',
     data: rest,
   });
  } catch (err) {
    console.log({err})
    return res.status(500).json({ message: 'Internal server error!'})
  }
}

const getUserPackages = async (req, res) => {
  try {
    const userPlans = await UserPlansBalance.findOne({
      userId: req.user._id,
    });

    // Iterate through all the user plans and fetch the details of active count features
    const servicePlans = userPlans?.activeCountFeatures
      ?.filter(f => f.totalRemaining > 0 && new Date(f.expiresAt) > new Date()) // Filter out expired plans and those with no remaining units
      .map(f => ({
        service: f.featureName,
        type: f.type,
        totalAllowed: f.totalAllowed,
        totalUsed: f.totalUsed,
        totalRemaining: f.totalRemaining,
        expiredAt: f.expiresAt, // Expiry date of the plan
        planType: f.planType, // Plan type (e.g., Basic, Premium, etc.)
      }));

    return res.json({
      data: servicePlans,
      total: servicePlans?.length || 0
    });
  } catch (err) {
    console.error("Error fetching user packages:", err);
    return res.status(500).json({ message: 'Internal server error!' });
  }
};

module.exports = {
  getAppUserDetails,
  getUserPlans,
  updateUserDetails,
  getUserPackages
};
