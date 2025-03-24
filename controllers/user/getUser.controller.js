const User = require("../../models/common/user.model.js");
const Response = require("../../utils/Response.js");
const AppConstant = require("../../utils/AppConstant.js");

const getUserById = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId).select(
      "-password -accessToken -refressToken"
    );
    if (!user) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation failed !"
      );
    }

    // below code should be replaced by middleware
    if (user.role.includes("superadmin", "Doctor")) {
      return Response.error(
        res,
        403,
        AppConstant.FAILED,
        error.message || "You don't have permission to acess !"
      );
    }
    return Response.success(res, user, 200, "User found with given id !");
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
  getUserById,
};
