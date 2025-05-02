const mongoose = require("mongoose");
const AppConstant = require("../../utils/AppConstant");
const Response = require("../../utils/Response");
const CorporatePlan = require("../../models/corporates/corporatePlan.model");
const UserPlansBalance = require("../../models/corporates/individualPlan.model");
const Employee = require("../../models/patient/employee/employee.model");

/**
 * Assigns a corporate plan to an employee
 * Updates UserPlansBalance and CorporatePlan.assignedEmployee
 */
const assignPlanToEmployee = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("Starting plan assignment process...");
    const { employeeId, corporatePlanId } = req.body;
    console.log("Request body:", { employeeId, corporatePlanId });

    // Validate required fields
    if (!employeeId || !corporatePlanId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Employee ID and Corporate Plan ID are required"
      );
    }

    // 1. Validate corporate plan exists and is active
    const corporatePlan = await CorporatePlan.findById(corporatePlanId)
      .populate("booleanFeatureList.featureId")
      .populate("countFeatureList.featureId")
      .session(session);

    console.log("Found corporate plan:", {
      id: corporatePlan?._id,
      name: corporatePlan?.name,
      status: corporatePlan?.status,
      duration: corporatePlan?.duration,
      startDate: corporatePlan?.startDate,
      endDate: corporatePlan?.endDate,
    });

    if (!corporatePlan) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Corporate plan not found"
      );
    }

    if (corporatePlan.status !== "active") {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Corporate plan is not active"
      );
    }

    // Check if plan has reached employee limit
    if (corporatePlan.employeeCount >= corporatePlan.totalEmployeeCount) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Corporate plan has reached maximum employee limit"
      );
    }

    // 2. Validate employee exists
    const employee = await Employee.findById(employeeId).session(session);
    console.log("Found employee:", { id: employee?._id, name: employee?.name });

    if (!employee) {
      return Response.error(res, 404, AppConstant.FAILED, "Employee not found");
    }

    // 3. Check if employee is already assigned to this plan
    if (corporatePlan.assignedEmployee.includes(employeeId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Employee is already assigned to this plan"
      );
    }

    // 4. Get or create UserPlansBalance document
    let userPlansBalance = await UserPlansBalance.findOne({
      userId: employeeId,
      roleType: "employee",
      corporateCompanyId: corporatePlan.corporateId,
    }).session(session);

    console.log("Existing user plans balance:", userPlansBalance?._id);

    if (!userPlansBalance) {
      userPlansBalance = new UserPlansBalance({
        userId: employeeId,
        roleType: "employee",
        corporateCompanyId: corporatePlan.corporateId,
        activeBooleanFeatures: [],
        activeCountFeatures: [],
      });
      console.log("Created new user plans balance");
    }

    const now = new Date();
    const expiresAt =
      corporatePlan.endDate || new Date(now.setFullYear(now.getFullYear() + 1));

    console.log("Setting timestamps:", { now, expiresAt });

    // Create boolean features
    const booleanFeatures = corporatePlan.booleanFeatureList.map((feature) => ({
      featureId: feature.featureId._id,
      featureType: feature.planType || corporatePlan.duration,
      featureName: feature.name,
      planType: corporatePlan.duration,
      status: feature.status,
      type: feature.type || "others",
      subType: feature.subType || "others",
      assignedAt: now,
      expiresAt: expiresAt,
      totalAllowed: 1,
      totalUsed: 0,
      totalRemaining: 1,
      periodAllowed: 1,
      periodUsed: 0,
      periodRemaining: 1,
      history: [
        {
          timestamp: now,
          usedDelta: 0,
          remainingAfter: 1,
          note: "Feature assigned",
        },
      ],
    }));

    // Create count features
    const countFeatures = corporatePlan.countFeatureList.map((feature) => ({
      featureId: feature.featureId._id,
      featureType: corporatePlan.countFeatureList.filter(
        (f) => f.featureId._id === feature.featureId._id
      )[0].planType,
      featureName: feature.name,
      planType: corporatePlan.duration,
      status: false,
      type: feature.type || "others",
      subType: feature.subType || "others",
      assignedAt: now,
      expiresAt: expiresAt,
      totalAllowed: feature.count,
      totalUsed: 0,
      totalRemaining: feature.count,
      periodAllowed: feature.count,
      periodUsed: 0,
      periodRemaining: feature.count,
      history: [
        {
          timestamp: now,
          usedDelta: 0,
          remainingAfter: feature.count,
          note: "Feature assigned",
        },
      ],
    }));

    // Add features to user's plan balance
    userPlansBalance.activeBooleanFeatures.push(...booleanFeatures);
    userPlansBalance.activeCountFeatures.push(...countFeatures);

    // 6. Update corporate plan
    corporatePlan.assignedEmployee.push(employeeId);
    corporatePlan.employeeCount += 1;

    console.log("Saving changes...");

    // 7. Save all changes
    await userPlansBalance.save({ session });
    await corporatePlan.save({ session });

    // 8. Commit transaction
    await session.commitTransaction();
    console.log("Transaction committed successfully");

    return Response.success(
      res,
      {
        userPlansBalance,
        corporatePlan,
      },
      200,
      "Plan assigned successfully"
    );
  } catch (err) {
    await session.abortTransaction();
    console.error("Error in assignPlanToEmployee:", err);
    console.error("Validation errors:", err.errors);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  } finally {
    session.endSession();
  }
};

/**
 * Gets all plans assigned to an employee
 */
const getEmployeePlans = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Employee ID is required"
      );
    }

    const userPlansBalance = await UserPlansBalance.findOne({
      userId: employeeId,
      roleType: "employee",
    })
      .populate("corporateCompanyId", "companyName")
      .populate("activeBooleanFeatures.featureId")
      .populate("activeCountFeatures.featureId");

    if (!userPlansBalance) {
      return Response.success(
        res,
        { activeBooleanFeatures: [], activeCountFeatures: [] },
        200,
        "No plans found for employee"
      );
    }

    return Response.success(
      res,
      userPlansBalance,
      200,
      "Employee plans retrieved successfully"
    );
  } catch (err) {
    console.error("Error in getEmployeePlans:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

module.exports = {
  assignPlanToEmployee,
  getEmployeePlans,
};
