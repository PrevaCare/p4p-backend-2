const Eprescription = require("../../../models/patient/eprescription/eprescription.model");

const PDFDocument = require("pdfkit-table");

const fs = require("fs");
const dayjs = require("dayjs");
const path = require("path");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");

const createEPrescription = async (req, res) => {
  try {
    // const prescription = new Eprescription(req.body);
    // await prescription.save();
    const prescription = {
      patient: {
        name: "John Doe",
        age: 35,
        gender: "Male",
      },
      doctor: {
        firstName: "Emily",
        lastName: "Stone",
        degree: "MBBS, MD",
        specialization: "Cardiologist",
        medicalRegistrationNumber: "12345678",
        eSign: path.join(__dirname, "../../../public/anupriya-sign.png"),
      },
      date: new Date("2024-10-10"),
      prescriptionID: "P4P-1",
      sx: "Cough, Chest pain, Breathlessness",
      vitals: {
        BP: "120/80",
        PR: "78",
        SpO2: "98",
      },
      dx: [
        {
          dateOfDiagnosis: new Date(),
          diagnosisName: "abc",
        },
      ],
      labTest: ["Blood Test", "ECG", "X-Ray"],
      rx: [
        {
          drugName: "Amlodipine",
          frequency: "Once daily",
          duration: "30 days",
          quantity: "30 tablets",
        },
        {
          drugName: "Salbutamol Inhaler",
          frequency: "As needed",
          duration: "30 days",
          quantity: "2 inhalers",
        },
      ],
      advice: [
        "Reduce salt intake",
        "Increase physical activity",
        "Avoid allergens",
      ],
      followUpSchedule: "follow up in next 3 days",
      consultationMode: "online",
    };

    // Generate and send the PDF directly
    await generatePrescriptionPDF(prescription, res);
  } catch (err) {
    // console.log(err);
    res.status(500).json({ error: "Failed to generate prescription" });
  }
};

