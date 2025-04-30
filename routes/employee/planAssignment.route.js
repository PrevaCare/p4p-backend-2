const express = require("express");
const router = express.Router();
const {
  assignPlanToEmployee,
  getEmployeePlans,
} = require("../../controllers/employeePlan/planAssignment.controller");

// Route to assign a plan to an employee
router.post("/employees/:employeeId/plans", assignPlanToEmployee);

// Route to get all plans for an employee
router.get("/employees/:employeeId/plans", getEmployeePlans);

module.exports = router;
