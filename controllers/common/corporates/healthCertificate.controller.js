const fs = require("fs");
const dayjs = require("dayjs");
const path = require("path");
const PDFDocument = require("pdfkit-table");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const mongoose = require("mongoose");
const {
  generateHealthCertificateCompanyFn,
  generateCorporateEmployeeFitnessCertificatePDFFn,
} = require("../../../helper/healthCertificatePdf/healthCertificate.helper");
const Corporate = require("../../../models/corporates/corporate.model");
const Employee = require("../../../models/patient/employee/employee.model");
const healthScoreModel = require("../../../models/patient/healthScore/healthScore.model");
const { populate } = require("../../../models/common/address.model");
const EMR = require("../../../models/common/emr.model");

// const testData = {
//   companyName: " SAFE SECURITY PVT LTD",
//   overAllHealthScore: 80,
//   employeeFitPercentage: 75,
//   date: new Date(),
//   address: "Complex 2, Sarita Vihar, New Delhi.",
//   doctor: [
//     {
//       _id: "dfsjfsakdfsaf1",
//       firstName: "Rajeeve",
//       lastName: "Rajput",
//       specialization: "Cardiologist",
//       degree: "MBBS, MD, DM",
//       registrationNumber: "146611H",
//     },
//     {
//       _id: "dfsjfsakdfsaf2",
//       firstName: "Rajeeve",
//       lastName: "Rajput",
//       specialization: "Cardiologist",
//       degree: "MBBS, MD, DM",
//       registrationNumber: "146611H",
//     },
//     {
//       _id: "dfsjfsakdfsaf3",
//       firstName: "Rajeeve",
//       lastName: "Rajput",
//       specialization: "Cardiologist",
//       degree: "MBBS, MD, DM",
//       registrationNumber: "146611H",
//     },
//   ],
// };

