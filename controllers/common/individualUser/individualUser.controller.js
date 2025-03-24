const { uploadToS3 } = require("../../../middlewares/uploads/awsConfig");
const EMR = require("../../../models/common/emr.model");
const userModel = require("../../../models/common/user.model");
const IndividualUser = require("../../../models/individualUser/induvidualUser.model");
const healthScoreModel = require("../../../models/patient/healthScore/healthScore.model");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const {
  individualUserUpdateValidationSchema,
} = require("../../../validators/patient/individualUser/updateIndividualUser.validator");

const updateIndividualUserById = async (req, res) => {
  try {
    const { individualUserId } = req.params;
    if (!individualUserId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "individualUserId  not found !"
      );
    }

    const { error } = individualUserUpdateValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation failed !"
      );
    }

    // Check if phone or email already exists for another user
    const existingUser = await userModel.findOne({
      $and: [
        { _id: { $ne: individualUserId } }, // Exclude the current doctorId
        { $or: [{ phone: req.body.phone }, { email: req.body.email }] }, // Check for existing phone or email
      ],
    });

    if (existingUser) {
      // console.log(existingUser);
      // console.log("req.body");
      // console.log(req.body.phone);
      // console.log(req.body.email);
      return Response.error(
        res,
        409,
        AppConstant.FAILED,
        "user already exists with this phone or email!"
      );
    }

    // let dataToUpdate = req.body;
    let profileImg = "";
    // check if profileImg also in file
    // console.log(req.files);
    if (req.files && req.files.profileImg && req.files.profileImg.length > 0) {
      const profileImage = req.files.profileImg[0];
      const profileImageUploaded = await uploadToS3(profileImage);
      profileImg = profileImageUploaded.Location;
    }

    //
    // console.log(dataToUpdate);
    const updatedIndividualUser = profileImg
      ? await IndividualUser.findByIdAndUpdate(
          individualUserId,
          { $set: { ...req.body, profileImg } },
          { new: true }
        ).select("-accessToken -refreshToken")
      : await IndividualUser.findByIdAndUpdate(
          individualUserId,
          { $set: req.body },
          { new: true }
        ).select("-accessToken -refreshToken");

    return Response.success(
      res,
      updatedIndividualUser,
      200,
      "individual user updated successfully !"
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

module.exports = { updateIndividualUserById };
