const individualUserPlanModel = require("../../../../models/individualUser/individualUserPlan.model");
const employeePlanModel = require("../../../../models/patient/employee/employeePlan.model");
const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const mongoose = require("mongoose");

// create
const addIndividualUserPlan = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const lowerCaseName = req.body.name && req.body.name.toLowerCase();
    const lowerCaseCategory =
      req.body.category && req.body.category.toLowerCase();

    const alreadyPlanExist = await individualUserPlanModel.findOne({
      name: lowerCaseName,
      category: lowerCaseCategory,
    });
    if (alreadyPlanExist) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "plan already exist !"
      );
    }

    const newIndividualUserPlan = new individualUserPlanModel({
      ...req.body,
      name: lowerCaseName,
      category: lowerCaseCategory,
    });
    const savedIndividualUserPlan = await newIndividualUserPlan.save({
      session,
    });

    // Return success response
    await session.commitTransaction();
    // session.endSession();
    return Response.success(
      res,
      savedIndividualUserPlan,
      201,
      "Individual User plan created successfully !"
    );
  } catch (err) {
    await session.abortTransaction();
    // session.endSession();
    // Handle any errors
    if (err.name === "ValidationError") {
      const errorMessages = Object.values(err.errors).map(
        (error) => error.message
      );
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        errorMessages.join(", ") || "Validation error!"
      );
    }
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  } finally {
    session.endSession();
  }
};

// get all
const getAllIndividualUserPlansToShowOnDashboard = async (req, res) => {
  try {
    const { individualUserId } = req.body;
    if (!individualUserId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "individual User Id is missing !"
      );
    }
    const existingAllIndividualUserPlans = await individualUserPlanModel.find(
      { individualUserId },
      "name category booleanFeatureList countFeatureList"
    );

    // Return success response
    return Response.success(
      res,
      existingAllIndividualUserPlans,
      200,
      "All Individual User plans found !"
    );
  } catch (err) {
    // Handle any errors
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

// get single plan
const getSingleIndividualUserPlanIndividualUserPlanId = async (req, res) => {
  try {
    const { individualUserPlanId } = req.body;
    if (!individualUserPlanId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Individual user plan Id is missing !"
      );
    }
    const existingIndividualUserPlan = await individualUserPlanModel
      .findOne(
        { _id: individualUserPlanId },
        "name category duration status  booleanFeatureList countFeatureList startDate autoRenew paymentStatus endDate price billingCycle nextBillingDate"
      )
      .populate({
        path: "individualUserId",
        populate: {
          path: "address",
          select: "name city",
        },
        select: "firstName lastName profileImg email phone",
      });

    // Return success response
    return Response.success(
      res,
      existingIndividualUserPlan,
      200,
      "Individual User plan found !"
    );
  } catch (err) {
    // Handle any errors
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};
// const getAllCorporatePlans = async (req, res) => {
//   try {
//     const existingAllCorporatePlans = await corporatePlanModel
//       .find(
//         {},
//         "name category price totalCount usedCount duration status endDate"
//       )
//       .populate({ path: "corporateId", select: "companyName logo" });

//     // Return success response
//     return Response.success(
//       res,
//       existingAllCorporatePlans,
//       200,
//       "All Corporate plans found !"
//     );
//   } catch (err) {
//     // Handle any errors
//     return Response.error(
//       res,
//       500,
//       AppConstant.FAILED,
//       err.message || "Internal server error!"
//     );
//   }
// };
const getAllCorporateEmployeePlansToShowOnDashboard = async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "employee Id is missing !"
      );
    }
    const existingAllEmployeePlans = await employeePlanModel.find(
      { employeeId },
      "name category booleanFeatureList countFeatureList"
    );

    // Return success response
    return Response.success(
      res,
      existingAllEmployeePlans,
      200,
      "All Corporate Employee plans found !"
    );
  } catch (err) {
    // Handle any errors
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

// get corporate plan by plan id to show  single plan
const getSingleCorporateEmployeePlanByEmployeePlanId = async (req, res) => {
  try {
    const { employeePlanId } = req.body;
    if (!employeePlanId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "employee Plan Id is missing !"
      );
    }
    const existingCorporateEmployeePlan = await employeePlanModel
      .findOne(
        { _id: employeePlanId },
        "name category duration status  booleanFeatureList countFeatureList startDate autoRenew paymentStatus endDate price billingCycle nextBillingDate"
      )
      .populate({
        path: "employeeId",
        populate: {
          path: "address",
          select: "name city",
        },
        select: "firstName lastName profileImg email phone",
      });

    // Return success response
    return Response.success(
      res,
      existingCorporateEmployeePlan,
      200,
      "Corporate Employee plan found !"
    );
  } catch (err) {
    // Handle any errors
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

module.exports = {
  addIndividualUserPlan,
  getAllIndividualUserPlansToShowOnDashboard,
  getAllCorporateEmployeePlansToShowOnDashboard,
  getSingleCorporateEmployeePlanByEmployeePlanId,
  getSingleIndividualUserPlanIndividualUserPlanId,
  //   getAllCorporatePlans,
  //   getAllCorporatePlansToShowOnDashboard,
  //   getSingleCorporatePlanByCorporatePlanId,
};
