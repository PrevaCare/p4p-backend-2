const existingPatientEprescriptionModel = require("../../../../../models/patient/existingPatientEprescription/existingPatientEprescription.model.js");
const Response = require("../../../../../utils/Response.js");
const AppConstant = require("../../../../../utils/AppConstant.js");

const {
  existingPatientEprescriptionValidationSchema,
} = require("../../../../../validators/existingPatientEprescription/existingPatientEprescription.validator.js");
const {
  uploadToS3,
} = require("../../../../../middlewares/uploads/awsConfig.js");
const eprescriptionModel = require("../../../../../models/patient/eprescription/eprescription.model.js");

// create
const createExistingPatientEPrescription = async (req, res) => {
  try {
    const { _id, role } = req.user;
    if (!_id) {
      return Response.error(res, 400, AppConstant.FAILED, "User is required !");
    }
    if (role !== "Employee" || role !== "IndividualUser") {
      return Response.error(res, 400, AppConstant.FAILED, "not a valid user !");
    }
    // validation check
    const { error } = existingPatientEprescriptionValidationSchema.validate(
      req.body
    );
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation failed !"
      );
    }

    // upload file to s3
    if (!req.files || !req.files.eprescriptionFile) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "eprescriptionFile is required !"
      );
    }
    const eprescriptionFile = req.files.eprescriptionFile[0];

    const uploadedEprescriptionFile = await uploadToS3(eprescriptionFile);

    // create new
    const newExistingPatientEprescription =
      new existingPatientEprescriptionModel({
        user: _id,
        existingEPrescriptionFile: uploadedEprescriptionFile?.Location,
        ...req.body,
      });
    const savedExistingPatientEprescription =
      await newExistingPatientEprescription.save();

    return Response.success(
      res,
      savedExistingPatientEprescription,
      201,
      "patient E-Prescription uploaded  successfully !"
    );
  } catch (err) {
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
      err.message || "Internal Server error !"
    );
  }
};

// get eprescription - our system + existing both
const getListOfExistingPatientEprescription = async (req, res) => {
  try {
    const { _id, role } = req.user;
    if (!_id) {
      return Response.error(res, 404, AppConstant.FAILED, "User is required !");
    }
    if (!["Employee", "IndividualUser"].includes(role)) {
      return Response.error(res, 400, AppConstant.FAILED, "not a valid user !");
    }
    // find emr form our system
    const userEPrescriptionOurSystem = await eprescriptionModel.find(
      { user: _id },
      "_id createdAt doctor link"
    );

    const userEPrescriptionOurSystemRequiredFieldOnly =
      userEPrescriptionOurSystem
        ? userEPrescriptionOurSystem.map((item) => {
            const validItems = {
              _id: item._id,
              date: item.createdAt,
              doctorName: item?.doctor.firstName + " " + item?.doctor.lastName,
              speciality: item?.doctor.specialization,
              ePrescriptionFileUrl: item.link,
              documentType: "E-Prescription",
              hospitalName: "Preva Care",
            };
            return validItems;
          })
        : [];

    // find all existing emr from other system --> ExistingPatientEMR
    const existingPatientEPrescriptions =
      await existingPatientEprescriptionModel.find(
        { user: _id },
        "createdAt date doctorName doctorSpeciality hospitalName documentType existingEPrescriptionFile"
      );

    let userEmrOtherSystemRequiredFieldOnly = existingPatientEPrescriptions
      ? existingPatientEPrescriptions.map((item) => {
          const validItems = {
            _id: item._id,
            date: item.date || item.createdAt,
            doctorName: item.doctorName,
            speciality: item.doctorSpeciality,
            ePrescriptionFileUrl: item.existingEPrescriptionFile,
            documentType: item.documentType,
            hospitalName: item.hospitalName,
          };
          return validItems;
        })
      : [];

    const totalResponseEmr = [
      ...userEPrescriptionOurSystemRequiredFieldOnly,
      ...userEmrOtherSystemRequiredFieldOnly,
    ];

    return Response.success(
      res,
      totalResponseEmr,
      200,
      "Total e-prescription found !"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal Server error !"
    );
  }
};

module.exports = {
  createExistingPatientEPrescription,
  getListOfExistingPatientEprescription,
};
