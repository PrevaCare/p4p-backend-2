const userModel = require("../../models/common/user.model");
const corporatePlanModel = require("../../models/corporates/corporatePlan.model");
const individualUserPlanModel = require("../../models/individualUser/individualUserPlan.model");
const employeePlanModel = require("../../models/patient/employee/employeePlan.model");
const AppConstant = require("../../utils/AppConstant");
const Response = require("../../utils/Response");
const mongoose = require("mongoose");

// create
const addEmployeePlan = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Validate request body
    // const { error } = addGlobalPlanSchema.validate(req.body);
    // if (error) {
    //   return Response.error(
    //     res,
    //     400,
    //     AppConstant.FAILED,
    //     err.message || "validation failed"
    //   );
    // }
    const { corporatePlanId, corporateId } = req.query;

    if (!corporatePlanId || !corporateId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "plan id or corporate is missing !"
      );
    }
    const existingCorporatePlan = await corporatePlanModel
      .findById(corporatePlanId)
      .session(session);

    if (
      existingCorporatePlan.toObject().corporateId.toString() !== corporateId
    ) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "plan does not belogs to same corporate !"
      );
    }
    // console.log(existingCorporatePlan);
    // return;
    existingCorporatePlan.toObject().totalCount &&
      existingCorporatePlan.toObject().status !== "active";
    if (
      !existingCorporatePlan &&
      existingCorporatePlan.toObject().usedCount >=
        existingCorporatePlan.toObject().totalCount &&
      existingCorporatePlan.toObject().status !== "active"
    ) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "corporate don't have valid plan !"
      );
    }
    const lowerCaseName = req.body.name && req.body.name.toLowerCase();
    const lowerCaseCategory =
      req.body.category && req.body.category.toLowerCase();

    const alreadyEmployeePlanExist = await employeePlanModel
      .findOne({
        employeeId: req.body.employeeId,
        name: lowerCaseName,
        category: lowerCaseCategory,
      })
      .session(session);
    if (alreadyEmployeePlanExist) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "plan already exist !"
      );
    }

    existingCorporatePlan.usedCount += 1;
    existingCorporatePlan.save({ session });

    const newEmployeePlan = new employeePlanModel({
      ...req.body,
      name: lowerCaseName,
      category: lowerCaseCategory,
    });
    const savedEmployeePlan = await newEmployeePlan.save({ session });

    // Return success response
    await session.commitTransaction();
    // session.endSession();
    return Response.success(
      res,
      savedEmployeePlan,
      201,
      "Employee plan created successfully !"
    );
  } catch (err) {
    await session.abortTransaction();
    // session.endSession();
    // Handle any errors
    if (err.name === "ValidationError") {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        err.message || "validation error !"
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

// check if user has valid tele consultation plan or not.
const checkUserHasValidTeleConsultationPlan = async (req, res) => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "patient Id is missing !"
      );
    }

    // existing user
    const existingUser = await userModel.findOne({
      _id: patientId,
      $or: [{ role: "Employee" }, { role: "IndividualUser" }],
    });

    if (!existingUser) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "patient not found !"
      );
    }

    // const existingUserPlans =
    //   existingUser.role === "Employee"
    //     ? await employeePlanModel.findOne({
    //         employeeId: existingUser._id,
    //       })
    //     : await individualUserPlanModel.findOne({
    //         individualUserId: existingUser._id,
    //       });
    const planModel =
      existingUser.role === "Employee"
        ? employeePlanModel
        : individualUserPlanModel;
    const query = {
      status: "active",
      countFeatureList: {
        $elemMatch: {
          name: { $regex: /tele[\s]?consultation/i }, // Matches "tele consultation" or "teleconsultation" case-insensitively
          count: { $gt: 0 }, // Ensures count is greater than 0
        },
      },
    };

    const existingUserPlans = await planModel.findOne(
      existingUser.role === "Employee"
        ? { employeeId: existingUser._id, ...query }
        : { individualUserId: existingUser._id, ...query }
    );
    if (!existingUserPlans) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "user don't have any plan !"
      );
    }
    return Response.success(
      res,
      existingUserPlans,
      200,
      "User has valid plan !"
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

module.exports = {
  addEmployeePlan,
  getAllCorporateEmployeePlansToShowOnDashboard,
  getSingleCorporateEmployeePlanByEmployeePlanId,
  checkUserHasValidTeleConsultationPlan,
  //   getAllCorporatePlans,
  //   getAllCorporatePlansToShowOnDashboard,
  //   getSingleCorporatePlanByCorporatePlanId,
};
