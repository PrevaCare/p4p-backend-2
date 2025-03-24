const fs = require("fs");
const dayjs = require("dayjs");
const path = require("path");
const PDFDocument = require("pdfkit-table");
const Employee = require("../../models/patient/employee/employee.model");
const Response = require("../../utils/Response");
const AppConstant = require("../../utils/AppConstant");
const employeePlanModel = require("../../models/patient/employee/employeePlan.model");
const Doctor = require("../../models/doctors/doctor.model");
const axios = require("axios");
// generate emr pdf
const generateEMRPDFFn = async (emrPdfData, res) => {
  //   console.log(path.join(__dirname, "../../public/footerIcon/call.png"));
  //   return;
  let doc;
  // return new Promise((resolve, reject) => {
  try {
    doc = new PDFDocument({
      size: "A4",
      margin: 0,
    });

    // you can test here -- by enabling below comment line to test in api response directly
    // Set up the response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=emrPdfData_${emrPdfData._id}.pdf`
    );

    // Pipe the PDF directly to the response
    doc.pipe(res);

    // save the pdf file in the public temp folder
    // const fileName = `emr_pdf${emrPdfData.basicInfo.phoneNumber}.pdf`;
    // const filePath = path.join(
    //   __dirname,
    //   "../../../../../public",
    //   "temp",
    //   fileName
    // );
    // console.log(filePath);

    // Pipe the PDF to a writable stream (write to disk)
    // const writeStream = fs.createWriteStream(filePath);
    // doc.pipe(writeStream);

    // register font
    const fontRegularPath = path.join(
      __dirname,
      "../../public/font/Roboto",
      "Roboto-Regular.ttf"
    );
    const fontMediumPath = path.join(
      __dirname,
      "../../public/font/Roboto",
      "Roboto-Medium.ttf"
    );
    const fontBoldPath = path.join(
      __dirname,
      "../../public/font/Roboto",
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

      .text(`${emrPdfData.doctor.degree || ""}`, 50, doc.y, {
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
      .image(path.join(__dirname, "../../public/logo.png"), 400, 45, {
        width: 30,
      })
      .fontSize(15)
      .font("Roboto-Medium")
      .text("Preva Care", 436, 52)
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
        path.join(__dirname, "../../public/footerIcon/call.png"),
        50,
        footerTop + 15,
        { width: 15 }
      );
      // middle section

      // // middle
      // doc.text("www.preva.care", 225, footerTop + 15, {
      //   link: "https://preva.care",
      // });

      // // middle image
      // doc.image(
      //   path.join(__dirname, "../../public/footerIcon/internet.png"),
      //   200,
      //   footerTop + 15,
      //   { width: 15 }
      // );
      // // right section
      // doc.text("info@p4phealthcare.com", 425, footerTop + 15, {
      //   link: "mailto:info@p4phealthcare.com",
      // });

      // // right image
      // doc.image(
      //   path.join(__dirname, "../../public/footerIcon/mail.png"),
      //   400,
      //   footerTop + 15,
      //   { width: 15 }
      // );
      // middle
      doc.text("www.preva.care", 270, footerTop + 15, {
        link: "https://preva.care",
      });

      // middle image
      doc.image(
        path.join(__dirname, "../../public/footerIcon/internet.png"),
        245,
        footerTop + 15,
        { width: 15 }
      );
      // right section
      doc.text("info@preva.care", 465, footerTop + 15, {
        link: "mailto:info@preva.care",
      });

      // right image
      doc.image(
        path.join(__dirname, "../../public/footerIcon/mail.png"),
        440,
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
      `Children : ${emrPdfData.basicInfo?.children || "0"}`,
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
      `Marital Status : ${
        emrPdfData.basicInfo?.maritalStatus ? "Married" : "Single"
      }`,
      62,
      doc.y + 20
    );
    doc.text(
      `Blood Group : ${emrPdfData.basicInfo?.bloodGroup || "not known"}`,
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
        `Chief Complaint : ${emrPdfData.history?.chiefComplaint || "N/A"}`,
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
      `: ${emrPdfData.history?.historyOfPresentingIllness || "N/A"}`,
      170,
      historyOfPresentingIllnessY
    );

    // past history
    doc.moveDown(1);
    ensureSpace(100);

    doc
      .font("Roboto-Bold")
      .fontSize(13)
      .text(`Past History: `, 55, doc.y + 40, {
        align: "left",
      })
      .font("Roboto-Medium")
      .fontSize(12);
    if (
      emrPdfData.history?.pastHistory &&
      emrPdfData.history?.pastHistory.length > 0
    ) {
      emrPdfData.history.pastHistory.forEach((item) => {
        // Render 'Suffering From' field
        doc.text(
          `Suffering From: ${item.sufferingFrom || "N/A"}`,
          70,
          doc.y + 20,
          {
            align: "left",
          }
        );

        // Render 'Drug Name' field
        doc.text(
          `Drug Name: ${item.drugName?.join(", ") || "N/A"}`,
          70,
          doc.y + 15,
          {
            align: "left",
          }
        );

        // Render 'Frequency' field
        doc.text(
          `Frequency: ${item.freequency?.join(", ") || "N/A"}`,
          70,
          doc.y + 15,
          {
            align: "left",
          }
        );

        // Render 'Readings' field
        doc.text(`Readings: ${item.readings || "N/A"}`, 70, doc.y + 15, {
          align: "left",
        });

        // Render 'Past History Notes' field
        doc.text(`Notes: ${item.pastHistoryNotes || "N/A"}`, 70, doc.y + 15, {
          align: "left",
        });

        // Add some spacing after each entry
        doc.moveDown(1);
      });
    }
    ensureSpace(200);

    doc
      .font("Roboto-Bold")
      .fontSize(13)
      .text(`Allergies: `, 55, doc.y + 40, {
        align: "left",
      })
      .font("Roboto-Medium")
      .fontSize(12);
    // allergies
    if (
      emrPdfData.history?.allergies &&
      emrPdfData.history?.allergies.length > 0
    ) {
      emrPdfData.history.allergies.forEach((item) => {
        // Render 'Allergy Name' field
        doc.text(`Allergy Name: ${item.allergyName || "N/A"}`, 70, doc.y + 20, {
          align: "left",
        });

        // Render 'Past Allergy Drug Name' field
        doc.text(
          `Past Allergy Drug Names: ${
            item.pastAllergyDrugName?.join(", ") || "N/A"
          }`,
          70,
          doc.y + 15,
          {
            align: "left",
          }
        );

        // Render 'Past Allergy Frequency' field
        doc.text(
          `Past Allergy Frequencies: ${
            item.pastAllergyFreequency?.join(", ") || "N/A"
          }`,
          70,
          doc.y + 15,
          {
            align: "left",
          }
        );

        // Render 'Advised By' field
        doc.text(`Advised By: ${item.advisedBy || "N/A"}`, 70, doc.y + 15, {
          align: "left",
        });

        // Render 'Advise' field
        doc.text(`Advise: ${item.advise || "N/A"}`, 70, doc.y + 15, {
          align: "left",
        });

        // Render 'Advise Allergy Drug Name' field
        doc.text(
          `Advise Allergy Drug Names: ${
            item.adviseAllergyDrugName?.join(", ") || "N/A"
          }`,
          70,
          doc.y + 15,
          {
            align: "left",
          }
        );

        // Render 'Advise Allergy Frequency' field
        doc.text(
          `Advise Allergy Frequencies: ${
            item.adviseAllergyFreequency?.join(", ") || "N/A"
          }`,
          70,
          doc.y + 15,
          {
            align: "left",
          }
        );

        // Add some spacing after each entry
        doc.moveDown(1);
      });
    }
    ensureSpace(200);

    doc.text(
      `Previous Surgeries : ${emrPdfData.history?.previousSurgeries || ""}`,
      50,
      doc.y + 20
    );
    // ensureSpace(90);

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
      `Desc: ${emrPdfData.history.depressionScreening?.desc || "N/A"}`,
      118,
      doc.y + 10
    );
    doc.text(
      `Recomendation : ${
        emrPdfData.history.depressionScreening?.recomendation || "N/A"
      }`,
      118,
      doc.y + 10
    );
    doc.text(
      `Score : ${emrPdfData.history.depressionScreening?.score || "0"}`,
      118,
      doc.y + 10
    );
    const mentalHealthAssementY = doc.y + 20;
    doc.text(`Mental Health Assessment `, 75, mentalHealthAssementY, {
      width: 120,
    });
    doc.text(
      `: ${emrPdfData.history?.mentalHealthAssessment || "N/A"}`,
      150,
      mentalHealthAssementY,
      { width: 120 }
    );

    //immunizations
    ensureSpace(200);

    doc
      .font("Roboto-Bold")
      .fontSize(13)
      .text(`Immunizations: `, 55, doc.y + 40, {
        align: "left",
      })
      .font("Roboto-Medium")
      .fontSize(12);
    if (emrPdfData.immunization && emrPdfData.immunization.length > 0) {
      emrPdfData.immunization.forEach((item) => {
        // Render 'Immunization Type'
        doc.text(
          `Immunization Type: ${item.immunizationType || "N/A"}`,
          70,
          doc.y + 20,
          {
            align: "left",
          }
        );

        // Render 'Vaccination Name'
        doc
          .font("Roboto-Regular")
          .fontSize(12)
          .text(
            `Vaccination Name: ${item.vaccinationName || "N/A"}`,
            70,
            doc.y + 15,
            {
              align: "left",
            }
          );

        // Render 'Total Dose'
        doc
          .font("Roboto-Regular")
          .fontSize(12)
          .text(`Total Dose: ${item.totalDose || "N/A"}`, 70, doc.y + 15, {
            align: "left",
          });

        // Render 'Dose Dates'
        if (item.doseDates && item.doseDates.length > 0) {
          item.doseDates.forEach((dose, index) => {
            doc.text(
              `Dose ${index + 1}: ${
                dose.date ? dayjs(dose.date).format("DD-MM-YYYY") : "N/A"
              } (${dose.status || "N/A"})`,
              70,
              doc.y + 15,
              { align: "left" }
            );
          });
        } else {
          doc.text(`Dose Dates: N/A`, 70, doc.y + 15, {
            align: "left",
          });
        }

        // Render 'Doctor Name'
        doc.text(`Doctor Name: ${item.doctorName || "N/A"}`, 70, doc.y + 15, {
          align: "left",
        });

        // Render 'Side Effects'
        doc.text(`Side Effects: ${item.sideEffects || "N/A"}`, 70, doc.y + 15, {
          align: "left",
        });

        // Render 'Immunization Notes'
        doc.text(
          `Immunization Notes: ${item.immunizationNotes || "N/A"}`,
          70,
          doc.y + 15,
          {
            align: "left",
          }
        );

        // Add spacing after each immunization
        doc.moveDown(1);
      });
    }

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
        50,
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
          `Pregnant : ${
            emrPdfData.gynaecologicalHistory?.obstetricHistory?.isPregnant
              ? "Yes"
              : "No"
          }`,
          100,
          doc.y + 20
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
    // ensureSpace(200);

    // Pprescribe treatments

    doc
      .font("Roboto-Bold")
      .fontSize(14)
      .text(`Prescribe Treatments : `, 50, doc.y + 20, {
        align: "left",
      })
      .font("Roboto-Medium")
      .fontSize(12);
    if (emrPdfData.diagnosis && emrPdfData.diagnosis.length > 0) {
      emrPdfData.diagnosis.forEach((item, index) => {
        // Render the treatment header
        // doc.text(`Prescribed Treatment ${index + 1}`, 70, doc.y + 20, {
        //   align: "left",
        // });

        // Render 'Date of Diagnosis'
        doc.text(
          `Diagnosis Name: ${item.diagnosisName || "N/A"}`,
          70,
          doc.y + 15,
          {
            align: "left",
          }
        );

        doc.text(
          `Date of Diagonosis: ${
            item.dateOfDiagnosis
              ? dayjs(item.dateOfDiagnosis).format("DD-MM-YYYY")
              : "N/A"
          }`,
          70,
          doc.y + 15,
          {
            align: "left",
          }
        );

        // prescription
        item.prescription?.forEach((presItem, index) => {
          // Render 'Investigations'
          if (index > 0) {
            doc.text(`------------------`, 70, doc.y + 5, {
              align: "left",
            });
            ensureSpace(150);
          }
          doc.text(
            `Investigations: ${presItem.investigations || "N/A"}`,
            70,
            doc.y + 15,
            {
              align: "left",
            }
          );

          // Render 'Drug Name'
          doc.text(`Drug Name: ${presItem.drugName || "N/A"}`, 70, doc.y + 15, {
            align: "left",
          });

          // Render 'Frequency'
          doc.text(
            `Frequency: ${presItem.freequency || "N/A"}`,
            70,
            doc.y + 15,
            {
              align: "left",
            }
          );

          // Render 'Duration'
          doc.text(`Duration: ${presItem.duration || "N/A"}`, 70, doc.y + 15, {
            align: "left",
          });

          // Render 'Quantity'
          doc.text(`Quantity: ${presItem.quantity || "N/A"}`, 70, doc.y + 15, {
            align: "left",
          });

          // Render 'Advice'
          doc.text(`Advice: ${presItem.advice || "N/A"}`, 70, doc.y + 15, {
            align: "left",
          });

          // Render 'Route of Administration'
          doc.text(
            `Route of Administration: ${
              presItem.routeOfAdministration || "N/A"
            }`,
            70,
            doc.y + 15,
            {
              align: "left",
            }
          );

          // Render 'How to Take'
          doc.text(
            `How to Take: ${presItem.howToTake || "N/A"}`,
            70,
            doc.y + 15,
            {
              align: "left",
            }
          );
        });

        // Add spacing after each treatment
        doc.moveDown(1);
      });
    }

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
    // console.log(emrPdfData?.doctor?.eSign);
    // if (
    //   emrPdfData?.doctor?.eSign && // Check if the value exists
    //   typeof emrPdfData.doctor.eSign === "string" && // Ensure it is a string
    //   emrPdfData.doctor.eSign.trim().toLowerCase() !== "null"
    // ) {
    // console.log(emrPdfData?.doctor?.eSign);
    // console.log("prescription?.doctor?.eSign" + prescription?.doctor?.eSign);
    const eSignUrl = await fetchImage(emrPdfData.doctor.eSign);

    doc.image(eSignUrl, 450, eSignY - 45, {
      width: 100,
      align: "right", // Corrected the typo from 'algin' to 'align'
    });

    doc.fontSize(12).text("E - SIGNATURE", 470, eSignY);
    addFooter();
    doc.end();
    // return doc;
  } catch (err) {
    // console.log("go into catch");
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

// generate e prescription pdf
const generatePrescriptionPDFFn = async (prescription, res) => {
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
      `attachment; filename=prescription_${prescription._id}.pdf`
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
    const fontRegularPath = path.join(
      __dirname,
      "../../public/font/Roboto",
      "Roboto-Regular.ttf"
    );
    const fontMediumPath = path.join(
      __dirname,
      "../../public/font/Roboto",
      "Roboto-Medium.ttf"
    );
    const fontBoldPath = path.join(
      __dirname,
      "../../public/font/Roboto",
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
      .image(path.join(__dirname, "../../public/logo.png"), 400, 45, {
        width: 30,
      })
      .fontSize(15)
      .font("Roboto-Medium")
      .text("Preva Care", 436, 52)
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
        path.join(__dirname, "../../public/footerIcon/call.png"),
        50,
        footerTop + 15,
        { width: 15 }
      );
      // middle section

      // middle
      doc.text("www.preva.care", 270, footerTop + 15, {
        link: "https://preva.care",
      });

      // middle image
      doc.image(
        path.join(__dirname, "../../public/footerIcon/internet.png"),
        245,
        footerTop + 15,
        { width: 15 }
      );
      // right section
      doc.text("info@preva.care", 465, footerTop + 15, {
        link: "mailto:info@preva.care",
      });

      // right image
      doc.image(
        path.join(__dirname, "../../public/footerIcon/mail.png"),
        440,
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
        `Name : ${dx?.diagnosisName}             Date : ${
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
        `VITALS:  BP : ${prescription.vitals.BP} mmHg          PR: ${prescription.vitals.PR} bpm          SpO2: ${prescription.vitals.SpO2} %`,
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
          `    ${med.freequency}`,
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
        headerAlign: "center",
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
    // if (
    //   prescription?.doctor?.eSign && // Check if the value exists
    //   typeof prescription.doctor.eSign === "string" && // Ensure it is a string
    //   prescription.doctor.eSign.trim().toLowerCase() !== "null"
    // ) {
    const eSignUrl = await fetchImage(prescription.doctor.eSign);

    doc.image(eSignUrl, 450, eSignY - 65, {
      width: 100,
      align: "right",
    });
    // }

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

const validateEmployeePhoneAndPlan = async (
  phoneArr,
  corporate,
  res,
  session
) => {
  try {
    // Remove duplicates and create Set for faster lookups
    const uniquePhones = [...new Set(phoneArr)];

    // Find employees with given phone numbers
    const existingPhones = await Employee.find({
      phone: { $in: uniquePhones },
      corporate,
    })
      .session(session)
      .select("phone _id")
      .lean();

    // Create a Set of existing phones for O(1) lookup
    const existingPhonesSet = new Set(existingPhones.map((doc) => doc.phone));

    // Find missing phones
    const missingPhones = uniquePhones.filter(
      (phone) => !existingPhonesSet.has(phone)
    );
    if (missingPhones.length > 0) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        `Following phone numbers not found: ${missingPhones.join(", ")}`
      );
    }

    // Get employee IDs
    const employeeIds = existingPhones.map((item) => item._id);

    // Find active plans with EMR creation feature
    const employeesWithPlans = await employeePlanModel
      .find({
        employeeId: { $in: employeeIds },
        status: "active",
        booleanFeatureList: {
          $elemMatch: {
            name: "EMR CREATION",
            status: false,
          },
        },
      })
      .session(session)
      .select("employeeId")
      .lean();

    // Find employees without EMR creation permission
    const employeesWithPlansSet = new Set(
      employeesWithPlans.map((plan) => plan.employeeId.toString())
    );
    const employeesWithoutPermission = existingPhones.filter(
      (employee) => !employeesWithPlansSet.has(employee._id.toString())
    );

    if (employeesWithoutPermission.length > 0) {
      const phonesWithoutPermission = employeesWithoutPermission.map(
        (emp) => emp.phone
      );
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        `Following employees don't have EMR creation permission: ${phonesWithoutPermission.join(
          ", "
        )}`
      );
    }

    // if false then make it true and update db
    // Update the `booleanFeatureList` to set `status: true` for "EMR CREATION"
    await employeePlanModel.updateMany(
      {
        employeeId: { $in: employeeIds },
        status: "active",
        booleanFeatureList: {
          $elemMatch: {
            name: "EMR CREATION",
            status: false,
          },
        },
      },
      {
        $set: {
          "booleanFeatureList.$[elem].status": true,
        },
      },
      {
        arrayFilters: [{ "elem.name": "EMR CREATION", "elem.status": false }], // Filter for the array element
        session, // Pass the session
      }
    );

    return existingPhones;
  } catch (error) {
    throw error;
  }
};

// validate doctor
const validateDoctorByPhone = async (phoneArr, res, session) => {
  try {
    // Remove duplicates and create Set for faster lookups
    const uniquePhones = [...new Set(phoneArr)];

    // Find employees with given phone numbers
    const existingPhones = await Doctor.find({
      phone: { $in: uniquePhones },
    })
      .session(session)
      .select(
        "phone _id firstName lastName education specialization eSign medicalRegistrationNumber"
      )
      .lean();

    // Create a Set of existing phones for O(1) lookup
    const existingPhonesSet = new Set(existingPhones.map((doc) => doc.phone));

    // Find missing phones
    const missingPhones = uniquePhones.filter(
      (phone) => !existingPhonesSet.has(phone)
    );
    if (missingPhones.length > 0) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        `Following phone numbers not found: ${missingPhones.join(", ")}`
      );
    }

    return existingPhones;
  } catch (error) {
    throw error;
  }
};

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
  generateEMRPDFFn,
  generatePrescriptionPDFFn,
  validateEmployeePhoneAndPlan,
  validateDoctorByPhone,
};
