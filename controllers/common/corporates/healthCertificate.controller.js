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
const cacheManager = require("../../../utils/cacheManager");
const templateManager = require("../../../utils/templateManager");

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
    ? `<img src="${logoBase64}" alt="Company Logo" class="logo-image" style="max-width: 100%; height: auto;" />`
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

// Enhanced version with optimized DB operations
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

    // Performance timing
    const startTime = Date.now();

    // Check if we have this certificate data cached
    const cacheKey = `fitness_certificate:${employeeId}`;
    const cachedData = cacheManager.get(cacheKey);

    if (cachedData) {
      console.log(`Using cached certificate data for employee ${employeeId}`);
      try {
        console.log("Generating PDF from cached data...");
        await generateCorporateEmployeeFitnessCertificatePDFFn(cachedData, res);
        console.log("PDF generation from cache successful");
        return;
      } catch (pdfError) {
        console.error("ERROR generating PDF from cache:", pdfError);
        // Continue with fresh data generation
      }
    }

    // Run database queries in parallel
    console.log("Fetching all required data in parallel...");
    const [employeeData, latestHealthScore, latestEmrDoctor] =
      await Promise.all([
        // Query 1: Get employee and corporate data
        Employee.findById(employeeId)
          .populate({
            path: "corporate",
            select: "companyName addresses",
            populate: { path: "addresses", select: "name city zipCode state" },
          })
          .lean(),

        // Query 2: Get latest health score
        healthScoreModel
          .findOne({ user: employeeId })
          .sort({ createdAt: -1 })
          .lean(),

        // Query 3: Get latest EMR with doctor info
        EMR.findOne({ user: employeeId })
          .sort({ createdAt: -1 })
          .populate({
            path: "doctor",
            select:
              "firstName lastName specialization degree registrationNumber eSign",
          })
          .lean(),
      ]);

    const queryTime = Date.now() - startTime;
    console.log(`Database queries completed in ${queryTime}ms`);

    // Validate results
    if (!employeeData) {
      console.log("ERROR: Employee not found with ID:", employeeId);
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    if (!employeeData.corporate) {
      console.log(
        "ERROR: Corporate information missing for employee:",
        employeeId
      );
      return res.status(404).json({
        success: false,
        message: "Corporate information not found for this employee",
      });
    }

    if (!latestHealthScore) {
      console.log("ERROR: No health score found for employee:", employeeId);
      return res.status(404).json({
        success: false,
        message: "No health score found for this employee",
      });
    }

    // Extract required data
    const { _id, firstName, lastName, gender, corporate } = employeeData;
    const { overallHealthScore, createdAt } = latestHealthScore;

    // Determine interpretation
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

    // Construct certificate data
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
      employeeId: _id,
      certificationId: `EMP-FC-${Date.now().toString().slice(-6)}`,
      issuedDate: new Date(),
      validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // Valid for 180 days
      healthCategory: determineHealthCategory(overallHealthScore),
      recommendations: generatePersonalRecommendations(overallHealthScore),
    };

    // Validate doctor data
    if (!employeeFitnessData.doctor) {
      console.log("ERROR: Doctor not assigned in the fitness data");
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "doctor not assigned!"
      );
    }

    // Cache the certificate data for future requests (10 minute TTL)
    cacheManager.set(cacheKey, employeeFitnessData, 600);

    // Log total preparation time
    const prepTime = Date.now() - startTime;
    console.log(`Certificate data prepared in ${prepTime}ms`);

    // Generate PDF
    console.log("Generating PDF...");
    try {
      await generateCorporateEmployeeFitnessCertificatePDFFn(
        employeeFitnessData,
        res
      );
      console.log("PDF generation successful");
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

// Compile the employee fitness certificate template for reuse
const getEmployeeFitnessCertificateHTML = (data, logoBase64) => {
  // Format dates function
  const formatDate = (date) => {
    return date ? dayjs(date).format("DD MMM YYYY") : "";
  };

  // Color coding function
  const getScoreColor = (score) => {
    if (score >= 85) return "#28a745"; // Green
    if (score >= 70) return "#17a2b8"; // Blue
    if (score >= 50) return "#ffc107"; // Yellow
    return "#dc3545"; // Red
  };

  // Generate recommendation list
  const recommendationsList = data.recommendations
    ? data.recommendations
        .map((rec) => `<li>${sanitizeHtml(rec)}</li>`)
        .join("")
    : "";

  // Important: Ensure logo HTML is properly constructed
  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="Company Logo" class="logo-image" style="max-width: 100%; height: auto;" />`
    : `<div class="logo-placeholder">Preva Care</div>`;

  // Doctor signature HTML
  const doctorSignatureHtml = data.doctor?.eSign
    ? `<img src="${data.doctor.eSign}" alt="Doctor Signature" class="signature-image" />`
    : '<div class="signature-placeholder">Signature Pending</div>';

  // Build the HTML content
  const html = `
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
            <div class="detail-value">${sanitizeHtml(data.employeeName)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Gender:</div>
            <div class="detail-value">${sanitizeHtml(data.gender)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Company:</div>
            <div class="detail-value">${sanitizeHtml(data.companyName)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Company Address:</div>
            <div class="detail-value">${sanitizeHtml(data.address)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Assessment Date:</div>
            <div class="detail-value">${formatDate(data.date)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Health Category:</div>
            <div class="detail-value">${sanitizeHtml(data.healthCategory)}</div>
          </div>
        </div>
        
        <div class="health-score-container">
          <div class="health-score" style="border: 5px solid ${getScoreColor(
            data.overAllHealthScore
          )};">
            <div class="score-value" style="color: ${getScoreColor(
              data.overAllHealthScore
            )};">${data.overAllHealthScore}%</div>
            <div class="score-label">Health Score</div>
          </div>
        </div>
        
        <div class="fitness-status" style="color: ${getScoreColor(
          data.overAllHealthScore
        )};">
          ${sanitizeHtml(data.interpretation)}
        </div>
        
        <div class="validity-dates">
          <div class="validity-item">
            <div class="validity-label">Certificate Issue Date</div>
            <div class="validity-value">${formatDate(data.issuedDate)}</div>
          </div>
          <div class="validity-item">
            <div class="validity-label">Valid Until</div>
            <div class="validity-value">${formatDate(data.validUntil)}</div>
          </div>
        </div>
        
        <div class="interpretation">
          <div class="interpretation-title">Health Interpretation</div>
          <div class="interpretation-text">${sanitizeHtml(
            data.interpretationNotes
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
            <div class="doctor-name">Dr. ${sanitizeHtml(
              data.doctor?.firstName || ""
            )} ${sanitizeHtml(data.doctor?.lastName || "")}</div>
            <div class="doctor-credentials">${sanitizeHtml(
              data.doctor?.specialization || ""
            )}</div>
            <div class="doctor-credentials">Reg. No: ${sanitizeHtml(
              data.doctor?.registrationNumber || ""
            )}</div>
          </div>
          
          <div class="approval-stamp">
            <div class="stamp">
              <div class="stamp-text">CERTIFIED</div>
              <div class="stamp-text">${
                data.interpretation === "Fit and Healthy"
                  ? "FIT"
                  : data.interpretation
              }</div>
              <div class="stamp-text">${formatDate(data.issuedDate)}</div>
            </div>
          </div>
        </div>
        
        <div class="footer">
          This certificate is issued by Preva Care and is valid for 180 days from the date of issue.
          <br>For verification or any queries, please contact support@prevacare.com
        </div>
        
        <div class="certificate-id">
          Certificate ID: ${sanitizeHtml(
            data.certificationId
          )} | Employee ID: ${sanitizeHtml(data.employeeId)}
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  // Return optimized HTML
  return templateManager.optimizeHtml(html);
};

// Compile the employee fitness certificate template for reuse
const compiledEmployeeFitnessTemplate = templateManager.compileTemplate(
  "employeeFitnessCertificate",
  getEmployeeFitnessCertificateHTML
);

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

// Cache for the logo base64 data
let cachedLogoBase64 = null;

// Enhanced function to get the logo from a pre-encoded base64 file and cache it
const getLogoBase64 = async () => {
  if (cachedLogoBase64) {
    return cachedLogoBase64;
  }
  try {
    const base64Path = path.resolve(
      __dirname,
      "../../../public/logo.base64.txt"
    );
    if (fs.existsSync(base64Path)) {
      const base64Data = fs
        .readFileSync(base64Path, "utf8")
        .replace(/\r?\n|\r/g, "");
      cachedLogoBase64 = `data:image/png;base64,${base64Data}`;
      return cachedLogoBase64;
    }
    // fallback: try to load and encode logo.png if base64 file is missing
    const logoPath = path.resolve(__dirname, "../../../public/logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      cachedLogoBase64 = `data:image/png;base64,${logoBuffer.toString(
        "base64"
      )}`;
      return cachedLogoBase64;
    }
    return null;
  } catch (err) {
    console.error("Error loading logo base64:", err);
    return null;
  }
};

// Modify the generateCorporateEmployeeFitnessCertificatePDFFn function to ensure logo is loaded correctly
const generateCorporateEmployeeFitnessCertificatePDFFn = async (
  certificateData,
  res
) => {
  console.log("Starting PDF generation process...");
  let browser = null;
  let page = null;
  let pdfFilePath = null;

  try {
    // Performance timing
    const startTime = Date.now();

    // Get temp directory path
    const tempDir = path.resolve(__dirname, "../../../public/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Get logo (using cached version) with improved logging
    console.log("Getting logo...");
    const logoBase64 = await getLogoBase64();
    if (logoBase64) {
      console.log("Logo retrieved successfully");
    } else {
      console.log("Logo not found, will use placeholder");
    }

    // Generate HTML content before browser operations - use compiled template
    console.log("Generating HTML content for certificate");
    const htmlContent = compiledEmployeeFitnessTemplate(
      certificateData,
      logoBase64
    );

    // For debugging, save the HTML to a file
    const htmlDebugPath = path.join(
      tempDir,
      `debug_certificate_${Date.now()}.html`
    );
    fs.writeFileSync(htmlDebugPath, htmlContent);
    console.log("Debug HTML saved to:", htmlDebugPath);

    console.log("HTML content generated");

    // Acquire browser from pool instead of launching a new one
    console.log("Acquiring browser from pool...");
    browser = await global.browserPool.acquire();
    console.log("Browser acquired from pool");

    // Create a new page
    console.log("Creating new page");
    page = await browser.newPage();
    console.log("New page created");

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
      footerTemplate: `<div style="font-size:8px; text-align:center; width:100%; padding-bottom:10mm;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </div>`,
      preferCSSPageSize: true,
    });
    console.log("PDF generated successfully");

    // Close page but keep browser for reuse
    console.log("Closing page");
    await page.close();
    page = null;
    console.log("Page closed");

    // Track performance metrics
    const pdfGenerationTime = Date.now() - startTime;
    console.log(`PDF generation time: ${pdfGenerationTime}ms`);

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
    // Close page if still open
    if (page) {
      try {
        await page.close();
      } catch (closeErr) {
        console.error("Error closing page:", closeErr);
      }
    }

    // Return browser to pool instead of closing it
    if (browser) {
      try {
        console.log("Returning browser to pool");
        await global.browserPool.release(browser);
        console.log("Browser returned to pool");
      } catch (releaseErr) {
        console.error("Error returning browser to pool:", releaseErr);
        // If we can't return to pool, try to close it
        try {
          await browser.close();
        } catch (closeErr) {
          console.error("Error closing browser:", closeErr);
        }
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
