const mongoose = require("mongoose");
const Employee = require("../../../models/patient/employee/employee.model");
const Response = require("../../../utils/Response");
const AppConstant = require("../../../utils/AppConstant");
const healthScoreModel = require("../../../models/patient/healthScore/healthScore.model");

const corporateDashboardStressLevelOfYourOrganization = async (req, res) => {
  try {
    const { corporateId } = req.body;

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
            { $project: { _id: 0, "history.stressScreening.score": 1 } },
          ],
          as: "latestEMR",
        },
      },
      {
        $unwind: {
          path: "$latestEMR",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$latestEMR.history.stressScreening.score", // Group by stress score
          groupEmployees: { $sum: 1 },
        },
      },
      {
        $set: {
          groupScore: {
            $multiply: ["$_id", "$groupEmployees"], // Calculate the total score of the group
          },
        },
      },
      {
        $group: {
          _id: null,
          groups: {
            $push: { groupEmployees: "$groupEmployees", score: "$_id" },
          },
          totalGroupScore: { $sum: "$groupScore" }, // Calculate total score across all groups
        },
      },
      {
        $unwind: "$groups",
      },
      {
        $set: {
          stressPercentage: {
            $multiply: [
              { $divide: ["$groups.score", 40] }, // Calculate percentage based on the max possible score (40)
              100,
            ],
          },
        },
      },
      {
        $project: {
          groupEmployees: "$groups.groupEmployees",
          stressPercentage: 1,
          _id: 0,
        },
      },
      { $sort: { stressPercentage: 1 } },
    ]);

    // Send response
    return Response.success(
      res,
      employees,
      200,
      "stress Percentage found !",
      AppConstant.SUCCESS
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

// 10 year ascvd graph
const corporateDashboard10YearASCVDOfYourOrganization = async (req, res) => {
  try {
    const { corporateId } = req.body;

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
    const result = await Employee.aggregate([
      {
        $match: { corporate: new mongoose.Types.ObjectId(corporateId) },
      },
      {
        $lookup: {
          from: "coronaryheartdiseaseassessments", // Collection name for coronary heart disease assessments
          let: { employeeId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$user", "$$employeeId"] } } },
            { $sort: { createdAt: -1 } }, // Get the latest entry
            { $limit: 1 }, // Limit to the most recent assessment
            { $project: { riskPercentage: 1, gender: 1, age: 1 } },
          ],
          as: "latestCoronaryDetail",
        },
      },
      {
        $unwind: {
          path: "$latestCoronaryDetail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: { age: "$age", gender: "$gender" },
          averageRisk: {
            $avg: "$latestCoronaryDetail.riskPercentage",
          },
        },
      },
      {
        $project: {
          age: "$_id.age",
          gender: "$_id.gender",
          averageRisk: { $ifNull: ["$averageRisk", 0] }, // Handle cases where no risk data exists
          _id: 0,
        },
      },
      {
        $sort: { age: 1 }, // Sort by age in ascending order
      },
    ]);

    // Transform data into required structure
    const data = result.reduce((acc, item) => {
      let group = acc.find((el) => el.age === item.age);
      if (!group) {
        group = { age: item.age, male: 0, female: 0 };
        acc.push(group);
      }
      if (item.gender === "M") {
        group.male = item.averageRisk;
      } else if (item.gender === "F") {
        group.female = item.averageRisk;
      }
      return acc;
    }, []);

    return Response.success(
      res,
      data,
      200,
      "Data fetched successfully!",
      AppConstant.SUCCESS
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
// existing COMORBIDITIES
const corporateDashboardExistingComorbiditiesOfYourOrganization = async (
  req,
  res
) => {
  try {
    const { corporateId } = req.body;

    // Validate required fields
    if (!corporateId) {
      return res.status(404).json({
        success: false,
        message: "Corporate Id is missing!",
      });
    }

    // Aggregate data
    const result = await Employee.aggregate([
      {
        $match: { corporate: new mongoose.Types.ObjectId(corporateId) },
      },
      {
        $lookup: {
          from: "emrs", // The collection for EMRs
          let: { employeeId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$user", "$$employeeId"] } } },
            { $sort: { createdAt: -1 } }, // Get the latest entry
            { $limit: 1 }, // Limit to the most recent assessment
          ],
          as: "latestEmr",
        },
      },
      {
        $unwind: {
          path: "$latestEmr",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          gender: 1,
          "latestEmr.diagonosis": 1,
          "latestEmr.generalPhysicalExamination.BMI": 1,
          "latestEmr.generalPhysicalExamination.BP.sys": 1,
        },
      },
    ]);

    // Calculate percentages for each condition
    const totalMale = result.filter((e) => e.gender === "M").length;
    const totalFemale = result.filter((e) => e.gender === "F").length;

    const calculateCondition = (conditionFn) => {
      const maleCount = result.filter(
        (e) => e.gender === "M" && conditionFn(e)
      ).length;
      const femaleCount = result.filter(
        (e) => e.gender === "F" && conditionFn(e)
      ).length;
      return {
        male: totalMale ? ((maleCount / totalMale) * 100).toFixed(1) : 0,
        female: totalFemale
          ? ((femaleCount / totalFemale) * 100).toFixed(1)
          : 0,
      };
    };

    const data = [
      {
        name: "Coronary Heart Disease",
        ...calculateCondition((e) =>
          e.latestEmr?.diagonosis?.some((d) =>
            d.diagonosisName.match(/coronary heart disease/i)
          )
        ),
      },
      {
        name: "Diabetes Mellitus",
        ...calculateCondition((e) =>
          e.latestEmr?.diagonosis?.some((d) =>
            d.diagonosisName.match(/diabetes mellitus/i)
          )
        ),
      },
      {
        name: "Hypertension",
        ...calculateCondition(
          (e) =>
            e.latestEmr?.generalPhysicalExamination?.BP?.sys > 140 ||
            e.latestEmr?.diagonosis?.some((d) =>
              d.diagonosisName.match(/hypertension/i)
            )
        ),
      },
      {
        name: "Dyslipidemia",
        ...calculateCondition((e) =>
          e.latestEmr?.diagonosis?.some((d) =>
            d.diagonosisName.match(/dyslipidemia/i)
          )
        ),
      },
      {
        name: "Overweight/Obesity",
        ...calculateCondition(
          (e) => e.latestEmr?.generalPhysicalExamination?.BMI > 24.5
        ),
      },
    ];

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in aggregation:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while aggregating data.",
    });
  }
};

// mental score
const corporateDashboardMentalStressOfYourOrganization = async (req, res) => {
  try {
    const { corporateId } = req.body;

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
            {
              $project: {
                _id: 0,
                "history.stressScreening.pssScore": 1,
                "history.stressScreening.phqScore": 1,
              },
            },
          ],
          as: "latestEMR",
        },
      },
      {
        $unwind: {
          path: "$latestEMR",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          pssScore: "$latestEMR.history.stressScreening.pssScore",
          phqScore: "$latestEMR.history.stressScreening.phqScore",
        },
      },
      {
        $addFields: {
          isStress: { $gt: ["$pssScore", 20] }, // Assume 50% of max PSS score (40) = 20
          isDepression: { $gt: ["$phqScore", 15] }, // Assume 50% of max PHQ score (30) = 15
        },
      },
      {
        $group: {
          _id: null,
          stressEmployees: { $sum: { $cond: ["$isStress", 1, 0] } },
          depressionEmployees: { $sum: { $cond: ["$isDepression", 1, 0] } },
          normalEmployees: {
            $sum: {
              $cond: [
                { $and: [{ $not: "$isStress" }, { $not: "$isDepression" }] },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          data: [
            { name: "Stress and anxiety", value: "$stressEmployees" },
            { name: "Depression", value: "$depressionEmployees" },
            { name: "Normal", value: "$normalEmployees" },
          ],
        },
      },
    ]);

    // Send response
    return Response.success(
      res,
      employees.length > 0 ? employees[0].data : [],
      200,
      AppConstant.SUCCESS
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

// lab report analysis
const corporateDashboardLabAnalysisReportOfYourOrganization = async (
  req,
  res
) => {
  try {
    const { corporateId } = req.body;

    // Validate required fields
    if (!corporateId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Corporate Id is missing!"
      );
    }

    // Total number of employees for percentage calculation
    const totalEmployees = await Employee.countDocuments({
      corporate: corporateId,
    });

    if (totalEmployees === 0) {
      return Response.success(
        res,
        [],
        200,
        AppConstant.SUCCESS,
        "No employees found for this corporate!"
      );
    }

    // Query to calculate health statistics
    const healthStatistics = await healthScoreModel.aggregate([
      {
        $match: {
          user: {
            $in: await Employee.distinct("_id", { corporate: corporateId }),
          },
        },
      },
      {
        $facet: {
          anaemia: [
            { $match: { "metabolicScore.hemoglobin": { $lt: 11 } } },
            { $count: "count" },
          ],
          derangedLFT: [
            {
              $match: {
                "metabolicScore.AST": { $gt: 45 },
                "metabolicScore.ALT": { $gt: 45 },
              },
            },
            { $count: "count" },
          ],
          highBloodSugar: [
            { $match: { "gutScore.plasmaGlucose": { $gt: 140 } } },
            { $count: "count" },
          ],
          derangedKFT: [
            {
              $match: {
                "gutScore.urea": { $gt: 40 },
                "gutScore.creatinine": { $gt: 1.4 },
              },
            },
            { $count: "count" },
          ],
          dyslipidemia: [
            {
              $match: {
                "heartScore.totalCholesterol": { $gt: 200 },
                "heartScore.LDL": { $gt: 100 },
              },
            },
            { $count: "count" },
          ],
        },
      },
      {
        $project: {
          anaemia: { $arrayElemAt: ["$anaemia.count", 0] },
          derangedLFT: { $arrayElemAt: ["$derangedLFT.count", 0] },
          highBloodSugar: { $arrayElemAt: ["$highBloodSugar.count", 0] },
          derangedKFT: { $arrayElemAt: ["$derangedKFT.count", 0] },
          dyslipidemia: { $arrayElemAt: ["$dyslipidemia.count", 0] },
        },
      },
      {
        $addFields: {
          anaemia: { $ifNull: ["$anaemia", 0] },
          derangedLFT: { $ifNull: ["$derangedLFT", 0] },
          highBloodSugar: { $ifNull: ["$highBloodSugar", 0] },
          derangedKFT: { $ifNull: ["$derangedKFT", 0] },
          dyslipidemia: { $ifNull: ["$dyslipidemia", 0] },
        },
      },
      {
        $project: {
          anaemia: {
            value: {
              $multiply: [{ $divide: ["$anaemia", totalEmployees] }, 100],
            },
          },
          derangedLFT: {
            value: {
              $multiply: [{ $divide: ["$derangedLFT", totalEmployees] }, 100],
            },
          },
          highBloodSugar: {
            value: {
              $multiply: [
                { $divide: ["$highBloodSugar", totalEmployees] },
                100,
              ],
            },
          },
          derangedKFT: {
            value: {
              $multiply: [{ $divide: ["$derangedKFT", totalEmployees] }, 100],
            },
          },
          dyslipidemia: {
            value: {
              $multiply: [{ $divide: ["$dyslipidemia", totalEmployees] }, 100],
            },
          },
        },
      },
    ]);

    // Transform the result into the desired format
    const data = [
      { name: "Anaemia", value: Math.round(healthStatistics[0].anaemia.value) },
      {
        name: "Deranged LFT",
        value: Math.round(healthStatistics[0].derangedLFT.value),
      },
      {
        name: "High Random blood sugar",
        value: Math.round(healthStatistics[0].highBloodSugar.value),
      },
      {
        name: "Deranged KFT",
        value: Math.round(healthStatistics[0].derangedKFT.value),
      },
      {
        name: "Dyslipidemia",
        value: Math.round(healthStatistics[0].dyslipidemia.value),
      },
    ];

    return Response.success(res, data, 200, AppConstant.SUCCESS);
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
  corporateDashboardStressLevelOfYourOrganization,
  corporateDashboard10YearASCVDOfYourOrganization,
  corporateDashboardExistingComorbiditiesOfYourOrganization,
  corporateDashboardMentalStressOfYourOrganization,
  corporateDashboardLabAnalysisReportOfYourOrganization,
};
