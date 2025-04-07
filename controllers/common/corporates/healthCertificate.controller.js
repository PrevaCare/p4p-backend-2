const fs = require("fs");
const dayjs = require("dayjs");
const path = require("path");
const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const Corporate = require("../../../models/corporates/corporate.model");
const Employee = require("../../../models/patient/employee/employee.model");
const healthScoreModel = require("../../../models/patient/healthScore/healthScore.model");
const EMR = require("../../../models/common/emr.model");

// Helper function to sanitize strings for HTML
const sanitizeHtml = (str) => {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Helper functions for certificate generation
const generateCorporateHealthCertificate = async (req, res) => {
  try {
    const { corporate } = req.body;
    if (!corporate) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "corporate is required!"
      );
    }

    // Step 1: Fetch corporate details including assigned doctors and addresses
    const corporateData = await Corporate.findById(corporate)
      .populate("addresses", "name city state zipCode")
      .populate(
        "assignedDoctors",
        "firstName lastName specialization education.degree medicalRegistrationNumber eSign"
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

    // Step 4: Construct the certificate data
    const certificateData = {
      companyName: corporateData.companyName,
      overAllHealthScore: overallHealthScorePercentage || 0,
      employeeFitPercentage: fitEmployeesPercentage || 0,
      date: latestHealthScoreDate,
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
      // Additional data for the enhanced certificate
      totalEmployees: totalEmployeeCount,
      fitEmployees: fitEmployees,
      certificationId: `CORP-HC-${Date.now().toString().slice(-6)}`,
      issuedDate: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Valid for 90 days
      healthStatus: determineHealthStatus(overallHealthScorePercentage),
      recommendations: generateRecommendations(overallHealthScorePercentage),
    };

    await generateHealthCertificateCompanyFn(certificateData, res);
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

// Helper function to determine health status based on score
function determineHealthStatus(score) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Average";
  return "Needs Improvement";
}

// Helper function to generate recommendations based on health score
function generateRecommendations(score) {
  if (score >= 85) {
    return [
      "Maintain current health programs",
      "Consider advanced wellness initiatives",
      "Conduct quarterly health assessments",
    ];
  } else if (score >= 70) {
    return [
      "Increase physical activity programs",
      "Implement nutrition education",
      "Schedule bi-monthly health check-ups",
    ];
  } else if (score >= 50) {
    return [
      "Immediate implementation of wellness programs",
      "Monthly health monitoring recommended",
      "Consider ergonomic workspace assessments",
    ];
  } else {
    return [
      "Urgent health intervention required",
      "Weekly health monitoring recommended",
      "Complete workplace health assessment needed",
      "Consider professional health consulting",
    ];
  }
}

// HTML template function for corporate health certificate
const getHealthCertificateHTML = (data, logoBase64) => {
  const {
    companyName,
    overAllHealthScore,
    employeeFitPercentage,
    totalEmployees,
    fitEmployees,
    date,
    address,
    doctor,
    certificationId,
    issuedDate,
    validUntil,
    healthStatus,
    recommendations,
  } = data;

  // Format dates
  const formatDate = (date) => {
    return date ? dayjs(date).format("DD MMM YYYY") : "";
  };

  // Generate doctor signatures
  const doctorSignatures = doctor
    .map(
      (doc, index) => `
    <div class="doctor-signature" style="${
      index > 0 ? "margin-left: 20px;" : ""
    }">
      <div class="signature">
        ${
          doc.eSign
            ? `<img src="${doc.eSign}" alt="Doctor Signature" class="signature-image" />`
            : '<div class="signature-placeholder">Signature Pending</div>'
        }
      </div>
      <div class="doctor-name">Dr. ${doc.firstName} ${doc.lastName}</div>
      <div class="doctor-credentials">${doc.specialization}</div>
      <div class="doctor-reg">Reg. No: ${doc.registrationNumber}</div>
    </div>
  `
    )
    .join("");

  // Generate health score color based on value
  const getScoreColor = (score) => {
    if (score >= 85) return "#28a745"; // Green
    if (score >= 70) return "#17a2b8"; // Blue
    if (score >= 50) return "#ffc107"; // Yellow
    return "#dc3545"; // Red
  };

  // Generate recommendation list
  const recommendationsList = recommendations
    ? recommendations.map((rec) => `<li>${sanitizeHtml(rec)}</li>`).join("")
    : "";

  // Logo HTML
  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="Company Logo" class="logo-image" />`
    : `<div class="logo-placeholder">Preva Care</div>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Corporate Health Certificate</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    body {
      font-family: 'Arial', sans-serif;
      margin: 0;
      padding: 0;
      color: #333;
      background-color: #fff;
    }
    .certificate {
      position: relative;
      width: 100%;
      padding: 40px;
      box-sizing: border-box;
    }
    .certificate-border {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      border: 2px solid #0096F2;
      border-radius: 10px;
      pointer-events: none;
      z-index: -1;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #0096F2;
    }
    .logo-container {
      max-width: 120px;
    }
    .logo-image {
      max-width: 100%;
      height: auto;
    }
    .logo-placeholder {
      font-size: 24px;
      font-weight: bold;
      color: #0096F2;
    }
    .certificate-title {
      text-align: center;
    }
    .certificate-title h1 {
      color: #0096F2;
      margin-bottom: 5px;
      font-size: 24px;
    }
    .certificate-title h2 {
      color: #555;
      margin-top: 0;
      font-size: 18px;
    }
    .certificate-details {
      margin-top: 20px;
    }
    .company-name {
      text-align: center;
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #333;
    }
    .metrics-container {
      display: flex;
      justify-content: space-around;
      margin: 30px 0;
    }
    .metric {
      text-align: center;
      width: 30%;
    }
    .metric-value {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .metric-label {
      font-size: 14px;
      color: #555;
    }
    .certificate-info {
      margin: 30px 0;
      padding: 20px;
      background-color: #f9f9f9;
      border-radius: 8px;
    }
    .info-row {
      display: flex;
      margin-bottom: 10px;
    }
    .info-label {
      width: 35%;
      font-weight: bold;
      color: #555;
    }
    .info-value {
      width: 65%;
    }
    .health-status {
      margin: 30px 0;
      text-align: center;
    }
    .status-label {
      font-size: 16px;
      margin-bottom: 10px;
      color: #555;
    }
    .status-value {
      font-size: 24px;
      font-weight: bold;
    }
    .recommendations {
      margin: 30px 0;
    }
    .recommendations h3 {
      color: #0096F2;
      margin-bottom: 15px;
    }
    .recommendations ul {
      padding-left: 20px;
    }
    .recommendations li {
      margin-bottom: 8px;
    }
    .signatures {
      margin-top: 50px;
      display: flex;
      justify-content: space-around;
    }
    .doctor-signature {
      text-align: center;
      width: 30%;
    }
    .signature {
      height: 60px;
      margin-bottom: 10px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .signature-image {
      max-height: 60px;
      max-width: 100%;
    }
    .signature-placeholder {
      font-style: italic;
      color: #999;
      border-top: 1px dashed #999;
      width: 100%;
      padding-top: 5px;
    }
    .doctor-name {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .doctor-credentials {
      font-size: 12px;
      color: #555;
      margin-bottom: 2px;
    }
    .doctor-reg {
      font-size: 11px;
      color: #777;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 12px;
      color: #777;
    }
    .certificate-id {
      margin-top: 10px;
      text-align: right;
      font-size: 11px;
      color: #999;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 100px;
      color: rgba(0, 150, 242, 0.05);
      z-index: -1;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="certificate-border"></div>
    <div class="watermark">PREVA CARE</div>
    
    <div class="header">
      <div class="logo-container">
        ${logoHtml}
      </div>
      <div class="certificate-title">
        <h1>CORPORATE HEALTH CERTIFICATE</h1>
        <h2>Official Health Assessment</h2>
      </div>
      <div style="width: 120px;"></div>
    </div>
    
    <div class="certificate-details">
      <div class="company-name">${sanitizeHtml(companyName)}</div>
      
      <div class="metrics-container">
        <div class="metric">
          <div class="metric-value" style="color: ${getScoreColor(
            overAllHealthScore
          )};">${overAllHealthScore}%</div>
          <div class="metric-label">Overall Health Score</div>
        </div>
        <div class="metric">
          <div class="metric-value" style="color: ${getScoreColor(
            employeeFitPercentage
          )};">${employeeFitPercentage}%</div>
          <div class="metric-label">Employee Fitness Rate</div>
        </div>
        <div class="metric">
          <div class="metric-value">${totalEmployees}</div>
          <div class="metric-label">Total Employees</div>
        </div>
      </div>
      
      <div class="certificate-info">
        <div class="info-row">
          <div class="info-label">Address:</div>
          <div class="info-value">${sanitizeHtml(address)}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Assessment Date:</div>
          <div class="info-value">${formatDate(date)}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Certificate Issue Date:</div>
          <div class="info-value">${formatDate(issuedDate)}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Valid Until:</div>
          <div class="info-value">${formatDate(validUntil)}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Fit Employees:</div>
          <div class="info-value">${fitEmployees} of ${totalEmployees} employees have a health score above 80%</div>
        </div>
      </div>
      
      <div class="health-status">
        <div class="status-label">Corporate Health Status</div>
        <div class="status-value" style="color: ${getScoreColor(
          overAllHealthScore
        )};">${healthStatus}</div>
      </div>
      
      <div class="recommendations">
        <h3>Health Recommendations</h3>
        <ul>
          ${recommendationsList}
        </ul>
      </div>
      
      <div class="signatures">
        ${doctorSignatures}
      </div>
      
      <div class="footer">
        This certificate is issued by Preva Care and is valid for 90 days from the date of issue.
        <br>For verification or any queries, please contact support@prevacare.com
      </div>
      
      <div class="certificate-id">
        Certificate ID: ${certificationId}
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

