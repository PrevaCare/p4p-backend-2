const EMR = require("../../../models/common/emr.model");
const IndividualUser = require("../../../models/individualUser/induvidualUser.model");
const healthScoreModel = require("../../../models/patient/healthScore/healthScore.model");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");

const getAllIndividualUsers = async (req, res) => {
  try {
    const { _id, role } = req.user;

    const individualUsers =
      role === "Doctor"
        ? await IndividualUser.find(
            { assignedDoctors: _id },
            "profileImg firstName lastName jobProfile address gender phone"
          )
        : await IndividualUser.find(
            {},
            "profileImg firstName lastName jobProfile address phone"
          ).populate({
            path: "assignedDoctors",
            select: "firstName lastName",
          });

    if (!individualUsers) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "individual user not found !"
      );
    }

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

    return Response.success(
      res,
      individualUsersWithEmrStatus,
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
