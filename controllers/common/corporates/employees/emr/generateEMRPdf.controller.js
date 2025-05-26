const fs = require("fs");
const dayjs = require("dayjs");
const path = require("path");
const PDFDocument = require("pdfkit-table");
const { dummyDataFemalePdf } = require("../../../../../public/emrPdfData");
const Response = require("../../../../../utils/Response");
const AppConstant = require("../../../../../utils/AppConstant");
const emrModel = require("../../../../../models/common/emr.model.js");
const {
  uploadToS3,
} = require("../../../../../middlewares/uploads/awsConfig.js");
const puppeteer = require("puppeteer");
const {
  generateEMRPDFFn,
  generatePrescriptionPDFFn,
} = require("../../../../../helper/emrPdf/generateEmrPdfFn.helper.js");
const eprescriptionModel = require("../../../../../models/patient/eprescription/eprescription.model.js");

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

// Create EMR PDF with dummy data
const createEMRPDF = async (req, res) => {
  console.log("hekooooo-------------------------");
  let browser = null;
  let pdfFilePath = null;

  try {
    console.log("\n=== Creating EMR PDF with Dummy Data ===");
    console.log(JSON.stringify(dummyDataFemalePdf, null, 2));
    console.log("=====================================\n");

    const pdfBuffer = await generateEMRPDF(dummyDataFemalePdf);

    // Ensure temp directory exists
    const tempDir = path.resolve(__dirname, "../../../../../public/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Save PDF to file
    const fileName = `EMR_sample_${Date.now()}.pdf`;
    pdfFilePath = path.join(tempDir, fileName);
    fs.writeFileSync(pdfFilePath, pdfBuffer);

    console.log("PDF saved to:", pdfFilePath);

    // Download file instead of sending buffer
    return res.download(pdfFilePath, fileName, (err) => {
      if (err) {
        console.error("Download error:", err);
      }
      // Optionally clean up the file after sending
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
    return res.status(500).json({
      error: "Failed to generate EMR PDF",
      details: err.message,
    });
  }
};

// Generate EMR PDF
const generateEMRPDF = async (emrPdfData) => {
  let browser = null;
  let logoBase64 = null;

  console.log("\n\n");
  console.log("emrPdfData", emrPdfData);
  console.log("\n\n");

  try {
    // Ensure temp directory exists
    const tempDir = path.resolve(__dirname, "../../../../../public/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Ensure debug directory exists
    const debugDir = path.resolve(tempDir, "debug");
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }

    // Copy logo to a location accessible by the browser
    const logoSourcePath = path.resolve(
      __dirname,
      "../../../../../public/logo.png"
    );
    const logoTempPath = path.join(tempDir, "temp_logo.png");
    fs.copyFileSync(logoSourcePath, logoTempPath);

    // Generate an absolute file URL for the copied logo
    const logoUrl = `file://${logoTempPath.replace(/\\/g, "/")}`;

    // Launch browser with proper error handling
    console.log("Launching browser for EMR PDF generation");
    try {
      browser = await launchPuppeteerBrowser();
      if (!browser) {
        throw new Error("Browser launch returned null");
      }

      console.log("Browser launched successfully");

      const page = await browser.newPage();
      console.log("New page created");

      // Set viewport
      await page.setViewport({
        width: 1200,
        height: 800,
      });

      // Allow all requests to proceed, including file access
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        req.continue();
      });

      // Generate HTML content with logo path
      const htmlContent = getEmrHTML(emrPdfData, logoUrl);

      // Add embedded Bootstrap CSS to avoid external dependency
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
            page-break-inside: avoid;
            page-break-after: avoid;
          }
          .doctor-info {
            flex: 1;
          }
          .doctor-info h2 {
            margin: 0;
            font-weight: 700;
            font-size: 1.2rem;
            word-wrap: break-word;
            color: #333;
          }
          .doctor-info p {
            margin: 0.05rem 0;
            font-size: 0.8rem;
            word-wrap: break-word;
            color: #666;
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
            page-break-after: avoid;
            word-wrap: break-word;
          }
          .section-title {
            background-color: #0096F2;
            color: white;
            padding: 8px 12px;
            font-weight: 600;
            font-size: 0.8rem;
            margin-bottom: 0;
            border-radius: 4px 4px 0 0;
            page-break-after: avoid;
            word-wrap: break-word;
          }
          .section-container {
            page-break-inside: avoid;
            margin-bottom: 1.5rem;
          }
          .table-container {
            margin-bottom: 1.5rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-radius: 0 0 4px 4px;
            page-break-inside: avoid;
            overflow: hidden;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            table-layout: fixed;
          }
          th, td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
            word-wrap: break-word;
            overflow-wrap: break-word;
            vertical-align: top;
          }
          th {
            background-color: #f8f9fa;
            color: #333;
            font-weight: 600;
            width: 25%;
          }
          td {
            width: 75%;
            white-space: pre-wrap;
          }
          tr:last-child td {
            border-bottom: none;
          }
          .vital-signs-table td:first-child {
            font-weight: 500;
            width: 30%;
          }
          .diagnosis-table th {
            text-align: left;
          }
          .footer {
            background: #0096F2;
            color: white;
            text-align: center;
            padding: 0.8rem 0;
            font-size: 0.9rem;
            margin-top: 2rem;
            border-radius: 4px;
            page-break-inside: avoid;
            page-break-before: auto;
            word-wrap: break-word;
          }
          .signature-section {
            margin-top: 2rem;
            padding: 1rem;
            text-align: right;
            page-break-inside: avoid;
          }
          .signature-image {
            max-width: 150px;
            height: auto;
          }

          /* Multi-column tables */
          table.multi-col th {
            width: auto;
          }
          table.multi-col td {
            width: auto;
          }

          /* Long text handling */
          .long-text {
            white-space: pre-wrap;
            word-wrap: break-word;
            max-width: 100%;
          }

          /* Print-specific styles */
          @media print {
            .header, .footer {
              background-color: #0096F2 !important;
              color: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .section-title {
              background-color: #0096F2 !important;
              color: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            th {
              background-color: #f8f9fa !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .section-container {
              break-inside: avoid;
            }
            h4 {
              break-after: avoid;
            }
            table {
              break-inside: avoid;
            }
            tr {
              break-inside: avoid;
            }
            td, th {
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
          }
        </style>
      `;

      // Inject bootstrap CSS directly into HTML to avoid loading from CDN
      const enhancedHtml = htmlContent.replace(
        "</head>",
        `${bootstrapCSS}</head>`
      );

      // Set content with proper timeout and wait conditions
      await page.setContent(enhancedHtml, {
        waitUntil: ["networkidle0", "domcontentloaded"],
        timeout: 30000,
      });
      console.log("Page content set successfully");

      // Wait for any dynamic content to settle
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Generate PDF with consistent settings
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
          '<div style="font-size:10px; text-align:center; width:100%; margin: 20px;">Electronic Medical Record</div>',
        footerTemplate:
          '<div style="font-size:8px; text-align:center; width:100%; margin: 20px;">Page <span class="pageNumber"></span> of <span class="totalPages"></span><div style="margin-top:5px;"> 2025 Preva Care</div></div>',
        preferCSSPageSize: true,
        timeout: 30000,
      });
      console.log("PDF generated successfully");

      // Create a safe filename using emrPdfData._id or timestamp
      const safeFilename = emrPdfData._id
        ? String(emrPdfData._id).replace(/[^a-z0-9]/gi, "_")
        : "unknown";

      // Save file with proper path for debugging
      const fileName = `emr_pdf_${safeFilename}_${Date.now()}.pdf`;
      const filePath = path.join(tempDir, fileName);
      fs.writeFileSync(filePath, pdfBuffer);

      console.log("PDF saved to:", filePath);

      // Upload PDF to S3
      try {
        const s3UploadResult = await uploadToS3({
          buffer: pdfBuffer,
          originalname: fileName,
          mimetype: "application/pdf",
        });
        console.log("PDF uploaded to S3:", s3UploadResult);
      } catch (uploadErr) {
        console.error("Error uploading PDF to S3:", uploadErr);
        // Continue execution even if S3 upload fails
      }

      // Clean up temporary logo file
      try {
        if (fs.existsSync(logoTempPath)) {
          fs.unlinkSync(logoTempPath);
        }
      } catch (err) {
        console.error("Error removing temporary logo:", err);
      }

      // Close browser before returning buffer
      await browser.close();
      browser = null;

      return pdfBuffer;
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
    console.error("PDF Generation Error:", err);
    throw err; // Re-throw to allow proper handling in calling function
  }
};

// Get EMR PDF by ID - UPDATED FOR FILE DOWNLOAD
const getEmrPdfLinkByemrId = async (req, res) => {
  const { emrId } = req.body;
  const existingEmr = await emrModel.findById(emrId).populate({
    path: "doctor",
    select:
      "firstName lastName education specialization eSign medicalRegistrationNumber degree",
  });
  if (!existingEmr) {
    return Response.error(
      res,
      404,
      AppConstant.FAILED,
      "EMR not found with provided ID!"
    );
  }
  if (existingEmr.link) {
    return res.send(existingEmr.link);
  } else {
    const safeEmr = existingEmr.toObject ? existingEmr.toObject() : existingEmr;

    console.log("\n=== Creating EMR PDF from Database Data ===");
    console.log("EMR ID:", emrId);
    console.log("EMR Data:", JSON.stringify(safeEmr, null, 2));
    console.log("=========================================\n");

    // Ensure temp directory exists
    const tempDir = path.resolve(__dirname, "../../../../../public/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Copy logo to a location accessible by the browser
    const logoSourcePath = path.resolve(
      __dirname,
      "../../../../../public/logo.png"
    );
    logoTempPath = path.join(tempDir, `temp_logo_${Date.now()}.png`);
    fs.copyFileSync(logoSourcePath, logoTempPath);

    // Generate an absolute file URL for the copied logo
    const logoUrl = `file://${logoTempPath.replace(/\\/g, "/")}`;

    // Launch browser
    browser = await launchPuppeteerBrowser();
    console.log("Browser launched successfully");

    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({
      width: 1200,
      height: 800,
    });
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
    // Generate HTML content with embedded logo
    const htmlContent = getEmrHTML(safeEmr, logoBase64);

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
          page-break-inside: avoid;
          page-break-after: avoid;
        }
        .doctor-info {
          flex: 1;
        }
        .doctor-info h2 {
          margin: 0;
          font-weight: 700;
          font-size: 1.2rem;
          word-wrap: break-word;
          color: #333;
        }
        .doctor-info p {
          margin: 0.05rem 0;
          font-size: 0.8rem;
          word-wrap: break-word;
          color: #666;
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
          page-break-after: avoid;
          word-wrap: break-word;
        }
        .section-title {
          background-color: #0096F2;
          color: white;
          padding: 8px 12px;
          font-weight: 600;
          font-size: 0.8rem;
          margin-bottom: 0;
          border-radius: 4px 4px 0 0;
          page-break-after: avoid;
          word-wrap: break-word;
        }
        .section-container {
          page-break-inside: avoid;
          margin-bottom: 1.5rem;
        }
        .table-container {
          margin-bottom: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border-radius: 0 0 4px 4px;
          page-break-inside: avoid;
          overflow: hidden;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 0;
          table-layout: fixed;
        }
        th, td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
          word-wrap: break-word;
          overflow-wrap: break-word;
          vertical-align: top;
        }
        th {
          background-color: #f8f9fa;
          color: #333;
          font-weight: 600;
          width: 25%;
        }
        td {
          width: 75%;
          white-space: pre-wrap;
        }
        tr:last-child td {
          border-bottom: none;
        }
        .vital-signs-table td:first-child {
          font-weight: 500;
          width: 30%;
        }
        .diagnosis-table th {
          text-align: left;
        }
        .footer {
          background: #0096F2;
          color: white;
          text-align: center;
          padding: 0.8rem 0;
          font-size: 0.9rem;
          margin-top: 2rem;
          border-radius: 4px;
          page-break-inside: avoid;
          page-break-before: auto;
          word-wrap: break-word;
        }
        .signature-section {
          margin-top: 2rem;
          padding: 1rem;
          text-align: right;
          page-break-inside: avoid;
        }
        .signature-image {
          max-width: 150px;
          height: auto;
        }

        /* Multi-column tables */
        table.multi-col th {
          width: auto;
        }
        table.multi-col td {
          width: auto;
        }

        /* Long text handling */
        .long-text {
          white-space: pre-wrap;
          word-wrap: break-word;
          max-width: 100%;
        }

        /* Print-specific styles */
        @media print {
          .header, .footer {
            background-color: #ffffff !important;
            color: #333 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .section-title {
            background-color: #0096F2 !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          th {
            background-color: #f8f9fa !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .section-container {
            break-inside: avoid;
          }
          h4 {
            break-after: avoid;
          }
          table {
            break-inside: avoid;
          }
          tr {
            break-inside: avoid;
          }
          td, th {
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .doctor-info h2 {
            color: #333 !important;
          }
          .doctor-info p {
            color: #666 !important;
          }
          .logo-address {
            color: #666 !important;
          }
        }
      </style>
    `;

    const enhancedHtml = htmlContent.replace(
      "</head>",
      `${bootstrapCSS}</head>`
    );

    // Allow all requests to proceed, including file access
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      req.continue();
    });

    // Set content and wait for it to load
    await page.setContent(enhancedHtml, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    // Wait for images to load
    await page
      .waitForSelector(".logo img", { visible: true, timeout: 5000 })
      .catch(() => {
        console.log("Logo image may not have loaded, continuing anyway");
      });

    // Debug with screenshot if needed
    const debugDir = path.resolve(tempDir, "debug");
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }

    const safeId = String(existingEmr._id).replace(/[^a-z0-9]/gi, "");
    const screenshotPath = path.join(
      debugDir,
      `emr_debug_${safeId}_${Date.now()}.png`
    );

    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    console.log("Debug screenshot saved to:", screenshotPath);
    console.log("Generating PDF...");

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
      headerTemplate: `<div style="font-size:10px; text-align:center; width:100%; padding-top:5mm;">Electronic Medical Record</div>`,
      footerTemplate: `<div style="font-size:8px; text-align:center; width:100%; padding-bottom:10mm;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        <div> 2025 Preva Care</div>
      </div>`,
      preferCSSPageSize: true,
      timeout: 60000,
    });

    console.log("PDF generated successfully");

    // Close browser before file operations
    await browser.close();
    browser = null;

    // Save the file to disk
    const pdfFileName = `EMR_${safeId}_${Date.now()}.pdf`;
    pdfFilePath = path.join(tempDir, pdfFileName);
    fs.writeFileSync(pdfFilePath, pdfBuffer);

    console.log("PDF saved to:", pdfFilePath);
    console.log("PDF size:", pdfBuffer.length, "bytes");

    // Upload PDF to S3
    let s3UploadResult;
    try {
      s3UploadResult = await uploadToS3({
        buffer: pdfBuffer,
        originalname: pdfFileName,
        mimetype: "application/pdf",
      });
      console.log("PDF uploaded to S3:", s3UploadResult);
    } catch (uploadErr) {
      console.error("Error uploading PDF to S3:", uploadErr);
      // Continue execution even if S3 upload fails
      return res.status(500).send("Error uploading PDF to S3");
    }

    const pdfLink = s3UploadResult.Location;
    await emrModel.findByIdAndUpdate(emrId, { link: pdfLink });

    // Use res.download instead of res.send
    return res.send(pdfLink);
  }
};

const getEmrPdfByemrId = async (req, res) => {
  let browser = null;
  let pdfFilePath = null;
  let logoTempPath = null;

  try {
    const { emrId } = req.body;
    if (!emrId) {
      return Response.error(res, 404, AppConstant.FAILED, "emrId is missing!");
    }

    const existingEmr = await emrModel.findById(emrId).populate({
      path: "doctor",
      select:
        "firstName lastName education specialization eSign medicalRegistrationNumber degree",
    });

    if (!existingEmr) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "EMR not found with provided ID!"
      );
    }

    // Create a safe copy of the data
    const safeEmr = existingEmr.toObject ? existingEmr.toObject() : existingEmr;

    console.log("\n=== Creating EMR PDF from Database Data ===");
    console.log("EMR ID:", emrId);
    console.log("EMR Data:", JSON.stringify(safeEmr, null, 2));
    console.log("=========================================\n");

    // Ensure temp directory exists
    const tempDir = path.resolve(__dirname, "../../../../../public/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Copy logo to a location accessible by the browser
    const logoSourcePath = path.resolve(
      __dirname,
      "../../../../../public/logo.png"
    );
    logoTempPath = path.join(tempDir, `temp_logo_${Date.now()}.png`);
    fs.copyFileSync(logoSourcePath, logoTempPath);

    // Generate an absolute file URL for the copied logo
    const logoUrl = `file://${logoTempPath.replace(/\\/g, "/")}`;

    // Launch browser
    browser = await launchPuppeteerBrowser();
    console.log("Browser launched successfully");

    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({
      width: 1200,
      height: 800,
    });
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
    // Generate HTML content with embedded logo
    const htmlContent = getEmrHTML(safeEmr, logoBase64);

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
          page-break-inside: avoid;
          page-break-after: avoid;
        }
        .doctor-info {
          flex: 1;
        }
        .doctor-info h2 {
          margin: 0;
          font-weight: 700;
          font-size: 1.2rem;
          word-wrap: break-word;
          color: #333;
        }
        .doctor-info p {
          margin: 0.05rem 0;
          font-size: 0.8rem;
          word-wrap: break-word;
          color: #666;
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
          page-break-after: avoid;
          word-wrap: break-word;
        }
        .section-title {
          background-color: #0096F2;
          color: white;
          padding: 8px 12px;
          font-weight: 600;
          font-size: 0.8rem;
          margin-bottom: 0;
          border-radius: 4px 4px 0 0;
          page-break-after: avoid;
          word-wrap: break-word;
        }
        .section-container {
          page-break-inside: avoid;
          margin-bottom: 1.5rem;
        }
        .table-container {
          margin-bottom: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border-radius: 0 0 4px 4px;
          page-break-inside: avoid;
          overflow: hidden;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 0;
          table-layout: fixed;
        }
        th, td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
          word-wrap: break-word;
          overflow-wrap: break-word;
          vertical-align: top;
        }
        th {
          background-color: #f8f9fa;
          color: #333;
          font-weight: 600;
          width: 25%;
        }
        td {
          width: 75%;
          white-space: pre-wrap;
        }
        tr:last-child td {
          border-bottom: none;
        }
        .vital-signs-table td:first-child {
          font-weight: 500;
          width: 30%;
        }
        .diagnosis-table th {
          text-align: left;
        }
        .footer {
          background: #0096F2;
          color: white;
          text-align: center;
          padding: 0.8rem 0;
          font-size: 0.9rem;
          margin-top: 2rem;
          border-radius: 4px;
          page-break-inside: avoid;
          page-break-before: auto;
          word-wrap: break-word;
        }
        .signature-section {
          margin-top: 2rem;
          padding: 1rem;
          text-align: right;
          page-break-inside: avoid;
        }
        .signature-image {
          max-width: 150px;
          height: auto;
        }

        /* Multi-column tables */
        table.multi-col th {
          width: auto;
        }
        table.multi-col td {
          width: auto;
        }

        /* Long text handling */
        .long-text {
          white-space: pre-wrap;
          word-wrap: break-word;
          max-width: 100%;
        }

        /* Print-specific styles */
        @media print {
          .header, .footer {
            background-color: #ffffff !important;
            color: #333 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .section-title {
            background-color: #0096F2 !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          th {
            background-color: #f8f9fa !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .section-container {
            break-inside: avoid;
          }
          h4 {
            break-after: avoid;
          }
          table {
            break-inside: avoid;
          }
          tr {
            break-inside: avoid;
          }
          td, th {
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .doctor-info h2 {
            color: #333 !important;
          }
          .doctor-info p {
            color: #666 !important;
          }
          .logo-address {
            color: #666 !important;
          }
        }
      </style>
    `;

    const enhancedHtml = htmlContent.replace(
      "</head>",
      `${bootstrapCSS}</head>`
    );

    // Allow all requests to proceed, including file access
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      req.continue();
    });

    // Set content and wait for it to load
    await page.setContent(enhancedHtml, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    // Wait for images to load
    await page
      .waitForSelector(".logo img", { visible: true, timeout: 5000 })
      .catch(() => {
        console.log("Logo image may not have loaded, continuing anyway");
      });

    // Debug with screenshot if needed
    const debugDir = path.resolve(tempDir, "debug");
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }

    const safeId = String(existingEmr._id).replace(/[^a-z0-9]/gi, "");
    const screenshotPath = path.join(
      debugDir,
      `emr_debug_${safeId}_${Date.now()}.png`
    );

    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    console.log("Debug screenshot saved to:", screenshotPath);
    console.log("Generating PDF...");

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
      headerTemplate: `<div style="font-size:10px; text-align:center; width:100%; padding-top:5mm;">Electronic Medical Record</div>`,
      footerTemplate: `<div style="font-size:8px; text-align:center; width:100%; padding-bottom:10mm;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        <div> 2025 Preva Care</div>
      </div>`,
      preferCSSPageSize: true,
      timeout: 60000,
    });

    console.log("PDF generated successfully");

    // Close browser before file operations
    await browser.close();
    browser = null;

    // Save the file to disk
    const pdfFileName = `EMR_${safeId}_${Date.now()}.pdf`;
    pdfFilePath = path.join(tempDir, pdfFileName);
    fs.writeFileSync(pdfFilePath, pdfBuffer);

    console.log("PDF saved to:", pdfFilePath);
    console.log("PDF size:", pdfBuffer.length, "bytes");

    // Upload PDF to S3
    if (!existingEmr.link) {
      try {
        const s3UploadResult = await uploadToS3({
          buffer: pdfBuffer,
          originalname: pdfFileName,
          mimetype: "application/pdf",
        });
        console.log("PDF uploaded to S3:", s3UploadResult);
        const pdfLink = s3UploadResult.Location;
        await emrModel.findByIdAndUpdate(emrId, { link: pdfLink });
      } catch (uploadErr) {
        console.error("Error uploading PDF to S3:", uploadErr);
        // Continue execution even if S3 upload fails
      }
    }

    // Use res.download instead of res.send
    return res.download(pdfFilePath, pdfFileName, (err) => {
      if (err) {
        console.error("Download error:", err);
        // If there's a download error, try to send an error response if headers haven't been sent
        if (!res.headersSent) {
          return Response.error(
            res,
            500,
            AppConstant.FAILED,
            "Error downloading PDF: " + err.message
          );
        }
      }

      // Clean up the files after sending (optional)
      try {
        if (fs.existsSync(pdfFilePath)) {
          fs.unlinkSync(pdfFilePath);
          console.log("Temporary PDF file deleted");
        }
        if (fs.existsSync(logoTempPath)) {
          fs.unlinkSync(logoTempPath);
          console.log("Temporary logo file deleted");
        }
      } catch (cleanupErr) {
        console.error("Error cleaning up files:", cleanupErr);
      }
    });
  } catch (err) {
    console.error("EMR PDF generation error:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      "Failed to generate EMR PDF: " + err.message
    );
  } finally {
    // Ensure browser is closed and temp files are cleaned up
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error("Error closing browser:", closeErr);
      }
    }
    if (logoTempPath && fs.existsSync(logoTempPath)) {
      try {
        fs.unlinkSync(logoTempPath);
      } catch (err) {
        console.error("Error removing temporary logo:", err);
      }
    }
  }
};

// Get e-prescription PDF by ID
const getEPrescriptionPdfById = async (req, res) => {
  let browser = null;
  let pdfFilePath = null;
  let logoTempPath = null;

  try {
    const { ePrescriptionId } = req.body;
    if (!ePrescriptionId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "ePrescriptionId is missing!"
      );
    }

    const existingEPrescription =
      await eprescriptionModel.findById(ePrescriptionId);
    console.log("existingEPrescription", existingEPrescription);

    if (!existingEPrescription) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "E-Prescription not found with provided ID!"
      );
    }

    // Fetch the latest medicine schedule for the patient
    const MedicineSchedule = require("../../../../../models/patient/medicineSchedule.model");
    const patientId = existingEPrescription.user;

    try {
      // Get the latest medicine schedule for this patient
      const latestMedicineSchedule = await MedicineSchedule.findOne({
        user: patientId,
        isActive: true,
      }).sort({ lastModified: -1 });

      // If found, add to the prescription data
      if (latestMedicineSchedule) {
        existingEPrescription.medicineSchedule = latestMedicineSchedule;
        console.log("Latest medicine schedule fetched successfully");
        console.log("Medicine count:", latestMedicineSchedule.medicines.length);
      } else {
        console.log(
          "No active medicine schedule found for patient:",
          patientId
        );
      }
    } catch (err) {
      console.error("Error fetching medicine schedule:", err);
      // Continue execution even if medicine schedule fetch fails
    }

    // Ensure temp directory exists
    const tempDir = path.resolve(__dirname, "../../../../../public/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Copy logo to a location accessible by the browser
    const logoSourcePath = path.resolve(
      __dirname,
      "../../../../../public/logo.png"
    );
    logoTempPath = path.join(tempDir, `temp_logo_${Date.now()}.png`);
    fs.copyFileSync(logoSourcePath, logoTempPath);

    // Generate an absolute file URL for the copied logo
    const logoUrl = `file://${logoTempPath.replace(/\\/g, "/")}`;

    // Launch browser
    console.log("Launching browser for E-Prescription PDF generation");
    browser = await launchPuppeteerBrowser();
    console.log("Browser launched successfully");

    const page = await browser.newPage();
    console.log("New page created");

    // Set viewport
    await page.setViewport({
      width: 1200,
      height: 800,
    });

    // Set content with proper timeout and wait conditions
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
    await page.setContent(
      getPrescriptionHTML(existingEPrescription, logoBase64),
      {
        waitUntil: "networkidle0",
        timeout: 60000,
      }
    );

    // Wait for images to load
    await page
      .waitForSelector(".logo img", { visible: true, timeout: 5000 })
      .catch(() => {
        console.log("Logo image may not have loaded, continuing anyway");
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
      headerTemplate: `<div style="font-size:10px; text-align:center; width:100%; padding-top:5mm;">Electronic Prescription</div>`,
      footerTemplate: `<div style="font-size:8px; text-align:center; width:100%; padding-bottom:10mm;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        <div> 2025 Preva Care</div>
      </div>`,
      preferCSSPageSize: true,
      timeout: 60000,
    });

    // Close browser before file operations
    await browser.close();
    browser = null;

    // Save the file to disk
    const pdfFileName = `Prescription_${
      existingEPrescription._id
    }_${Date.now()}.pdf`;
    pdfFilePath = path.join(tempDir, pdfFileName);
    fs.writeFileSync(pdfFilePath, pdfBuffer);

    let pdfLink;
    if (!existingEPrescription.link) {
      try {
        const s3UploadResult = await uploadToS3({
          buffer: pdfBuffer,
          originalname: pdfFileName,
          mimetype: "application/pdf",
        });
        console.log("PDF uploaded to S3:", s3UploadResult);
        pdfLink = s3UploadResult.Location;
        await eprescriptionModel.findByIdAndUpdate(ePrescriptionId, {
          link: pdfLink,
        });
      } catch (uploadErr) {
        console.error("Error uploading PDF to S3:", uploadErr);
        // Continue execution even if S3 upload fails
      }
    }

    // Use res.download instead of res.send
    return res.send(pdfLink);
  } catch (err) {
    console.error("Error launching browser:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      "Failed to generate e-prescription PDF: " + err.message
    );
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error("Error closing browser:", closeErr);
      }
    }
    if (logoTempPath && fs.existsSync(logoTempPath)) {
      try {
        fs.unlinkSync(logoTempPath);
      } catch (err) {
        console.error("Error removing temporary logo:", err);
      }
    }
  }
};

