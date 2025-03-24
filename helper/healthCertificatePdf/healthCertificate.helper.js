const fs = require("fs");
const dayjs = require("dayjs");
const path = require("path");
const PDFDocument = require("pdfkit-table");
const AppConstant = require("../../utils/AppConstant");
const Response = require("../../utils/Response");
const axios = require("axios");
// const generateCorporateHealthCertificate = async (req, res) => {
//   try {
//     const { corporate } = req.body;
//     if (!corporate) {
//       return Response.error(
//         res,
//         404,
//         AppConstant.FAILED,
//         "corporate is required !"
//       );
//     }
//     await generatePrescriptionPDFFn(testData, res);
//   } catch (err) {
//     return Response.error(
//       res,
//       500,
//       AppConstant.FAILED,
//       err.message || "Internal server error!"
//     );
//   }
// };

const generateHealthCertificateCompanyFn = async (data, res) => {
  // console.log(prescription);
  let doc;
  // return new Promise((resolve, reject) => {
  try {
    doc = new PDFDocument({
      size: "A4",
      margin: 0,
    });

    // Set up the response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=health_certificate.pdf`
    );

    // Pipe the PDF directly to the response
    doc.pipe(res);

    // save the pdf file in the public temp folder
    // const fileName = `eprescription_pdf${prescription.prescriptionID}.pdf`;
    // const filePath = path.join(__dirname, "../../../public", "temp", fileName);

    // // Pipe the PDF to a writable stream (write to disk)
    // const writeStream = fs.createWriteStream(filePath);
    // doc.pipe(writeStream);

    // register font
    const logoBoldFont = path.join(
      __dirname,
      "../../public/font/Poppins",
      "Poppins-Bold.ttf"
    );
    const fontRegularPath = path.join(
      __dirname,
      "../../public/font/Inter/static",
      "Inter_18pt-Regular.ttf"
    );
    const fontMediumPath = path.join(
      __dirname,
      "../../public/font/Inter/static",
      "Inter_18pt-Medium.ttf"
    );
    const fontBoldPath = path.join(
      __dirname,
      "../../public/font/Inter/static",
      "Inter_18pt-Bold.ttf"
    );
    // console.log(fontBoldPath);

    // Register the font
    doc.registerFont("Poppins-Bold", logoBoldFont);
    doc.registerFont("Inter-Regular", fontRegularPath);
    doc.registerFont("Inter-Medium", fontMediumPath);
    doc.registerFont("Inter-Bold", fontBoldPath);

    // Add logo
    doc
      .image(path.join(__dirname, "../../public/logo.png"), 30, 30, {
        width: 40,
      })
      .fontSize(15)
      .font("Poppins-Bold")
      .text("Preva ", 80, 39)
      .fillColor("#4A90E2")
      .text("Care", 130, 39)
      .font("Inter-Regular");

    // company info
    doc
      .fillColor("#000")
      .fontSize(8)
      .font("Inter-Bold")
      .text(data.companyName, 420, 39)
      .font("Inter-Regular")

      .text(
        `Date of Issue: ${dayjs(data.date).format("DD. MM. YYYY")}`,
        422,
        doc.y
      )
      .text("Valid for 1 Year from the date of issue", 422, doc.y);

    doc.moveDown(1);

    // Add blue line
    const lineY = doc.y + 10; // Add 10 units of margin above the line
    doc
      .moveTo(0, lineY)
      .lineTo(doc.page.width, lineY)
      .strokeColor("#4b90e2")
      .lineWidth(0.2)
      .stroke();
    doc.moveDown(3);

    doc
      .fontSize(20)
      .font("Inter-Bold")
      .text("CORPORATE HEALTH CERTIFICATE", 120, doc.y + 30, {
        align: "left",
      });

    doc
      .fontSize(12)
      .text(
        `This certificate is proudly awarded to ${data.companyName} in recognition of their commitment to employee well-being.`,
        90,
        doc.y + 30,
        { align: "center", width: 450 }
      );

    doc.moveDown(1);

    const orgHelathScoreY = doc.y;
    drawCircularProgress(
      doc,
      data.overAllHealthScore || 0,
      180,
      orgHelathScoreY,
      55,
      55
    );
    doc
      .font("Inter-Regular")
      .fillColor("#000")
      .fontSize(12)
      .text("ORGANISATION HEALTH SCORE", 250, orgHelathScoreY + 16);

    doc.moveDown(2.3);
    const employeeFitY = doc.y;
    drawCircularProgress(
      doc,
      data.employeeFitPercentage || 0,
      180,
      employeeFitY,
      55,
      55
    );
    doc
      .font("Inter-Regular")
      .fillColor("#000")
      .fontSize(12)
      .text("EMPLOYEES ARE ABSOLUTELY FIT", 250, employeeFitY + 16);

    //
    doc.moveDown(1);

    doc
      .fontSize(12)
      .text(
        `This score reflects the health status of the workforce based on a comprehensive preventive health checkup program conducted by Preva Care on ${dayjs(
          data.date
        ).format("DD-MM-YYYY")} at ${data.address}.`,
        70,
        doc.y + 30,
        { align: "center", width: 460 }
      );
    doc.moveDown(2);

    doc
      .fontSize(12)
      .font("Inter-Medium")
      .text(
        `We Congratulate the entire team at ${data.companyName} on achieving an ${data.employeeFitPercentage}% of healthy workforce as a testament to their dedication to fostering a healthy, productive workplace environment.`,
        70,
        doc.y + 30,
        { align: "center", width: 460 }
      );
    doc.moveDown(2);

    // assigned doctors
    const assignedDoctorY = doc.y;
    // console.log(data.doctor);
    // data.doctor.forEach(async (doctor, index) => {
    //   const eSignUrl = await fetchImage(doctor.eSign);
    //   doc
    //     .fillColor("#000")
    //     .fontSize(10)
    //     .font("Inter-Medium")
    //     .text(
    //       `Dr. ${doctor.firstName} ${doctor.lastName}`,
    //       100 + 150 * index,
    //       assignedDoctorY
    //     )
    //     .fontSize(8)
    //     .text(doctor.specialization, 115 + 150 * index, assignedDoctorY + 15)
    //     .font("Inter-Regular")
    //     .fontSize(8.5)
    //     .font("Inter-Regular")
    //     .text(doctor.degree, 110 + 150 * index, assignedDoctorY + 25)
    //     .text(
    //       `Reg. No: ${doctor.registrationNumber}`,
    //       105 + 150 * index,
    //       assignedDoctorY + 35
    //     )

    //     .image(
    //       "https://p4phealthcareprofileimg.s3.amazonaws.com/1737356564816_Screenshot%202025-01-20%20at%2011.18.01%C3%A2%C2%80%C2%AFAM.png",

    //       120 + 150 * index,
    //       assignedDoctorY + 50,
    //       {
    //         width: 57,
    //         height: 20,
    //       }
    //     )
    //     .text("E-Signature", 120 + 150 * index, assignedDoctorY + 75);
    // });
    for (const [index, doctor] of data.doctor.entries()) {
      const eSignUrl = await fetchImage(doctor.eSign);
      doc
        .fillColor("#000")
        .fontSize(10)
        .font("Inter-Medium")
        .text(
          `Dr. ${doctor.firstName} ${doctor.lastName}`,
          100 + 150 * index,
          assignedDoctorY
        )
        .fontSize(8)
        .text(doctor.specialization, 115 + 150 * index, assignedDoctorY + 15)
        .font("Inter-Regular")
        .fontSize(8.5)
        .font("Inter-Regular")
        .text(doctor.degree, 110 + 150 * index, assignedDoctorY + 25)
        .text(
          `Reg. No: ${doctor.registrationNumber}`,
          105 + 150 * index,
          assignedDoctorY + 35
        )
        .image(eSignUrl, 120 + 150 * index, assignedDoctorY + 50, {
          width: 57,
          height: 20,
        })
        .text("E-Signature", 120 + 150 * index, assignedDoctorY + 75);
    }

    doc
      .fontSize(8)
      .font("Inter-Bold")
      .text(
        `This certificate is based on data provided by the health assessments conducted By Preva Care which upholds strict confidentiality standards and ensures data accuracy to the best of its ability.`,
        70,
        doc.y + 30,
        { align: "center", width: 460 }
      );
    doc.moveDown(3);

    // Add blue line
    const footerLineY = doc.y + 10; // Add 10 units of margin above the line
    doc
      .moveTo(0, footerLineY)
      .lineTo(doc.page.width, footerLineY)
      .strokeColor("#4b90e2")
      .lineWidth(3)
      .stroke();
    doc.moveDown(2);

    // footer icons

    const firstrowIconY = doc.y + 10;
    doc
      .image(
        path.join(__dirname, "../../public/healthCertificateIcon/call.png"),
        30,
        firstrowIconY,
        {
          width: 17,
          link: "tel:+91 959 990 3172",
        }
      )
      .fontSize(12)
      .font("Inter-Regular")
      .text("+91 959 990 3172 ", 60, firstrowIconY);
    doc
      .image(
        path.join(__dirname, "../../public/healthCertificateIcon/mail.png"),
        400,
        firstrowIconY + 2,
        {
          width: 17,
        }
      )
      .fontSize(12)
      .font("Inter-Regular")
      .text("info@preva.care", 430, firstrowIconY, {
        link: "mailto:info@preva.care",
      });
    doc.moveDown(0.5);

    const secondrowIconY = doc.y + 10;
    doc
      .image(
        path.join(__dirname, "../../public/healthCertificateIcon/location.png"),
        30,
        secondrowIconY + 3,
        {
          width: 17,
        }
      )
      .fontSize(10)
      .font("Inter-Regular")
      .text(
        "P-1 Ground Floor B/P P-1 To P-20NDSE II New Delhi DL 110049 IN",
        60,
        secondrowIconY,
        { width: 180 }
      );
    doc
      .image(
        path.join(__dirname, "../../public/healthCertificateIcon/net.png"),
        400,
        secondrowIconY,
        {
          width: 17,
        }
      )
      .fontSize(12)
      .font("Inter-Regular")
      .text("preva.care", 430, secondrowIconY, {
        link: "https://preva.care",
      });

    doc.end();
    // return doc;

    // return Response.success(
    //   res,
    //   null,
    //   201,
    //   AppConstant.SUCCESS,
    //   "E-Prescription created Successfully !"
    // );
  } catch (err) {
    console.log("go into catch");
    console.log(err);
    doc.end();

    if (doc && doc.pipe) {
      doc.end();
      return Response.error(
        res,
        500,
        AppConstant.FAILED,
        err.message || "Internal server error!"
      );
    } else {
      return Response.error(
        res,
        500,
        AppConstant.FAILED,
        err.message || "Internal server error!"
      );
    }
  }
};
const generateCorporateEmployeeFitnessCertificatePDFFn = async (data, res) => {
  // console.log(prescription);
  let doc;
  // return new Promise((resolve, reject) => {
  try {
    doc = new PDFDocument({
      size: "A4",
      margin: 0,
    });

    // Set up the response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=employee_health_certificate.pdf`
    );

    // Pipe the PDF directly to the response
    doc.pipe(res);

    // save the pdf file in the public temp folder
    // const fileName = `eprescription_pdf${prescription.prescriptionID}.pdf`;
    // const filePath = path.join(__dirname, "../../../public", "temp", fileName);

    // // Pipe the PDF to a writable stream (write to disk)
    // const writeStream = fs.createWriteStream(filePath);
    // doc.pipe(writeStream);

    // register font
    const logoBoldFont = path.join(
      __dirname,
      "../../public/font/Poppins",
      "Poppins-Bold.ttf"
    );
    const fontRegularPath = path.join(
      __dirname,
      "../../public/font/Inter/static",
      "Inter_18pt-Regular.ttf"
    );
    const fontMediumPath = path.join(
      __dirname,
      "../../public/font/Inter/static",
      "Inter_18pt-Medium.ttf"
    );
    const fontBoldPath = path.join(
      __dirname,
      "../../public/font/Inter/static",
      "Inter_18pt-Bold.ttf"
    );
    // console.log(fontBoldPath);

    // Register the font
    doc.registerFont("Poppins-Bold", logoBoldFont);
    doc.registerFont("Inter-Regular", fontRegularPath);
    doc.registerFont("Inter-Medium", fontMediumPath);
    doc.registerFont("Inter-Bold", fontBoldPath);

    // Add logo
    doc
      .image(path.join(__dirname, "../../public/logo.png"), 30, 30, {
        width: 40,
      })
      .fontSize(15)
      .font("Poppins-Bold")
      .text("Preva ", 80, 39)
      .fillColor("#4A90E2")
      .text("Care", 130, 39)
      .font("Inter-Regular");

    // company info
    doc
      .fillColor("#000")
      .fontSize(8)
      .font("Inter-Bold")
      .text(data.companyName, 398, 39)
      .font("Inter-Regular")

      .text(
        `Date of Issue: ${dayjs(data.date).format("DD.MM.YYYY")}`,
        400,
        doc.y
      )
      .text("Valid for 1 Year from the date of issue", 400, doc.y);

    doc.moveDown(1);

    // Add blue line
    const lineY = doc.y + 10; // Add 10 units of margin above the line
    doc
      .moveTo(0, lineY)
      .lineTo(doc.page.width, lineY)
      .strokeColor("#4b90e2")
      .lineWidth(3)
      .stroke();
    doc.moveDown(1);

    doc
      .fontSize(20)
      .font("Inter-Bold")
      .text("EMPLOYEE HEALTH CERTIFICATE", 120, doc.y + 30, {
        align: "left",
      });

    doc
      .fontSize(12)
      .text(
        `This is to certify that ${data.gender === "M" ? "Mr." : "Ms."} ${
          data.employeeName
        } has completed a comprehensive health assessment by Preva Care on ${dayjs(
          data.date
        ).format("DD-MM-YYYY")} at ${
          data.companyName
        } as a part of Preventive Annual Health Checkup.`,
        40,
        doc.y + 30,
        { align: "center", width: 520 }
      );

    doc
      .fontSize(12)
      .text(
        `Based on this evaluation, ${data.gender === "M" ? "Mr." : "Ms."} ${
          data.employeeName
        } has achieved a Health Score of ${data.overAllHealthScore}/100.`,
        50,
        doc.y + 10,
        { align: "center", width: 520 }
      );
    doc.moveDown(2);

    const orgHelathScoreY = doc.y;
    drawCircularProgress(
      doc,
      data.overAllHealthScore,
      150,
      orgHelathScoreY,
      50,
      50
    );
    doc
      .font("Inter-Regular")
      .fillColor("#000")
      .fontSize(12)
      .text("OVERALL HEALTH SCORE", 250, orgHelathScoreY + 18);

    doc.moveDown(2);
    const employeeFitY = doc.y;
    doc.fontSize(12).text("INTERPRETATION", 120, employeeFitY);
    doc
      .font("Inter-Regular")
      .fillColor("#000")
      .fontSize(12)
      .text(data.interpretation + " Health", 250, employeeFitY);

    //
    doc.moveDown(1);

    doc
      .fontSize(12)
      .text(
        `This score reflects the health status of the individual based on a comprehensive preventive health checkup program conducted by Preva Care on ${dayjs(
          data.date
        ).format("DD-MM-YYYY")} at ${data.address}.`,
        70,
        doc.y + 30,
        { align: "center", width: 460 }
      );
    doc.moveDown(1);

    doc
      .fontSize(12)
      .font("Inter-Medium")
      .fillColor("#4A90E2")
      .text(
        `Your health is in a ${data.interpretation} range. It is advisable to schedule a health checkup every 6 months. Regular follow-up with your doctor is recommended for maintaining optimal health.`,
        70,
        doc.y + 30,
        { align: "center", width: 460 }
      );
    doc.moveDown(1);
    doc
      .fillColor("#000")
      .fontSize(12)
      .font("Inter-Medium")
      .text(
        `We Congratulate ${data.employeeName} on achieving an ${data.overAllHealthScore}% of overall health score as a testament to his dedication to fostering a healthy, productive workplace environment.
`,
        70,
        doc.y,
        { align: "center", width: 460 }
      );
    doc.moveDown(1);

    // doctor Sign
    // const eSignUrl = await fetchImage(data.doctor.eSign);
    const assignedDoctorY = doc.y;
    if (data.doctor) {
      doc
        .fillColor("#000")
        .fontSize(10)
        .font("Inter-Medium")
        .text(
          `Dr. ${data.doctor.firstName} ${data.doctor.lastName}`,
          250,
          assignedDoctorY
        )
        .fontSize(8)
        .text(data.doctor?.specialization, 265, assignedDoctorY + 15)
        .font("Inter-Regular")
        .fontSize(8.5)
        .font("Inter-Regular")
        .text(data.doctor?.degree, 260, assignedDoctorY + 25)
        .text(
          `Reg. No: ${data.doctor?.registrationNumber || ""}`,
          255,
          assignedDoctorY + 35
        )
        .image(await fetchImage(data.doctor.eSign), 250, assignedDoctorY + 50, {
          width: 57,
          height: 20,
        })
        .text("E-Signature", 260, assignedDoctorY + 75);

      doc
        .fontSize(8)
        .font("Inter-Bold")
        .text(
          `This certificate is based on data provided by the health assessments conducted By Preva Care which upholds strict confidentiality standards and ensures data accuracy to the best of its ability.`,
          70,
          doc.y + 30,
          { align: "center", width: 460 }
        );
      doc.moveDown(1);
    }

    // Add blue line
    const footerLineY = doc.y + 10; // Add 10 units of margin above the line
    doc
      .moveTo(0, footerLineY)
      .lineTo(doc.page.width, footerLineY)
      .strokeColor("#4b90e2")
      .lineWidth(3)
      .stroke();
    doc.moveDown(1.5);

    // footer icons

    const firstrowIconY = doc.y + 10;
    doc
      .image(
        path.join(__dirname, "../../public/healthCertificateIcon/call.png"),
        30,
        firstrowIconY,
        {
          width: 17,
          link: "tel:+91 959 990 3172",
        }
      )
      .fontSize(12)
      .font("Inter-Regular")
      .text("+91 959 990 3172 ", 60, firstrowIconY);
    doc
      .image(
        path.join(__dirname, "../../public/healthCertificateIcon/mail.png"),
        400,
        firstrowIconY + 2,
        {
          width: 17,
        }
      )
      .fontSize(12)
      .font("Inter-Regular")
      .text("info@preva.care", 430, firstrowIconY, {
        link: "mailto:info@preva.care",
      });
    doc.moveDown(0.5);

    const secondrowIconY = doc.y + 10;
    doc
      .image(
        path.join(__dirname, "../../public/healthCertificateIcon/location.png"),
        30,
        secondrowIconY + 3,
        {
          width: 17,
        }
      )
      .fontSize(10)
      .font("Inter-Regular")
      .text(
        "P-1 Ground Floor B/P P-1 To P-20NDSE II New Delhi DL 110049 IN",
        60,
        secondrowIconY,
        { width: 180 }
      );
    doc
      .image(
        path.join(__dirname, "../../public/healthCertificateIcon/net.png"),
        400,
        secondrowIconY,
        {
          width: 17,
        }
      )
      .fontSize(12)
      .font("Inter-Regular")
      .text("preva.care", 430, secondrowIconY, {
        link: "https://preva.care",
      });

    doc.end();
    // return doc;

    // return Response.success(
    //   res,
    //   null,
    //   201,
    //   AppConstant.SUCCESS,
    //   "E-Prescription created Successfully !"
    // );
  } catch (err) {
    console.log("go into catch");
    console.log(err);
    doc.end();

    if (doc && doc.pipe) {
      doc.end();
      return Response.error(
        res,
        500,
        AppConstant.FAILED,
        err.message || "Internal server error!"
      );
    } else {
      return Response.error(
        res,
        500,
        AppConstant.FAILED,
        err.message || "Internal server error!"
      );
    }
  }
};

