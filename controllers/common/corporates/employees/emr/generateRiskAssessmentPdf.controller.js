const fs = require("fs");
const dayjs = require("dayjs");
const path = require("path");
const puppeteer = require("puppeteer");
const {
  uploadToS3,
} = require("../../../../../middlewares/uploads/awsConfig.js");

// Generate Risk Assessment PDF
const generateRiskAssessmentPDF = async (req, res) => {
  let browser = null;
  let pdfFilePath = null;
  let logoTempPath = null;
  let logoBase64 = null;

  try {
    const {
      coronaryHeartData = [],
      diabeticRiskScoreData = [],
      strokeRiskScoreData = [],
      liverRiskScoreData = [],
      patientName = "",
      employeeId = "",
    } = req.body;

    // Ensure temp directory exists
    const tempDir = path.resolve(__dirname, "../../../../../public/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const debugDir = path.resolve(tempDir, "debug");
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }

    // Load logo as base64
    try {
      const logoPath = path.resolve(
        __dirname,
        "../../../../../public/logo1.png"
      );
      console.log("Looking for logo at:", logoPath);
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
        console.log("Logo loaded successfully");
      } else {
        console.error("Logo file not found at path:", logoPath);
      }
    } catch (err) {
      console.error("Error loading logo:", err);
    }

    // Launch browser
    console.log("Launching browser for Risk Assessment PDF generation");
    try {
      const options = {
        headless: "new",
        executablePath:
          process.platform === "win32"
            ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
            : process.platform === "linux"
              ? "/usr/bin/google-chrome"
              : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-web-security",
          "--disable-features=IsolateOrigins",
          "--disable-site-isolation-trials",
        ],
        timeout: 60000,
        protocolTimeout: 60000,
      };

      // Check for Chrome executable in different locations
      const possiblePaths = [
        process.env.PUPPETEER_EXECUTABLE_PATH, // First check if explicitly set in env
        "/usr/bin/google-chrome",
        "/usr/bin/chromium",
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
      ];

      let executablePath = null;
      for (const path of possiblePaths) {
        if (path && fs.existsSync(path)) {
          executablePath = path;
          break;
        }
      }

      if (executablePath) {
        console.log("Using Chrome executable path:", executablePath);
        options.executablePath = executablePath;
      } else {
        console.log(
          "No Chrome executable found in standard locations, using bundled Chromium"
        );
        // Let Puppeteer use its bundled version
        delete options.executablePath;
      }

      console.log(
        "Launching browser with options:",
        JSON.stringify(options, null, 2)
      );
      browser = await puppeteer.launch(options);

      if (!browser) {
        throw new Error("Browser launch returned null");
      }

      console.log("Browser launched successfully");

      // Create a new page
      const page = await browser.newPage();
      console.log("New page created");

      // Set viewport
      await page.setViewport({ width: 1200, height: 800 });

      // Generate HTML content
      const htmlContent = getRiskAssessmentHTML({
        coronaryHeartData,
        diabeticRiskScoreData,
        strokeRiskScoreData,
        liverRiskScoreData,
        patientName,
        employeeId,
        logoBase64,
      });

      // Add embedded Bootstrap CSS
      const bootstrapCSS = `
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
            line-height: 1.6;
            font-size: 12px;
          }
          .header {
            background: #ffffff;
            padding: 1.5rem;
            color: #333;
            margin-bottom: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 4px solid #0096F2;
          }
          .logo {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            min-width: 120px;
            margin-left: 1rem;
          }
          .logo img {
            max-height: 46px;
            object-fit: contain;
            background-color: #ffffff;
            padding: 10px;
            border-radius: 10px;
          }
          .logo-address {
            font-size: 0.7rem;
            color: #666;
            text-align: right;
            margin-top: 0.5rem;
            max-width: 200px;
            word-wrap: break-word;
          }
          .title {
            text-align: center;
            margin: 1.5rem 0;
            font-size: 1.2rem;
            font-weight: 700;
            color: #0096F2;
            text-transform: uppercase;
          }
          .section-title {
            background-color: #0096F2;
            color: white;
            padding: 8px 12px;
            font-weight: 600;
            font-size: 0.8rem;
            margin-bottom: 0;
            border-radius: 4px 4px 0 0;
          }
          .section-container {
            margin-bottom: 1.5rem;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .table-container {
            margin-bottom: 1.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-radius: 0 0 4px 4px;
            overflow: hidden;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            table-layout: fixed;
          }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          th, td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
            word-wrap: break-word;
            overflow-wrap: break-word;
            vertical-align: middle;
          }
          th {
            background-color: #f8f9fa;
            color: #333;
            font-weight: 600;
          }
          td.risk-level-cell {
            width: 160px;
            min-width: 120px;
            max-width: 180px;
            text-align: center;
          }
          .risk-level {
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 100px;
            min-height: 48px;
            font-weight: bold;
            font-size: 1rem;
            border-radius: 8px;
            margin: 0 auto;
          }
          .risk-level.low {
            background-color: #d4edda;
            color: #155724;
          }
          .risk-level.moderate {
            background-color: #fff3cd;
            color: #856404;
          }
          .risk-level.high {
            background-color: #f8d7da;
            color: #721c24;
          }
          .risk-level.very-high {
            background-color: #dc3545;
            color: white;
          }
          .footer {
            background: #0096F2;
            color: white;
            text-align: center;
            padding: 0.8rem 0;
            font-size: 0.9rem;
            margin-top: 2rem;
            border-radius: 4px;
          }
          .page-break {
            page-break-after: always;
          }
        </style>
      `;

      const enhancedHtml = htmlContent.replace(
        "</head>",
        `${bootstrapCSS}</head>`
      );

      // Set content
      await page.setContent(enhancedHtml, {
        waitUntil: ["networkidle0", "domcontentloaded"],
        timeout: 30000,
      });
      console.log("Page content set successfully");

      // Wait for any dynamic content to settle
      await new Promise((resolve) => setTimeout(resolve, 1000));

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
        headerTemplate:
          '<div style="font-size:10px; text-align:center; width:100%; margin: 20px;">Risk Assessment Report</div>',
        footerTemplate:
          '<div style="font-size:8px; text-align:center; width:100%; margin: 20px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span><div style="margin-top:5px;">© 2025 Preva Care</div></div>',
        preferCSSPageSize: true,
        timeout: 30000,
      });
      console.log("PDF generated successfully");

      const pdfFileName = `RiskAssessment_${employeeId}_${Date.now()}.pdf`;
      pdfFilePath = path.join(tempDir, pdfFileName);
      fs.writeFileSync(pdfFilePath, pdfBuffer);

      try {
        const s3UploadResult = await uploadToS3({
          buffer: pdfBuffer,
          originalname: pdfFileName,
          mimetype: "application/pdf",
        });
        console.log("PDF uploaded to S3:", s3UploadResult);
        return res.send(s3UploadResult.Location);
      } catch (uploadErr) {
        console.error("Error uploading PDF to S3:", uploadErr);
        return res.download(pdfFilePath, pdfFileName);
      }
    } catch (err) {
      console.error("Error in PDF generation:", err);
      throw err;
    } finally {
      if (browser) {
        try {
          await browser.close();
          console.log("Browser closed successfully");
        } catch (closeErr) {
          console.error("Error closing browser:", closeErr);
        }
      }
      // Clean up temp files
      if (logoTempPath && fs.existsSync(logoTempPath)) {
        try {
          fs.unlinkSync(logoTempPath);
        } catch (err) {
          console.error("Error removing temporary logo:", err);
        }
      }
    }
  } catch (err) {
    console.error("PDF generation error:", err);
    return res.status(500).json({
      error: "Failed to generate PDF",
      details: err.message,
    });
  }
};

