const Institute = require("../../../models/institute/institute.model.js");
const Response = require("../../../utils/Response.js");
const AppConstant = require("../../../utils/AppConstant.js");

// get all corporates
const getAllInstitutes = async (req, res) => {
  try {
    const { _id, role } = req.user;

    const institutes =
      role === "Doctor"
        ? await Institute.find({ assignedDoctors: _id }).populate("addresses")
        : await Institute.find({}).populate("addresses");
    if (!institutes) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "institutes not found !"
      );
    }
    return Response.success(res, institutes, 200, AppConstant.SUCCESS);
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
  getAllInstitutes,
};
