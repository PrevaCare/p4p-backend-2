const fs = require("fs");
const dayjs = require("dayjs");
const path = require("path");
const PDFDocument = require("pdfkit-table");
const { dummyDataFemalePdf } = require("../../../../../public/emrPdfData");
const Response = require("../../../../../utils/Response");
const AppConstant = require("../../../../../utils/AppConstant");
const emrModel = require("../../../../../models/common/emr.model.js");
const {
  generateEMRPDFFn,
  generatePrescriptionPDFFn,
} = require("../../../../../helper/emrPdf/generateEmrPdfFn.helper.js");
const eprescriptionModel = require("../../../../../models/patient/eprescription/eprescription.model.js");
const createEMRPDF = async (req, res) => {
  try {
    // const emrPdfData = new EemrPdfData(req.body);
    // await emrPdfData.save();

    // Generate and send the PDF directly
    await generateEMRPDF(dummyDataFemalePdf, res);
    // const pdfPath = await generatePrescriptionPDF(emrPdfData);
    // return res.download(pdfPath);
  } catch (err) {
    // console.log(err);
    res.status(500).json({ error: "Failed to generate emrPdfData" });
  }
};

// const generateEMRPDF = async (emrPdfData, res) => {
const generateEMRPDF = async (emrPdfData) => {
  // console.log(emrPdfData);
  let doc;
  // return new Promise((resolve, reject) => {
  try {
    doc = new PDFDocument({
      size: "A4",
      margin: 0,
    });

    // you can test here -- by enabling below comment line to test in api response directly
    // // Set up the response headers for PDF download
    // res.setHeader("Content-Type", "application/pdf");
    // res.setHeader(
    //   "Content-Disposition",
    //   `attachment; filename=emrPdfData_${emrPdfData._id}.pdf`
    // );

    // // Pipe the PDF directly to the response
    // doc.pipe(res);

    // save the pdf file in the public temp folder
    const fileName = `emr_pdf${emrPdfData.basicInfo.phoneNumber}.pdf`;
    const filePath = path.join(
      __dirname,
      "../../../../../public",
      "temp",
      fileName
    );
    // console.log(filePath);

    // Pipe the PDF to a writable stream (write to disk)
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // register font
    const fontRegularPath = path.join(
      __dirname,
      "../../../../../public/font/Roboto",
      "Roboto-Regular.ttf"
    );
    const fontMediumPath = path.join(
      __dirname,
      "../../../../../public/font/Roboto",
      "Roboto-Medium.ttf"
    );
    const fontBoldPath = path.join(
      __dirname,
      "../../../../../public/font/Roboto",
      "Roboto-Bold.ttf"
    );
    // console.log(fontBoldPath);

    // Register the font
    doc.registerFont("Roboto-Regular", fontRegularPath);
    doc.registerFont("Roboto-Medium", fontMediumPath);
    doc.registerFont("Roboto-Bold", fontBoldPath);

    // Doctor info
    doc
      .font("Roboto-Medium")
      .fontSize(18)
      .fillColor("#4b90e2")
      .text(
        `${emrPdfData.doctor.firstName} ${emrPdfData.doctor.lastName}`,
        50,
        50,
        { align: "left" }
      )
      .fillColor("#000")
      .fontSize(12)

      .text(`${emrPdfData.doctor.degree}`, 50, doc.y, {
        align: "left",
      })
      .text(`${emrPdfData.doctor.specialization}`, 50, doc.y, {
        align: "left",
      })
      .text(`${emrPdfData.doctor.medicalRegistrationNumber}`, 50, doc.y, {
        align: "left",
      });

    // Add logo
    doc
      .image(path.join(__dirname, "../../../../../public/logo.png"), 400, 45, {
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
    // create new page if space less
    let currentPage = 1; // Start with the first page
    // fn to add border
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
        path.join(__dirname, "../../../../../public/footerIcon/call.png"),
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
        path.join(__dirname, "../../../../../public/footerIcon/internet.png"),
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
        path.join(__dirname, "../../../../../public/footerIcon/mail.png"),
        400,
        footerTop + 15,
        { width: 15 }
      );

      // add page
      doc
        .fillColor("#000")
        .fontSize(11)
        .font("Roboto-Medium")
        .text(`Page ${currentPage}`, 0, footerTop - 18, {
          align: "center",
        });
      currentPage++;
    };
    const ensureSpace = (neededSpace) => {
      addFooter();

      // Check if there's enough space on the current page
      if (doc.y + neededSpace > doc.page.height - doc.page.margins.bottom) {
        // Add a new page
        doc.addPage();
      }
    };

    doc.moveDown(0.5);

    const lineY = doc.y + 10; // Add 10 units of margin above the line
    doc
      .moveTo(0, lineY)
      .lineTo(doc.page.width, lineY)
      .strokeColor("#4b90e2")
      .lineWidth(3)
      .stroke();

    // middle
    doc
      .font("Roboto-Medium")
      .fontSize(12)
      .text(`EMR (Electronic Medical Report)`, 0, doc.y + 20, {
        align: "center",
      });

    // doc.moveTo(50, 100).lineTo(550, 100).strokeColor("#4b90e2").stroke();

    // Patient info
    const basicInfoAndDateY = doc.y + 40;

    doc
      .font("Roboto-Bold")
      .fontSize(14)
      .text(`Basic Info: `, 50, basicInfoAndDateY, {
        align: "left",
      });

    doc
      .font("Roboto-Medium")
      .fontSize(12)
      .text(
        `Date : ${dayjs(emrPdfData.createdAt).format("DD-MM-YYYY")}`,
        445,
        basicInfoAndDateY
      );

    patientY = doc.y + 20;
    doc
      .font("Roboto-Medium")
      .fontSize(12)
      .text(`Patient Name : ${emrPdfData.basicInfo.name}`, 60, patientY, {
        align: "left",
      });

    doc
      .fontSize(12)
      .text(`Age : ${emrPdfData.basicInfo?.age || ""} Years`, 110, doc.y + 20, {
        align: "left",
      });

    // Prescription details
    doc.text(
      `Children : ${emrPdfData.basicInfo?.children || ""}`,
      90,
      doc.y + 20
    );
    doc.text(
      `Gender : ${emrPdfData.basicInfo.gender === "F" ? "Female" : "Male"}`,
      98,
      doc.y + 20
    );
    doc.text(
      `Phone Number : ${emrPdfData.basicInfo?.phoneNumber || ""}`,
      58,
      doc.y + 20
    );
    doc.text(
      `Marital Status : ${emrPdfData.basicInfo?.maritalStatus || ""}`,
      62,
      doc.y + 20
    );
    doc.text(
      `Blood Group : ${emrPdfData.basicInfo?.bloodGroup || ""}`,
      70,
      doc.y + 20
    );
    doc.text(
      `Address : ${emrPdfData.basicInfo.address.name} ${emrPdfData.basicInfo.address.street} ${emrPdfData.basicInfo.address.city} ${emrPdfData.basicInfo.address.state}, ${emrPdfData.basicInfo.address.zipCode}`,
      96,
      doc.y + 20
    );

    // history section
    doc
      .font("Roboto-Bold")
      .fontSize(14)
      .text(`History: `, 50, doc.y + 40, {
        align: "left",
      });

    doc
      .font("Roboto-Medium")
      .fontSize(12)
      .text(
        `Chief Complaint : ${emrPdfData.history?.chiefComplaint || ""}`,
        55,
        doc.y + 20
      );
    const historyOfPresentingIllnessY = doc.y + 20;

    doc.text(
      `History Of Presenting Illness `,
      70,
      historyOfPresentingIllnessY,
      { width: 100 }
    );

    doc.text(
      `: ${emrPdfData.history?.historyOfPresentingIllness || ""}`,
      146,
      historyOfPresentingIllnessY
    );

    doc.text(
      `Past History : ${
        emrPdfData.history?.pastHistory.length > 0
          ? emrPdfData.history?.pastHistory
              .map((item) => item.sufferingFrom)
              .join(", ")
          : ""
      }`,
      80,
      doc.y + 30
    );
    doc.text(
      `Drug Taking : ${
        emrPdfData.history?.pastHistory.length > 0
          ? emrPdfData.history?.pastHistory
              .map((item) => item.drugName)
              .join(", ")
          : ""
      }`,
      83,
      doc.y + 20
    );
    doc.text(
      `Previous Surgeries : ${emrPdfData.history?.previousSurgeries || ""}`,
      50,
      doc.y + 20
    );
    ensureSpace(90);

    const personalHabbitY = doc.y + 20;
    doc
      .text(`Habits : `, 115, personalHabbitY)
      .text(
        `Smoking: ${emrPdfData.history.habits.smoking ? "Yes" : "No"}`,
        160,
        personalHabbitY
      )
      .text(
        `Pack Years: ${
          emrPdfData.history.habits.packYears
            ? emrPdfData.history.habits.packYears
            : ""
        }`,
        240,
        personalHabbitY
      )
      .text(
        `Alcohol: ${emrPdfData.history.habits?.alcohol ? "Yes" : "No"}`,
        160,
        personalHabbitY + 20
      )
      .text(
        `Alcohol Details: ${
          emrPdfData.history.habits.alcoholDetails
            ? emrPdfData.history.habits.alcoholDetails
            : ""
        }`,
        240,
        personalHabbitY + 20
      )
      .text(
        `Qty. Per Week: ${
          emrPdfData.history.habits.qntPerWeek
            ? emrPdfData.history.habits.qntPerWeek
            : "0"
        } ml`,
        400,
        personalHabbitY + 20
      );

    doc.text(
      `Bowel And Bladder : ${emrPdfData.history?.bowelAndBladder || ""}`,
      50,
      doc.y + 20
    );

    doc.text(
      `Appetite : ${emrPdfData.history?.appetite || ""}`,
      113,
      doc.y + 20
    );
    doc.text(`Sleep : ${emrPdfData.history?.sleep || ""}`, 127, doc.y + 20);
    doc.text(`Stress Screening :   `, 65, doc.y + 30);
    doc.text(
      `Desc: ${emrPdfData.history.stressScreening?.desc || ""}`,
      118,
      doc.y + 10
    );
    doc.text(
      `Recomendation : ${
        emrPdfData.history.stressScreening?.recomendation || ""
      }`,
      118,
      doc.y + 10
    );
    doc.text(
      `Score: ${emrPdfData.history.stressScreening?.score || ""}`,
      118,
      doc.y + 10
    );

    doc.text(`Depression Screening :   `, 65, doc.y + 20);
    doc.text(
      `Desc: ${emrPdfData.history.depressionScreening?.desc || ""}`,
      118,
      doc.y + 10
    );
    doc.text(
      `Recomendation : ${
        emrPdfData.history.depressionScreening?.recomendation || ""
      }`,
      118,
      doc.y + 10
    );
    doc.text(
      `Score : ${emrPdfData.history.depressionScreening?.score || ""}`,
      118,
      doc.y + 10
    );
    const mentalHealthAssementY = doc.y + 20;
    doc.text(`Mental Health Assessment `, 75, mentalHealthAssementY, {
      width: 120,
    });
    doc.text(
      `: ${emrPdfData.history?.depressionScreening?.score || ""}`,
      150,
      mentalHealthAssementY,
      { width: 120 }
    );
    // General Physical Exam
    doc
      .font("Roboto-Bold")
      .fontSize(14)
      .text(`General Physical Exam : `, 50, doc.y + 40, {
        align: "left",
      });

    const generalPhysicalExamY1 = doc.y + 20;
    doc
      .font("Roboto-Medium")
      .fontSize(12)
      .text(
        `PR : ${
          emrPdfData.generalPhysicalExamination?.PR || ""
        } bpm               BP : ${
          emrPdfData.generalPhysicalExamination?.BP?.sys || ""
        }/${
          emrPdfData.generalPhysicalExamination?.BP?.dia || ""
        } mmHg               Volume : ${
          emrPdfData.generalPhysicalExamination?.volume || ""
        }`,
        100,
        generalPhysicalExamY1
      );
    const generalPhysicalExamY2 = doc.y + 20;
    doc
      .fontSize(12)
      .text(
        `Regularity : ${
          emrPdfData.generalPhysicalExamination?.regularity || ""
        }               Character : ${
          emrPdfData.generalPhysicalExamination?.character || ""
        }               Temperature : ${
          emrPdfData.generalPhysicalExamination.temperature || ""
        }`,
        100,
        generalPhysicalExamY2
      );
    const generalPhysicalExamY3 = doc.y + 20;
    doc
      .fontSize(12)
      .text(
        `RR : ${
          emrPdfData.generalPhysicalExamination?.RR || ""
        }               SPO2 : ${
          emrPdfData.generalPhysicalExamination?.SPO2 || ""
        } %               Radio Femoral Delay : ${
          emrPdfData.generalPhysicalExamination?.radioFemoralDelay || ""
        }`,
        100,
        generalPhysicalExamY3
      );
    const generalPhysicalExamY4 = doc.y + 20;
    doc
      .fontSize(12)
      .text(
        `Height : ${
          emrPdfData.generalPhysicalExamination?.height || ""
        } cm               Weight : ${
          emrPdfData.generalPhysicalExamination?.weight || ""
        } Kg               BMI : ${
          emrPdfData.generalPhysicalExamination?.BMI || ""
        } kg/m2`,
        100,
        generalPhysicalExamY4
      );
    const generalPhysicalExamY5 = doc.y + 20;
    doc
      .fontSize(12)
      .text(
        `Pallor : ${
          emrPdfData.generalPhysicalExamination?.pallor || ""
        }               Icterus : ${
          emrPdfData.generalPhysicalExamination.icterus || ""
        }               Cyanosis : ${
          emrPdfData.generalPhysicalExamination.cyanosis || ""
        }                JVP : ${
          emrPdfData.generalPhysicalExamination.JVP || ""
        }`,
        100,
        generalPhysicalExamY5
      );
    const generalPhysicalExamY6 = doc.y + 20;
    doc
      .fontSize(12)
      .text(
        `Clubbing : ${
          emrPdfData.generalPhysicalExamination?.clubbing || ""
        }               Lymphadenopathy : ${
          emrPdfData.generalPhysicalExamination.lymphadenopathy || ""
        }               Edema : ${
          emrPdfData.generalPhysicalExamination.edema || ""
        }`,
        100,
        generalPhysicalExamY6
      );
    ensureSpace(70);

    // Systemic Examination
    doc
      .font("Roboto-Bold")
      .fontSize(14)
      .text(`Systemic Examination : `, 50, doc.y + 100, {
        align: "left",
      });

    const systemicExaminationY1 = doc.y + 20;
    doc
      .font("Roboto-Medium")
      .fontSize(12)
      .text(
        `Respiratory System : ${
          emrPdfData.systemicExamination?.respiratorySystem || ""
        }               CVS : ${
          emrPdfData.systemicExamination?.CVS || ""
        }               CNS : ${emrPdfData.systemicExamination?.CNS || ""}`,
        100,
        systemicExaminationY1
      );
    const systemicExaminationY2 = doc.y + 20;
    doc
      .font("Roboto-Medium")
      .fontSize(12)
      .text(
        `PA : ${
          emrPdfData.systemicExamination?.PA || ""
        }               Other Systemic Findings : ${
          emrPdfData.systemicExamination?.otherSystemicFindings || ""
        }`,
        100,
        systemicExaminationY2
      );

    // investigations

    doc
      .font("Roboto-Bold")
      .fontSize(14)
      .text(`Investigations : `, 50, doc.y + 20, {
        align: "left",
      });

    emrPdfData.investigations.forEach((investigation, index) => {
      let investigationY1 = doc.y + 20;

      doc
        .font("Roboto-Medium")
        .fontSize(12)
        .text(`${index + 1} : ${investigation || ""} `, 100, investigationY1);
    });
    // Diagonosis

    doc
      .font("Roboto-Bold")
      .fontSize(14)
      .text(`Diagonosis : `, 50, doc.y + 20, {
        align: "left",
      });

    emrPdfData.diagnosis.forEach((diagnosis) => {
      let diagonosisY1 = doc.y + 20;

      doc
        .font("Roboto-Medium")
        .fontSize(12)
        .text(
          `Name : ${diagnosis.diagnosisName || ""}               Date : ${
            diagnosis.dateOfDiagnosis
              ? dayjs(diagnosis.dateOfDiagnosis || "").format("DD-MM-YYYY")
              : "NA"
          }`,
          100,
          diagonosisY1
        );
    });

    // gynaecologicalHistory -- only for gender F
    if (emrPdfData.basicInfo.gender === "F") {
      doc
        .font("Roboto-Bold")
        .fontSize(14)
        .text(`Gynaecological History : `, 50, doc.y + 30, {
          align: "left",
        });

      doc
        .font("Roboto-Medium")
        .fontSize(12)
        .text(
          `Age Of Menarche : ${
            emrPdfData.gynaecologicalHistory?.ageOfMenarche || ""
          }`,
          100,
          doc.y + 20
        );
      doc
        .fontSize(12)
        .text(
          `Cycle Duration : ${
            emrPdfData.gynaecologicalHistory?.cycleDuration || ""
          }`,
          100,
          doc.y + 20
        );
      doc
        .fontSize(12)
        .text(
          `Cycle Regularity : ${
            emrPdfData.gynaecologicalHistory?.cycleRegularity || ""
          }`,
          100,
          doc.y + 20
        );
      doc
        .fontSize(12)
        .text(
          `Days Of Bleeding : ${
            emrPdfData.gynaecologicalHistory?.daysOfBleeding || ""
          }`,
          100,
          doc.y + 20
        );
      doc
        .fontSize(12)
        .text(
          `Pads Used Per Day : ${
            emrPdfData.gynaecologicalHistory?.padsUsedPerDay || ""
          }`,
          100,
          doc.y + 20
        );
      doc
        .fontSize(12)
        .text(
          `Passage Of Clots : ${
            emrPdfData.gynaecologicalHistory?.passageOfClots || ""
          }`,
          100,
          doc.y + 20
        );
      doc
        .fontSize(12)
        .text(
          `Complaints : ${emrPdfData.gynaecologicalHistory?.complaints || ""}`,
          100,
          doc.y + 20
        );
      doc
        .fontSize(12)
        .text(
          `Previous History : ${
            emrPdfData.gynaecologicalHistory?.previousHistory || ""
          }`,
          100,
          doc.y + 20
        );

      doc
        .font("Roboto-Bold")
        .fontSize(14)
        .text(`Obstetric History : `, 50, doc.y + 30, {
          align: "left",
        });
      doc
        .font("Roboto-Medium")
        .fontSize(12)
        .text(
          `G : ${
            emrPdfData.gynaecologicalHistory.obstetricHistory.gScore || ""
          }     P : ${
            emrPdfData.gynaecologicalHistory.obstetricHistory.pScore || ""
          }     L : ${
            emrPdfData.gynaecologicalHistory.obstetricHistory.lScore || ""
          }     A : ${
            emrPdfData.gynaecologicalHistory.obstetricHistory.aScore || ""
          }`,
          100,
          doc.y + 20
        );
      doc
        .font("Roboto-Medium")
        .fontSize(12)
        .text(
          `Partner Blood Group : ${
            emrPdfData.gynaecologicalHistory.obstetricHistory
              ?.partnerBloodGroup || ""
          }`,
          100,
          doc.y + 20
        );
      ensureSpace(70);

      doc
        .font("Roboto-Bold")
        .fontSize(14)
        .text(`Conceptions : `, 50, doc.y + 30, {
          align: "left",
        });

      emrPdfData.gynaecologicalHistory.obstetricHistory.conceptions.forEach(
        (conception) => {
          // let conceptionY1 = doc.y + 20;

          doc
            .font("Roboto-Medium")
            .fontSize(12)
            .text(
              `Age At Conception : ${conception?.ageAtConception || ""}`,
              100,
              doc.y + 20
            );
          doc
            .font("Roboto-Medium")
            .fontSize(12)
            .text(
              `Mode Of Conception : ${conception?.modeOfConception || ""}`,
              100,
              doc.y + 20
            );
          doc
            .font("Roboto-Medium")
            .fontSize(12)
            .text(
              `Mode Of Delivery : ${conception?.modeOfDelivery || ""}`,
              100,
              doc.y + 20
            );
          doc
            .font("Roboto-Medium")
            .fontSize(12)
            .text(
              `Complications : ${conception?.complications || ""}`,
              100,
              doc.y + 20
            );
        }
      );
      doc
        .font("Roboto-Medium")
        .fontSize(12)
        .text(
          `Primigravida Weeks : ${
            emrPdfData.gynaecologicalHistory?.obstetricHistory
              ?.primigravidaWeeks || ""
          }`,
          100,
          doc.y + 20
        );
      doc
        .fontSize(12)
        .text(
          `EDD : ${
            emrPdfData.gynaecologicalHistory?.obstetricHistory.EDD
              ? dayjs(emrPdfData.gynaecologicalHistory.obstetricHistory.EDD)
              : ""
          }`,
          100,
          doc.y + 20
        );
      doc
        .fontSize(12)
        .text(
          `Symptoms : ${
            emrPdfData.gynaecologicalHistory?.obstetricHistory?.symptoms || ""
          }`,
          100,
          doc.y + 20
        );
      doc
        .fontSize(12)
        .text(
          `Examination : ${
            emrPdfData.gynaecologicalHistory.obstetricHistory?.examination || ""
          }`,
          100,
          doc.y + 20
        );
      doc
        .fontSize(12)
        .text(
          `USG Scans : ${
            emrPdfData.gynaecologicalHistory.obstetricHistory?.USGScans || ""
          }`,
          100,
          doc.y + 20
        );
      doc
        .fontSize(12)
        .text(
          `TD Dose Taken : ${
            emrPdfData.gynaecologicalHistory.obstetricHistory?.TDDoseTaken || ""
          }`,
          100,
          doc.y + 20
        );
      doc
        .fontSize(12)
        .text(
          `Prenatal Screening Reports : ${
            emrPdfData.gynaecologicalHistory.obstetricHistory
              ?.prenatalScreeningReports || ""
          }`,
          100,
          doc.y + 20
        );
      doc
        .fontSize(12)
        .text(
          `PrenatalVitamins : ${
            emrPdfData.gynaecologicalHistory.obstetricHistory?.prenatalVitamins
              ? "Yes"
              : "No"
          }`,
          100,
          doc.y + 20
        );

      doc
        .fontSize(12)
        .text(
          `Fresh Complaint : ${
            emrPdfData.gynaecologicalHistory.obstetricHistory?.freshComplaint ||
            ""
          }`,
          100,
          doc.y + 20
        );
      doc
        .fontSize(12)
        .text(
          `Fresh Complaint : ${
            emrPdfData.gynaecologicalHistory.obstetricHistory?.freshComplaint ||
            ""
          }`,
          100,
          doc.y + 20
        );
      doc
        .fontSize(12)
        .text(
          `Nutritional History : ${
            emrPdfData.gynaecologicalHistory.obstetricHistory
              ?.nutritionalHistory || ""
          }`,
          100,
          doc.y + 20
        );
      doc
        .fontSize(12)
        .text(
          `Treating Gynaecologist Name : ${
            emrPdfData.gynaecologicalHistory.obstetricHistory
              ?.treatingGynaecologistName || ""
          }`,
          100,
          doc.y + 20
        );
      doc
        .fontSize(12)
        .text(
          `Gynaecologist Address : ${
            emrPdfData.gynaecologicalHistory.obstetricHistory
              ?.gynaecologistAddress || ""
          }`,
          100,
          doc.y + 20
        );
    }
    ensureSpace(90);

    // doctor notes
    doc
      .font("Roboto-Bold")
      .fontSize(14)
      .text(`Doctor Notes : `, 50, doc.y + 20, {
        align: "left",
      });

    doc
      .font("Roboto-Medium")
      .fontSize(12)
      .text(`${emrPdfData?.doctorNotes || ""}`, 100, doc.y + 15);
    // advice
    doc
      .font("Roboto-Bold")
      .fontSize(14)
      .text(`Advice : `, 50, doc.y + 20, {
        align: "left",
      });

    doc
      .font("Roboto-Medium")
      .fontSize(12)
      .text(`${emrPdfData?.advice || ""}`, 100, doc.y + 15);
    // Referrals
    doc
      .font("Roboto-Bold")
      .fontSize(14)
      .text(`Referrals : `, 50, doc.y + 20, {
        align: "left",
      });

    doc
      .font("Roboto-Medium")
      .fontSize(12)
      .text(`${emrPdfData?.referrals || ""}`, 100, doc.y + 15);

    // Follow Up Schedule
    doc
      .font("Roboto-Bold")
      .fontSize(14)
      .text(`Follow Up Schedule : `, 50, doc.y + 20, {
        align: "left",
      });

    doc
      .font("Roboto-Medium")
      .fontSize(12)
      .text(`${emrPdfData?.followUpSchedule || ""}`, 100, doc.y + 15);

    // Consultation Mode
    doc
      .font("Roboto-Bold")
      .fontSize(14)
      .text(
        `Consultation Mode : ${
          emrPdfData.consultationMode === "online"
            ? "Tele Consultation"
            : "On Site"
        }`,
        50,
        doc.y + 20,
        {
          align: "left",
        }
      );
    doc.moveDown(4);

    // E-Signature
    const eSignY = doc.page.height - 150;

    // Add ESIGN photo

    // doc.image(
    //   path.join(__dirname, "../../../../../public/anupriya-sign.png"),
    //   450,
    //   doc.y + 35,
    //   {
    //     width: 100,
    //     algin: "right",
    //   }
    // );

    if (
      emrPdfData?.doctor?.eSign && // Check if the value exists
      typeof emrPdfData.doctor.eSign === "string" && // Ensure it is a string
      emrPdfData.doctor.eSign.trim().toLowerCase() !== "null"
    ) {
      // console.log(emrPdfData?.doctor?.eSign);
      // console.log("prescription?.doctor?.eSign" + prescription?.doctor?.eSign);

      doc.image(emrPdfData.doctor.eSign, 450, eSignY - 65, {
        width: 100,
        align: "right", // Corrected the typo from 'algin' to 'align'
      });
    }

    doc.fontSize(12).text("E - SIGNATURE", 470, eSignY);
    addFooter();
    doc.end();
    return doc;
  } catch (err) {
    // console.log("go into catch");
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

// get emr pdf by id
const getEmrPdfByemrId = async (req, res) => {
  try {
    const { emrId } = req.body;
    if (!emrId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "emrId is missing  !"
      );
    }
    const existingEmr = await emrModel.findById(emrId).populate({
      path: "doctor",
      select:
        "firstName lastName education specialization eSign medicalRegistrationNumber",
    });
    if (!existingEmr) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "emrId is missing  !"
      );
    }
    // console.log(existingEmr);

    await generateEMRPDFFn(existingEmr, res);
    // const pdfPath = await generatePrescriptionPDF(emrPdfData);
    // return res.download(pdfPath);
  } catch (err) {
    // console.log(err);
    res.status(500).json({ error: "Failed to generate emrPdfData" });
  }
};
// get emr pdf by id
const getEPrescriptionPdfById = async (req, res) => {
  try {
    const { ePrescriptionId } = req.body;
    if (!ePrescriptionId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "ePrescriptionId is missing  !"
      );
    }
    const existingEPrescription = await eprescriptionModel.findById(
      ePrescriptionId
    );

    if (!existingEPrescription) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "ePrescriptionId is missing  !"
      );
    }

    await generatePrescriptionPDFFn(existingEPrescription, res);
    // const pdfPath = await generatePrescriptionPDF(emrPdfData);
    // return res.download(pdfPath);
  } catch (err) {
    // console.log(err);
    res.status(500).json({ error: "Failed to generate emrpdf" });
  }
};

module.exports = {
  createEMRPDF,
  generateEMRPDF,
  getEmrPdfByemrId,
  getEPrescriptionPdfById,
};
