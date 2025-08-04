const Employee = require("../../models/patient/employee/employee.model.js");
const AppConstant = require("../../utils/AppConstant.js");
const Response = require("../../utils/Response.js");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");

const {
  employeeRegisterSchema,
} = require("../../validators/user/register.validator.js");
const {
  encryptPasswordFn,
  validGender,
  validIsMarried,
} = require("../../helper/password/password.helper.js");

// download sample excel file

const downloadSampleExcelFileToAddCorporateEmployee = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Corporate Employees");

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

    worksheet.columns = [
      { header: "First Name", key: "firstName", width: 20 },
      { header: "Last Name", key: "lastName", width: 20 },
      { header: "Email", key: "email", width: 20 },
      { header: "Password", key: "password", width: 20 },
      { header: "Phone", key: "phone", width: 20 },
      { header: "Gender", key: "gender", width: 20 },
      { header: "Address Name", key: "name", width: 20 },
      { header: "Address Street", key: "street", width: 20 },
      { header: "City", key: "city", width: 20 },
      { header: "State", key: "state", width: 20 },
      { header: "Pin Code", key: "pincode", width: 20 },
      { header: "Is Married", key: "isMarried", width: 20 },
      { header: "Age", key: "age", width: 20 },
      { header: "Weight", key: "weight", width: 20 },
      { header: "Department", key: "department", width: 20 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    const materialData = await Employee.findOne({});

    worksheet.getRow(1).height = 30;
    // materialData.forEach((record) => {
    //   const row = worksheet.addRow({
    //     firstName: record.firstName,
    //     lastName: record.lastName,
    //     email: record.email,
    //     email: record.email,

    //   });

    //   row.eachCell((cell) => {
    //     cell.style = dataStyle;
    //   });

    //   row.height = 25;
    // });

    // add a single dummy row here
    const row = worksheet.addRow({
      firstName: "first name",
      lastName: "last name",
      email: "email@gmail.com",
      password: "password",
      phone: "1234567890",
      gender: "Male",
      name: "flat 1551",
      street: "sahi majra",
      city: "mohali",
      state: "Punjab",
      pincode: "140301",
      isMarried: "Yes | No",
      weight: "56",
      age: "34",
      department: "IT",
    });
    row.eachCell((cell) => {
      cell.style = dataStyle;
    });

    row.height = 25;

    worksheet.autoFilter = { from: "A1", to: "N1" };
    worksheet.views = [
      {
        state: "frozen",
        xSplit: 0,
        ySplit: 1,
        topLeftCell: "A2",
        activeCell: "A2",
      },
    ];

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sample_employees.xlsx"
    );

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

//
const addCorporateEmployeesThroughExcel = async (req, res) => {
  try {
    const { corporate } = req.body;
    if (!corporate) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        `Please Select Corporate`
      );
    }

    // Load and parse the Excel file
    if (
      !req.files ||
      !req.files.employees ||
      req.files.employees.length === 0
    ) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        `Please upload an Excel file`
      );
    }
    const workbook = xlsx.read(req.files.employees[0].buffer, {
      type: "buffer",
    });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Map the data from Excel to the employee schema
    const employeesData = data.map((item) => ({
      firstName: item["First Name"],
      lastName: item["Last Name"],
      email: item["Email"],
      password: encryptPasswordFn(item["Password"]), // Ensure password is hashed before saving
      phone: item["Phone"]?.toString(),
      gender: validGender(item["Gender"]),
      corporate,
      role: "Employee",
      address: {
        name: item["Address Name"],
        street: item["Address Street"],
        city: item["City"],
        state: item["State"],
        pincode: item["Pin Code"]?.toString(),
      },
      isMarried: validIsMarried(item["Is Married"]),
      age: item["Age"],
      weight: item["Weight"] || "",
      department: item["Department"],
    }));

    // Validate and clean data if necessary (optional)
    const validatedData = await Promise.all(
      employeesData.map(async (employee) => {
        try {
          // Validate employee data using Joi
          return await employeeRegisterSchema.validateAsync(employee);
        } catch (error) {
          // Throw an error to be caught by Promise.all
          //   throw new Error(
          //     `Validation failed for employee: ${employee.firstName} ${employee.lastName}. Error: ${error.message}`
          //   );
          return Response.error(
            res,
            400,
            AppConstant.FAILED,
            `Validation failed for employee: ${employee.firstName} ${employee.lastName}. Error: ${error.message}`
          );
        }
      })
    );

    // Insert all the employees in bulk
    const insertedEmployees = await Employee.insertMany(validatedData);

    return Response.success(
      res,
      insertedEmployees,
      201,
      AppConstant.SUCCESS,
      "Employees created successfully!"
    );
  } catch (error) {
    console.error(error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error!"
    );
  }
};

module.exports = {
  downloadSampleExcelFileToAddCorporateEmployee,
  addCorporateEmployeesThroughExcel,
};
