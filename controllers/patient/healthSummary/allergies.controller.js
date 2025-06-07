const emrModel = require("../../../models/common/emr.model");
const allergyModel = require("../../../models/patient/healthSummary/allergy.model");
const userModel = require("../../../models/common/user.model");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const {
  allergyValidationSchema,
} = require("../../../validators/patient/healthSummary/allergies.validator");
const { uploadToS3 } = require("../../../middlewares/uploads/awsConfig");
const mongoose = require("mongoose");

// add allergy
const addAllergy = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { error } = allergyValidationSchema.validate(req.body);

    const allergiFile = req.file;

    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation error !"
      );
    }

    const {
      userId,
      allergyName,
      pastAllergyDrugName,
      pastAllergyFreequency,
      advisedBy,
      advise,
      adviseAllergyDrugName,
      adviseAllergyFreequency,
    } = req.body;

    // check if user exist and emr exist of that uesr else return error
    const existingUser = await userModel
      .findOne({ _id: userId })
      .session(session);
    if (!existingUser) {
      return Response.error(res, 404, AppConstant.FAILED, "user not found !");
    }

    // check emr
    // const latestEmr = await emrModel
    //   .findOne({ user: existingUser._id })
    //   .sort({ createdAt: -1 })
    //   .session(session);

    // if (!latestEmr) {
    //   return Response.error(res, 404, AppConstant.FAILED, "EMR  not found !");
    // }

    if (
      pastAllergyDrugName &&
      pastAllergyFreequency &&
      pastAllergyDrugName.length !== pastAllergyFreequency.length
    ) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "drug name and freequency should be of same length !"
      );
    }
    if (
      adviseAllergyDrugName &&
      adviseAllergyFreequency &&
      adviseAllergyDrugName.length !== adviseAllergyFreequency.length
    ) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "drug name and freequency should be of same length !"
      );
    }

    // const dataToAddInEmr = {
    //   allergyName: allergyName || "",
    //   pastAllergyDrugName: pastAllergyDrugName || [],
    //   pastAllergyFreequency: pastAllergyFreequency || [],
    //   advisedBy: advisedBy || "",
    //   advise: advise || "",
    //   adviseAllergyDrugName: adviseAllergyDrugName || [],
    //   adviseAllergyFreequency: adviseAllergyFreequency || [],
    // };
    // latestEmr.history.allergies.push(dataToAddInEmr);
    // latestEmr.save({ session });

    let uploadedAllergyFileUrl = allergiFile
      ? (await uploadToS3(allergiFile)).Location
      : null;

    const dataToSendAllergyTable = {
      ...dataToAddInEmr,
      userId: existingUser._id,
      allergyFileUrl: uploadedAllergyFileUrl,
    };

    const newAllergy = new allergyModel(dataToSendAllergyTable);

    const savedAllergy = await newAllergy.save({ session });

    await session.commitTransaction();

    return Response.success(res, savedAllergy, 201, "allergies created !");

    // const newAller
  } catch (err) {
    await session.abortTransaction();
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal Server error !"
    );
  } finally {
    session.endSession();
  }
};

// get allergies from the latest emr
const getAllergiesFromLatestEmr = async (req, res) => {
  try {
    const { patientId } = req.body;
    const existingUser = await userModel.findOne({ _id: patientId });
    if (!existingUser) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "User does not exist !"
      );
    }

    const latestEmr = await emrModel
      .findOne({ user: existingUser._id })
      .sort({ createdAt: -1 });

    let allergies = await allergyModel.find(
      {
        emrId: latestEmr._id,
      },
      "allergyName pastAllergyDrugName pastAllergyFreequency advisedBy advise adviseAllergyDrugName adviseAllergyFreequency createdAt"
    );

    if (allergies.createdAt < latestEmr.createdAt) {
      const formattedAllergies =
        latestEmr?.history?.allergies?.newAllergyPrescription?.map(
          (allergy) => ({
            allergyName: allergy.allergyName || "",
            pastAllergyDrugName:
              allergy.drugs?.map((drug) => drug.drugName).join(", ") || "",
            pastAllergyFreequency:
              allergy.drugs?.map((drug) => drug.frequency).join(", ") || "",
            advisedBy: allergy.pastAllergyPrescriptionBy || "",
            advise: allergy.pastAllergyNotes || "",
            adviseAllergyDrugName:
              allergy.drugs?.map((drug) => drug.drugName).join(", ") || "",
            adviseAllergyFreequency:
              allergy.drugs?.map((drug) => drug.frequency).join(", ") || "",
            createdAt: latestEmr.createdAt,
          })
        ) || [];

      allergies = formattedAllergies;
    }
    return Response.success(res, allergies, 200, "allergies fetched !");
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal Server error !"
    );
  }
};

module.exports = { getAllergiesFromLatestEmr, addAllergy };