const employeeFitnessData = {
  employeeName: "RAJ PATEL",
  gender: "M",
  companyName: " SAFE SECURITY PVT LTD",
  overAllHealthScore: 80,
  interpretation: "Moderate",
  date: new Date(),
  address: "Complex 2, Sarita Vihar, New Delhi.",
};
const generateCorporateHealthCertificate = async (req, res) => {
  try {
    const { corporate } = req.body;
    if (!corporate) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "corporate is required !"
      );
    }
    //

    // Step 1: Fetch corporate details including assigned doctors and addresses
    const corporateData = await Corporate.findById(corporate)
      .populate("addresses", "name city state zipCode")
      .populate(
        "assignedDoctors",
        "firstName lastName specialization education.degree  medicalRegistrationNumber eSign"
      )
      .lean();

    if (!corporateData) {
      return res.status(404).json({
        success: false,
        message: "Corporate not found",
      });
    }

    // Step 2: Count total employees for the corporate
    const totalEmployeeCount = await Employee.countDocuments({
      corporate,
    });

    // Step 3: Aggregate health scores for employees under this corporate
    const aggregationResults = await Employee.aggregate([
      { $match: { corporate: new mongoose.Types.ObjectId(corporate) } },
      {
        $lookup: {
          from: "healthscores",
          localField: "_id",
          foreignField: "user",
          as: "healthScore",
        },
      },
      { $unwind: { path: "$healthScore", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          fitEmployees: {
            $sum: {
              $cond: [{ $gt: ["$healthScore.overallHealthScore", 80] }, 1, 0],
            },
          },
          totalHealthScore: {
            $sum: {
              $cond: [
                { $ne: ["$healthScore.overallHealthScore", null] },
                "$healthScore.overallHealthScore",
                0,
              ],
            },
          },
          healthScores: {
            $push: {
              overallHealthScore: "$healthScore.overallHealthScore",
              createdAt: "$healthScore.createdAt",
            },
          },
        },
      },
    ]);

    if (!aggregationResults.length) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "No health scores found for employees under this corporate."
      );
    }

    const {
      fitEmployees = 0,
      totalHealthScore = 0,
      healthScores = [],
    } = aggregationResults[0];

    const fitEmployeesPercentage = Math.round(
      (fitEmployees * 100) / totalEmployeeCount
    );

    const overallHealthScorePercentage = Math.round(
      totalHealthScore / totalEmployeeCount
    );

    // Get the latest health score date
    const latestHealthScoreDate = healthScores.reduce((latest, current) => {
      return new Date(current.createdAt) > new Date(latest.createdAt)
        ? current
        : latest;
    }, healthScores[0]).createdAt;

    // Step 4: Construct the response object
    const responseData = {
      companyName: corporateData.companyName,
      overAllHealthScore: overallHealthScorePercentage || 0,
      employeeFitPercentage: fitEmployeesPercentage || 0,
      date: latestHealthScoreDate, // Set to the latest healthScore createdAt
      // address: corporateData.addresses
      //   .map(
      //     (addr) =>
      //       `${addr.name}, ${addr.city}, ${addr.state}, ${addr.zipCode || ""}`
      //   )
      //   .join(", "),
      address: `${
        corporateData.addresses[0]?.name || "Address not available"
      }, ${corporateData.addresses[0]?.city || ""}, ${
        corporateData.addresses[0]?.state || ""
      }, ${corporateData.addresses[0]?.zipCode || ""}`,
      doctor: corporateData.assignedDoctors.slice(0, 3).map((doc) => ({
        _id: doc._id,
        firstName: doc.firstName,
        lastName: doc.lastName,
        specialization: doc.specialization,
        degree: doc.education[0]?.degree || "",
        registrationNumber: doc.medicalRegistrationNumber,
        eSign: doc.eSign,
      })),
    };
    // console.log(responseData);

    // return Response.success(res, responseData, 200, AppConstant.SUCCESS);

    await generateHealthCertificateCompanyFn(responseData, res);
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};
const generateCorporateEmployeeFitnessCertificate = async (req, res) => {
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "employeeId is required!"
      );
    }

    // Step 1: Fetch employee details including the corporate ID
    const employeeData = await Employee.findById(employeeId)
      .populate({
        path: "corporate",
        select: "companyName",
        populate: { path: "addresses", select: "name city zipCode state" },
      })
      .lean();

    if (!employeeData) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const { _id, firstName, lastName, gender, corporate } = employeeData;

    if (!corporate) {
      return res.status(404).json({
        success: false,
        message: "Corporate information not found for this employee",
      });
    }

    // Step 2: Fetch the latest health score for the employee
    const latestHealthScore = await healthScoreModel
      .findOne({ user: employeeId })
      .sort({ createdAt: -1 })
      .lean();

    if (!latestHealthScore) {
      return res.status(404).json({
        success: false,
        message: "No health score found for this employee",
      });
    }

    const { overallHealthScore, createdAt } = latestHealthScore;

    // Step 3: Determine interpretation and notes based on the overall health score
    let interpretation = "";
    let interpretationNotes = "";

    if (overallHealthScore >= 85) {
      interpretation = "Fit and Healthy";
      interpretationNotes =
        "The individual demonstrates excellent health and is fit for all duties. Continued healthy lifestyle habits and routine health monitoring are recommended.";
    } else if (overallHealthScore >= 70) {
      interpretation = "Fit with Recommendations";
      interpretationNotes =
        "The individual is fit for duties with minor health improvements suggested. Lifestyle adjustments such as improved diet, regular exercise, or stress management are recommended.";
    } else if (overallHealthScore >= 50) {
      interpretation = "Monitoring Advised";
      interpretationNotes =
        "The individual shows moderate health risks. Fitness for duties is appropriate with proactive management of specific health factors and periodic health evaluations.";
    } else {
      interpretation = "Health Improvement Needed";
      interpretationNotes =
        "The individual has significant health risks. Participation in a structured health improvement plan and medical consultation is strongly recommended before taking on certain duties.";
    }

    // find eSign of the doctor from the latest emr
    const latestEmrDoctor = await EMR.findOne({ user: _id })
      .sort({ createdAt: -1 })
      .populate({
        path: "doctor",
        select:
          "firstName lastName specialization degree registrationNumber eSign",
      });

    // Step 4: Construct the response object
    const employeeFitnessData = {
      employeeName: `${firstName.toUpperCase()} ${lastName.toUpperCase()}`,
      gender: gender.toUpperCase(),
      companyName: corporate.companyName,
      overAllHealthScore: overallHealthScore || 0,
      interpretation,
      interpretationNotes,
      date: createdAt,
      doctor: latestEmrDoctor?.doctor || null,
      address: `${corporate.addresses[0]?.name || "Address not available"}, ${
        corporate.addresses[0]?.city || ""
      }, ${corporate.addresses[0]?.state || ""}, ${
        corporate.addresses[0]?.zipCode || ""
      }`,
    };
    // console.log(employeeFitnessData);
    if (!employeeFitnessData.doctor) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "doctor not assigned !"
      );
    }

    // return Response.success(res, employeeFitnessData, 200, AppConstant.SUCCESS);
    await generateCorporateEmployeeFitnessCertificatePDFFn(
      employeeFitnessData,
      res
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
  generateCorporateHealthCertificate,
  generateCorporateEmployeeFitnessCertificate,
};
