const mongoose = require("mongoose");
const Employee = require("../../../models/patient/employee/employee.model");
const EMR = require("../models/../../../models/common/emr.model");
const HealthScore = require("../../../models/patient/healthScore/healthScore.model");
const Response = require("../../../utils/Response");
const AppConstant = require("../../../utils/AppConstant");

const corporateDashboardTable = async (req, res) => {
  try {
    const { corporateId, limit = 10 } = req.body;

    // Validate required fields
    if (!corporateId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Corporate Id is missing!"
      );
    }

    // Aggregate data
    const employees = await Employee.aggregate([
      {
        $match: { corporate: new mongoose.Types.ObjectId(corporateId) },
      },
      {
        $lookup: {
          from: "emrs", // Collection name for EMR
          let: { employeeId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$user", "$$employeeId"] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { _id: 0, createdAt: 1 } },
          ],
          as: "latestEMR",
        },
      },
      {
        $lookup: {
          from: "healthscores", // Collection name for HealthScore
          let: { employeeId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$user", "$$employeeId"] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            { $project: { _id: 0, overallHealthScore: 1 } },
          ],
          as: "latestHealthScore",
        },
      },
      {
        $project: {
          _id: 0,
          firstName: 1,
          lastName: 1,
          profileImg: 1,
          age: 1,
          gender: 1,
          emrGenerationDate: {
            $arrayElemAt: ["$latestEMR.createdAt", 0],
          },
          overallHealthScore: {
            $arrayElemAt: ["$latestHealthScore.overallHealthScore", 0],
          },
        },
      },
      { $sort: { overallHealthScore: -1 } },
      { $limit: parseInt(limit, 10) },
    ]);

    // Send response
    return Response.success(res, employees, 200, AppConstant.SUCCESS);
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

module.exports = { corporateDashboardTable };
