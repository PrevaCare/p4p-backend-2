const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
// const HealthScore = require('../models/HealthScore');
const HealthScore = require("../../../../../models/patient/healthScore/healthScore.model");
const AppConstant = require("../../../../../utils/AppConstant");
const Response = require("../../../../../utils/Response");
const Employee = require("../../../../../models/patient/employee/employee.model");
const {
  healthScoreValidation,
} = require("../../../../../validators/patient/employees/healthScore/healthScore.validator");

const calculateHeartScore = (data) => {
  let totalScore = 0;
  const { totalCholesterol, HDL, LDL, BP, PR, alcoholIntake, BMI, smoking } =
    data;

  if (totalCholesterol) {
    if (totalCholesterol < 200) totalScore += 10;
    else if (totalCholesterol >= 200 && totalCholesterol < 240) totalScore += 5;
  }

  if (HDL) {
    if (HDL > 60) totalScore += 10;
    else if (HDL >= 40 && HDL <= 60) totalScore += 5;
  }

  if (LDL) {
    if (LDL < 100) totalScore += 10;
    else if (LDL >= 100 && LDL < 130) totalScore += 5;
  }

  if (BP?.sys && BP?.dia) {
    if (BP.sys < 121 && BP.dia < 81) totalScore += 10;
    else if (BP.sys >= 120 && BP.sys < 131 && BP.dia < 81) totalScore += 5;
  }

  if (BMI) {
    if (BMI > 18.4 && BMI < 24.9) totalScore += 10;
    else if (BMI > 25 && BMI < 29.9) totalScore += 5;
  }

  if (PR) {
    if (PR > 60 && PR < 100) totalScore += 10;
  }

  if (!alcoholIntake) totalScore += 10;
  if (!smoking) totalScore += 10;

  return Math.round((totalScore * 100) / 80);
};

const calculateGutScore = (data) => {
  let totalScore = 0;
  const { urea, creatinine, plasmaGlucose, sleepingHours } = data;

  if (urea) {
    if (urea > 6 && urea < 21) totalScore += 10;
  }

  if (creatinine) {
    if (creatinine > 0.5 && creatinine < 1.3) totalScore += 10;
  }

  if (plasmaGlucose) {
    if (plasmaGlucose < 100) totalScore += 10;
    else if (plasmaGlucose >= 100 && plasmaGlucose < 125) totalScore += 5;
  }

  if (sleepingHours) {
    if (sleepingHours > 7) totalScore += 10;
    else if (sleepingHours > 4 && sleepingHours < 8) totalScore += 5;
  }

  return Math.round((totalScore * 100) / 40);
};

const calculateMentalScore = (data) => {
  let totalScore = 0;
  const { phq9Score, stressRiskAssessmentScore } = data;

  if (phq9Score) {
    if (phq9Score < 5) totalScore += 10;
    else if (phq9Score > 5 && phq9Score < 10) totalScore += 5;
  }

  if (stressRiskAssessmentScore) {
    if (stressRiskAssessmentScore > 0 && stressRiskAssessmentScore <= 13)
      totalScore += 10;
    else if (stressRiskAssessmentScore > 13 && stressRiskAssessmentScore <= 26)
      totalScore += 5;
  }

  return Math.round((totalScore * 100) / 20);
};

const calculateMetabolicScore = (data, gender) => {
  let totalScore = 0;
  const { hemoglobin, TLC, AST, ALT, plasmaGlucose, BMI } = data;

  if (hemoglobin) {
    if (gender === "M") {
      if (hemoglobin > 12 && hemoglobin < 18) totalScore += 10;
    } else {
      if (hemoglobin > 11 && hemoglobin < 16) totalScore += 10;
    }
  }

  if (TLC) {
    if (TLC >= 4000 && TLC <= 10000) totalScore += 10;
  }

  if (AST) {
    if (AST > 7 && AST < 49) totalScore += 5;
  }

  if (ALT) {
    if (ALT > 6 && ALT < 56) totalScore += 5;
  }

  if (plasmaGlucose) {
    if (plasmaGlucose < 100) totalScore += 10;
    else if (plasmaGlucose >= 100 && plasmaGlucose < 126) totalScore += 5;
  }

  if (BMI) {
    if (BMI > 18.4 && BMI < 24.9) totalScore += 10;
    else if (BMI > 25 && BMI < 29.9) totalScore += 5;
  }

  return Math.round((totalScore * 100) / 50);
};

