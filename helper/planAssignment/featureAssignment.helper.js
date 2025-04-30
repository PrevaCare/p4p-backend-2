const mongoose = require("mongoose");

/**
 * Creates a feature usage object for a boolean feature
 */
const createBooleanFeatureUsage = (feature, planType) => {
  console.log("Creating boolean feature usage:", {
    feature,
    planType,
    featureId: feature.featureId,
    name: feature.name,
  });

  const booleanFeature = {
    featureId: feature.featureId,
    featureType: "BooleanFeature",
    name: feature.name,
    planType: planType || "yearly",
    status: feature.status,
    totalAllowed: 1,
    used: 0,
    remaining: 1,
    periodAllowed: 1,
    periodUsed: 0,
    periodRemaining: 1,
    history: [
      {
        timestamp: new Date(),
        usedDelta: 0,
        remainingAfter: 1,
        note: "Feature assigned",
      },
    ],
  };

  console.log("Created boolean feature:", booleanFeature);
  return booleanFeature;
};

/**
 * Creates a feature usage object for a count feature
 */
const createCountFeatureUsage = (feature) => {
  console.log("Creating count feature usage:", {
    feature,
    featureId: feature.featureId,
    name: feature.name,
    planType: feature.planType,
  });

  const countFeature = {
    featureId: feature.featureId,
    featureType: "CountFeature",
    name: feature.name,
    planType: feature.planType || "yearly",
    totalAllowed: feature.count,
    used: 0,
    remaining: feature.count,
    periodAllowed: feature.count,
    periodUsed: 0,
    periodRemaining: feature.count,
    history: [
      {
        timestamp: new Date(),
        usedDelta: 0,
        remainingAfter: feature.count,
        note: "Feature assigned",
      },
    ],
  };

  console.log("Created count feature:", countFeature);
  return countFeature;
};

/**
 * Assigns features from a corporate plan to a user's plan balance
 */
const assignFeaturesToPlan = (corporatePlan, userPlan) => {
  console.log("Starting assignFeaturesToPlan with:", {
    corporatePlanName: corporatePlan.name,
    corporatePlanDuration: corporatePlan.duration,
    userPlanId: userPlan.planId,
  });

  const now = new Date();

  // Set plan details
  userPlan.planName = corporatePlan.name;
  userPlan.planType = corporatePlan.duration || "yearly";
  userPlan.assignedAt = now;
  userPlan.expiresAt = corporatePlan.endDate;
  userPlan.totalAllowed = corporatePlan.totalEmployeeCount || 0;
  userPlan.used = 0;
  userPlan.remaining = corporatePlan.totalEmployeeCount || 0;
  userPlan.periodAllowed = corporatePlan.employeeCount || 0;
  userPlan.periodUsed = 0;
  userPlan.periodRemaining = corporatePlan.employeeCount || 0;

  console.log("Set plan details:", {
    planName: userPlan.planName,
    planType: userPlan.planType,
    totalAllowed: userPlan.totalAllowed,
  });

  // Assign boolean features
  if (
    corporatePlan.booleanFeatureList &&
    Array.isArray(corporatePlan.booleanFeatureList)
  ) {
    console.log(
      "Processing boolean features:",
      corporatePlan.booleanFeatureList
    );
    userPlan.features.booleanFeatures = corporatePlan.booleanFeatureList.map(
      (feature) => createBooleanFeatureUsage(feature, corporatePlan.duration)
    );
  } else {
    console.log("No boolean features found in corporate plan");
    userPlan.features.booleanFeatures = [];
  }

  // Assign count features
  if (
    corporatePlan.countFeatureList &&
    Array.isArray(corporatePlan.countFeatureList)
  ) {
    console.log("Processing count features:", corporatePlan.countFeatureList);
    userPlan.features.countFeatures = corporatePlan.countFeatureList.map(
      (feature) => createCountFeatureUsage(feature)
    );
  } else {
    console.log("No count features found in corporate plan");
    userPlan.features.countFeatures = [];
  }

  // Update overall plan history
  userPlan.history.push({
    timestamp: now,
    usedDelta: 0,
    remainingAfter: 1,
    note: "Plan features assigned",
  });

  console.log("Final user plan structure:", {
    planName: userPlan.planName,
    planType: userPlan.planType,
    booleanFeaturesCount: userPlan.features.booleanFeatures.length,
    countFeaturesCount: userPlan.features.countFeatures.length,
  });

  return userPlan;
};

/**
 * Updates a feature's usage
 */
const updateFeatureUsage = async (
  userPlansBalance,
  planId,
  featureId,
  featureType,
  usageDelta
) => {
  console.log("Updating feature usage:", {
    planId,
    featureId,
    featureType,
    usageDelta,
  });

  const plan = userPlansBalance.activePlans.id(planId);
  if (!plan) {
    console.error("Plan not found with ID:", planId);
    throw new Error("Plan not found");
  }

  const featureList =
    featureType === "BooleanFeature"
      ? plan.features.booleanFeatures
      : plan.features.countFeatures;

  const feature = featureList.find(
    (f) => f.featureId.toString() === featureId.toString()
  );
  if (!feature) {
    console.error("Feature not found with ID:", featureId);
    throw new Error("Feature not found");
  }

  const now = new Date();

  if (featureType === "BooleanFeature") {
    // For boolean features, just update status
    feature.status = usageDelta > 0;
    feature.history.push({
      timestamp: now,
      usedDelta: usageDelta,
      remainingAfter: usageDelta > 0 ? 1 : 0,
      note: usageDelta > 0 ? "Feature activated" : "Feature deactivated",
    });
  } else {
    // For count features, update counts
    feature.used += usageDelta;
    feature.remaining = Math.max(0, feature.totalAllowed - feature.used);
    feature.periodUsed += usageDelta;
    feature.periodRemaining = Math.max(
      0,
      feature.periodAllowed - feature.periodUsed
    );

    feature.history.push({
      timestamp: now,
      usedDelta: usageDelta,
      remainingAfter: feature.remaining,
      note: `Feature usage updated by ${usageDelta}`,
    });
  }

  // Update overall plan usage
  plan.used += usageDelta;
  plan.remaining = Math.max(0, plan.totalAllowed - plan.used);
  plan.periodUsed += usageDelta;
  plan.periodRemaining = Math.max(0, plan.periodAllowed - plan.periodUsed);

  plan.history.push({
    timestamp: now,
    usedDelta: usageDelta,
    remainingAfter: plan.remaining,
    note: `Plan usage updated by ${usageDelta}`,
  });

  console.log("Updated feature and plan usage:", {
    featureId,
    featureType,
    newUsage: feature.used,
    planRemaining: plan.remaining,
  });

  return userPlansBalance;
};

module.exports = {
  assignFeaturesToPlan,
  updateFeatureUsage,
};
