const Doctor = require("../../models/doctors/doctor.model.js");
const DoctorCategory = require("../../models/common/doctor.categories.model.js");
const User = require("../../models/common/user.model.js");
const Response = require("../../utils/Response.js");
const AppConstant = require("../../utils/AppConstant.js");
const {
  deleteS3Object,
  handleFileUpload,
  uploadToS3,
} = require("../../middlewares/uploads/awsConfig.js");
const CryptoJS = require("crypto-js");
const userModel = require("../../models/common/user.model.js");
const GlobalSetting = require("../../models/settings/globalSetting.model.js");

// get all corporates --> for admin
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find(
      {},
      "firstName lastName specialization address education gender profileImg"
    );
    if (!doctors) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Doctors not found !"
      );
    }

    return Response.success(
      res,
      doctors,
      200,
      AppConstant.SUCCESS,
      "Doctors Found Successfully!"
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
const getDoctorNameAndIds = async (req, res) => {
  try {
    const doctors = await Doctor.find({}, "firstName lastName _id");
    return Response.success(
      res,
      doctors,
      200,
      AppConstant.SUCCESS,
      "Doctors name and Id fetched!"
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

const getSingleDoctorDetail = async (req, res) => {
  try {
    const { doctorId } = req.body;
    const doctors = await Doctor.findById(doctorId);
    if (!doctors) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Doctors not found !"
      );
    }
    // decrypt password
    const decryptPassword = CryptoJS.AES.decrypt(
      doctors.password,
      process.env.AES_SEC
    ).toString(CryptoJS.enc.Utf8);
    console.log(decryptPassword);

    return Response.success(
      res,
      { ...doctors.toObject(), password: decryptPassword },
      200,
      AppConstant.SUCCESS,
      "Doctor Found Successfully!"
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

const getCategoryOfDoctor = async (req, res) => {
  try {
    const categories = await DoctorCategory.aggregate([
      { $match: { isActive: true } },
      { $sort: { displayOrder: 1 } },
      {
        $lookup: {
          from: "users",
          let: { categoryName: "$name" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$role", "Doctor"] },
                    {
                      $regexMatch: {
                        input: "$specialization",
                        regex: "$$categoryName",
                        options: "i"
                      }
                    }
                  ]
                }
              }
            }
          ],
          as: "doctors"
        }
      },
      {
        $match: {
          "doctors.0": { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          names: { $push: "$name" }
        }
      },
      {
        $project: {
          _id: 0,
          names: 1
        }
      }
    ]);

    if (!categories || categories.length === 0) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "No category found !"
      );
    }

    const categoryNames = categories[0]?.names || []

    return Response.success(
      res,
      { categories: categoryNames },
      200,
      AppConstant.SUCCESS,
      "Categories Found Successfully!"
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

const getDoctorByCategory = async (req, res) => {
  try {
    const { category } = req.body;
    const doctors = await User.find({
      specialization: category,
      role: "Doctor",
    }).select("firstName lastName bio profileImg education noOfYearExperience specialization _id")
    .lean();

    if (!doctors) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "No doctors found for this category !"
      );
    }

    const globalSettings = await GlobalSetting.findOne().select("consultationFee corporateDiscount individualUserDiscount")

    const formattedDoctors = doctors.map(d => {
      // Extract courses and degrees if education exists
      const courseList = Array.isArray(d.education)
        ? d.education.map((item) => item.course || null)
        : [];
      const degreeList = Array.isArray(d.education)
        ? d.education.map((item) => item.degree || null)
        : [];

      const discount = req.user?.role === "Employee" ? globalSettings.corporateDiscount : globalSettings.individualUserDiscount
      const {education, ...rest} = d
      return {
        ...rest,
        course: courseList,
        degree: degreeList,
        consultationFee: globalSettings.consultationFee,
        sellingPrice: globalSettings.consultationFee - (discount.type === "percentage" ? ((globalSettings.consultationFee * discount.value)/100) : discount.value),
        remainingConsultationsAvailable: 0,
        discount
      }
    })

    return Response.success(
      res,
      { doctorsTotal: formattedDoctors.length, doctors: formattedDoctors },
      200,
      AppConstant.SUCCESS,
      "Doctors Found Successfully!"
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
// delete doctor by id
const deleteDoctorById = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "doctorId is missing !"
      );
    }
    // console.log(doctorId);
    // return;
    const deletedDoctor = await Doctor.findByIdAndDelete(doctorId);
    // delete profile img if exist
    // if (deletedDoctor.profileImg) {
    //   deleteS3Object(deletedDoctor.profileImg);
    // }
    // // delete eSign img if exist

    // if (deletedDoctor.eSign) {
    //   deleteS3Object(deletedDoctor.eSign);
    // }
    // // delete medicalRegistrationProof img if exist

    // if (deletedDoctor.medicalRegistrationProof) {
    //   deleteS3Object(deletedDoctor.medicalRegistrationProof);
    // }
    // // delete medicalDegreeProof img if exist

    // if (deletedDoctor.medicalDegreeProof) {
    //   deleteS3Object(deletedDoctor.medicalDegreeProof);
    // }

    // return Response.success(res, deletedDoctor, 200, AppConstant.SUCCESS);
    return Response.success(
      res,
      deletedDoctor,
      200,
      AppConstant.SUCCESS,
      "Doctor Deleted Successfully!"
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
const updateDoctorById = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "doctorId is missing !"
      );
    }

    // Check if phone or email already exists for another user
    const existingUser = await userModel.findOne({
      $and: [
        { _id: { $ne: doctorId } }, // Exclude the current doctorId
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
    //
    let profileImg =
      req.files &&
      req.files.profileImg &&
      req.files.profileImg.length > 0 &&
      req.files.profileImg[0];
    let eSign =
      req.files &&
      req.files.eSign &&
      req.files.eSign.length > 0 &&
      req.files.eSign[0];
    let medicalRegistrationProof =
      req.files &&
      req.files.medicalRegistrationProof &&
      req.files.medicalRegistrationProof.length > 0 &&
      req.files.medicalRegistrationProof[0];

    let medicalDegreeProof =
      req.files &&
      req.files.medicalDegreeProof &&
      req.files.medicalDegreeProof.length > 0 &&
      req.files.medicalDegreeProof[0];

    let dataToUpdate = req.body;

    // console.log(profileImg);
    // console.log(medicalRegistrationProof);
    // console.log(medicalDegreeProof);
    // console.log(dataToUpdate);
    // console.log(req.body.firstName);

    // return;

    // update profile img and delete at the same time
    if (profileImg) {
      // console.log(profileImg);
      if (dataToUpdate.profileImg) {
        // deleteS3Object(dataToUpdate.profileImg);
      }
      dataToUpdate.profileImg = (await uploadToS3(profileImg)).Location;
    }
    // update eSign img and delete at the same time
    if (eSign) {
      // console.log(eSign);

      if (dataToUpdate.eSign) {
        // deleteS3Object(dataToUpdate.eSign);
      }
      dataToUpdate.eSign = (await uploadToS3(eSign)).Location;
    }
    // update medicalRegistrationProof img and delete at the same time
    if (medicalRegistrationProof) {
      if (dataToUpdate.medicalRegistrationProof) {
        // deleteS3Object(dataToUpdate.medicalRegistrationProof);
      }
      dataToUpdate.medicalRegistrationProof = (
        await uploadToS3(medicalRegistrationProof)
      ).Location;
    }
    // update medicalRegistrationProof img and delete at the same time
    if (medicalDegreeProof) {
      if (dataToUpdate.medicalDegreeProof) {
        // deleteS3Object(dataToUpdate.medicalDegreeProof);
      }
      dataToUpdate.medicalDegreeProof = (
        await uploadToS3(medicalDegreeProof)
      ).Location;
    }

    // if password then encrypt it first then save
    if (req.body.password) {
      const encryptedPassword = CryptoJS.AES.encrypt(
        req.body.password,
        process.env.AES_SEC
      ).toString();
      dataToUpdate.password = encryptedPassword;
    }
    // finalyy update the doctor
    // console.log(dataToUpdate);
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      { _id: doctorId },
      { $set: dataToUpdate },
      { new: true, runValidators: true }
    );
    // console.log(updatedDoctor);

    // return Response.success(res, updatedDoctor, 200, AppConstant.SUCCESS);
    return Response.success(
      res,
      updatedDoctor,
      200,
      "Doctor Updated Successfully!",
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

module.exports = {
  getAllDoctors,
  getSingleDoctorDetail,
  deleteDoctorById,
  updateDoctorById,
  getDoctorNameAndIds,
  getCategoryOfDoctor,
  getDoctorByCategory,
};
