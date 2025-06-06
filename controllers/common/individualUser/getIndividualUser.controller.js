const EMR = require("../../../models/common/emr.model");
const IndividualUser = require("../../../models/individualUser/induvidualUser.model");
const healthScoreModel = require("../../../models/patient/healthScore/healthScore.model");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");

const getAllIndividualUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const { _id, role } = req.user;

    let individualUsers;

    if (role === "Doctor") {
      individualUsers = await IndividualUser.find(
        { assignedDoctors: _id },
        "profileImg firstName lastName jobProfile address gender phone"
      )
        .skip(skip)
        .limit(limit);
    } else {
      individualUsers = await IndividualUser.find(
        {},
        "profileImg firstName lastName jobProfile address phone"
      )
        .skip(skip)
        .limit(limit)
        .populate({
          path: "assignedDoctors",
          select: "firstName lastName",
        });
    }

    if (!individualUsers) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Individual users not found !"
      );
    }

    // Adding EMR status and health score
    const individualUsersWithEmrStatus = await Promise.all(
      individualUsers.map(async (individualUser) => {
        const emrStatus = await EMR.findOne({ user: individualUser._id });
        const healthScoreDoc = await healthScoreModel
          .findOne({ user: individualUser._id })
          .select("overallHealthScore -_id");
        const healthScore = healthScoreDoc
          ? healthScoreDoc.overallHealthScore
          : null;
        return {
          ...individualUser.toObject(),
          emrStatus: !!emrStatus,
          healthScore,
        };
      })
    );

    // Get total count of individual users for pagination info
    const totalUsersCount = await IndividualUser.countDocuments();

    const pagination = {
      total: totalUsersCount,
      totalPages: Math.ceil(totalUsersCount / limit),
      page: page,
      limit: limit,
    };

    return Response.success(
      res,
      {
        data: individualUsersWithEmrStatus,
        pagination,
      },
      200,
      AppConstant.SUCCESS
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error !"
    );
  }
};

// individual user detail page
const getSingleIndividualUserById = async (req, res) => {
  try {
    const { individualUserId } = req.body;
    if (!individualUserId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "individual User Id not found !"
      );
    }
    const existingIndividualUser = await IndividualUser.findOne({
      _id: individualUserId,
    })
      .populate({
        path: "assignedDoctors",
        select: "firstName lastName address",
      })
      .select(
        "-password -accessToken -refreshToken -activityLevel -isSmoke -isDrink -sleepHours -cronicDiseases -currentMedication -allergicSubstance"
      );
    // console.log(corporateEmployee);

    if (!existingIndividualUser) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "individual user  not found !"
      );
    }

    return Response.success(
      res,
      existingIndividualUser,
      200,
      AppConstant.SUCCESS
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error !"
    );
  }
};

module.exports = { getAllIndividualUsers, getSingleIndividualUserById };