const getEPrescriptionPdfLinkByemrId = async (req, res) => {
  const { ePrescriptionId } = req.body;
  const existingEPrescription =
    await eprescriptionModel.findById(ePrescriptionId);
  if (!existingEPrescription) {
    return Response.error(
      res,
      404,
      AppConstant.FAILED,
      "E-Prescription not found"
    );
  }

  // Fetch the latest medicine schedule for the patient
  const MedicineSchedule = require("../../../../../models/patient/medicineSchedule.model");
  const patientId = existingEPrescription.user;

  try {
    // Get the latest medicine schedule for this patient
    const latestMedicineSchedule = await MedicineSchedule.findOne({
      user: patientId,
      isActive: true,
    }).sort({ lastModified: -1 });

    // If found, add to the prescription data
    if (latestMedicineSchedule) {
      existingEPrescription.medicineSchedule = latestMedicineSchedule;
      console.log("Latest medicine schedule fetched successfully for PDF link");
      console.log("Medicine count:", latestMedicineSchedule.medicines.length);
    } else {
      console.log("No active medicine schedule found for patient:", patientId);
    }
  } catch (err) {
    console.error("Error fetching medicine schedule for PDF link:", err);
    // Continue execution even if medicine schedule fetch fails
  }

  const pdfLink = existingEPrescription.link;
  if (pdfLink) {
    return res.send(pdfLink);
  } else {
    const tempDir = path.resolve(__dirname, "../../../../../public/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Copy logo to a location accessible by the browser
    const logoSourcePath = path.resolve(
      __dirname,
      "../../../../../public/logo.png"
    );
    logoTempPath = path.join(tempDir, `temp_logo_${Date.now()}.png`);
    fs.copyFileSync(logoSourcePath, logoTempPath);

    // Generate an absolute file URL for the copied logo
    const logoUrl = `file://${logoTempPath.replace(/\\/g, "/")}`;

    // Launch browser
    console.log(
      "Launching browser for EPrescription 1 PDF link with custom port 9222 instead of default 8000"
    );
    browser = await launchPuppeteerBrowser();
    console.log("Browser launched successfully");

    const page = await browser.newPage();
    console.log("New page created");

    // Set viewport
    await page.setViewport({
      width: 1200,
      height: 800,
    });
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
    await page.setContent(
      getPrescriptionHTML(existingEPrescription, logoBase64),
      {
        waitUntil: "networkidle0",
        timeout: 60000,
      }
    );

    // Wait for images to load
    await page
      .waitForSelector(".logo img", { visible: true, timeout: 5000 })
      .catch(() => {
        console.log("Logo image may not have loaded, continuing anyway");
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
      headerTemplate: `<div style="font-size:10px; text-align:center; width:100%; padding-top:5mm;">Electronic Prescription</div>`,
      footerTemplate: `<div style="font-size:8px; text-align:center; width:100%; padding-bottom:10mm;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        <div> 2025 Preva Care</div>
      </div>`,
      preferCSSPageSize: true,
      timeout: 60000,
    });

    // Close browser before file operations
    await browser.close();
    browser = null;

    // Save the file to disk
    const pdfFileName = `Prescription_${
      existingEPrescription._id
    }_${Date.now()}.pdf`;
    pdfFilePath = path.join(tempDir, pdfFileName);
    fs.writeFileSync(pdfFilePath, pdfBuffer);

    let pdfLink;
    if (!existingEPrescription.link) {
      try {
        const s3UploadResult = await uploadToS3({
          buffer: pdfBuffer,
          originalname: pdfFileName,
          mimetype: "application/pdf",
        });
        console.log("PDF uploaded to S3:", s3UploadResult);
        pdfLink = s3UploadResult.Location;
        await eprescriptionModel.findByIdAndUpdate(ePrescriptionId, {
          link: pdfLink,
        });
      } catch (uploadErr) {
        console.error("Error uploading PDF to S3:", uploadErr);
        // Continue execution even if S3 upload fails
      }
    }

    // Use res.download instead of res.send
    return res.send(pdfLink);
  }
};

// Function to launch browser consistently across all PDF generation functions
const launchPuppeteerBrowser = async () => {
  console.log("Launching Puppeteer browser with bundled Chromium...");
  return puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
};

function getEmrHTML(emrPdfData, logoBase64) {
  const {
    basicInfo = {},
    doctor = {},
    history = {},
    immunization = [],
    generalPhysicalExamination = {},
    systemicExamination = {},
    diagnosis = [],
    advice = "",
    referrals = "",
    followUpSchedule = "",
    doctorNotes = "",
    consultationMode = "",
    createdAt = new Date(),
  } = emrPdfData || {};

  const formatDate = (date) => {
    return date ? dayjs(date).format("DD/MM/YYYY") : "";
  };

  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="Preva Care Logo" style="max-height:40px; background-color:#ffffff; padding:10px; border-radius:10px;" />`
    : `<div style="background:#ffffff; padding:10px; border-radius:10px; font-weight:bold; color:#4b90e2; text-align:center;">
       <span style="font-size:1.5rem;">Preva Care</span>
     </div>`;

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>EMR PDF</title>
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
        page-break-inside: avoid;
        page-break-after: avoid;
      }
      .doctor-info {
        flex: 1;
      }
      .doctor-info h2 {
        margin: 0;
        font-weight: 700;
        font-size: 1.2rem;
        word-wrap: break-word;
        color: #333;
      }
      .doctor-info p {
        margin: 0.05rem 0;
        font-size: 0.8rem;
        word-wrap: break-word;
        color: #666;
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
        page-break-after: avoid;
        word-wrap: break-word;
      }
      .section-title {
        background-color: #0096F2;
        color: white;
        padding: 8px 12px;
        font-weight: 600;
        font-size: 0.8rem;
        margin-bottom: 0;
        border-radius: 4px 4px 0 0;
        page-break-after: avoid;
        word-wrap: break-word;
      }
      .section-container {
        page-break-inside: avoid;
        margin-bottom: 1.5rem;
      }
      .table-container {
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        border-radius: 0 0 4px 4px;
        page-break-inside: avoid;
        overflow: hidden;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 0;
        table-layout: fixed;
      }
      th, td {
        padding: 8px 12px;
        text-align: left;
        border-bottom: 1px solid #eee;
        word-wrap: break-word;
        overflow-wrap: break-word;
        vertical-align: top;
      }
      th {
        background-color: #f8f9fa;
        color: #333;
        font-weight: 600;
        width: 25%;
      }
      td {
        width: 75%;
        white-space: pre-wrap;
      }
      tr:last-child td {
        border-bottom: none;
      }
      .vital-signs-table td:first-child {
        font-weight: 500;
        width: 30%;
      }
      .diagnosis-table th {
        text-align: left;
      }
      .footer {
        background: #0096F2;
        color: white;
        text-align: center;
        padding: 0.8rem 0;
        font-size: 0.9rem;
        margin-top: 2rem;
        border-radius: 4px;
        page-break-inside: avoid;
        page-break-before: auto;
        word-wrap: break-word;
      }
      .signature-section {
        margin-top: 2rem;
        padding: 1rem;
        text-align: right;
        page-break-inside: avoid;
      }
      .signature-image {
        max-width: 150px;
        height: auto;
      }

      /* Multi-column tables */
      table.multi-col th {
        width: auto;
      }
      table.multi-col td {
        width: auto;
      }

      /* Long text handling */
      .long-text {
        white-space: pre-wrap;
        word-wrap: break-word;
        max-width: 100%;
      }

      /* Print-specific styles */
      @media print {
        .header, .footer {
          background-color: #0096F2 !important;
          color: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .section-title {
          background-color: #0096F2 !important;
          color: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        th {
          background-color: #f8f9fa !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .section-container {
          break-inside: avoid;
        }
        h4 {
          break-after: avoid;
        }
        table {
          break-inside: avoid;
        }
        tr {
          break-inside: avoid;
        }
        td, th {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="doctor-info">
        <h2>Dr. ${doctor.firstName || ""} ${doctor.lastName || ""}</h2>
        <p>${doctor.specialization || ""}</p>
        <p>Reg. No: ${doctor.medicalRegistrationNumber || ""}</p>
        <p>Consultation Mode: ${consultationMode}</p>
        <p>Date: ${formatDate(createdAt)}</p>
      </div>
      <div class="logo">
        ${logoHtml}
        <div class="logo-address">Registered Office : P-1 GROUND FLOOR B/P P-1 TO P-20 NDSE II OPP. LI/11 , Delhi, India - 110049</div>
      </div>
    </div>

    <h1 class="title">Electronic Medical Record</h1>

    <div class="container-fluid px-4">
      <!-- Patient Info -->
      <div class="section-container">
        <h4 class="section-title">Patient Information</h4>
        <div class="table-container">
          <table>
            <tbody>
              <tr><th>Patient Name</th><td>${basicInfo.name || ""}</td></tr>
              <tr><th>Age</th><td>${basicInfo.age || ""} years</td></tr>
              <tr><th>Gender</th><td>${
                basicInfo.gender === "F" ? "Female" : "Male"
              }</td></tr>
              <tr><th>Phone Number</th><td>${
                basicInfo.phoneNumber || ""
              }</td></tr>
              <tr><th>Blood Group</th><td>${
                basicInfo.bloodGroup || ""
              }</td></tr>
              <tr><th>Marital Status</th><td>${
                basicInfo.maritalStatus ? "Married" : "Single"
              }</td></tr>
              <tr><th>Children</th><td>${basicInfo.children || "0"}</td></tr>
              <tr><th>Address</th><td>${basicInfo.address?.name || ""}, ${
                basicInfo.address?.street || ""
              }, ${basicInfo.address?.city || ""}, ${basicInfo.address?.state || ""} - ${
                basicInfo.address?.zipCode || ""
              }</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- History -->
      <div class="section-container">
        <h4 class="section-title">Medical History</h4>
        <div class="table-container">
          <table>
            <tbody>
              <tr><th>Chief Complaint</th><td>${
                history.chiefComplaint || ""
              }</td></tr>
              <tr><th>History of Present Illness</th><td>${
                history.historyOfPresentingIllness || ""
              }</td></tr>
              <tr><th>Previous Surgeries</th><td>${
                history.previousSurgeries || ""
              }</td></tr>
              <tr><th>Bowel and Bladder</th><td>${
                history.bowelAndBladder || ""
              }</td></tr>
              <tr><th>Appetite</th><td>${history.appetite || ""}</td></tr>
              <tr><th>Sleep</th><td>${history.sleep || ""} hours</td></tr>
              <tr><th>Mental Health Assessment</th><td>${
                history.mentalHealthAssessment || ""
              }</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Habits -->
      <div class="section-container">
        <h4 class="section-title">Habits</h4>
        <div class="table-container">
          <table>
            <tbody>
              <tr><th>Smoking</th><td>${
                history.habits?.smoking ? "Yes" : "No"
              }</td></tr>
              <tr><th>Alcohol</th><td>${
                history.habits?.alcohol ? "Yes" : "No"
              }</td></tr>
              ${
                history.habits?.alcohol
                  ? `
              <tr><th>Alcohol Details</th><td>${
                history.habits?.alcoholDetails || ""
              }</td></tr>
              <tr><th>Quantity per Week</th><td>${
                history.habits?.qntPerWeek || ""
              } ml</td></tr>
              `
                  : ""
              }
              <tr><th>Substance Abuse</th><td>${
                history.habits?.substanceAbuse || "None"
              }</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Screening -->
      <div class="section-container">
        <h4 class="section-title">Health Screening</h4>
        <div class="table-container">
          <table>
            <tbody>
              <tr>
                <th>Stress Screening</th>
                <td>
                  Description: ${history.stressScreening?.desc || ""}<br>
                  Score: ${history.stressScreening?.score || ""}<br>
                  Recommendation: ${
                    history.stressScreening?.recomendation || ""
                  }
                </td>
              </tr>
              <tr>
                <th>Depression Screening</th>
                <td>
                  Description: ${history.depressionScreening?.desc || ""}<br>
                  Score: ${history.depressionScreening?.score || ""}<br>
                  Recommendation: ${
                    history.depressionScreening?.recomendation || ""
                  }
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Past History -->
      ${
        history.pastHistory && history.pastHistory.length > 0
          ? `
        <div class="section-container">
          <h4 class="section-title">Past Medical History</h4>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Condition</th>
                  <th>Medications</th>
                  <th>Frequency</th>
                  <th>Readings</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${history.pastHistory
                  .map(
                    (ph) => `
                  <tr>
                    <td>${ph.sufferingFrom || ""}</td>
                    <td>${ph.drugName?.join(", ") || ""}</td>
                    <td>${ph.freequency?.join(", ") || ""}</td>
                    <td>${ph.readings || ""}</td>
                    <td>${ph.pastHistoryNotes || ""}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      `
          : ""
      }

      <!-- Surgical History -->
      ${
        history.surgicalHistory && history.surgicalHistory.length > 0
          ? `
        <div class="section-container">
          <h4 class="section-title">Surgical History</h4>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Surgery</th>
                  <th>Indication</th>
                  <th>Year</th>
                  <th>Procedure</th>
                  <th>Complications</th>
                  <th>Hospital</th>
                </tr>
              </thead>
              <tbody>
                ${history.surgicalHistory
                  .map(
                    (sh) => `
                  <tr>
                    <td>${sh.surgeryName || ""}</td>
                    <td>${sh.indication || ""}</td>
                    <td>${sh.year || ""}</td>
                    <td>${sh.procedureType || ""}</td>
                    <td>${sh.complications || ""}</td>
                    <td>${sh.hospital?.name || ""}, ${
                      sh.hospital?.location || ""
                    }</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      `
          : ""
      }

      <!-- Allergies -->
      ${
        history.allergies && history.allergies.length > 0
          ? `
        <div class="section-container">
          <h4 class="section-title">Allergies</h4>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Allergy</th>
                  <th>Past Medications</th>
                  <th>Frequency</th>
                  <th>Advised By</th>
                  <th>Advice</th>
                </tr>
              </thead>
              <tbody>
                ${history.allergies
                  .map(
                    (allergy) => `
                  <tr>
                    <td>${allergy.allergyName || ""}</td>
                    <td>${allergy.pastAllergyDrugName?.join(", ") || ""}</td>
                    <td>${allergy.pastAllergyFreequency?.join(", ") || ""}</td>
                    <td>${allergy.advisedBy || ""}</td>
                    <td>${allergy.advise || ""}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      `
          : ""
      }

      <!-- Immunization -->
      ${
        immunization && immunization.length > 0
          ? `
        <div class="section-container">
          <h4 class="section-title">Immunization History</h4>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Vaccine</th>
                  <th>Total Doses</th>
                  <th>Doctor</th>
                  <th>Side Effects</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${immunization
                  .map(
                    (imm) => `
                  <tr>
                    <td>${imm.immunizationType || ""}</td>
                    <td>${imm.vaccinationName || ""}</td>
                    <td>${imm.totalDose || ""}</td>
                    <td>${imm.doctorName || ""}</td>
                    <td>${imm.sideEffects || ""}</td>
                    <td>${imm.immunizationNotes || ""}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      `
          : ""
      }

      <!-- General Physical Examination -->
      <div class="section-container">
        <h4 class="section-title">General Physical Examination</h4>
        <div class="table-container">
          <table>
            <tbody>
              <tr><th>Blood Pressure</th><td>${
                generalPhysicalExamination.BP?.sys || ""
              }/${generalPhysicalExamination.BP?.dia || ""} mmHg</td></tr>
              <tr><th>Pulse Rate</th><td>${
                generalPhysicalExamination.PR || ""
              } bpm</td></tr>
              <tr><th>Volume</th><td>${
                generalPhysicalExamination.volume || ""
              }</td></tr>
              <tr><th>Regularity</th><td>${
                generalPhysicalExamination.regularity || ""
              }</td></tr>
              <tr><th>Character</th><td>${
                generalPhysicalExamination.character || ""
              }</td></tr>
              <tr><th>Temperature</th><td>${
                generalPhysicalExamination.temperature || ""
              }</td></tr>
              <tr><th>Respiratory Rate</th><td>${
                generalPhysicalExamination.RR || ""
              }</td></tr>
              <tr><th>SpO2</th><td>${
                generalPhysicalExamination.SPO2 || ""
              }%</td></tr>
              <tr><th>Height</th><td>${
                generalPhysicalExamination.height || ""
              } m</td></tr>
              <tr><th>Weight</th><td>${
                generalPhysicalExamination.weight || ""
              } kg</td></tr>
              <tr><th>BMI</th><td>${
                generalPhysicalExamination.BMI || ""
              }</td></tr>
              <tr><th>Radio Femoral Delay</th><td>${
                generalPhysicalExamination.radioFemoralDelay || ""
              }</td></tr>
              <tr><th>Pallor</th><td>${
                generalPhysicalExamination.pallor || ""
              }</td></tr>
              <tr><th>Icterus</th><td>${
                generalPhysicalExamination.icterus || ""
              }</td></tr>
              <tr><th>Cyanosis</th><td>${
                generalPhysicalExamination.cyanosis || ""
              }</td></tr>
              <tr><th>Clubbing</th><td>${
                generalPhysicalExamination.clubbing || ""
              }</td></tr>
              <tr><th>Lymphadenopathy</th><td>${
                generalPhysicalExamination.lymphadenopathy || ""
              }</td></tr>
              <tr><th>Edema</th><td>${
                generalPhysicalExamination.edema || ""
              }</td></tr>
              <tr><th>JVP</th><td>${
                generalPhysicalExamination.JVP || ""
              }</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Systemic Examination -->
      <div class="section-container">
        <h4 class="section-title">Systemic Examination</h4>
        <div class="table-container">
          <table>
            <tbody>
              <tr><th>Respiratory System</th><td>${
                systemicExamination.respiratorySystem || ""
              }</td></tr>
              <tr><th>Cardiovascular System</th><td>${
                systemicExamination.CVS || ""
              }</td></tr>
              <tr><th>Central Nervous System</th><td>${
                systemicExamination.CNS || ""
              }</td></tr>
              <tr><th>Per Abdomen</th><td>${
                systemicExamination.PA || ""
              }</td></tr>
              <tr><th>Other Findings</th><td>${
                systemicExamination.otherSystemicFindings || ""
              }</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Diagnosis and Prescription -->
      ${
        diagnosis && diagnosis.length > 0
          ? `
        <div class="section-container">
          <h4 class="section-title">Diagnosis & Prescription</h4>
          ${diagnosis
            .map(
              (diag) => `
            <div class="table-container">
              <table>
                <tbody>
                  <tr>
                    <th style="width: 30%">Diagnosis</th>
                    <td>${diag.diagnosisName || ""}</td>
                  </tr>
                  <tr>
                    <th>Date</th>
                    <td>${formatDate(diag.dateOfDiagnosis)}</td>
                  </tr>
                </tbody>
              </table>
              ${
                diag.prescription && diag.prescription.length > 0
                  ? `
                <table style="margin-top: 10px;">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Route</th>
                      <th>How to Take</th>
                      <th>Investigations</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${diag.prescription
                      .map(
                        (med) => `
                      <tr>
                        <td>${med.drugName || ""}</td>
                        <td>${med.frequency || ""}</td>
                        <td>${med.duration || ""} days</td>
                        <td>${med.routeOfAdministration || ""}</td>
                        <td>${med.howToTake || ""}</td>
                        <td>${med.investigations || ""}</td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              `
                  : ""
              }
            </div>
          `
            )
            .join("")}
        </div>
      `
          : ""
      }

      <!-- Advice and Follow-up -->
      <div class="section-container">
        <h4 class="section-title">Advice & Follow-up</h4>
        <div class="table-container">
          <table>
            <tbody>
              <tr><th>Advice</th><td>${advice || ""}</td></tr>
              <tr><th>Referrals</th><td>${referrals || ""}</td></tr>
              <tr><th>Follow-up Schedule</th><td>${
                followUpSchedule || ""
              }</td></tr>
              ${
                doctorNotes
                  ? `<tr><th>Doctor Notes</th><td>${doctorNotes}</td></tr>`
                  : ""
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="footer">
      <span> 2025 Preva Care | Electronic Medical Record System</span>
    </div>
  </body>
</html>
`;
}

function getPrescriptionHTML(prescriptionData, logoBase64) {
  const {
    patient = {},
    doctor = {},
    date = new Date(),
    prescriptionID = "",
    vitals = {},
    dx = [],
    sx = "",
    rx = [],
    labTest = [],
    advice = [],
    followUpSchedule = "",
    consultationMode = "",
    medicineSchedule = null, // Add the medicine schedule parameter
  } = prescriptionData || {};

  const formatDate = (date) => {
    return date ? dayjs(date).format("DD/MM/YYYY") : "";
  };

  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="Preva Care Logo" style="max-height:40px; background-color:#ffffff; padding:10px; border-radius:10px;" />`
    : `<div style="background:#ffffff; padding:10px; border-radius:10px; font-weight:bold; color:#4b90e2; text-align:center;">
         <span style="font-size:1.5rem;">Preva Care</span>
       </div>`;

  // Create medicine schedule HTML if available
  let medicineScheduleHtml = "";
  if (
    medicineSchedule &&
    medicineSchedule.medicines &&
    medicineSchedule.medicines.length > 0
  ) {
    medicineScheduleHtml = `
      <div class="section-container">
        <h4 class="section-title">Medicine Schedule</h4>
        <div class="table-container">
          <table class="multi-col" style="width: 100%; table-layout: auto;">
            <thead>
              <tr>
                <th style="width: 25%;">Medicine</th>
                <th style="width: 15%;">Frequency</th>
                <th style="width: 15%;">Dosage</th>
                <th style="width: 35%;">Instructions</th>
                <th style="width: 10%;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${medicineSchedule.medicines
                .map(
                  (med) => `
                <tr>
                  <td>${sanitizeHtml(med.drugName || "")}</td>
                  <td>${sanitizeHtml(med.frequency || "")}</td>
                  <td>${sanitizeHtml(med.dosage || "")}</td>
                  <td>${sanitizeHtml(med.instructions || "")}</td>
                  <td>${med.status || "Active"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>E-Prescription</title>
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
        page-break-inside: avoid;
        page-break-after: avoid;
      }
      .doctor-info {
        flex: 1;
      }
      .doctor-info h2 {
        margin: 0;
        font-weight: 700;
        font-size: 1.2rem;
        word-wrap: break-word;
        color: #333;
      }
      .doctor-info p {
        margin: 0.05rem 0;
        font-size: 0.8rem;
        word-wrap: break-word;
        color: #666;
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
        page-break-after: avoid;
        word-wrap: break-word;
      }
      .section-title {
        background-color: #0096F2;
        color: white;
        padding: 8px 12px;
        font-weight: 600;
        font-size: 0.8rem;
        margin-bottom: 0;
        border-radius: 4px 4px 0 0;
        page-break-after: avoid;
        word-wrap: break-word;
      }
      .section-container {
        page-break-inside: avoid;
        margin-bottom: 1.5rem;
      }
      .table-container {
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        border-radius: 0 0 4px 4px;
        page-break-inside: avoid;
        overflow: hidden;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 0;
        table-layout: fixed;
      }
      th, td {
        padding: 8px 12px;
        text-align: left;
        border-bottom: 1px solid #eee;
        word-wrap: break-word;
        overflow-wrap: break-word;
        vertical-align: top;
      }
      th {
        background-color: #f8f9fa;
        color: #333;
        font-weight: 600;
        width: 25%;
      }
      td {
        width: 75%;
        white-space: pre-wrap;
      }
      tr:last-child td {
        border-bottom: none;
      }
      .footer {
        background: #0096F2;
        color: white;
        text-align: center;
        padding: 0.8rem 0;
        font-size: 0.9rem;
        margin-top: 2rem;
        border-radius: 4px;
        page-break-inside: avoid;
        page-break-before: auto;
        word-wrap: break-word;
      }
      .signature-section {
        margin-top: 2rem;
        padding: 1rem;
        text-align: right;
        page-break-inside: avoid;
      }
      .signature-image {
        max-width: 150px;
        height: auto;
      }

      /* Multi-column tables */
      table.multi-col th {
        width: auto;
      }
      table.multi-col td {
        width: auto;
      }

      /* Long text handling */
      .long-text {
        white-space: pre-wrap;
        word-wrap: break-word;
        max-width: 100%;
      }

      /* Print-specific styles */
      @media print {
        .header, .footer {
          background-color: #ffffff !important;
          color: #333 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .section-title {
          background-color: #0096F2 !important;
          color: white !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        th {
          background-color: #f8f9fa !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .section-container {
          break-inside: avoid;
        }
        h4 {
          break-after: avoid;
        }
        table {
          break-inside: avoid;
        }
        tr {
          break-inside: avoid;
        }
        td, th {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .doctor-info h2 {
          color: #333 !important;
        }
        .doctor-info p {
          color: #666 !important;
        }
        .logo-address {
          color: #666 !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="doctor-info">
        <h2>${doctor.name || "Doctor"}</h2>
        <p>${doctor.education || ""}</p>
        <p>${doctor.specialization || ""}</p>
        <p>${doctor.registrationNumber || ""}</p>
      </div>
      <div class="logo">
        ${logoHtml}
        <div class="logo-address">
          <small>Preva Care<br />Electronic Medical Record System</small>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="title">PRESCRIPTION</div>

      <div class="section-container">
        <h4 class="section-title">Patient Information</h4>
        <div class="table-container">
          <table>
            <tbody>
              <tr>
                <th>Name</th>
                <td>${patient.name || ""}</td>
              </tr>
              <tr>
                <th>Age / Gender</th>
                <td>${patient.age || ""} ${
                  patient.gender === "M" ? "Male" : "Female"
                }</td>
              </tr>
              <tr>
                <th>Date</th>
                <td>${formatDate(date)}</td>
              </tr>
              <tr>
                <th>Prescription ID</th>
                <td>${prescriptionID || ""}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Vitals -->
      <div class="section-container">
        <h4 class="section-title">Vital Signs</h4>
        <div class="table-container">
          <table>
            <tbody>
              <tr><th>Blood Pressure</th><td>${vitals.BP || ""} mmHg</td></tr>
              <tr><th>Pulse Rate</th><td>${vitals.PR || ""} bpm</td></tr>
              <tr><th>SpO2</th><td>${vitals.SpO2 || ""}%</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Symptoms -->
      ${
        sx
          ? `
      <div class="section-container">
        <h4 class="section-title">Symptoms</h4>
        <div class="table-container">
          <table>
            <tbody>
              <tr><th>Presenting Complaints</th><td>${sx}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      `
          : ""
      }

      <!-- Diagnosis -->
      ${
        dx && dx.length > 0
          ? `
      <div class="section-container">
        <h4 class="section-title">Diagnosis</h4>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Diagnosis</th>
                <th>Date</th>
            </tr>
            </thead>
            <tbody>
              ${dx
                .map(
                  (diagnosis) => `
            <tr>
                  <td>${diagnosis.diagnosisName || ""}</td>
                  <td>${formatDate(diagnosis.dateOfDiagnosis)}</td>
            </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
      `
          : ""
      }

      <!-- Medications -->
      ${
        rx && rx.length > 0
          ? `
      <div class="section-container">
        <h4 class="section-title">Medications</h4>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Frequency</th>
                <th>Duration</th>
                <th>Quantity</th>
            </tr>
            </thead>
            <tbody>
              ${rx
                .map(
                  (medicine) => `
                <tr>
                  <td>${medicine.drugName || ""}</td>
                  <td>${medicine.frequency || ""}</td>
                  <td>${medicine.duration || ""}</td>
                  <td>${medicine.quantity || ""}</td>
            </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
      `
          : ""
      }

      <!-- Lab Tests -->
      ${
        labTest && labTest.length > 0
          ? `
      <div class="section-container">
        <h4 class="section-title">Laboratory Tests</h4>
        <div class="table-container">
          <table>
            <tbody>
              <tr>
                <th>Recommended Tests</th>
                <td>${labTest.join(", ")}</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
      `
          : ""
      }

      <!-- Advice -->
      ${
        advice && advice.length > 0
          ? `
      <div class="section-container">
        <h4 class="section-title">Medical Advice</h4>
        <div class="table-container">
          <table>
            <tbody>
              <tr>
                <th>Instructions</th>
                <td>${advice.join("<br>")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </div>
      `
          : ""
      }

      <!-- Follow-up -->
      ${
        followUpSchedule
          ? `
      <div class="section-container">
        <h4 class="section-title">Follow-up</h4>
        <div class="table-container">
          <table>
            <tbody>
              <tr>
                <th>Next Visit</th>
                <td>${followUpSchedule}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      `
          : ""
      }

      ${medicineScheduleHtml}
    </div>

    <div class="footer">
      <span> 2025 Preva Care | Electronic Prescription System</span>
    </div>
  </body>
</html>
`;
}

module.exports = {
  createEMRPDF,
  generateEMRPDF,
  getEmrPdfByemrId,
  getEPrescriptionPdfById,
  getEmrPdfLinkByemrId,
  getEPrescriptionPdfLinkByemrId,
  launchPuppeteerBrowser,
};
