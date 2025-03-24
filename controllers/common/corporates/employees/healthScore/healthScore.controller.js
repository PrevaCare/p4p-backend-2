const HealthScore = require("../../../../../models/patient/healthScore/healthScore.model");
const Employee = require("../../../../../models/patient/employee/employee.model");
const Response = require("../../../../../utils/Response"); // Assuming this is your custom response handler
const AppConstant = require("../../../../../utils/AppConstant"); // Assuming this holds your success/failure constants
const mongoose = require("mongoose");
const {
  healthScoreValidation,
} = require("../../../../../validators/patient/employees/healthScore/healthScore.validator");

const createOrUpdateAndScore = async (req, res) => {
  try {
    // const { userId } = req.params;

    const { error } = healthScoreValidation.validate(req.body);
    if (error) {
      console.log("yes validation");
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation error !"
      );
    }
    // console.log("yes reached");
    // Check if a HealthScore entry for the user already exists
    let healthScore = await HealthScore.findOne({ user: req.body.user });

    if (healthScore) {
      // If exists, update the HealthScore entry
      healthScore = await HealthScore.findOneAndUpdate(
        { user: req.body.user },
        { $set: { ...req.body } },
        { new: true, runValidators: true }
      );
    } else {
      // Otherwise, create a new HealthScore entry
      healthScore = new HealthScore({
        user: req.body.user,
        ...req.body,
      });
      await healthScore.save();
    }

    // const responseData = {
    //   healthScore,
    // };

    return Response.success(
      res,
      null,
      200,
      AppConstant.SUCCESS,
      "HealthScore  updated  successfully !"
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

// get corporateScore

const getCorporateScoreByCalculatingEachEmployees = async (req, res) => {
  try {
    const { _id: corporateId } = req.user; // Corporate's ID from the authenticated user
    const corporateObjectId = new mongoose.Types.ObjectId(corporateId);

    // Step 1: Total employee count for the corporate
    const totalEmployeeCount = await Employee.countDocuments({
      corporate: corporateId,
    });

    // Step 2: BMI and PR out of range, and health checks (health score) aggregation
    const aggregationResults = await Employee.aggregate([
      // Match employees belonging to the corporate
      { $match: { corporate: corporateObjectId } },

      // Left join with health scores (if available)
      {
        $lookup: {
          from: "healthscores", // health score collection name
          localField: "_id",
          foreignField: "user",
          as: "healthScore",
        },
      },

      // Unwind the healthScore array (if no healthScore, it'll be null)
      { $unwind: { path: "$healthScore", preserveNullAndEmptyArrays: true } },

      // Project fields to calculate BMI, PR, and check if health score exists
      {
        $project: {
          BMI: "$healthScore.heartScore.BMI",
          PR: "$healthScore.heartScore.PR",
          overallHealthScore: "$healthScore.overallHealthScore",
          hasHealthScore: {
            $cond: {
              if: { $gt: [{ $type: "$healthScore" }, "missing"] },
              then: true,
              else: false,
            },
          },
        },
      },

      // Group and count based on conditions
      {
        $group: {
          _id: null,
          totalOutOfBMIRange: {
            $sum: {
              $cond: [
                {
                  $or: [{ $lt: ["$BMI", 18.5] }, { $gt: ["$BMI", 24.9] }],
                },
                1,
                0,
              ],
            },
          },
          totalOutOfPRRange: {
            $sum: {
              $cond: [
                {
                  $or: [{ $lt: ["$PR", 60] }, { $gt: ["$PR", 100] }],
                },
                1,
                0,
              ],
            },
          },
          fitEmployees: {
            $sum: {
              $cond: [
                {
                  $gt: ["$overallHealthScore", 80],
                },
                1,
                0,
              ],
            },
          },
          overallhealthScoreOfCorporate: {
            $sum: {
              $cond: [
                {
                  $ne: ["$overallHealthScore", null],
                },
                "$overallHealthScore", // Add the score if it exists
                0, // Otherwise, add 0
              ],
            },
          },
          totalHealthCheckDone: {
            $sum: {
              $cond: [{ $eq: ["$hasHealthScore", true] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Extract aggregation results

    const {
      totalOutOfBMIRange = 0,
      totalOutOfPRRange = 0,
      fitEmployees = 0,
      overallhealthScoreOfCorporate = 0,
      totalHealthCheckDone = 0,
    } = aggregationResults.length ? aggregationResults[0] : {};

    // in percentage
    const totalOutOfBMIRangePercentage = Math.round(
      (totalOutOfBMIRange * 100) / totalEmployeeCount
    );
    const totalOutOfPRRangePercentage = Math.round(
      (totalOutOfPRRange * 100) / totalEmployeeCount
    );
    const fitEmployeespercentage = Math.round(
      (fitEmployees * 100) / totalEmployeeCount
    );
    const overallhealthScoreOfCorporatePercentage = Math.round(
      overallhealthScoreOfCorporate / totalEmployeeCount
    );

    // Return the response
    return res.status(200).json({
      success: true,
      message: "Dashboard data found successfully!",
      // data: {
      //   totalEmployeeCount,
      //   totalOutOfBMIRange,
      //   totalOutOfPRRange,
      //   fitEmployees,
      //   overallhealthScoreOfCorporate,
      //   totalHealthCheckDone,
      // },
      data: {
        totalEmployeeCount,
        totalOutOfBMIRangePercentage,
        totalOutOfPRRangePercentage,
        fitEmployeespercentage,
        overallhealthScoreOfCorporatePercentage,
        totalHealthCheckDone,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

module.exports = {
  createOrUpdateAndScore,
  getCorporateScoreByCalculatingEachEmployees,
};
