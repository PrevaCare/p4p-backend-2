const School = require("../../../models/schools/school.model.js");
const Response = require("../../../utils/Response.js");
const AppConstant = require("../../../utils/AppConstant.js");

// get all Schools
const getAllSchools = async (req, res) => {
  try {
    const { _id, role } = req.user;

    const schools =
      role === "Doctor"
        ? await School.find({ assignedDoctors: _id }).populate("addresses")
        : await School.find({}).populate("addresses");
    if (!schools) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Schools  not found !"
      );
    }
    return Response.success(res, schools, 200, AppConstant.SUCCESS);
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
  getAllSchools,
};
