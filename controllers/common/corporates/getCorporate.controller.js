const Employee = require("../../../models/patient/employee/employee.model.js");
const Corporate = require("../../../models/corporates/corporate.model.js");

const Response = require("../../../utils/Response.js");
const AppConstant = require("../../../utils/AppConstant.js");
const mongoose = require("mongoose");
const User = require("../../../models/common/user.model.js");

// get all corporate in which doctor assigned to
const getAllCorporates = async (req, res) => {
  try {
    // two people - 1 superadmin, doctor
    // check  if currentUser is doctor if yes then give filter by doctor.
    const { _id, role } = req.user;
    const doctorId = _id;
    // console.log(_id);

    const corporates =
      role === "Doctor"
        ? await Corporate.find(
            {
              assignedDoctors: doctorId,
            },
            "logo gstNumber companyName designation department"
          ).populate({ path: "addresses", select: "city" })
        : await Corporate.find(
            {},
            "logo gstNumber companyName designation department"
          ).populate({ path: "addresses", select: "city" });

    if (!corporates) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Corporates not found !"
      );
    }
    const corporateWithEmployeesCount = await Promise.all(
      corporates.map(async (corporate) => {
        const employeesCount = await Employee.countDocuments({
          corporate: corporate._id,
        });
        return { ...corporate.toObject(), employeesCount };
      })
    );
    // console.log(corporateWithEmployeesCount);

    return Response.success(
      res,
      corporateWithEmployeesCount,
      200,
      AppConstant.SUCCESS
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
const getSingleCorporateById = async (req, res) => {
  try {
    const { _id, role } = req.user;
    const { corporateId } = req.body;
    const doctorId = _id;
    // console.log(_id);

    const corporate =
      role === "Doctor"
        ? await Corporate.findOne(
            {
              assignedDoctors: doctorId,
              _id: corporateId,
            },
            "logo gstNumber companyName designation department email phone"
          ).populate({ path: "addresses" })
        : await Corporate.findOne(
            {
              _id: corporateId,
            },
            "logo gstNumber companyName designation department email phone"
          )
            .populate({ path: "addresses" })
            .populate({
              path: "assignedDoctors",
              select: "firstName lastName address",
            });

    if (!corporate) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Corporate not found !"
      );
    }
    return Response.success(res, corporate, 200, AppConstant.SUCCESS);
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error !"
    );
  }
};

// overall corporate dashboard health score
// const overallCorporateDashboardHealthScore = async (req, res) => {
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
module.exports = {
  getAllCorporates,
  getSingleCorporateById,
};
