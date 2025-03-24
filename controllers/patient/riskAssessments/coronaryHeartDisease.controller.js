const coronaryHeartDiseaseModel = require("../../../models/patient/riskAssessments/coronaryHeartDisease.model");
const Employee = require("../../../models/patient/employee/employee.model");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const mongoose = require("mongoose");
const {
  coronaryHeartDiseaseValidationSchema,
} = require("../../../validators/patient/riskAssessments/coronaryHeartDiseases.validator");
const {
  calculateRisk,
} = require("../../../helper/employeeDiseaseAssessmentHelper/employeeDiseaseAssessmentHelper.helper");
const userModel = require("../../../models/common/user.model");
const individualUserModel = require("../../../models/individualUser/induvidualUser.model");
// create

const createCoronaryHeartDisease = async (req, res) => {
  try {
    const { error } = coronaryHeartDiseaseValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation error !"
      );
    }

    const { user, ...patientData } = req.body;
    // console.log(patientData);

    const riskPercentage = calculateRisk(patientData);

    const newCoronaryHeartDisease = new coronaryHeartDiseaseModel({
      ...req.body,
      riskPercentage,
    });
    const savedCoronaryHeartDisease = await newCoronaryHeartDisease.save();

    return Response.success(
      res,
      savedCoronaryHeartDisease,
      201,
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

// find data for creating coronary heart disease
const getDataToCreateCoronaryHeartDisease = async (req, res) => {
  const { employeeId } = req.body;
  try {
    const employeeHealthScoreData = await userModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(employeeId) } },
      {
        $lookup: {
          from: "healthscores", // health score collection name
          localField: "_id",
          foreignField: "user",
          as: "healthScore",
        },
      },
      { $unwind: { path: "$healthScore", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          systolicBP: { $ifNull: ["$healthScore.heartScore.BP.sys", 0] },
          totalCholesterol: {
            $ifNull: ["$healthScore.heartScore.totalCholesterol", 0],
          },
          hdlCholesterol: { $ifNull: ["$healthScore.heartScore.HDL", 0] },
          gender: "$gender",
          age: "$age",
        },
      },
    ]);
    // console.log(employeeHealthScoreData);
    return Response.success(
      res,
      employeeHealthScoreData[0],
      200,
      "data fetch to create coronary disease !",
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
// get all for employee dashboard
const getCoronaryHeartDiseaseOfParticularEmployeeForDetailPageRistAssessment =
  async (req, res) => {
    try {
      const { employeeId } = req.body;
      if (!employeeId) {
        return Response.error(
          res,
          404,
          AppConstant.FAILED,
          "employee id is missing !"
        );
      }

      const CoronaryHeartDieases = await coronaryHeartDiseaseModel
        .find({ user: employeeId }, "createdAt riskPercentage")
        .limit(10);
      return Response.success(
        res,
        CoronaryHeartDieases,
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

// coronary date score and date
const getCoronaryDataScoreAndDateByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.query;
    if (!employeeId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "employee id is missing !"
      );
    }
    const allExistingCoronaryDataOfParticularEmployee =
      await coronaryHeartDiseaseModel
        .find({ user: employeeId }, "riskPercentage createdAt")
        .sort({ createdAt: -1 });

    //
    return Response.success(
      res,
      allExistingCoronaryDataOfParticularEmployee,
      200,
      "coronary data found successfully !",
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
module.exports = {
  createCoronaryHeartDisease,
  getCoronaryHeartDiseaseOfParticularEmployeeForDetailPageRistAssessment,
  getDataToCreateCoronaryHeartDisease,
  getCoronaryDataScoreAndDateByEmployeeId,
};