const processHealthScoreData = (rawData) => {
  const heartScore = {
    totalCholesterol: parseFloat(rawData["Total Cholesterol"]),
    HDL: parseFloat(rawData["HDL"]),
    LDL: parseFloat(rawData["LDL"]),
    BP: {
      sys: parseFloat(rawData["BP Systolic"]),
      dia: parseFloat(rawData["BP Diastolic"]),
    },
    PR: parseFloat(rawData["Pulse Rate"]),
    BMI: parseFloat(rawData["BMI"]),
    alcoholIntake: rawData["Alcohol Intake\n(true/false)"] === "true",
    smoking: rawData["Smoking\n(true/false)"] === "true",
  };

  const gutScore = {
    urea: parseFloat(rawData["Urea"]),
    creatinine: parseFloat(rawData["Creatinine"]),
    plasmaGlucose: parseFloat(rawData["Plasma Glucose"]),
    sleepingHours: parseFloat(rawData["Sleeping Hours"]),
  };

  const mentalScore = {
    phq9Score: parseFloat(rawData["PHQ-9 Score"]),
    stressRiskAssessmentScore: parseFloat(
      rawData["Stress Risk Assessment Score"]
    ),
  };

  const metabolicScore = {
    hemoglobin: parseFloat(rawData["Hemoglobin"]),
    TLC: parseFloat(rawData["TLC"]),
    AST: parseFloat(rawData["AST"]),
    ALT: parseFloat(rawData["ALT"]),
    plasmaGlucose: parseFloat(rawData["Metabolic Plasma Glucose"]),
    BMI: parseFloat(rawData["BMI"]),
  };

  // Calculate scores
  heartScore.overAllHeartScore = calculateHeartScore(heartScore);
  gutScore.overAllGutScore = calculateGutScore(gutScore);
  mentalScore.overAllMentalScore = calculateMentalScore(mentalScore);
  metabolicScore.overAllMetabolicScore = calculateMetabolicScore(
    metabolicScore,
    rawData["Gender\n (M/F)"]
  );

  const overallHealthScore = Math.round(
    (heartScore.overAllHeartScore +
      gutScore.overAllGutScore +
      mentalScore.overAllMentalScore +
      metabolicScore.overAllMetabolicScore) /
      4
  );

  return {
    user: rawData.userId,
    heartScore,
    gutScore,
    mentalScore,
    metabolicScore,
    overallHealthScore,
  };
};

