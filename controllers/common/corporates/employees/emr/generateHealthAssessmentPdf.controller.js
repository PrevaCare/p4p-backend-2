const fs = require("fs");
const dayjs = require("dayjs");
const path = require("path");
const puppeteer = require("puppeteer");
const { uploadToS3 } = require("../../../../../middlewares/uploads/awsConfig.js");

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
      employeeId = ""
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
      const logoPath = path.resolve(__dirname, "../../../../../public/logo1.png");
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      }
    } catch (err) {
      console.error("Error loading logo:", err);
    }

    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--allow-file-access-from-files",
      ],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    const htmlContent = getHealthAssessmentHTML({
      currentConditionData,
      allergiesData,
      immunizationData,
      patientName,
      employeeId,
      logoBase64
    });

    const bootstrapCSS = `
      <style>
        @page { size: A4; margin: 15mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; margin: 0; padding: 0; color: #333; line-height: 1.6; font-size: 12px; }
        .header { background: #ffffff; padding: 1.5rem; color: #333; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #0096F2; }
        .logo { display: flex; flex-direction: column; align-items: flex-end; min-width: 120px; margin-left: 1rem; }
        .logo img { max-height: 46px; object-fit: contain; background-color: #ffffff; padding: 10px; border-radius: 10px; }
        .logo-address { font-size: 0.7rem; color: #666; text-align: right; margin-top: 0.5rem; max-width: 200px; word-wrap: break-word; }
        .title { text-align: center; margin: 1.5rem 0; font-size: 1.2rem; font-weight: 700; color: #0096F2; text-transform: uppercase; }
        .section-title { background-color: #0096F2; color: white; padding: 8px 12px; font-weight: 600; font-size: 0.8rem; margin-bottom: 0; border-radius: 4px 4px 0 0; }
        .section-container { margin-bottom: 1.5rem; page-break-inside: avoid; break-inside: avoid; }
        .table-container { margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 0 0 4px 4px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; margin: 0; table-layout: fixed; }
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        tr { break-inside: avoid; page-break-inside: avoid; }
        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #eee; word-wrap: break-word; overflow-wrap: break-word; vertical-align: middle; }
        th { background-color: #f8f9fa; color: #333; font-weight: 600; }
        .footer { background: #0096F2; color: white; text-align: center; padding: 0.8rem 0; font-size: 0.9rem; margin-top: 2rem; border-radius: 4px; }
      </style>
    `;
    const enhancedHtml = htmlContent.replace("</head>", `${bootstrapCSS}</head>`);
    await page.setContent(enhancedHtml, { waitUntil: "networkidle0", timeout: 60000 });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:10px; text-align:center; width:100%; padding-top:5mm;">Health Assessment Report</div>`,
      footerTemplate: `<div style="font-size:8px; text-align:center; width:100%; padding-bottom:10mm;">Page <span class='pageNumber'></span> of <span class='totalPages'></span><div>© 2025 Preva Care</div></div>`,
      preferCSSPageSize: true,
      timeout: 60000,
    });
    await browser.close();
    browser = null;
    const pdfFileName = `HealthAssessment_${employeeId}_${Date.now()}.pdf`;
    pdfFilePath = path.join(tempDir, pdfFileName);
    fs.writeFileSync(pdfFilePath, pdfBuffer);
    try {
      const s3UploadResult = await uploadToS3({ buffer: pdfBuffer, originalname: pdfFileName, mimetype: 'application/pdf' });
      return res.send(s3UploadResult.Location);
    } catch (uploadErr) {
      return res.download(pdfFilePath, pdfFileName);
    }
  } catch (err) {
    return res.status(500).json({ error: "Failed to generate PDF", details: err.message });
  } finally {
    if (browser) { try { await browser.close(); } catch (closeErr) { } }
  }
};

function getHealthAssessmentHTML(data) {
  const { currentConditionData = [], allergiesData = [], immunizationData = [], patientName = "", employeeId = "", logoBase64 = "" } = data;
  const formatDate = (date) => date ? dayjs(date).format("DD/MM/YYYY") : "";
  const logoHtml = logoBase64 ? `<img src="${logoBase64}" alt="Preva Care Logo" style="max-height:40px; background-color:#ffffff; padding:10px; border-radius:10px;" />` : `<div style="background:#ffffff; padding:10px; border-radius:10px; font-weight:bold; color:#4b90e2; text-align:center;"><span style="font-size:1.5rem;">Preva Care</span></div>`;

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
            <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
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
    ["Diagnosis", "Date of Diagnosis", "Treatment Advised", "Referral Needed", "Notes"],
    item => `
            <tr>
              <td>${item.diagnosisName || "-"}</td>
              <td>${formatDate(item.dateOfDiagnosis)}</td>
              <td>${item.prescription && item.prescription.length > 0 ? item.prescription.map(p => `${p.drugName} (${p.freequency})`).join(", ") : "NONE"}</td>
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
    item => `
            <tr>
              <td>${item.allergyName || "-"}</td>
              <td>${item.pastAllergyDrugName && item.pastAllergyDrugName.length > 0 ? item.pastAllergyDrugName.map((drug, idx) => `${drug} (${item.pastAllergyFreequency[idx] || "-"})`).join(", ") : "None"}</td>
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
    ["Vaccination Name", "Type", "No Of Doses", "Next Dose Date", "Doctor Name", "Side Effects", "Notes"],
    item => `
            <tr>
              <td>${item.vaccinationName || "-"}</td>
              <td>${item.immunizationType || "-"}</td>
              <td>${item.totalDose || "-"}</td>
              <td>${item.doseDates && item.doseDates.length > 0 ? item.doseDates.map(d => d.date ? dayjs(d.date).format("DD-MM-YYYY") + ` [${d.status}]` : "N/A").join(", ") : "NA"}</td>
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