function drawCircularProgress(doc, percentage, x, y, width, height) {
  // Calculate dimensions
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const radius = Math.min(width, height) / 2.5;

  // Calculate angles for the arc (PDFKit uses radians)
  const startAngle = -0.5 * Math.PI; // Start at top
  const endAngle = startAngle + (2 * Math.PI * percentage) / 100;

  // Draw background circle (light gray)
  doc
    .circle(centerX, centerY, radius)
    .lineWidth(2) // Reduced line width to match image
    .strokeColor("#E6E6E6")
    .stroke();

  // Draw progress arc (blue)
  if (percentage > 0) {
    doc
      .arc(centerX, centerY, radius, startAngle, endAngle)
      .lineWidth(2) // Reduced line width to match image
      .strokeColor("#4B89DC")
      .stroke();
  }

  // Add percentage text
  doc
    .fontSize(12)
    .font("Inter-Bold")
    .fillColor("#4B89DC")
    .text(`${Math.round(percentage)}%`, centerX - radius, centerY - 6, {
      width: radius * 2,
      align: "center",
    });
}

async function fetchImage(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data, "binary");
  } catch (error) {
    console.error("Error fetching the image:", error.message);
    // Return a fallback image if the fetch fails
    return fs.readFileSync(path.join(__dirname, "../../public/no-Sign.png"));
  }
}

module.exports = {
  generateHealthCertificateCompanyFn,
  generateCorporateEmployeeFitnessCertificatePDFFn,
};
