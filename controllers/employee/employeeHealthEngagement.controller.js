const mongoose = require("mongoose");
const AppConstant = require("../../utils/AppConstant");
const Response = require("../../utils/Response");
const Employee = require("../../models/patient/employee/employee.model");
const PatientBmi = require("../../models/patient/healthTracker/bmi/patientBmi.model");
const PatientBp = require("../../models/patient/healthTracker/bp/patientBp.model");
const PatientWaterIntake = require("../../models/patient/healthTracker/waterIntake/patientWaterIntake.model");
const PatientMood = require("../../models/patient/healthTracker/mood/patientMood.model");
const PatientBloodGlucose = require("../../models/patient/healthTracker/bloodGlucose/bloodGlucose.model");
const PatientSleep = require("../../models/patient/healthTracker/sleep/patientSleep.model");

/**
 * Get health engagement metrics for a specific employee/user
 * @route GET /api/user/health-engagement
 */
const getUserHealthEngagement = async (req, res) => {
  try {
    const { employeeId } = req.body;

    // Validate required fields
    if (!employeeId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Employee ID is required"
      );
    }

    // Calculate date 7 days ago for health metrics lookup
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return Response.error(res, 404, AppConstant.FAILED, "Employee not found");
    }

    // Aggregate user's health data
    const userHealthData = await Employee.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(employeeId) },
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
        $lookup: {
          from: "patientbmis", // Collection name for PatientBmi
          let: { employeeId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$patientId", { $toObjectId: "$$employeeId" }],
                },
              },
            },
            { $sort: { date: -1 } }, // Sort by most recent
            { $limit: 7 }, // Last 7 records max
            {
              $project: {
                _id: 0,
                bmi: 1,
                date: 1,
                bmiGoal: 1,
              },
            },
          ],
          as: "bmiRecords",
        },
      },
      {
        $lookup: {
          from: "patientbps",
          let: { employeeId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$patientId", { $toObjectId: "$$employeeId" }],
                },
              },
            },
            { $sort: { date: -1 } },
            { $limit: 7 },
            {
              $project: {
                _id: 0,
                systolic: 1,
                diastolic: 1,
                date: 1,
              },
            },
          ],
          as: "bpRecords",
        },
      },
      {
        $lookup: {
          from: "patientwaterintakes",
          let: { employeeId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$patientId", { $toObjectId: "$$employeeId" }],
                },
              },
            },
            { $sort: { date: -1 } },
            { $limit: 7 },
            {
              $project: {
                _id: 0,
                quantity: 1,
                date: 1,
              },
            },
          ],
          as: "waterIntakeRecords",
        },
      },
      {
        $lookup: {
          from: "patientmoods",
          let: { employeeId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$patientId", { $toObjectId: "$$employeeId" }],
                },
              },
            },
            { $sort: { date: -1 } },
            { $limit: 7 },
            {
              $project: {
                _id: 0,
                mood: 1,
                date: 1,
              },
            },
          ],
          as: "moodRecords",
        },
      },
      {
        $lookup: {
          from: "patientbloodglucoses",
          let: { employeeId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$patientId", { $toObjectId: "$$employeeId" }],
                },
              },
            },
            { $sort: { date: -1 } },
            { $limit: 7 },
            {
              $project: {
                _id: 0,
                bloodGlucoseLevel: 1,
                date: 1,
              },
            },
          ],
          as: "bloodGlucoseRecords",
        },
      },
      {
        $lookup: {
          from: "patientsleeps",
          let: { employeeId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$patientId", { $toObjectId: "$$employeeId" }],
                },
              },
            },
            { $sort: { date: -1 } },
            { $limit: 7 },
            {
              $project: {
                _id: 0,
                duration: 1,
                date: 1,
              },
            },
          ],
          as: "sleepRecords",
        },
      },
      {
        $addFields: {
          bmiUsageDaysCount: {
            $size: {
              $setUnion: {
                $map: {
                  input: {
                    $filter: {
                      input: "$bmiRecords",
                      as: "record",
                      cond: { $gte: ["$$record.date", oneWeekAgo] },
                    },
                  },
                  as: "record",
                  in: {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$$record.date",
                    },
                  },
                },
              },
            },
          },
          bpUsageDaysCount: {
            $size: {
              $setUnion: {
                $map: {
                  input: {
                    $filter: {
                      input: "$bpRecords",
                      as: "record",
                      cond: { $gte: ["$$record.date", oneWeekAgo] },
                    },
                  },
                  as: "record",
                  in: {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$$record.date",
                    },
                  },
                },
              },
            },
          },
          waterIntakeUsageDaysCount: {
            $size: {
              $setUnion: {
                $map: {
                  input: {
                    $filter: {
                      input: "$waterIntakeRecords",
                      as: "record",
                      cond: { $gte: ["$$record.date", oneWeekAgo] },
                    },
                  },
                  as: "record",
                  in: {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$$record.date",
                    },
                  },
                },
              },
            },
          },
          moodUsageDaysCount: {
            $size: {
              $setUnion: {
                $map: {
                  input: {
                    $filter: {
                      input: "$moodRecords",
                      as: "record",
                      cond: { $gte: ["$$record.date", oneWeekAgo] },
                    },
                  },
                  as: "record",
                  in: {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$$record.date",
                    },
                  },
                },
              },
            },
          },
          bloodGlucoseUsageDaysCount: {
            $size: {
              $setUnion: {
                $map: {
                  input: {
                    $filter: {
                      input: "$bloodGlucoseRecords",
                      as: "record",
                      cond: { $gte: ["$$record.date", oneWeekAgo] },
                    },
                  },
                  as: "record",
                  in: {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$$record.date",
                    },
                  },
                },
              },
            },
          },
          sleepUsageDaysCount: {
            $size: {
              $setUnion: {
                $map: {
                  input: {
                    $filter: {
                      input: "$sleepRecords",
                      as: "record",
                      cond: { $gte: ["$$record.date", oneWeekAgo] },
                    },
                  },
                  as: "record",
                  in: {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$$record.date",
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          employeeId: "$_id",
          firstName: 1,
          lastName: 1,
          profileImg: 1,
          age: 1,
          gender: 1,
          email: 1,
          phone: 1,
          emrGenerationDate: {
            $arrayElemAt: ["$latestEMR.createdAt", 0],
          },
          overallHealthScore: {
            $arrayElemAt: ["$latestHealthScore.overallHealthScore", 0],
          },
          bmiUsageDaysCount: 1,
          bmiRecords: 1,
          bpUsageDaysCount: 1,
          bpRecords: 1,
          waterIntakeUsageDaysCount: 1,
          waterIntakeRecords: 1,
          moodUsageDaysCount: 1,
          moodRecords: 1,
          bloodGlucoseUsageDaysCount: 1,
          bloodGlucoseRecords: 1,
          sleepUsageDaysCount: 1,
          sleepRecords: 1,
          // Calculate overall engagement score (0-7) based on days of usage
          overallEngagementScore: {
            $min: [
              7,
              {
                $sum: [
                  "$bmiUsageDaysCount",
                  "$bpUsageDaysCount",
                  "$waterIntakeUsageDaysCount",
                  "$moodUsageDaysCount",
                  "$bloodGlucoseUsageDaysCount",
                  "$sleepUsageDaysCount",
                ],
              },
            ],
          },
        },
      },
    ]);

    if (userHealthData.length === 0) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "No health data found for this employee"
      );
    }

    return Response.success(
      res,
      userHealthData[0],
      200,
      "User health engagement data retrieved successfully"
    );
  } catch (err) {
    console.error("Error in getUserHealthEngagement:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

module.exports = { getUserHealthEngagement };
