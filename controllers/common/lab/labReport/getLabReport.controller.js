const User = require("../../../../models/common/user.model");
const Employee = require("../../../../models/patient/employee/employee.model");
const LabReport = require("../../../../models/lab/labReport/labReport.model");
const ExistingPatientLabReport = require("../../../../models/lab/labReport/ExistingPatientLabReport.model");
const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");

// get both lab report our + existing user lab report
// const getBothLabReportOfAllUsers = async (req, res) => {
//   try {

//     const ourLabReport = await LabReport.find(
//       {},
//       "testName labName labReportFile createdAt"
//     ).populate({
//       path: "user",
//       select: "profileImg firstName lastName",
//     });

//     const existingLabReportOfUser = await ExistingPatientLabReport.find(
//       {},
//       "testName labName labReportFile createdAt"
//     ).populate({
//       path: "user",
//       select: "profileImg firstName lastName",
//     });
//     const responseLabReports = [...ourLabReport, ...existingLabReportOfUser];

//     return Response.success(
//       res,
//       responseLabReports,
//       200,
//       "Both lab reports found successfully !"
//     );
//   } catch (err) {
//     return Response.error(
//       res,
//       500,
//       AppConstant.FAILED,
//       err.message || "Internal server failed !"
//     );
//   }
// };

const getBothLabReportOfAllUsers = async (req, res) => {
  try {
    const userRole = req.user.role; // Assume the user's role is stored in req.user.role
    let ourLabReport = [];
    let existingLabReportOfUser = [];

    if (userRole === "Superadmin" || userRole === "Doctor") {
      // Return all reports for superadmin and doctor
      ourLabReport = await LabReport.find(
        {},
        "testName labReportFile createdAt"
      )
        .populate({
          path: "user",
          select: "profileImg firstName lastName",
        })
        .populate({
          path: "lab",
          select: "labName",
        });

      existingLabReportOfUser = await ExistingPatientLabReport.find(
        {},
        "testName labName labReportFile createdAt"
      ).populate({
        path: "user",
        select: "profileImg firstName lastName",
      });
    } else if (userRole === "Corporate") {
      // Filter reports for corporate users
      const corporateId = req.user._id; // Assume corporate ID is stored in req.user.corporateId

      // Get users or employees associated with this corporate
      const employees = await Employee.find({ corporate: corporateId }, "_id");

      const employeeIds = employees.map((employee) => employee._id);

      ourLabReport = await LabReport.find(
        { user: { $in: employeeIds } },
        "testName labReportFile createdAt"
      )
        .populate({
          path: "user",
          select: "profileImg firstName lastName",
        })
        .populate({
          path: "lab",
          select: "labName",
        });

      existingLabReportOfUser = await ExistingPatientLabReport.find(
        { user: { $in: employeeIds } },
        "testName labName labReportFile createdAt"
      ).populate({
        path: "user",
        select: "profileImg firstName lastName",
      });
    }
    // make our lab report same way as others--> basically labName
    const formatOurLabReport = ourLabReport.map((item) => {
      const { lab, ...rest } = item._doc;
      return {
        ...rest,
        labName: lab.labName,
      };
    });

    const responseLabReports = [
      ...formatOurLabReport,
      ...existingLabReportOfUser,
    ];

    if (responseLabReports?.length <= 0) {
      return Response.success(
        res,
        responseLabReports,
        404,
        "No Lab Reports found!"
      );
    }

    return Response.success(
      res,
      responseLabReports,
      200,
      "Both lab reports found successfully!"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

// get all lab report from p4p
const getAllLabReportFromP4p = async (req, res) => {
  try {
    const allLabReports = await LabReport.find({}, "")
      .populate({
        path: "lab",
        select: "labName",
      })
      .select(
        "-user -doctor -category -subCategory -testName -desc -labReportFile -documentType -price"
      );

    return Response.success(
      res,
      allLabReports,
      200,
      "all P4p lab reports found successfully!"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

module.exports = {
  getBothLabReportOfAllUsers,
  getAllLabReportFromP4p,
};