const generateCorporateEmployeeFitnessCertificate = async (req, res) => {
  console.log(
    "---- FUNCTION START: generateCorporateEmployeeFitnessCertificate ----"
  );
  console.log("Request body:", req.body);
  try {
    const { employeeId } = req.body;

    if (!employeeId) {
      console.log("ERROR: Missing employeeId in request");
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "employeeId is required!"
      );
    }
    console.log("Employee ID validation passed:", employeeId);

    // Step 1: Fetch employee details including the corporate ID
    console.log("Attempting to fetch employee data...");
    const employeeData = await Employee.findById(employeeId)
      .populate({
        path: "corporate",
        select: "companyName",
        populate: { path: "addresses", select: "name city zipCode state" },
      })
      .lean();

    console.log(
      "Employee data fetch result:",
      employeeData ? "Found" : "Not Found"
    );

    if (!employeeData) {
      console.log("ERROR: Employee not found with ID:", employeeId);
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const { _id, firstName, lastName, gender, corporate } = employeeData;
    console.log("Employee details extracted:", {
      _id,
      firstName,
      lastName,
      gender,
    });
    console.log("Corporate data:", corporate);

    if (!corporate) {
      console.log(
        "ERROR: Corporate information missing for employee:",
        employeeId
      );
      return res.status(404).json({
        success: false,
        message: "Corporate information not found for this employee",
      });
    }
    console.log("Corporate validation passed");

    // Step 2: Fetch the latest health score for the employee
    console.log("Attempting to fetch latest health score...");
    const latestHealthScore = await healthScoreModel
      .findOne({ user: employeeId })
      .sort({ createdAt: -1 })
      .lean();

    console.log(
      "Health score fetch result:",
      latestHealthScore ? "Found" : "Not Found"
    );

    if (!latestHealthScore) {
      console.log("ERROR: No health score found for employee:", employeeId);
      return res.status(404).json({
        success: false,
        message: "No health score found for this employee",
      });
    }

    const { overallHealthScore, createdAt } = latestHealthScore;
    console.log("Health score details:", { overallHealthScore, createdAt });

    // Step 3: Determine interpretation and notes based on the overall health score
    console.log(
      "Determining health interpretation based on score:",
      overallHealthScore
    );
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
    console.log("Determined interpretation:", interpretation);

    // find eSign of the doctor from the latest emr
    console.log("Attempting to find latest EMR and doctor information...");
    const latestEmrDoctor = await EMR.findOne({ user: _id })
      .sort({ createdAt: -1 })
      .populate({
        path: "doctor",
        select:
          "firstName lastName specialization degree registrationNumber eSign",
      });

    console.log(
      "EMR doctor fetch result:",
      latestEmrDoctor ? "Found" : "Not Found"
    );
    if (latestEmrDoctor) {
      console.log(
        "Doctor data:",
        latestEmrDoctor.doctor ? "Available" : "Missing in EMR"
      );
    }

    // Step 4: Construct the response object with additional data for enhanced certificate
    console.log("Constructing fitness certificate data...");
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
      // Additional data for enhanced certificate
      employeeId: _id,
      certificationId: `EMP-FC-${Date.now().toString().slice(-6)}`,
      issuedDate: new Date(),
      validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // Valid for 180 days
      healthCategory: determineHealthCategory(overallHealthScore),
      recommendations: generatePersonalRecommendations(overallHealthScore),
    };
    console.log(
      "Employee fitness data constructed:",
      JSON.stringify(employeeFitnessData, null, 2)
    );

    if (!employeeFitnessData.doctor) {
      console.log("ERROR: Doctor not assigned in the fitness data");
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "doctor not assigned!"
      );
    }
    console.log("Doctor validation passed");

    console.log("Attempting to generate PDF...");
    try {
      await generateCorporateEmployeeFitnessCertificatePDFFn(
        employeeFitnessData,
        res
      );
      console.log("PDF generation function called successfully");
    } catch (pdfError) {
      console.error("ERROR in PDF generation:", pdfError);
      throw pdfError;
    }
  } catch (err) {
    console.error("CAUGHT ERROR in fitness certificate generation:", err);
    console.error("Error stack:", err.stack);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

// Helper function to determine health category based on score
function determineHealthCategory(score) {
  if (score >= 85) return "Category A - Excellent Health";
  if (score >= 70) return "Category B - Good Health";
  if (score >= 50) return "Category C - Acceptable Health";
  return "Category D - Health Improvement Required";
}

// Helper function to generate personalized recommendations
function generatePersonalRecommendations(score) {
  let recommendations = [];

  if (score >= 85) {
    recommendations = [
      "Maintain current exercise and dietary habits",
      "Continue regular health check-ups",
      "Consider advanced fitness goals",
      "Share health practices with colleagues",
    ];
  } else if (score >= 70) {
    recommendations = [
      "Increase physical activity to 150 minutes per week",
      "Ensure balanced nutrition with emphasis on protein and vegetables",
      "Practice stress management techniques",
      "Schedule bi-annual health check-ups",
    ];
  } else if (score >= 50) {
    recommendations = [
      "Consult with healthcare provider for personalized health plan",
      "Aim for 30 minutes of moderate exercise daily",
      "Review and improve dietary habits",
      "Reduce stress through mindfulness or counseling",
      "Quarterly health monitoring recommended",
    ];
  } else {
    recommendations = [
      "Immediate consultation with healthcare provider",
      "Begin gentle, regular physical activity as approved by doctor",
      "Follow structured nutrition plan",
      "Monitor vital signs weekly",
      "Participate in corporate wellness program",
      "Monthly medical follow-ups",
    ];
  }

  return recommendations;
}

// HTML template function for employee fitness certificate
const getEmployeeFitnessCertificateHTML = (data, logoBase64) => {
  const {
    employeeName,
    gender,
    companyName,
    overAllHealthScore,
    interpretation,
    interpretationNotes,
    date,
    doctor,
    address,
    employeeId,
    certificationId,
    issuedDate,
    validUntil,
    healthCategory,
    recommendations,
  } = data;

  // Format dates
  const formatDate = (date) => {
    return date ? dayjs(date).format("DD MMM YYYY") : "";
  };

  // Generate health score color based on value
  const getScoreColor = (score) => {
    if (score >= 85) return "#28a745"; // Green
    if (score >= 70) return "#17a2b8"; // Blue
    if (score >= 50) return "#ffc107"; // Yellow
    return "#dc3545"; // Red
  };

  // Generate recommendation list
  const recommendationsList = recommendations
    ? recommendations.map((rec) => `<li>${sanitizeHtml(rec)}</li>`).join("")
    : "";

  // Logo HTML
  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="Company Logo" class="logo-image" />`
    : `<div class="logo-placeholder">Preva Care</div>`;

  // Doctor signature HTML
  const doctorSignatureHtml = doctor?.eSign
    ? `<img src="${doctor.eSign}" alt="Doctor Signature" class="signature-image" />`
    : '<div class="signature-placeholder">Signature Pending</div>';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Employee Fitness Certificate</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    body {
      font-family: 'Arial', sans-serif;
      margin: 0;
      padding: 0;
      color: #333;
      background-color: #fff;
      font-size: 11px; /* Slightly larger base font size */
    }
    .certificate {
      position: relative;
      width: 100%;
      padding: 25px; /* Reduced padding */
      box-sizing: border-box;
    }
    .certificate-border {
      position: absolute;
      top: 5px;
      left: 5px;
      right: 5px;
      bottom: 5px;
      border: 1px solid #0096F2; /* Thinner border */
      border-radius: 5px; /* Smaller radius */
      pointer-events: none;
      z-index: -1;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px; /* Reduced margin */
      padding-bottom: 10px; /* Reduced padding */
      border-bottom: 2px solid #0096F2; /* Thinner border */
    }
    .logo-container {
      max-width: 80px; /* Smaller logo */
    }
    .logo-image {
      max-width: 100%;
      height: auto;
    }
    .logo-placeholder {
      font-size: 18px; /* Smaller font */
      font-weight: bold;
      color: #0096F2;
    }
    .certificate-title {
      text-align: center;
    }
    .certificate-title h1 {
      color: #0096F2;
      margin-bottom: 2px; /* Reduced margin */
      font-size: 18px; /* Smaller heading */
    }
    .certificate-title h2 {
      color: #555;
      margin-top: 0;
      font-size: 14px; /* Smaller subheading */
    }
    .certificate-details {
      margin-top: 15px; /* Reduced margin */
    }
    .employee-details {
      background-color: #f9f9f9;
      padding: 12px; /* Reduced padding */
      border-radius: 5px; /* Smaller radius */
      margin-bottom: 15px; /* Reduced margin */
    }
    .detail-row {
      display: flex;
      margin-bottom: 6px; /* Reduced margin */
    }
    .detail-label {
      width: 40%;
      font-weight: bold;
      color: #555;
      font-size: 11px; /* Increased font size */
    }
    .detail-value {
      width: 60%;
      font-size: 11px; /* Increased font size */
    }
    .health-score-container {
      margin: 15px 0; /* Reduced margins */
      text-align: center;
    }
    .health-score {
      display: inline-block;
      width: 100px; /* Smaller circle */
      height: 100px; /* Smaller circle */
      border-radius: 50%;
      background-color: #f5f5f5;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); /* Smaller shadow */
      margin: 0 auto 10px; /* Reduced margin */
    }
    .score-value {
      font-size: 36px; /* Larger font */
      font-weight: bold;
    }
    .score-label {
      font-size: 11px; /* Increased font size */
      color: #555;
    }
    .fitness-status {
      font-size: 20px; /* Larger font */
      font-weight: bold;
      margin-bottom: 15px; /* Reduced margin */
      text-align: center;
    }
    .interpretation {
      background-color: #f9f9f9;
      padding: 12px; /* Reduced padding */
      border-radius: 5px; /* Smaller radius */
      margin: 12px 0; /* Reduced margins */
    }
    .interpretation-title {
      font-weight: bold;
      margin-bottom: 6px; /* Reduced margin */
      color: #0096F2;
      font-size: 13px; /* Increased font size */
    }
    .interpretation-text {
      line-height: 1.4; /* Reduced line height */
      font-size: 11px; /* Increased font size */
    }
    .recommendations {
      margin: 15px 0; /* Reduced margins */
    }
    .recommendations h3 {
      color: #0096F2;
      margin-bottom: 8px; /* Reduced margin */
      font-size: 13px; /* Increased font size */
    }
    .recommendations ul {
      padding-left: 15px; /* Reduced padding */
      line-height: 1.4; /* Reduced line height */
    }
    .recommendations li {
      margin-bottom: 4px; /* Reduced margin */
      font-size: 11px; /* Increased font size */
    }
    .signature-section {
      margin-top: 20px; /* Reduced margin */
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .doctor-signature {
      text-align: center;
      width: 45%;
    }
    .signature {
      height: 40px; /* Smaller signature area */
      margin-bottom: 5px; /* Reduced margin */
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .signature-image {
      max-height: 40px; /* Smaller image */
      max-width: 100%;
    }
    .signature-placeholder {
      font-style: italic;
      color: #999;
      border-top: 1px dashed #999;
      width: 100%;
      padding-top: 3px; /* Reduced padding */
      text-align: center;
      font-size: 10px; /* Increased font size */
    }
    .doctor-name {
      font-weight: bold;
      margin-bottom: 2px; /* Reduced margin */
      font-size: 11px; /* Increased font size */
    }
    .doctor-credentials {
      font-size: 10px; /* Increased font size */
      color: #555;
    }
    .approval-stamp {
      text-align: center;
      width: 45%;
    }
    .stamp {
      width: 85px; /* Slightly larger stamp */
      height: 85px; /* Slightly larger stamp */
      border: 1px solid #0096F2; /* Thinner border */
      border-radius: 50%;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      transform: rotate(-15deg);
      font-weight: bold;
      color: #0096F2;
      font-size: 12px; /* Increased font size */
    }
    .stamp-text {
      margin: 2px 0; /* Reduced margin */
      font-size: 11px; /* Increased font size */
    }
    .footer {
      margin-top: 15px; /* Reduced margin */
      padding-top: 10px; /* Reduced padding */
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 9px; /* Increased font size */
      color: #777;
    }
    .certificate-id {
      margin-top: 5px; /* Reduced margin */
      text-align: right;
      font-size: 9px; /* Increased font size */
      color: #999;
    }
    .validity-dates {
      display: flex;
      justify-content: space-between;
      margin: 12px 0; /* Reduced margins */
      padding: 8px; /* Reduced padding */
      background-color: #f0f8ff;
      border-radius: 5px; /* Smaller radius */
      border-left: 3px solid #0096F2; /* Thinner border */
    }
    .validity-item {
      text-align: center;
    }
    .validity-label {
      font-size: 10px; /* Increased font size */
      color: #555;
      margin-bottom: 5px;
    }
    .validity-value {
      font-weight: bold;
      font-size: 11px; /* Increased font size */
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80px; /* Smaller font */
      color: rgba(0, 150, 242, 0.03); /* More transparent */
      z-index: -1;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="certificate-border"></div>
    <div class="watermark">PREVA CARE</div>
    
    <div class="header">
      <div class="logo-container">
        ${logoHtml}
      </div>
      <div class="certificate-title">
        <h1>EMPLOYEE FITNESS CERTIFICATE</h1>
        <h2>Official Health Assessment</h2>
      </div>
      <div style="width: 80px;"></div>
    </div>
    
    <div class="certificate-details">
      <div class="employee-details">
        <div class="detail-row">
          <div class="detail-label">Employee Name:</div>
          <div class="detail-value">${sanitizeHtml(employeeName)}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Gender:</div>
          <div class="detail-value">${sanitizeHtml(gender)}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Company:</div>
          <div class="detail-value">${sanitizeHtml(companyName)}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Company Address:</div>
          <div class="detail-value">${sanitizeHtml(address)}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Assessment Date:</div>
          <div class="detail-value">${formatDate(date)}</div>
        </div>
        <div class="detail-row">
          <div class="detail-label">Health Category:</div>
          <div class="detail-value">${sanitizeHtml(healthCategory)}</div>
        </div>
      </div>
      
      <div class="health-score-container">
        <div class="health-score" style="border: 5px solid ${getScoreColor(
          overAllHealthScore
        )};">
          <div class="score-value" style="color: ${getScoreColor(
            overAllHealthScore
          )};">${overAllHealthScore}%</div>
          <div class="score-label">Health Score</div>
        </div>
      </div>
      
      <div class="fitness-status" style="color: ${getScoreColor(
        overAllHealthScore
      )};">
        ${sanitizeHtml(interpretation)}
      </div>
      
      <div class="validity-dates">
        <div class="validity-item">
          <div class="validity-label">Certificate Issue Date</div>
          <div class="validity-value">${formatDate(issuedDate)}</div>
        </div>
        <div class="validity-item">
          <div class="validity-label">Valid Until</div>
          <div class="validity-value">${formatDate(validUntil)}</div>
        </div>
      </div>
      
      <div class="interpretation">
        <div class="interpretation-title">Health Interpretation</div>
        <div class="interpretation-text">${sanitizeHtml(
          interpretationNotes
        )}</div>
      </div>
      
      <div class="recommendations">
        <h3>Health Recommendations</h3>
        <ul>
          ${recommendationsList}
        </ul>
      </div>
      
      <div class="signature-section">
        <div class="doctor-signature">
          <div class="signature">
            ${doctorSignatureHtml}
          </div>
          <div class="doctor-name">Dr. ${doctor?.firstName || ""} ${
    doctor?.lastName || ""
  }</div>
          <div class="doctor-credentials">${doctor?.specialization || ""}</div>
          <div class="doctor-credentials">Reg. No: ${
            doctor?.registrationNumber || ""
          }</div>
        </div>
        
        <div class="approval-stamp">
          <div class="stamp">
            <div class="stamp-text">CERTIFIED</div>
            <div class="stamp-text">${
              interpretation === "Fit and Healthy" ? "FIT" : interpretation
            }</div>
            <div class="stamp-text">${formatDate(issuedDate)}</div>
          </div>
        </div>
      </div>
      
      <div class="footer">
        This certificate is issued by Preva Care and is valid for 180 days from the date of issue.
        <br>For verification or any queries, please contact support@prevacare.com
      </div>
      
      <div class="certificate-id">
        Certificate ID: ${certificationId} | Employee ID: ${employeeId}
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

// Main certificate generation functions
const generateHealthCertificateCompanyFn = async (certificateData, res) => {
  let browser = null;
  let pdfFilePath = null;
  let logoTempPath = null;
  let logoBase64 = null;

  try {
    // Ensure temp directory exists
    const tempDir = path.resolve(__dirname, "../../../public/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Load logo
    try {
      const logoPath = path.resolve(__dirname, "../../../public/logo.png");
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      }
    } catch (err) {
      console.error("Error loading logo:", err);
    }

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      ignoreHTTPSErrors: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Generate HTML content
    const htmlContent = getHealthCertificateHTML(certificateData, logoBase64);

    // Set content
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
      displayHeaderFooter: true,
      // headerTemplate: `<div style="font-size:10px; text-align:center; width:100%; padding-top:5mm;">Corporate Health Certificate</div>`,
      footerTemplate: `<div style="font-size:8px; text-align:center; width:100%; padding-bottom:10mm;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </div>`,
      preferCSSPageSize: true,
    });

    // Close browser
    await browser.close();
    browser = null;

    // Save the PDF temporarily
    const fileName = `CorporateHealthCertificate_${Date.now()}.pdf`;
    pdfFilePath = path.join(tempDir, fileName);
    fs.writeFileSync(pdfFilePath, pdfBuffer);

    // Send file as download
    return res.download(pdfFilePath, fileName, (err) => {
      if (err) {
        console.error("Download error:", err);
      }
      // Clean up file after download
      try {
        if (fs.existsSync(pdfFilePath)) {
          fs.unlinkSync(pdfFilePath);
        }
      } catch (cleanupErr) {
        console.error("Cleanup error:", cleanupErr);
      }
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Failed to generate health certificate PDF"
    );
  } finally {
    // Ensure browser is closed
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error("Error closing browser:", closeErr);
      }
    }
  }
};

