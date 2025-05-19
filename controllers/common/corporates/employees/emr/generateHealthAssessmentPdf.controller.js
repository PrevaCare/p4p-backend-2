const fs = require("fs");
const dayjs = require("dayjs");
const path = require("path");
const puppeteer = require("puppeteer");
const {
  uploadToS3,
} = require("../../../../../middlewares/uploads/awsConfig.js");

const generateHealthAssessmentPDF = async (req, res) => {
  let browser = null;
  let pdfFilePath = null;
  let logoBase64 = null;

  try {
    const {
      currentConditionData = [],
      allergiesData = [],
      immunizationData = [],
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
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      }
    } catch (err) {
      console.error("Error loading logo:", err);
    }

    console.log(
      "Launching browser for Health Assessment PDF generation"
    );
    try {
      const options = {
        headless: "new",
        executablePath: process.platform === 'win32'
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
          : process.platform === 'linux'
            ? '/usr/bin/chromium-browser'
            : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=IsolateOrigins',
          '--disable-site-isolation-trials'
        ],
        timeout: 60000,
        protocolTimeout: 60000
      };

      // Check if we're in a Linux environment (likely production)
      if (process.platform === 'linux') {
        options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';
        console.log('Using executable path:', options.executablePath);
      }

      console.log('Launching browser with options:', JSON.stringify(options, null, 2));
      browser = await puppeteer.launch(options);

      if (!browser) {
        throw new Error('Browser launch returned null');
      }

      console.log('Browser launched successfully');

      // Create a new page
      const page = await browser.newPage();
      console.log('New page created');

      // Set viewport
      await page.setViewport({ width: 1200, height: 800 });

      const htmlContent = getHealthAssessmentHTML({
        currentConditionData,
        allergiesData,
        immunizationData,
        patientName,
        employeeId,
        logoBase64,
      });

      const bootstrapCSS = `
      <style>
        @page { 
          size: A4;
          margin: 0;
        }
        html {
          zoom: 0.75;
        }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          line-height: 1.6;
          font-size: 12px;
          background-color: white;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .main-container {
          padding: 30px;
          position: relative;
        }
        .header { 
          background: #ffffff;
          padding: 20px;
          color: #333;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 4px solid #0096F2;
          page-break-inside: avoid;
        }
        .patient-info {
          flex: 1;
        }
        .patient-info h2 {
          margin: 0 0 10px 0;
          font-size: 18px;
          color: #333;
        }
        .patient-info p {
          margin: 5px 0;
          font-size: 14px;
          color: #666;
        }
        .logo {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          min-width: 150px;
          margin-left: 20px;
        }
        .logo img {
          width: 120px;
          height: auto;
          object-fit: contain;
          background-color: #ffffff;
          padding: 5px;
          border-radius: 8px;
        }
        .logo-address {
          font-size: 10px;
          color: #666;
          text-align: right;
          margin-top: 8px;
          max-width: 200px;
          word-wrap: break-word;
        }
        .title { 
          text-align: center; 
          margin: 20px 0; 
          font-size: 24px; 
          font-weight: 700; 
          color: #0096F2; 
          text-transform: uppercase;
          page-break-after: avoid;
        }
        .section-container { 
          margin-bottom: 30px; 
          page-break-inside: avoid;
          page-break-before: auto;
          padding-top: 20px;
        }
        .section-container:first-of-type {
          padding-top: 0;
        }
        .section-title { 
          background-color: #0096F2; 
          color: white; 
          padding: 12px 15px; 
          font-weight: 600; 
          font-size: 14px; 
          margin: 0; 
          border-radius: 4px 4px 0 0;
          page-break-after: avoid;
        }
        .table-container { 
          margin: 0; 
          box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
          border-radius: 0 0 4px 4px; 
          overflow: hidden;
          page-break-inside: avoid;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 0; 
          background: white;
        }
        thead { 
          display: table-header-group;
        }
        tbody {
          page-break-inside: avoid;
        }
        tr { 
          page-break-inside: avoid;
        }
        th, td { 
          padding: 12px 15px; 
          text-align: left; 
          border-bottom: 1px solid #eee; 
          font-size: 12px;
          word-wrap: break-word; 
          max-width: 300px;
        }
        th { 
          background-color: #f8f9fa; 
          color: #333; 
          font-weight: 600;
          white-space: nowrap;
        }
        td {
          vertical-align: top;
        }
        .footer { 
          background: #0096F2; 
          color: white; 
          text-align: center; 
          padding: 15px 0; 
          font-size: 12px; 
          margin-top: 40px; 
          border-radius: 4px;
          position: relative;
          page-break-inside: avoid;
        }
        .container-fluid {
          padding: 0 20px;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .section-container {
            margin-top: 20px;
          }
          .section-title {
            background-color: #0096F2 !important;
            color: white !important;
          }
          .footer {
            background-color: #0096F2 !important;
            color: white !important;
            position: fixed;
            bottom: 40px;
            left: 20px;
            right: 20px;
          }
        }
      </style>
    `;

      const enhancedHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Health Assessment Report</title>
            ${bootstrapCSS}
          </head>
          <body>
            <div class="main-container">
              ${htmlContent}
            </div>
          </body>
        </html>
      `;

      // Set content
      await page.setContent(enhancedHtml, {
        waitUntil: ["networkidle0", "domcontentloaded"],
        timeout: 30000,
      });
      console.log('Page content set successfully');

      // Wait for any dynamic content to settle
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate PDF with adjusted settings
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "10mm",
          right: "10mm",
          bottom: "10mm",
          left: "10mm"
        },
        displayHeaderFooter: false,
        preferCSSPageSize: true,
        timeout: 30000
      });
      console.log('PDF generated successfully');

      const pdfFileName = `HealthAssessment_${employeeId}_${Date.now()}.pdf`;
      pdfFilePath = path.join(tempDir, pdfFileName);
      fs.writeFileSync(pdfFilePath, pdfBuffer);

      try {
        const s3UploadResult = await uploadToS3({
          buffer: pdfBuffer,
          originalname: pdfFileName,
          mimetype: "application/pdf",
        });
        return res.send(s3UploadResult.Location);
      } catch (uploadErr) {
        console.error('Error uploading to S3:', uploadErr);
        return res.download(pdfFilePath, pdfFileName);
      }
    } catch (err) {
      console.error('Error in PDF generation:', err);
      throw err;
    } finally {
      if (browser) {
        try {
          await browser.close();
          console.log('Browser closed successfully');
        } catch (closeErr) {
          console.error('Error closing browser:', closeErr);
        }
      }
    }
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Failed to generate PDF", details: err.message });
  }
};

function getHealthAssessmentHTML(data) {
  const {
    currentConditionData = [],
    allergiesData = [],
    immunizationData = [],
    patientName = "",
    employeeId = "",
    logoBase64 = "",
  } = data;
  const formatDate = (date) => (date ? dayjs(date).format("DD/MM/YYYY") : "");
  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="Preva Care Logo" style="max-height:40px; background-color:#ffffff; padding:10px; border-radius:10px;" />`
    : `<div style="background:#ffffff; padding:10px; border-radius:10px; font-weight:bold; color:#4b90e2; text-align:center;"><span style="font-size:1.5rem;">Preva Care</span></div>`;

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

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Health Assessment Report</title>
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
    <h1 class="title">Health Assessment Report</h1>
    <div class="container-fluid px-4">
      <div class="section-container">
        <h4 class="section-title">Current Conditions</h4>
        ${renderTable(
    currentConditionData,
    [
      "Diagnosis",
      "Date of Diagnosis",
      "Treatment Advised",
      "Referral Needed",
      "Notes",
    ],
    (item) => `
            <tr>
              <td>${item.diagnosisName || "-"}</td>
              <td>${formatDate(item.dateOfDiagnosis)}</td>
              <td>${item.prescription && item.prescription.length > 0
        ? item.prescription
          .map((p) => `${p.drugName} (${p.freequency})`)
          .join(", ")
        : "NONE"
      }</td>
              <td>${item.referralNeeded || "-"}</td>
              <td>${item.advice || "-"}</td>
            </tr>
          `
  )}
      </div>
      <div class="section-container">
        <h4 class="section-title">Allergies</h4>
        ${renderTable(
    allergiesData,
    ["Allergy", "Past Drugs", "Advised By", "Advice"],
    (item) => `
            <tr>
              <td>${item.allergyName || "-"}</td>
              <td>${item.pastAllergyDrugName && item.pastAllergyDrugName.length > 0
        ? item.pastAllergyDrugName
          .map(
            (drug, idx) =>
              `${drug} (${item.pastAllergyFreequency[idx] || "-"})`
          )
          .join(", ")
        : "None"
      }</td>
              <td>${item.advisedBy || "-"}</td>
              <td>${item.advise || "-"}</td>
            </tr>
          `
  )}
      </div>
      <div class="section-container">
        <h4 class="section-title">Immunization</h4>
        ${renderTable(
    immunizationData,
    [
      "Vaccination Name",
      "Type",
      "No Of Doses",
      "Next Dose Date",
      "Doctor Name",
      "Side Effects",
      "Notes",
    ],
    (item) => `
            <tr>
              <td>${item.vaccinationName || "-"}</td>
              <td>${item.immunizationType || "-"}</td>
              <td>${item.totalDose || "-"}</td>
              <td>${item.doseDates && item.doseDates.length > 0
        ? item.doseDates
          .map((d) =>
            d.date
              ? dayjs(d.date).format("DD-MM-YYYY") +
              ` [${d.status}]`
              : "N/A"
          )
          .join(", ")
        : "NA"
      }</td>
              <td>${item.doctorName || "-"}</td>
              <td>${item.sideEffects || "N/A"}</td>
              <td>${item.immunizationNotes || "N/A"}</td>
            </tr>
          `
  )}
      </div>
    </div>
    <div class="footer">
      <span>© 2025 Preva Care | Health Assessment Report</span>
    </div>
  </body>
</html>
`;
}

module.exports = { generateHealthAssessmentPDF };