const bulkCreateOrUpdateHealthScore = async (req, res) => {
  try {
    if (!req.file) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Please upload an Excel file"
      );
    }
    const { corporate } = req.body;
    if (!corporate) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "corporate not found !"
      );
    }
    // console.log(req.file);

    // Read Excel file
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelData = xlsx.utils.sheet_to_json(worksheet);
    // console.log(excelData.map((row) => row.phone));

    const results = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    // Extract all phone numbers from Excel
    const phoneNumbers = excelData.map((row) => row["Phone"]).filter(Boolean);
    // console.log(excelData.map((row) => row.phone));

    if (phoneNumbers.length === 0) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "No valid phone numbers found in Excel"
      );
    }

    // Find all users with the given phone numbers
    const users = await Employee.find(
      { phone: { $in: phoneNumbers }, corporate },
      { _id: 1, phone: 1 }
    );

    // Create a map of phone numbers to user IDs for quick lookup
    const phoneToUserMap = new Map(users.map((user) => [user.phone, user._id]));
    // console.log(phoneToUserMap);

    // Filter out invalid phone numbers and prepare bulk operations
    // const bulkOperations = [];
    const validData = [];

    for (const row of excelData) {
      try {
        const userId = phoneToUserMap.get(row["Phone"]?.toString());

        if (!userId) {
          results.failed++;
          results.errors.push(
            `Invalid or non-existent phone number: ${row.phone}`
          );
          continue;
        }

        // Process health score data with the found userId
        row.userId = userId;
        // console.log(row);
        const healthScoreData = processHealthScoreData(row);
        // console.log(row["Gender\n (M/F)"]);

        // Validate data
        const { error } = healthScoreValidation.validate(healthScoreData);
        if (error) {
          results.failed++;
          results.errors.push(`Phone ${row.phone}: ${error.message}`);
          continue;
        }

        // Add to valid data for bulk operation
        validData.push({
          updateOne: {
            filter: { user: userId },
            update: { $set: healthScoreData },
            upsert: true,
          },
        });
      } catch (err) {
        results.failed++;
        results.errors.push(`Phone ${row.phone}: ${err.message}`);
      }
    }

    if (validData.length === 0) {
      console.log(results.errors);
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "No valid records to process"
      );
    }

    // console.log(validData);
    // return;
    // Perform bulk write operation
    const bulkResult = await HealthScore.bulkWrite(validData, {
      ordered: false,
    });

    results.successful = bulkResult.upsertedCount + bulkResult.modifiedCount;

    return Response.success(
      res,
      //   validData,
      //   {
      //     ...results,
      //     bulkWriteResult: {
      //       modified: bulkResult.modifiedCount,
      //       upserted: bulkResult.upsertedCount,
      //     },
      //   },
      null,
      200,
      AppConstant.SUCCESS,
      `Processed ${results.successful} records successfully. Failed: ${results.failed}`
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

// download sample excel file
const downloadSampleHealthScoreTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Health Score Template");

    // Define styles
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

    // Define columns
    worksheet.columns = [
      // User Information
      { header: "Phone", key: "phone", width: 30 },
      { header: "Gender\n (M/F)", key: "gender", width: 30 },

      // Heart Score Section
      { header: "Total Cholesterol", key: "totalCholesterol", width: 20 },
      { header: "HDL", key: "HDL", width: 15 },
      { header: "LDL", key: "LDL", width: 15 },
      { header: "BP Systolic", key: "BPSys", width: 15 },
      { header: "BP Diastolic", key: "BPDia", width: 15 },
      { header: "Pulse Rate", key: "PR", width: 15 },
      { header: "BMI", key: "BMI", width: 15 },
      {
        header: "Alcohol Intake\n(true/false)",
        key: "alcoholIntake",
        width: 20,
      },
      { header: "Smoking\n(true/false)", key: "smoking", width: 20 },

      // Gut Score Section
      { header: "Urea", key: "urea", width: 15 },
      { header: "Creatinine", key: "creatinine", width: 15 },
      { header: "Plasma Glucose", key: "plasmaGlucose", width: 20 },
      { header: "Sleeping Hours", key: "sleepingHours", width: 20 },

      // Mental Score Section
      { header: "PHQ-9 Score", key: "phq9Score", width: 20 },
      {
        header: "Stress Risk Assessment Score",
        key: "stressRiskAssessmentScore",
        width: 30,
      },

      // Metabolic Score Section
      { header: "Hemoglobin", key: "hemoglobin", width: 15 },
      { header: "TLC", key: "TLC", width: 15 },
      { header: "AST", key: "AST", width: 15 },
      { header: "ALT", key: "ALT", width: 15 },
      {
        header: "Metabolic Plasma Glucose",
        key: "metabolicPlasmaGlucose",
        width: 25,
      },
      { header: "Metabolic BMI", key: "metabolicBMI", width: 20 },
    ];

    // Apply header style
    worksheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Add sample data row
    const sampleRow = worksheet.addRow({
      phone: "7631006505", // Sample MongoDB ObjectId
      gender: "M", // Sample MongoDB ObjectId
      totalCholesterol: 180,
      HDL: 50,
      LDL: 100,
      BPSys: 120,
      BPDia: 80,
      PR: 72,
      BMI: 23.5,
      alcoholIntake: "false",
      smoking: "false",
      urea: 25,
      creatinine: 0.9,
      plasmaGlucose: 95,
      sleepingHours: 7,
      phq9Score: 4,
      stressRiskAssessmentScore: 3,
      hemoglobin: 14,
      TLC: 7500,
      AST: 25,
      ALT: 30,
      metabolicPlasmaGlucose: 95,
      metabolicBMI: 23.5,
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

    // Add notes/comments for valid ranges
    worksheet.getCell("A1").note = "Enter valid Phone Number";
    worksheet.getCell("B1").note =
      "Total Cholesterol in mg/dL (Normal range: 125-200)";
    worksheet.getCell("C1").note = "HDL in mg/dL (Normal range: 40-60)";
    worksheet.getCell("D1").note = "LDL in mg/dL (Normal range: <100)";
    worksheet.getCell("E1").note = "Systolic BP in mmHg (Normal range: 90-120)";
    worksheet.getCell("F1").note = "Diastolic BP in mmHg (Normal range: 60-80)";
    worksheet.getCell("G1").note = "Pulse Rate in bpm (Normal range: 60-100)";
    worksheet.getCell("H1").note = "BMI (Normal range: 18.5-24.9)";

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=health_score_template.xlsx"
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

module.exports = {
  bulkCreateOrUpdateHealthScore,
  downloadSampleHealthScoreTemplate,
};
