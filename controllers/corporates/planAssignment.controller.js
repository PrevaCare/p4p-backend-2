const UserPlansBalance = require("../../models/corporates/individualPlan.model");
const CorporatePlan = require("../../models/corporates/corporatePlan.model");
const {
  assignFeaturesToPlan,
} = require("../../helper/planAssignment/featureAssignment.helper");

/**
 * Assign a plan to a user
 */
const assignPlan = async (req, res) => {
  try {
    console.log("Starting plan assignment with request body:", req.body);
    const { corporatePlanId, employeeId } = req.body;

    // First fetch the corporate plan
    const corporatePlan = await CorporatePlan.findById(corporatePlanId);
    if (!corporatePlan) {
      console.error("Corporate plan not found:", corporatePlanId);
      return res.status(404).json({
        success: false,
        message: "Corporate plan not found",
      });
    }
    console.log("Found corporate plan:", {
      name: corporatePlan.name,
      duration: corporatePlan.duration,
      booleanFeatures: corporatePlan.booleanFeatureList?.length,
      countFeatures: corporatePlan.countFeatureList?.length,
    });

    // Find or create user's plan balance
    let userPlansBalance = await UserPlansBalance.findOne({
      userId: employeeId,
    });
    console.log("Existing user plan balance:", userPlansBalance);

    if (!userPlansBalance) {
      console.log("Creating new user plan balance for employee:", employeeId);
      userPlansBalance = new UserPlansBalance({
        userId: employeeId,
        roleType: "employee",
        corporateCompanyId: corporatePlan.corporateId,
        activePlans: [],
      });
    }

    // Create new plan assignment with all required fields
    console.log("Creating new plan with corporate plan data:", {
      name: corporatePlan.name,
      duration: corporatePlan.duration,
      endDate: corporatePlan.endDate,
      totalEmployeeCount: corporatePlan.totalEmployeeCount,
      employeeCount: corporatePlan.employeeCount,
    });

    const newPlan = {
      planId: corporatePlanId,
      corporateId: corporatePlan.corporateId,
      planName: corporatePlan.name,
      planType: corporatePlan.duration || "yearly",
      assignedAt: new Date(),
      expiresAt: corporatePlan.endDate,
      features: {
        booleanFeatures: [],
        countFeatures: [],
      },
      totalAllowed: corporatePlan.totalEmployeeCount || 0,
      used: 0,
      remaining: corporatePlan.totalEmployeeCount || 0,
      periodAllowed: corporatePlan.employeeCount || 0,
      periodUsed: 0,
      periodRemaining: corporatePlan.employeeCount || 0,
      history: [],
    };

    console.log("Created new plan structure:", newPlan);

    // Assign features from corporate plan
    console.log("Assigning features from corporate plan");
    const updatedPlan = assignFeaturesToPlan(corporatePlan, newPlan);
    console.log("Updated plan with features:", {
      planName: updatedPlan.planName,
      planType: updatedPlan.planType,
      booleanFeaturesCount: updatedPlan.features.booleanFeatures.length,
      countFeaturesCount: updatedPlan.features.countFeatures.length,
    });

    // Add plan to user's active plans
    userPlansBalance.activePlans.push(updatedPlan);
    console.log("Added plan to user's active plans");

    // Save changes
    console.log("Saving user plan balance");
    await userPlansBalance.save();
    console.log("Successfully saved user plan balance");

    res.status(200).json({
      success: true,
      message: "Plan assigned successfully",
      data: userPlansBalance,
    });
  } catch (error) {
    console.error("Error in assignPlan:", error);
    console.error("Validation errors:", error.errors);
    res.status(500).json({
      success: false,
      message: "Error assigning plan",
      error: error.message,
    });
  }
};

/**
 * Update feature usage
 */
const updateFeatureUsage = async (req, res) => {
  try {
    console.log("Starting feature usage update with request body:", req.body);
    const { userId, planId, featureId, featureType, usageDelta } = req.body;

    const userPlansBalance = await UserPlansBalance.findOne({ userId });
    if (!userPlansBalance) {
      console.error("User plan balance not found for userId:", userId);
      return res.status(404).json({
        success: false,
        message: "User plan balance not found",
      });
    }

    console.log("Found user plan balance:", {
      userId,
      activePlansCount: userPlansBalance.activePlans.length,
    });

    const updatedBalance = await updateFeatureUsage(
      userPlansBalance,
      planId,
      featureId,
      featureType,
      usageDelta
    );

    console.log("Updated feature usage, saving changes");
    await updatedBalance.save();
    console.log("Successfully saved updated balance");

    res.status(200).json({
      success: true,
      message: "Feature usage updated successfully",
      data: updatedBalance,
    });
  } catch (error) {
    console.error("Error in updateFeatureUsage:", error);
    res.status(500).json({
      success: false,
      message: "Error updating feature usage",
      error: error.message,
    });
  }
};

module.exports = {
  assignPlan,
  updateFeatureUsage,
};