const generateCorporateEmployeeFitnessCertificatePDFFn = async (
  certificateData,
  res
) => {
  console.log("Starting PDF generation process...");
  let browser = null;
  let pdfFilePath = null;
  let logoBase64 = null;

  try {
    // Ensure temp directory exists
    const tempDir = path.resolve(__dirname, "../../../public/temp");
    console.log("Temp directory path:", tempDir);

    if (!fs.existsSync(tempDir)) {
      console.log("Creating temp directory as it doesn't exist");
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Load logo
    try {
      console.log("Attempting to load logo...");
      const logoPath = path.resolve(__dirname, "../../../public/logo.png");
      console.log("Logo path:", logoPath);

      if (fs.existsSync(logoPath)) {
        console.log("Logo file exists, reading it");
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
        console.log("Logo loaded successfully");
      } else {
        console.log("Logo file does not exist");
      }
    } catch (err) {
      console.error("Error loading logo:", err);
    }

    // Launch browser
    console.log("Launching Puppeteer browser...");
    browser = await puppeteer.launch({
      headless: true,
      ignoreHTTPSErrors: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });
    console.log("Browser launched successfully");

    const page = await browser.newPage();
    console.log("New page created");

    // Generate HTML content
    console.log("Generating HTML content for certificate");
    const htmlContent = getEmployeeFitnessCertificateHTML(
      certificateData,
      logoBase64
    );
    console.log("HTML content generated");

    // Set content
    console.log("Setting page content");
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    console.log("Page content set successfully");

    // Generate PDF
    console.log("Generating PDF...");
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
      displayHeaderFooter: true,
      // headerTemplate: `<div style="font-size:10px; text-align:center; width:100%; padding-top:5mm;">Employee Fitness Certificate</div>`,
      footerTemplate: `<div style="font-size:8px; text-align:center; width:100%; padding-bottom:10mm;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </div>`,
      preferCSSPageSize: true,
    });
    console.log("PDF generated successfully");

    // Close browser
    console.log("Closing browser");
    await browser.close();
    browser = null;
    console.log("Browser closed");

    // Save the PDF temporarily
    const fileName = `EmployeeFitnessCertificate_${Date.now()}.pdf`;
    pdfFilePath = path.join(tempDir, fileName);
    console.log("Saving PDF to:", pdfFilePath);
    fs.writeFileSync(pdfFilePath, pdfBuffer);
    console.log("PDF saved successfully");

    // Send file as download
    console.log("Sending file as download response");
    return res.download(pdfFilePath, fileName, (err) => {
      if (err) {
        console.error("Download error:", err);
      }
      // Clean up file after download
      try {
        if (fs.existsSync(pdfFilePath)) {
          console.log("Cleaning up temporary PDF file");
          fs.unlinkSync(pdfFilePath);
          console.log("Temporary PDF file removed");
        }
      } catch (cleanupErr) {
        console.error("Cleanup error:", cleanupErr);
      }
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    console.error("Error stack:", err.stack);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Failed to generate employee fitness certificate PDF"
    );
  } finally {
    // Ensure browser is closed
    if (browser) {
      try {
        console.log("Closing browser in finally block");
        await browser.close();
        console.log("Browser closed successfully in finally block");
      } catch (closeErr) {
        console.error("Error closing browser:", closeErr);
      }
    }
  }
};

module.exports = {
  generateCorporateHealthCertificate,
  generateCorporateEmployeeFitnessCertificate,
  generateHealthCertificateCompanyFn,
  generateCorporateEmployeeFitnessCertificatePDFFn,
};
