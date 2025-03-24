const Employee = require("../../../models/patient/employee/employee.model.js");
const Response = require("../../../utils/Response.js");
const AppConstant = require("../../../utils/AppConstant.js");
const mongoose = require("mongoose");
const User = require("../../../models/common/user.model.js");
// get all corporates
// const getAllCorporateEmployees = async (req, res) => {
//   try {
//     const corporateEmployees = await Employee.find(
//       {},
//       "profileImg firstName lastName department address jobProfile"
//     )
//       .populate({ path: "corporate", select: "companyName" })
//       .populate({
//         path: "assignedDoctors",
//         select: "firstName lastName",
//       });
//     // console.log(corporateEmployees);
//     if (!corporateEmployees) {
//       return Response.error(
//         res,
//         404,
//         AppConstant.FAILED,
//         "Corporate Employees  not found !"
//       );
//     }
//     return Response.success(res, corporateEmployees, 200, AppConstant.SUCCESS);
//   } catch (err) {
//     return Response.error(
//       res,
//       500,
//       AppConstant.FAILED,
//       err.message || "Internal server error !"
//     );
//   }
// };

// get all corporate in which doctor assigned too
// const getEmployeesByAssignedDoctor = async (req, res) => {
//   try {
//     const doctor = req.user;
//     const doctorId = doctor._id;
//     const corporateEmployees = await Employee.find(
//       {},
//       "profileImg firstName lastName department address jobProfile assignedDoctors"
//     );
//     console.log(corporateEmployees);

//     if (!corporateEmployees) {
//       return Response.error(
//         res,
//         404,
//         AppConstant.FAILED,
//         "Corporate Employees not found !"
//       );
//     }
//     const assignedDoctorEmployeesList = corporateEmployees.filter((employee) =>
//       employee.assignedDoctors.some((ad) => {
//         // console.log(ad.toString());
//         // console.log(doctorId);
//         return ad.toString() === doctorId;
//       })
//     );
//     return Response.success(
//       res,
//       assignedDoctorEmployeesList,
//       200,
//       AppConstant.SUCCESS
//     );
//   } catch (err) {
//     return Response.error(
//       res,
//       500,
//       AppConstant.FAILED,
//       err.message || "Internal server error !"
//     );
//   }
// };
// const getEmployeesByAssignedDoctor = async (req, res) => {
//   try {
//     const { _id, role } = req.user;
//     // const doctorId = _id;
//     // const demo = await Employee.find({});
//     // console.log(demo);
//     const corporateEmployees =
//       role === "Doctor"
//         ? await Employee.find(
//             { assignedDoctors: _id },
//             "profileImg firstName lastName department address jobProfile gender"
//           ).populate({ path: "corporate", select: "companyName" })
//         : await Employee.find(
//             {},
//             "profileImg firstName lastName department address jobProfile gender"
//           ).populate({ path: "corporate", select: "companyName" });
//     // console.log(corporateEmployees);

//     if (!corporateEmployees) {
//       return Response.error(
//         res,
//         404,
//         AppConstant.FAILED,
//         "Corporate Employees not found !"
//       );
//     }

//     return Response.success(res, corporateEmployees, 200, AppConstant.SUCCESS);
//   } catch (err) {
//     return Response.error(
//       res,
//       500,
//       AppConstant.FAILED,
//       err.message || "Internal server error !"
//     );
//   }
// };
const getSingleEmployeesDetailById = async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "EmployeeId not found !"
      );
    }
    const corporateEmployee = await Employee.findOne({
      _id: employeeId,
    })
      .populate({ path: "corporate", select: "companyName" })
      .populate({
        path: "assignedDoctors",
        select: "firstName lastName address",
      })
      .select(
        "-password -accessToken -refreshToken -activityLevel -isSmoke -isDrink -sleepHours -cronicDiseases -currentMedication -allergicSubstance"
      );
    // console.log(corporateEmployee);

    if (!corporateEmployee) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Corporate Employee not found !"
      );
    }

    return Response.success(res, corporateEmployee, 200, AppConstant.SUCCESS);
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
  getSingleEmployeesDetailById,
};