function getRiskAssessmentHTML(data) {
  const {
    coronaryHeartData = [],
    diabeticRiskScoreData = [],
    strokeRiskScoreData = [],
    liverRiskScoreData = [],
    patientName = "",
    employeeId = "",
    logoBase64 = "",
  } = data;

  const formatDate = (date) => {
    return date ? dayjs(date).format("DD/MM/YYYY") : "";
  };

  const getRiskLevelClass = (level) => {
    if (!level) return "";
    const lowerLevel = level.toLowerCase();
    if (lowerLevel.includes("very high")) return "very-high";
    return lowerLevel;
  };

  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="Preva Care Logo" style="max-height:40px; background-color:#ffffff; padding:10px; border-radius:10px;" />`
    : `<div style="background:#ffffff; padding:10px; border-radius:10px; font-weight:bold; color:#4b90e2; text-align:center;">
           <span style="font-size:1.5rem;">Preva Care</span>
         </div>`;

  const noDataMessage = `
        <div style="text-align: center; padding: 30px; color: #666; background: #f9f9f9; border-radius: 4px; margin: 10px 0;">
            <div style="font-size: 14px;">No data available</div>
        </div>
    `;

  const renderTable = (data, headers, rowRenderer) => {
    if (data.length === 0) {
      return noDataMessage;
    }
    return `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
                    </thead>
                    <tbody>
                        ${data.map(rowRenderer).join("")}
                    </tbody>
                </table>
            </div>
        `;
  };

  // Collect all table HTMLs
  const tables = [];

  // Coronary Heart Disease Risk Assessment
  tables.push(`
        <div class="section-container">
            <h4 class="section-title">Coronary Heart Disease Risk Assessment</h4>
            ${renderTable(
              coronaryHeartData,
              ["Date", "Risk Percentage", "Risk Level"],
              (assessment) => `
                    <tr>
                        <td>${formatDate(assessment.createdAt)}</td>
                        <td>${assessment.riskPercentage}%</td>
                        <td class="risk-level-cell">
                            <span class="risk-level ${getRiskLevelClass(
                              assessment.riskLevel
                            )}">
                                ${assessment.riskLevel || "Not Available"}
                            </span>
                        </td>
                    </tr>
                `
            )}
        </div>
    `);

  // Diabetic Risk Assessment
  tables.push(`
        <div class="section-container">
            <h4 class="section-title">Diabetic Risk Assessment</h4>
            ${renderTable(
              diabeticRiskScoreData,
              ["Date", "Total Score", "Risk Level"],
              (assessment) => `
                    <tr>
                        <td>${formatDate(assessment.createdAt)}</td>
                        <td>${assessment.totalScore}</td>
                        <td class="risk-level-cell">
                            <span class="risk-level ${getRiskLevelClass(
                              assessment.riskLevel
                            )}">
                                ${assessment.riskLevel || "Not Available"}
                            </span>
                        </td>
                    </tr>
                `
            )}
        </div>
    `);

  // Stroke Risk Assessment
  tables.push(`
        <div class="section-container">
            <h4 class="section-title">Stroke Risk Assessment</h4>
            ${renderTable(
              strokeRiskScoreData,
              ["Date", "Risk Score", "Description"],
              (assessment) => `
                    <tr>
                        <td>${formatDate(assessment.createdAt)}</td>
                        <td>${((assessment.lowerRiskScore+assessment.higherRiskScore)/2).toFixed(2)}</td>
                        <td>${assessment.desc || "Not Available"}</td>
                    </tr>
                `
            )}
        </div>
    `);

  // Liver Risk Assessment
  tables.push(`
        <div class="section-container">
            <h4 class="section-title">Liver Risk Assessment</h4>
            ${renderTable(
              liverRiskScoreData,
              ["Date", "Risk Score", "Risk Level"],
              (assessment) => `
                    <tr>
                        <td>${formatDate(assessment.createdAt)}</td>
                        <td>${assessment.riskScore}</td>
                        <td class="risk-level-cell">
                            <span class="risk-level ${getRiskLevelClass(
                              assessment.riskLevel
                            )}">
                                ${assessment.riskLevel || "Not Available"}
                            </span>
                        </td>
                    </tr>
                `
            )}
        </div>
    `);

  return `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <title>Risk Assessment Report</title>
    </head>
    <body>
        <div class="header">
            <div class="patient-info">
                <h2>${patientName}</h2>
                <p>Employee ID: ${employeeId}</p>
                <p>Date: ${formatDate(new Date())}</p>
            </div>
            <div class="logo">
                ${logoHtml}
                <div class="logo-address">Registered Office : P-1 GROUND FLOOR B/P P-1 TO P-20 NDSE II OPP. LI/11 , Delhi, India - 110049</div>
            </div>
        </div>

        <h1 class="title">Risk Assessment Report</h1>

        <div class="container-fluid px-4">
            ${tables.join("")}
        </div>

        <div class="footer">
            <span>© 2025 Preva Care | Risk Assessment Report</span>
        </div>
    </body>
</html>
`;
}

module.exports = {
  generateRiskAssessmentPDF,
};
