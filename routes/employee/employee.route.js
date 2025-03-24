const {
  downloadSampleExcelFileToAddCorporateEmployee,
  addCorporateEmployeesThroughExcel,
} = require("../../controllers/auth/addCorporateEmployeeThroughExcel.controller");
const {
  createCoronaryHeartDisease,
  getDataToCreateCoronaryHeartDisease,
  getCoronaryDataScoreAndDateByEmployeeId,
} = require("../../controllers/patient/riskAssessments/coronaryHeartDisease.controller");
const {
  createDiabeticRiskCalculator,
  getAllDiabeticRiskCalculatorDateAndRisk,
} = require("../../controllers/patient/riskAssessments/diabeticRiskCalculator.controller");
const {
  createLiverRiskCalculator,
  getAllLiverRiskCalculator,
} = require("../../controllers/patient/riskAssessments/liverRiskCalculate.controller");
const {
  createStrokeRiskCalculator,
  getAllStrokeRiskCalculatorDateAndLowerHigherVal,
} = require("../../controllers/patient/riskAssessments/strokeRiskCalculate.controller");
const { verifyToken } = require("../../middlewares/jwt/permission");
const { upload } = require("../../middlewares/uploads/multerConfig");

const router = require("express").Router();

// <================= risk assessment calculator ===============>
// <========= coronary heart calc =========>
router.post(
  "/admin/patient/coronaryheart-diseases",
  // verifyToken,
  //   checkPermissions("CREATE", "Superadmin"),
  createCoronaryHeartDisease
);
router.post(
  "/admin/patient/coronaryheart-disease",
  verifyToken,
  //   checkPermissions("CREATE", "Superadmin"),
  getDataToCreateCoronaryHeartDisease
);
router.get(
  "/admin/patient/coronaryheart-diseases",
  verifyToken,
  //   checkPermissions("CREATE", "Superadmin"),
  getCoronaryDataScoreAndDateByEmployeeId
);

// <========= diabetic health heart calc =========>
router.post(
  "/admin/patient/diabetic-risk-calc",
  verifyToken,
  //   checkPermissions("CREATE", "Superadmin"),
  createDiabeticRiskCalculator
);
router.post(
  "/admin/patient/diabetic-risk-calcs",
  verifyToken,
  //   checkPermissions("CREATE", "Superadmin"),
  getAllDiabeticRiskCalculatorDateAndRisk
);
// <========= stroke risk calc =========>
router.post(
  "/admin/patient/stroke-risk-calc",
  verifyToken,
  //   checkPermissions("CREATE", "Superadmin"),
  createStrokeRiskCalculator
);
router.post(
  "/admin/patient/stroke-risk-calcs",
  verifyToken,
  //   checkPermissions("CREATE", "Superadmin"),
  getAllStrokeRiskCalculatorDateAndLowerHigherVal
);
// <========= liver risk calc =========>
router.post(
  "/admin/patient/liver-risk-calc",
  // verifyToken,
  //   checkPermissions("CREATE", "Superadmin"),
  createLiverRiskCalculator
);
router.post(
  "/admin/patient/liver-risk-calcs",
  // verifyToken,
  //   checkPermissions("CREATE", "Superadmin"),
  getAllLiverRiskCalculator
);

//<=============== add employee through excel =================>

// download sample excel file
router.get(
  "/admin/corporate/employees/sample-excel",
  verifyToken,
  //   checkPermissions("CREATE", "Superadmin"),
  downloadSampleExcelFileToAddCorporateEmployee
);
router.post(
  "/admin/corporate/employees/excel",
  verifyToken,
  //   checkPermissions("CREATE", "Superadmin"),
  upload.fields([{ name: "employees", maxCount: 1 }]),
  addCorporateEmployeesThroughExcel
);

module.exports = router;
