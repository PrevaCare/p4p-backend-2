const emrModel = require("../../../models/common/emr.model");
const immunizationModel = require("../../../models/patient/healthSummary/immunization.model");
const userModel = require("../../../models/common/user.model");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const {
  immunizationValidationSchema,
} = require("../../../validators/patient/healthSummary/immunization.validator");
const mongoose = require("mongoose")
const { uploadToS3 } = require("../../../middlewares/uploads/awsConfig");

// create immunization and add to latest emr
const addImmunization = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const immunizationFile = req.file;
    const reconstructedDoseDates = [];

    Object.keys(req.body).forEach((key) => {
      const match = key.match(/^doseDates\[(\d+)\]\.(\w+)$/);
      if (match) {
        const index = parseInt(match[1]);
        const field = match[2];

        if (!reconstructedDoseDates[index]) {
          reconstructedDoseDates[index] = {};
        }
        reconstructedDoseDates[index][field] = req.body[key];
        delete req.body[key];
      }
    });

    if (reconstructedDoseDates.length > 0) {
      req.body.doseDates = reconstructedDoseDates;
    }

    const { error } = immunizationValidationSchema.validate(req.body);

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
      // doctorId,
      // emrId,
      immunizationType,
      vaccinationName,
      totalDose,
      doseDates,
      doctorName,
      sideEffects,
      immunizationNotes,
    } = req.body;

    // check if user exist and emr exist of that uesr else return error
    const existingUser = await userModel
      .findOne({ _id: userId })
      .session(session);
    if (!existingUser) {
      return Response.error(res, 404, AppConstant.FAILED, "user not found !");
    }

    const dataToAddInEmr = {
      immunizationType: immunizationType || "up to date",
      vaccinationName: vaccinationName || "",
      totalDose: totalDose || 0,
      totalDose: totalDose || 0,
      doseDates,
      doctorName: doctorName || "",
      sideEffects: sideEffects || "",
      immunizationNotes: immunizationNotes || "",
    };

    let uploadedImmunizationFileUrl = immunizationFile
      ? (await uploadToS3(immunizationFile)).Location
      : null;

    const dataToSendImmunizationTable = {
      ...dataToAddInEmr,
      userId: existingUser._id,
      immunizationFileUrl: uploadedImmunizationFileUrl,
    };

    const newImmunization = new immunizationModel(dataToSendImmunizationTable);

    const savedImmunization = await newImmunization.save({ session });

    await session.commitTransaction();

    return Response.success(
      res,
      savedImmunization,
      201,
      "immunization created !"
    );

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
const getImmunizationFromLatestEmr = async (req, res) => {
  try {
    const { patientId } = req.body;
    const existingUser = await userModel.findOne({ _id: patientId });
    if (!existingUser) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "patientId is required!"
      );
    }

    const latestEmr = await emrModel
      .findOne({ user: existingUser._id })
      .sort({ createdAt: -1 })
      .lean();

    if (!latestEmr) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "No EMR found for the user!"
      );
    }

    let immunizations = await immunizationModel
      .find(
        { userId: existingUser._id },
        "immunizationType vaccinationName totalDose doseDates doctorName sideEffects immunizationNotes immunizationFileUrl createdAt"
      )
      .populate({ path: "doctorId", select: "firstName lastName" })
      .sort({createdAt: -1 });

    if (!immunizations || immunizations.length === 0 || immunizations?.[0]?.createdAt < latestEmr.createdAt) {
      immunizations = latestEmr.immunization;
    }

    // Always populate doctorName, regardless of immunizationType
    immunizations = immunizations.map((immunization) => {
      if (immunization.doctorId) {
        immunization.doctorName = `${immunization.doctorId.firstName} ${immunization.doctorId.lastName}`;
      } else {
        immunization.doctorName = immunization.doctorName || "N/A";
      }
      const { doctorId, ...rest } = immunization._doc;
      return { ...rest };
    });

    return Response.success(
      res,
      immunizations,
      200,
      "Immunizations fetched successfully!"
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

module.exports = { getImmunizationFromLatestEmr, addImmunization };
