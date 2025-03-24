const User = require("../../models/common/user.model.js");
const HealthTracker = require("../../models/patient/healthTracker/healthTracker.model.js");

const Response = require("../../utils/Response.js");
const AppConstant = require("../../utils/AppConstant.js");
const EMR = require("../../models/common/emr.model.js");

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

module.exports = {
  getAppUserDetails,
};