// const generatePrescriptionPDF = async (prescription, res) => {
const generatePrescriptionPDF = async (prescription) => {
  // console.log(prescription);
  let doc;
  // return new Promise((resolve, reject) => {
  try {
    doc = new PDFDocument({
      size: "A4",
      margin: 0,
    });

    // Set up the response headers for PDF download
    // res.setHeader("Content-Type", "application/pdf");
    // res.setHeader(
    //   "Content-Disposition",
    //   `attachment; filename=prescription_${prescription.prescriptionID}.pdf`
    // );

    // Pipe the PDF directly to the response
    // doc.pipe(res);

    // save the pdf file in the public temp folder
    const fileName = `eprescription_pdf${prescription.prescriptionID}.pdf`;
    const filePath = path.join(__dirname, "../../../public", "temp", fileName);

    // // Pipe the PDF to a writable stream (write to disk)
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // register font
    const fontRegularPath = path.join(
      __dirname,
      "../../../public/font/Roboto",
      "Roboto-Regular.ttf"
    );
    const fontMediumPath = path.join(
      __dirname,
      "../../../public/font/Roboto",
      "Roboto-Medium.ttf"
    );
    const fontBoldPath = path.join(
      __dirname,
      "../../../public/font/Roboto",
      "Roboto-Bold.ttf"
    );
    // console.log(fontBoldPath);

    // Register the font
    doc.registerFont("Roboto-Regular", fontRegularPath);
    doc.registerFont("Roboto-Medium", fontMediumPath);
    doc.registerFont("Roboto-Bold", fontBoldPath);

    // Doctor info
    doc
      .font("Roboto-Regular")
      .fontSize(18)
      .fillColor("#4b90e2")
      .text(
        `${prescription.doctor.firstName} ${prescription.doctor.lastName}`,
        50,
        50,
        { align: "left" }
      )
      .fillColor("#000")
      .fontSize(12)

      .text(`${prescription.doctor.degree}`, 50, doc.y, {
        align: "left",
      })
      .text(`${prescription.doctor.specialization}`, 50, doc.y, {
        align: "left",
      })
      .text(`${prescription.doctor.medicalRegistrationNumber}`, 50, doc.y, {
        align: "left",
      });

    // Add logo
    doc
      .image(path.join(__dirname, "../../../public/logo.png"), 400, 45, {
        width: 30,
      })
      .fontSize(15)
      .font("Roboto-Medium")
      .text("Preva care", 436, 52)
      .font("Roboto-Regular")
      .fontSize(8)
      .text("CIN : U85100DL2019PTC352165", 425, doc.y + 10)
      .text(
        "Registered Office : P-1 GROUND FLOOR B/P P-1 TO P-20 NDSE II OPP. LI/11 , Delhi, India - 110049",
        370,
        doc.y + 5,
        { width: 180 }
      );

    // add border
    let currentPage = 1;
    const addFooter = () => {
      // Footer
      const footerHeight = 50;
      const footerTop = doc.page.height - 50;

      // Draw the footer rectangle
      doc.rect(0, footerTop, doc.page.width, footerHeight).fill("#4A90E2");

      // Set text color and font size
      doc.fillColor("#fff").fontSize(11).font("Roboto-Medium");

      // Left section
      doc.text("+91 995 8502197", 75, footerTop + 15);

      // left image
      doc.image(
        path.join(__dirname, "../../../public/footerIcon/call.png"),
        50,
        footerTop + 15,
        { width: 15 }
      );
      // middle section

      // middle
      doc.text("www.preva.care", 225, footerTop + 15, {
        link: "https://preva.care",
      });

      // middle image
      doc.image(
        path.join(__dirname, "../../../public/footerIcon/internet.png"),
        200,
        footerTop + 15,
        { width: 15 }
      );
      // right section
      doc.text("info@p4phealthcare.com", 425, footerTop + 15, {
        link: "mailto:info@p4phealthcare.com",
      });

      // right image
      doc.image(
        path.join(__dirname, "../../../public/footerIcon/mail.png"),
        400,
        footerTop + 15,
        { width: 15 }
      );

      // add page
      doc
        .fillColor("#000")
        .fontSize(11)
        .font("Roboto-Medium")
        .text(`Page ${currentPage}`, 280, footerTop - 18);
      currentPage++;
    };

    // add space
    doc.moveDown(0.5);

    // Add blue line
    // Add blue line with margin
    const lineY = doc.y + 10; // Add 10 units of margin above the line
    doc
      .moveTo(0, lineY)
      .lineTo(doc.page.width, lineY)
      .strokeColor("#4b90e2")
      .lineWidth(3)
      .stroke();

    // doc.moveTo(50, 100).lineTo(550, 100).strokeColor("#4b90e2").stroke();

    // middle
    doc
      .font("Roboto-Medium")
      .fontSize(12)
      .text(`E-Prescription`, 40, doc.y + 20, {
        align: "center",
      });

    // Patient info
    // const ePrescriptionDocumentCount = 1;
    patientY = doc.y + 20;
    doc
      .fontSize(12)
      .text(`Patient Name : ${prescription.patient.name}`, 50, patientY, {
        align: "left",
      })
      .text(
        `Prescription Id: P4P-${prescription.prescriptionID}`,
        400,
        patientY
      );

    const ageAndDateY = doc.y + 20;
    doc
      .fontSize(12)
      .text(`Age : ${prescription.patient.age} Years`, 100, ageAndDateY, {
        align: "left",
      });
    doc.text(
      `Date : ${dayjs(prescription.date).format("DD-MM-YYYY")}`,
      400,
      ageAndDateY
    );

    // Prescription details
    doc
      .text(`SX: ${prescription.sx}`, 110, doc.y + 20)
      .text(`DX: `, 110, doc.y + 20);
    //

    prescription.dx.forEach((dx) => {
      doc.text(
        `Name : ${dx.diagnosisName}             Date : ${
          dx.dateOfDiagnosis
            ? dayjs(dx.dateOfDiagnosis).format("DD-MM-YYYY")
            : "N/A"
        }`,
        140,
        doc.y + 5
      );
    });

    doc.text(`LAB TEST : ${prescription.labTest.join(", ")}`, 70, doc.y + 20);
    if (prescription.consultationMode !== "online")
      doc.text(
        `VITALS:  BP : ${prescription.vitals.BP} mmHg          PR: ${prescription.vitals.PR} bpm          SpO2: ${prescription.vitals.SpO2} %`,
        70,
        doc.y + 20
      );

    if (
      prescription.rx &&
      prescription.rx.length > 0 &&
      prescription.rx[0].drugName
    ) {
      doc.text(`RX :`, 110, doc.y + 20);

      // Medications (RX) in table format
      doc.moveDown(1.5);
      const table = {
        // title: "RX",
        headers: ["", "DRUG NAME", "FREQUENCY", "DURATION", "QUANTITY"],
        rows: prescription.rx.map((med, index) => [
          (index + 1).toString(),
          med.drugName,
          med.frequency || med.freequency,
          med.duration,
          med.quantity,
        ]),
      };

      doc.table(table, {
        prepareHeader: () => doc.font("Roboto-Medium").fontSize(10),
        prepareRow: (row, i) => doc.font("Roboto-Regular").fontSize(10),
        width: 500,
        x: 50,
        columnSpacing: 10,
        padding: 5,
        headerAlign: "left",
        align: "center",
        divider: {
          header: { disabled: false, width: 1, opacity: 1 },
          horizontal: { disabled: false, width: 1, opacity: 0.5 },
        },
        columnsSize: [30, 200, 90, 90, 90],
        minRowHeight: 20,
        // Change table border color to blue
        headerColor: "#fff",
        // Change row line color to light blue
        oddRowColor: "#fff",
        evenRowColor: "#fff",
      });
    }

    // Advice;
    doc.moveDown();
    // const adviceAndFollowUpY = doc.y + 20;
    doc.fontSize(12);
    doc.text("ADVICE:", 70, doc.y);
    doc.fontSize(10);
    prescription.advice.forEach((advice, index) => {
      doc.text(`${index + 1}. ${advice}`, 80, doc.y + 5);
    });

    const followUpY = doc.y + 20;
    doc.fontSize(12).text("FOLLOW UP :", 70, followUpY);
    doc.fontSize(10).text(prescription.followUpSchedule, 155, followUpY + 2);
    // E-Signature
    const eSignY = doc.page.height - 150;
    // Add ESIGN photo
    if (
      prescription?.doctor?.eSign && // Check if the value exists
      typeof prescription.doctor.eSign === "string" && // Ensure it is a string
      prescription.doctor.eSign.trim().toLowerCase() !== "null"
    ) {
      doc.image(prescription.doctor.eSign, 450, eSignY - 65, {
        width: 100,
        align: "right",
      });
    }

    // doc.image(
    //   path.join(__dirname, "../../../public/anupriya-sign.png"),
    //   450,
    //   doc.y + 35,
    //   {
    //     width: 100,
    //     algin: "right",
    //   }
    // );
    doc.fontSize(12).text("E - SIGNATURE", 470, eSignY);

    // footer
    // doc.rect(0, doc.page.height - 50, doc.page.width, 50).fill("#4A90E2");

    // doc.fillColor("#000").fontSize(10);

    // // First text (e.g., phone number)
    // doc.text("+91 995 8502197", 50, doc.page.height - 88, {
    //   align: "left",
    //   width: 150,
    // });
    addFooter();

    doc.end();
    return doc;

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

    //   if (doc && doc.pipe) {
    //     doc.end();
    //     return Response.error(
    //       res,
    //       500,
    //       AppConstant.FAILED,
    //       err.message || "Internal server error!"
    //     );
    //   } else {
    //     return Response.error(
    //       res,
    //       500,
    //       AppConstant.FAILED,
    //       err.message || "Internal server error!"
    //     );
    //   }
  }
};

module.exports = { createEPrescription, generatePrescriptionPDF };
