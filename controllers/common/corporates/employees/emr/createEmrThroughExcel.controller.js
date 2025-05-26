const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const Response = require("../../../../../utils/Response.js");
const AppConstant = require("../../../../../utils/AppConstant.js");
const {
  EMRValidationSchema,
} = require("../../../../../validators/emr/emr.validation.js");
const AdultMaleEMR = require("../../../../../models/EMR/adultMaleEMR.model.js");
const AdultFemaleEMR = require("../../../../../models/EMR/adultFemaleEMR.model.js");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
const {
  validatePhone,
  validateEmployeePhoneAndPlan,
  validateDoctorByPhone,
} = require("../../../../../helper/emrPdf/generateEmrPdfFn.helper.js");
const Employee = require("../../../../../models/patient/employee/employee.model.js");
const Doctor = require("../../../../../models/doctors/doctor.model.js");
dayjs.extend(customParseFormat);
const mongoose = require("mongoose");
const eprescriptionModel = require("../../../../../models/patient/eprescription/eprescription.model.js");
// all gender - M , F, C(M, F)
const downloadSampleExcelFileToCreateEMR = async (req, res) => {
  try {
    const { gender } = req.body;
    if (!["M", "F", "C"].includes(gender)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "invalid gender type !"
      );
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
      `${
        gender === "F" ? "Female" : gender === "M" ? "Male" : "Common"
      } EMR Template`
    );

    const headerStyle = {
      font: { bold: true, color: { argb: "FFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "4472C4" } },
      alignment: { horizontal: "center", vertical: "middle", wrapText: true },
      border: {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      },
    };

    const dataStyle = {
      alignment: { horizontal: "center", vertical: "middle", wrapText: true },
      border: {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      },
    };

    // Define columns including all previous EMR fields plus gynecological history
    worksheet.columns = [
      // Previous Basic Info columns...
      { header: "Doctor Name", key: "doctorName", width: 25 },
      { header: "Doctor Phone", key: "doctorPhone", width: 25 },
      { header: "Patient Name", key: "name", width: 25 },
      { header: "Age", key: "age", width: 10 },
      {
        header: `Gender\n (${gender === "C" ? "M/F" : gender})`,
        key: "gender",
        width: 15,
      },
      { header: "Phone Number", key: "phoneNumber", width: 15 },
      {
        header: "Blood Group\n (A+/B+/AB+/O+/A-/B-/AB-/O-/not known)",
        key: "bloodGroup",
        width: 35,
      },
      {
        header: "Marital Status\n (true/false)",
        key: "maritalStatus",
        width: 20,
      },
      { header: "Children", key: "children", width: 10 },

      // Gynecological History

      ...(["C", "F"].includes(gender)
        ? [
            { header: "Age of Menarche", key: "ageOfMenarche", width: 20 },
            {
              header: "Cycle Duration\n (days)",
              key: "cycleDuration",
              width: 20,
            },
            {
              header: "Cycle Regularity\n (regular/irregular)",
              key: "cycleRegularity",
              width: 25,
            },
            { header: "Days of Bleeding", key: "daysOfBleeding", width: 20 },
            { header: "Pads Used Per Day", key: "padsUsedPerDay", width: 20 },
            { header: "Passage of Clots", key: "passageOfClots", width: 25 },
            { header: "Gynec Complaints", key: "complaints", width: 30 },
            {
              header: "Previous Gynec History",
              key: "previousHistory",
              width: 30,
            },
            // Obstetric History
            { header: "G Score", key: "gScore", width: 15 },
            { header: "P Score", key: "pScore", width: 15 },
            { header: "L Score", key: "lScore", width: 15 },
            { header: "A Score", key: "aScore", width: 15 },
            {
              header: "Partner Blood Group",
              key: "partnerBloodGroup",
              width: 20,
            },
            { header: "Age at Conception", key: "ageAtConception", width: 20 },
            {
              header: "Mode of Conception",
              key: "modeOfConception",
              width: 25,
            },
            { header: "Mode of Delivery", key: "modeOfDelivery", width: 25 },
            { header: "Complications", key: "complications", width: 30 },
            {
              header: "Primigravida Weeks",
              key: "primigravidaWeeks",
              width: 20,
            },
            { header: "EDD", key: "EDD", width: 20 },
            { header: "Symptoms", key: "symptoms", width: 30 },
            { header: "Examination", key: "examination", width: 30 },
            {
              header: "USG Scans\n (due/uptodate)",
              key: "USGScans",
              width: 20,
            },
            { header: "TD Dose Taken", key: "TDDoseTaken", width: 20 },
            {
              header: "Prenatal Screening Reports",
              key: "prenatalScreeningReports",
              width: 30,
            },
            {
              header: "Prenatal Vitamins\n (true/false)",
              key: "prenatalVitamins",
              width: 25,
            },
            { header: "Fresh Complaint", key: "freshComplaint", width: 30 },
            {
              header: "Nutritional History",
              key: "nutritionalHistory",
              width: 30,
            },
            {
              header: "Treating Gynaecologist Name",
              key: "treatingGynaecologistName",
              width: 30,
            },
            {
              header: "Gynaecologist Address",
              key: "gynaecologistAddress",
              width: 30,
            },
          ]
        : []),
      // [Previous EMR fields continue from here...]
      // Address
      { header: "Address Name", key: "addressName", width: 20 },
      { header: "Street", key: "street", width: 25 },
      { header: "City", key: "city", width: 20 },
      { header: "State", key: "state", width: 20 },
      { header: "Zip Code", key: "zipCode", width: 15 },

      // Continue with all other fields from previous EMR...
      // History
      { header: "Chief Complaint", key: "chiefComplaint", width: 30 },
      {
        header: "Present Illness History",
        key: "historyOfPresentingIllness",
        width: 30,
      },
      {
        header: "Past History\n Suffering From",
        key: "sufferingFrom",
        width: 25,
      },
      { header: "Past History\n Drug Name", key: "drugName", width: 25 },
      {
        header:
          "Past History Frequency\n (0-0-1, 1-0-1, 1-1-1, 1-0-0, 1-1-0, 0-1-0, 0-1-1)",
        key: "frequency",
        width: 35,
      },
      {
        header: "Past History\n Readings",
        key: "readings",
        width: 25,
      },
      {
        header: "Past History\n Past History Notes",
        key: "pastHistoryNotes",
        width: 25,
      },
      // allergies
      {
        header: "Allergy\n Allergy Name",
        key: "allergyName",
        width: 25,
      },
      {
        header: "Allergy\n past Allergy Drug Name",
        key: "pastAllergyDrugName",
        width: 25,
      },
      {
        header: "Allergy\n Past Allergy Freequency",
        key: "pastAllergyFreequency",
        width: 25,
      },
      {
        header: "Allergy\n Advised By",
        key: "advisedBy",
        width: 25,
      },
      {
        header: "Allergy\n Advise",
        key: "advise",
        width: 25,
      },
      {
        header: "Allergy\n Advise Allergy DrugName",
        key: "adviseAllergyDrugName",
        width: 30,
      },
      {
        header: "Allergy\n Advise Allergy Freequency",
        key: "adviseAllergyFreequency",
        width: 30,
      },

      { header: "Previous Surgeries", key: "previousSurgeries", width: 30 },

      // Habits
      { header: "Smoking\n (true/false)", key: "smoking", width: 20 },
      { header: "Pack Years", key: "packYears", width: 15 },
      { header: "Alcohol\n (true/false)", key: "alcohol", width: 20 },
      { header: "Alcohol Details", key: "alcoholDetails", width: 25 },
      { header: "Quantity Per Week \n (ml)", key: "qntPerWeek", width: 20 },
      { header: "Substance Abuse", key: "substanceAbuse", width: 25 },

      // Additional History
      { header: "Bowel And Bladder", key: "bowelAndBladder", width: 25 },
      { header: "Appetite", key: "appetite", width: 20 },
      { header: "Sleep (hours)", key: "sleep", width: 15 },

      // Mental Health
      {
        header: "Stress Screening Description",
        key: "stressScreeningDesc",
        width: 30,
      },
      {
        header: "Stress Screening Recommendation",
        key: "stressScreeningRecom",
        width: 30,
      },
      {
        header: "Stress Screening Score",
        key: "stressScreeningScore",
        width: 20,
      },
      {
        header: "Depression Screening Description",
        key: "depressionScreeningDesc",
        width: 30,
      },
      {
        header: "Depression Screening Recommendation",
        key: "depressionScreeningRecom",
        width: 30,
      },
      {
        header: "Depression Screening Score",
        key: "depressionScreeningScore",
        width: 20,
      },
      {
        header: "Mental Health Assessment",
        key: "mentalHealthAssessment",
        width: 30,
      },

      // immunizations
      {
        header: `Immunization \n Type("up to date", "adding", "recommended")`,
        key: "immunizationType",
        width: 25,
      },
      {
        header: "Immunization \n Vaccination Name",
        key: "vaccinationName",
        width: 25,
      },
      {
        header: "Immunization \n Total Dose",
        key: "totalDose",
        width: 20,
      },
      {
        header: "Immunization \n Total Dose",
        key: "totalDose",
        width: 20,
      },
      {
        header: "Immunization \n Date",
        key: "date",
        width: 20,
      },
      {
        header: "Immunization \n Status",
        key: "status",
        width: 20,
      },
      {
        header: "Immunization \n Doctor Name",
        key: "immunizatoinDoctorName",
        width: 25,
      },
      {
        header: "Immunization \n Side Effects",
        key: "sideEffects",
        width: 30,
      },
      {
        header: "Immunization \n immunizationNotes",
        key: "immunizationNotes",
        width: 30,
      },

      // Physical Examination
      { header: "PR", key: "PR", width: 10 },
      { header: "BP Systolic", key: "BPSys", width: 15 },
      { header: "BP Diastolic", key: "BPDia", width: 15 },
      { header: "Volume", key: "volume", width: 15 },
      { header: "Regularity", key: "regularity", width: 15 },
      { header: "Character", key: "character", width: 15 },
      { header: "Temperature", key: "temperature", width: 15 },
      { header: "RR", key: "RR", width: 10 },
      { header: "SPO2", key: "SPO2", width: 10 },
      { header: "Radio Femoral Delay", key: "radioFemoralDelay", width: 20 },
      { header: "Height \n (in m)", key: "height", width: 10 },
      { header: "Weight \n (in kg)", key: "weight", width: 10 },
      { header: "BMI", key: "BMI", width: 10 },
      { header: "Pallor", key: "pallor", width: 15 },
      { header: "Icterus", key: "icterus", width: 15 },
      { header: "Cyanosis", key: "cyanosis", width: 15 },
      { header: "Clubbing", key: "clubbing", width: 15 },
      { header: "Lymphadenopathy", key: "lymphadenopathy", width: 20 },
      { header: "Edema", key: "edema", width: 15 },
      { header: "JVP", key: "JVP", width: 15 },

      // Systemic Examination
      { header: "Respiratory System", key: "respiratorySystem", width: 30 },
      { header: "CVS", key: "CVS", width: 30 },
      { header: "CNS", key: "CNS", width: 30 },
      { header: "PA", key: "PA", width: 30 },
      {
        header: "Other Systemic Findings",
        key: "otherSystemicFindings",
        width: 30,
      },

      // Diagnosis and Investigations
      // { header: "Investigations", key: "investigations", width: 30 },
      // { header: "Diagnosis Date", key: "diagnosisDate", width: 20 },
      // { header: "Diagnosis Name", key: "diagnosisName", width: 30 },

      // Prescribed Treatment
      {
        header: "Prescribed \n Diagnosis Name",
        key: "diagnosisName",
        width: 25,
      },
      {
        header: "Prescribed \n Diagnosis Date",
        key: "diagnosisDate",
        width: 25,
      },
      {
        header: "Prescribed \n Investigations",
        key: "investigations",
        width: 25,
      },
      {
        header: "Prescribed \n Drug Name",
        key: "prescribedDrugName",
        width: 25,
      },
      {
        header: "Prescribed \n Drug Frequency",
        key: "prescribedFrequency",
        width: 20,
      },
      {
        header: "Prescribed \n Drug Duration",
        key: "prescribedDuration",
        width: 20,
      },
      {
        header: "Prescribed \n Drug Quantity",
        key: "prescribedQuantity",
        width: 20,
      },
      {
        header: "Prescribed \n Route Of Administration",
        key: "routeOfAdministration",
        width: 25,
      },
      { header: "How To Take", key: "howToTake", width: 25 },
      { header: "Treatment Advice", key: "treatmentAdvice", width: 30 },

      // Additional Information
      { header: "Advice", key: "advice", width: 30 },
      { header: "Referrals", key: "referrals", width: 30 },
      { header: "Follow Up Schedule", key: "followUpSchedule", width: 25 },
      { header: "Doctor Notes", key: "doctorNotes", width: 30 },
      {
        header: "Consultation Mode \n (on site/online)",
        key: "consultationMode",
        width: 25,
      },
    ];

    // Apply header style
    worksheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Add sample data row with female-specific information
    const sampleRow = worksheet.addRow({
      doctorName: "Anupriya Lilhori",
      doctorPhone: "8527237088",
      name: `${gender === "C" || gender === "F" ? "Jane Doe" : "John Doe"}`,

      age: "35",
      gender: `${gender === "C" || gender === "F" ? "F" : "M"}`,
      phoneNumber: "7631006505",
      bloodGroup: "B+",
      maritalStatus: "true",
      children: "2",

      // Gynecological History sample data
      ...(["C", "F"].includes(gender)
        ? {
            ageOfMenarche: "13",
            cycleDuration: "28",
            cycleRegularity: "regular",
            daysOfBleeding: "5",
            padsUsedPerDay: "3",
            passageOfClots: "minimal",
            complaints: "none",
            previousHistory: "no significant history",

            // Obstetric History sample data
            gScore: "2",
            pScore: "2",
            lScore: "2",
            aScore: "0",
            partnerBloodGroup: "A+",
            ageAtConception: "28",
            modeOfConception: "natural",
            modeOfDelivery: "normal vaginal delivery",
            complications: "none",
            primigravidaWeeks: "40",
            EDD: "2024-08-15",
            symptoms: "none",
            examination: "normal",
            USGScans: "uptodate",
            TDDoseTaken: "completed",
            prenatalScreeningReports: "normal",
            prenatalVitamins: "true",
            freshComplaint: "none",
            nutritionalHistory: "balanced diet",
            treatingGynaecologistName: "Dr. Smith",
            gynaecologistAddress: "123 Medical Plaza",
          }
        : {}),

      // [Continue with all other sample data fields from previous EMR...]

      addressName: "Home",
      street: "123 Main St",
      city: "Mumbai",
      state: "Maharashtra",
      zipCode: "400001",
      chiefComplaint: "Fever and body ache",
      historyOfPresentingIllness: "Fever since 3 days",
      // past history
      sufferingFrom: "Hypertension",
      drugName: "Amlodipine",
      frequency: "0-0-1",
      readings: "normal",
      pastHistoryNotes: "test notes",

      // allergies
      allergyName: "Glutten",
      pastAllergyDrugName: "Drug Name",
      pastAllergyFreequency: "0-0-1",
      advisedBy: "Dr. Prasant kumar",
      advise: "Avoid Dairy Product",
      advise: "Avoid Dairy Product",
      adviseAllergyDrugName: "none",
      adviseAllergyFreequency: "0-0-1",

      previousSurgeries: "None",
      smoking: "false",
      packYears: "0",
      alcohol: "false",
      alcoholDetails: "NA",
      qntPerWeek: "0",
      substanceAbuse: "None",
      bowelAndBladder: "Normal",
      appetite: "Good",
      sleep: "7",
      stressScreeningDesc: "Mild work-related stress",
      stressScreeningRecom: "Lifestyle modifications",
      stressScreeningScore: "3",
      depressionScreeningDesc: "No significant symptoms",
      depressionScreeningRecom: "Regular follow-up",
      depressionScreeningScore: "1",
      mentalHealthAssessment: "Normal",

      // immunizations

      immunizationType: "recommended",
      vaccinationName: "HMPV virus",
      totalDose: "1",
      date: "2025-01-10",
      status: "due",
      immunizatoinDoctorName: "Dr. Pransant Kumar",
      sideEffects: "none",
      immunizationNotes: "test notes",

      PR: "72",
      BPSys: "120",
      BPDia: "80",
      volume: "Normal",
      regularity: "Regular",
      character: "Normal",
      temperature: "98.6",
      RR: "16",
      SPO2: "98",
      radioFemoralDelay: "Absent",
      height: "1.70",
      weight: "70",
      BMI: "24.2",
      pallor: "Absent",
      icterus: "Absent",
      cyanosis: "Absent",
      clubbing: "Absent",
      lymphadenopathy: "Absent",
      edema: "Absent",
      JVP: "Not raised",
      respiratorySystem: "Normal",
      CVS: "Normal",
      CNS: "Normal",
      PA: "Soft, non-tender",
      otherSystemicFindings: "None",

      // prescribe treat.
      investigations: "CBC, RFT",
      diagnosisDate: "2025-01-10",
      diagnosisName: "Viral Fever",
      prescribedDrugName: "Paracetamol",
      prescribedFrequency: "1-0-1",
      prescribedDuration: "5 days",
      prescribedQuantity: "15 tablets",
      routeOfAdministration: "Oral",
      howToTake: "After food",
      treatmentAdvice: "Take complete rest",
      advice: "Increase fluid intake",
      referrals: "None",
      followUpSchedule: "After 1 week",
      doctorNotes: "Patient responding well to treatment",
      consultationMode: "on site",
    });

    // Apply data style to sample row
    sampleRow.eachCell((cell) => {
      cell.style = dataStyle;
    });

    // Set row heights
    worksheet.getRow(1).height = 30;
    sampleRow.height = 25;

    // Add filtering and freeze pane
    worksheet.autoFilter = {
      from: "A1",
      to: `${String.fromCharCode(65 + worksheet.columns.length - 1)}1`,
    };

    worksheet.views = [
      {
        state: "frozen",
        xSplit: 0,
        ySplit: 1,
        topLeftCell: "A2",
        activeCell: "A2",
      },
    ];

    // add notes to excel
    worksheet.getCell("E1").note = "Enter M or F based on gender !";
    worksheet.getCell("G1").note =
      "Enter one of the provided blood group type !";
    worksheet.getCell("AU1").note =
      "drug could be multiple add by comma separated !";
    worksheet.getCell("AV1").note =
      "freequency could be multiple same no. of drug add by comma separated !";
    // need to handle multiple vlaues .
    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${
        gender === "C"
          ? "common_emr_template"
          : gender === "F"
            ? "female_emr_template"
            : "male_emr_template"
      }.xlsx`
    );

    // Write workbook and send response
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

const createAllEmployeeEmrThroughExcel = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    return Response.error(res, 400, AppConstant.FAILED, `under developement !`);
    const { gender, corporate } = req.body;
    if (!gender || !corporate) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        `gender or corporate is missing !`
      );
    }
    // Load and parse the Excel file
    if (
      !req.files ||
      !req.files.sampleemr ||
      req.files.sampleemr.length === 0
    ) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        `Please upload an Excel file`
      );
    }
    const workbook = xlsx.read(req.files.sampleemr[0].buffer, {
      type: "buffer",
    });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const doctorPhoneArr = data.map((item) => item["Doctor Phone"]);
    const employeePhoneArr = data.map((item) => item["Phone Number"]);

    const doctorPhoneAndIds = await validateDoctorByPhone(
      doctorPhoneArr,
      res,
      session
    );
    const employeesPhoneAndIds = await validateEmployeePhoneAndPlan(
      employeePhoneArr,
      corporate,
      res,
      session
    );

    const emrData = data.map((item) => {
      const totalDose = parseInt(item["Immunization \n Total Dose"]) || 0;

      const dates = item["Immunization \n Date"]
        ? item["Immunization \n Date"].split(",").map((date) => date.trim())
        : [];
      const statuses = item["Immunization \n Status"]
        ? item["Immunization \n Status"]
            .split(",")
            .map((status) => status.trim())
        : [];

      const doseDates = Array.from({ length: totalDose }, (_, index) => ({
        date: dates[index] || dayjs().format("YYYY-MM-DD"), // Use the corresponding date or fallback
        status: statuses[index] || "due", // Use the corresponding status or fallback
      }));

      return {
        // These fields would need to be provided or fetched from context

        user: employeesPhoneAndIds.find(
          (ele) => ele.phone === item["Phone Number"]
        )._id,
        doctor: doctorPhoneAndIds.find(
          (ele) => ele.phone === item["Doctor Phone"]
        )._id,
        basicInfo: {
          name: item["Patient Name"],
          age: parseInt(item["Age"]),
          gender: item[`Gender\n (${gender === "C" ? "M/F" : gender})`],
          phoneNumber: item["Phone Number"],
          bloodGroup:
            item["Blood Group\n (A+/B+/AB+/O+/A-/B-/AB-/O-/not known)"],
          maritalStatus: item["Marital Status\n (true/false)"] === "true",
          children: parseInt(item["Children"]),
          address: {
            name: item["Address Name"],
            street: item["Street"],
            city: item["City"],
            state: item["State"],
            zipCode: item["Zip Code"],
          },
        },

        history: {
          chiefComplaint: item["Chief Complaint"],
          historyOfPresentingIllness: item["Present Illness History"],
          // past history
          pastHistory: [
            {
              sufferingFrom: item["Past History\n Suffering From"],
              drugName: item["Past History\n Drug Name"]
                ? item["Past History\n Drug Name"]
                    .split(",")
                    .map((name) => name.trim())
                : [],
              freequency: item["Past History Frequency"]
                ? item["Past History Frequency"]
                    .split(",")
                    .map((freq) => freq.trim())
                : [],
              readings: item["Past History\n Readings"],
              pastHistoryNotes: item["Past History\n Past History Notes"],
            },
          ],

          // allergies
          allergies: [
            {
              allergyName: item["Allergy\n Allergy Name"],
              pastAllergyDrugName: item["Allergy\n past Allergy Drug Name"]
                ? item["Allergy\n past Allergy Drug Name"]
                    .split(",")
                    .map((name) => name.trim())
                : [],
              pastAllergyFreequency: item["Allergy\n Past Allergy Freequency"]
                ? item["Allergy\n Past Allergy Freequency"]
                    .split(",")
                    .map((name) => name.trim())
                : [],
              advisedBy: item["Allergy\n Advised By"],
              advise: item["Allergy\n Advise"],
              adviseAllergyDrugName: item["Allergy\n Advise Allergy DrugName"]
                ? item["Allergy\n Advise Allergy DrugName"]
                    .split(",")
                    .map((name) => name.trim())
                : [],
              adviseAllergyFreequency: item[
                "Allergy\n Advise Allergy Freequency"
              ]
                ? item["Allergy\n Advise Allergy Freequency"]
                    .split(",")
                    .map((name) => name.trim())
                : [],
            },
          ],

          //

          previousSurgeries: item["Previous Surgeries"],
          habits: {
            smoking: item["Smoking\n (true/false)"] === "true",
            packYears: parseInt(item["Pack Years"]) || 0,
            alcohol: item["Alcohol\n (true/false)"] === "true",
            alcoholDetails: item["Alcohol Details"],
            qntPerWeek: parseInt(item["Quantity Per Week \n (ml)"]) || 0,
            substanceAbuse: item["Substance Abuse"],
          },
          bowelAndBladder: item["Bowel And Bladder"],
          appetite: item["Appetite"],
          sleep: parseInt(item["Sleep (hours)"]) || 0,
          stressScreening: {
            desc: item["Stress Screening Description"],
            recomendation: item["Stress Screening Recommendation"],
            score: parseInt(item["Stress Screening Score"]) || 0,
          },
          depressionScreening: {
            desc: item["Depression Screening Description"],
            recomendation: item["Depression Screening Recommendation"],
            score: parseInt(item["Depression Screening Score"]) || 0,
          },
          mentalHealthAssessment: item["Mental Health Assessment"],
        },

        // immunizations

        immunization: [
          {
            immunizationType:
              item[
                `Immunization \n Type("up to date", "adding", "recommended")`
              ],
            vaccinationName: item["Immunization \n Vaccination Name"],
            totalDose: parseInt(item["Immunization \n Total Dose"]) || 0,
            doseDates: doseDates,
            doctorName: item["Immunization \n Doctor Name"],
            sideEffects: item["Immunization \n Side Effects"],
            immunizationNotes: item["Immunization \n immunizationNotes"],
          },
        ],
        generalPhysicalExamination: {
          PR: parseInt(item["PR"]) || 0,
          BP: {
            sys: parseInt(item["BP Systolic"]) || 0,
            dia: parseInt(item["BP Diastolic"]) || 0,
          },
          volume: item["Volume"],
          regularity: item["Regularity"],
          character: item["Character"],
          temperature: item["Temperature"],
          RR: parseInt(item["RR"]) || 0,
          SPO2: parseInt(item["SPO2"]) || 0,
          radioFemoralDelay: item["Radio Femoral Delay"],
          height: parseFloat(item["Height \n (in m)"]) || 0,
          weight: parseFloat(item["Weight \n (kg)"]) || 0,
          BMI: parseFloat(item["BMI"]) || 0,
          pallor: item["Pallor"],
          icterus: item["Icterus"],
          cyanosis: item["Cyanosis"],
          clubbing: item["Clubbing"],
          lymphadenopathy: item["Lymphadenopathy"],
          edema: item["Edema"],
          JVP: item["JVP"],
        },

        systemicExamination: {
          respiratorySystem: item["Respiratory System"],
          CVS: item["CVS"],
          CNS: item["CNS"],
          PA: item["PA"],
          otherSystemicFindings: item["Other Systemic Findings"],
        },

        // investigations: [item["Investigations"]],

        // diagonosis: [
        //   {
        //     dateOfDiagonosis: dayjs(item["Diagnosis Date"]).format(
        //       "YYYY-MM-DD"
        //     ),
        //     diagonosisName: item["Diagnosis Name"],
        //   },
        // ],

        prescribedTreatment: [
          {
            diagnosisName: item["Prescribed \n Diagnosis Name"],
            diagnosisDate: item["Prescribed \n Diagnosis Date"],
            investigations: item["Prescribed \n Investigations"],
            drugName: item["Prescribed \n Drug Name"],
            frequency: item["Prescribed \n Drug Frequency"],
            duration: item["Prescribed \n Drug Duration"],
            quantity: item["Prescribed \n Drug Quantity"],
            routeOfAdministration:
              item["Prescribed \n Route Of Administration"],
            howToTake: item["How To Take"],
            advice: item["Treatment Advice"],
          },
        ],

        advice: item["Advice"],
        referrals: item["Referrals"],
        followUpSchedule: item["Follow Up Schedule"],
        doctorNotes: item["Doctor Notes"],
        consultationMode: item["Consultation Mode \n (on site/online)"],

        // For Female EMR additional fields
        ...(["F"].includes(
          item[`Gender\n (${gender === "C" ? "M/F" : gender})`]
        ) && {
          gynaecologicalHistory: {
            ageOfMenarche: parseInt(item["Age of Menarche"]) || 0,
            cycleDuration: parseInt(item["Cycle Duration\n (days)"]) || 0,
            cycleRegularity: item["Cycle Regularity\n (regular/irregular)"],
            daysOfBleeding: parseInt(item["Days of Bleeding"]) || 0,
            padsUsedPerDay: parseInt(item["Pads Used Per Day"]) || 0,
            passageOfClots: item["Passage of Clots"],
            complaints: item["Gynec Complaints"],
            previousHistory: item["Previous Gynec History"],
            obstetricHistory: {
              gScore: parseInt(item["G Score"]) || 0,
              pScore: parseInt(item["P Score"]) || 0,
              lScore: parseInt(item["L Score"]) || 0,
              aScore: parseInt(item["A Score"]) || 0,
              partnerBloodGroup: item["Partner Blood Group"],
              conceptions: [
                {
                  ageAtConception: parseInt(item["Age at Conception"]) || 0,
                  modeOfConception: item["Mode of Conception"],
                  modeOfDelivery: item["Mode of Delivery"],
                  complications: item["Complications"],
                },
              ],
              primigravidaWeeks: parseInt(item["Primigravida Weeks"]) || 0,
              EDD: new Date(item["EDD"]),
              symptoms: item["Symptoms"],
              examination: item["Examination"],
              USGScans: item["USG Scans\n (due/uptodate)"],
              TDDoseTaken: item["TD Dose Taken"],
              prenatalScreeningReports: item["Prenatal Screening Reports"],
              prenatalVitamins:
                item["Prenatal Vitamins\n (true/false)"] === "true",
              freshComplaint: item["Fresh Complaint"],
              nutritionalHistory: item["Nutritional History"],
              treatingGynaecologistName: item["Treating Gynaecologist Name"],
              gynaecologistAddress: item["Gynaecologist Address"],
            },
          },
        }),
      };
    });

    // Validate and clean data
    const validatedData = await Promise.all(
      emrData.map(async (emr) => {
        try {
          return await EMRValidationSchema.validateAsync(emr);
        } catch (error) {
          throw new Error(
            `Validation failed for patient: ${emr.basicInfo.name} Error: ${error.message}`
          );
        }
      })
    );

    // Split data based on gender for common template
    let dataToSendInDbMale = [];
    let dataToSendInDbFemale = [];
    if (gender === "C") {
      dataToSendInDbMale = validatedData.filter(
        (item) => item.basicInfo.gender === "M"
      );
      dataToSendInDbFemale = validatedData.filter(
        (item) => item.basicInfo.gender === "F"
      );
    }

    // Insert data into appropriate collections
    if (gender === "C") {
      if (dataToSendInDbMale.length > 0) {
        await AdultMaleEMR.insertMany(dataToSendInDbMale, { session });
      }
      if (dataToSendInDbFemale.length > 0) {
        await AdultFemaleEMR.insertMany(dataToSendInDbFemale, { session });
      }
    } else {
      gender === "M"
        ? await AdultMaleEMR.insertMany(validatedData, { session })
        : await AdultFemaleEMR.insertMany(validatedData, { session });
    }

    // create eprescription model for all the employee at once

    // e prescription count
    const ePrescriptionDocumentCount = await eprescriptionModel.countDocuments(
      {},
      { session }
    );
    const validateDataToCreateEprescriptions = validatedData.map(
      (data, index) => {
        return {
          user: data.user,
          patient: {
            name: data.basicInfo.name,
            age: data.basicInfo.age,
            gender: data.basicInfo.gender === "M" ? "Male" : "Female",
          },
          doctor: (() => {
            const item = doctorPhoneAndIds.find(
              (item) => item._id === data.doctor
            );
            if (item) {
              return {
                firstName: item.firstName,
                lastName: item.lastName,
                degree: item?.degree || "",
                specialization: item?.specialization || "",
                medicalRegistrationNumber: item.medicalRegistrationNumber,
                eSign: item?.eSign,
              };
            }
            return {}; // Or handle the case where no match is found
          })(),
          date: new Date(),
          prescriptionID: ePrescriptionDocumentCount + index + 1,
          sx: data.history.chiefComplaint,
          vitals: {
            BP: data.generalPhysicalExamination?.BP
              ? `${data.generalPhysicalExamination?.BP?.sys || ""}/${
                  data.generalPhysicalExamination?.BP?.dia || ""
                }`
              : "",
            PR: data.generalPhysicalExamination?.PR || "",
            SpO2: data.generalPhysicalExamination?.SPO2 || "",
          },
          dx: data?.diagonosis,
          labTest: data.investigations,
          rx:
            data.prescribedTreatment && data.prescribedTreatment.length > 0
              ? data.prescribedTreatment.map((item) => {
                  return {
                    drugName: item.drugName,
                    frequency: item.frequency,
                    duration: item.duration,
                    quantity: item.quantity,
                  };
                })
              : [
                  {
                    drugName: "",
                    frequency: "",
                    duration: "",
                    quantity: "",
                  },
                ],
          advice: data.advice ? data.advice.split(",") : [],
          followUpSchedule: data.advice || "",
          consultationMode: data.consultationMode,
        };
      }
    );

    await eprescriptionModel.insertMany(validateDataToCreateEprescriptions, {
      session,
    });
    await session.commitTransaction();
    return Response.success(
      res,
      null,
      201,
      AppConstant.SUCCESS,
      "EMRs created successfully!"
    );
  } catch (error) {
    await session.abortTransaction();

    console.error(error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error!"
    );
  } finally {
    session.endSession();
  }
};

module.exports = {
  downloadSampleExcelFileToCreateEMR,
  createAllEmployeeEmrThroughExcel,
};
