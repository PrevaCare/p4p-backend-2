const mongoose = require("mongoose");
const Employee = require("../../../models/patient/employee/employee.model");
const EMR = require("../models/../../../models/common/emr.model");
const HealthScore = require("../../../models/patient/healthScore/healthScore.model");
const PatientBmi = require("../../../models/patient/healthTracker/bmi/patientBmi.model");
const PatientBp = require("../../../models/patient/healthTracker/bp/patientBp.model");
const PatientWaterIntake = require("../../../models/patient/healthTracker/waterIntake/patientWaterIntake.model");
const PatientMood = require("../../../models/patient/healthTracker/mood/patientMood.model");
const PatientBloodGlucose = require("../../../models/patient/healthTracker/bloodGlucose/bloodGlucose.model");
const PatientSleep = require("../../../models/patient/healthTracker/sleep/patientSleep.model");
const Response = require("../../../utils/Response");
const AppConstant = require("../../../utils/AppConstant");

const corporateDashboardTable = async (req, res) => {
  try {
    const { corporateId, limit = 10 } = req.body;
    console.log("Corporate ID:", corporateId);
    console.log("Limit:", limit);
    console.log("Request Body:", req.body);

    // Validate required fields
    if (!corporateId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Corporate Id is missing!"
      );
    }

    // Calculate date 7 days ago for health metrics lookup
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    console.log("Looking for records after date:", oneWeekAgo);

    // Debug the database for a specific user
    const debugUserId = "6745972f0ad688f88d0d8704";

    // Check if BMI records exist for this user
    const bmiTest = await PatientBmi.find({
      patientId: new mongoose.Types.ObjectId(debugUserId),
    }).sort({ date: -1 });
    console.log("BMI Test Records found:", bmiTest.length);
    if (bmiTest.length > 0) {
      console.log("Sample BMI record:", bmiTest[0]);
    }

    // Get collection names from Mongoose models
    console.log("Collection names from models:");
    console.log("PatientBmi collection:", PatientBmi.collection.name);
    console.log("PatientBp collection:", PatientBp.collection.name);
    console.log(
      "PatientWaterIntake collection:",
      PatientWaterIntake.collection.name
    );
    console.log("PatientMood collection:", PatientMood.collection.name);
    console.log(
      "PatientBloodGlucose collection:",
      PatientBloodGlucose.collection.name
    );
    console.log("PatientSleep collection:", PatientSleep.collection.name);

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
