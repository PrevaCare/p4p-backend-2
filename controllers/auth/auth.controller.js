const User = require("../../models/common/user.model.js");
const Superadmin = require("../../models/superadmin.model.js");
const Corporate = require("../../models/corporates/corporate.model.js");
const EMR = require("../../models/common/emr.model.js");
// const CorporateAddress = require("../models/corporates/corporateAddress.model.js");
// common address
const Address = require("../../models/common/address.model.js");

const {
  adminRegisterSchema,
  corporateRegisterSchema,
  loginSchema,
  appLoginSchema,
  DoctorRegistrationSchema,
  schoolRegisterSchema,
  instituteRegisterSchema,
  employeeRegisterSchema,
} = require("../../validators/user/register.validator.js");
const CryptoJS = require("crypto-js");
const {
  generateToken,
  generateRefreshToken,
  generateResetToken,
  generateRefreshAcessToken,
} = require("../../middlewares/jwt/generateToken.js");
const { uploadToS3 } = require("../../middlewares/uploads/awsConfig.js");
const {
  sendNotification,
} = require("../../middlewares/nodemailer/sendMail.js");
const Response = require("../../utils/Response.js");
const AppConstant = require("../../utils/AppConstant.js");
const jwt = require("jsonwebtoken");
const Doctor = require("../../models/doctors/doctor.model.js");
const School = require("../../models/schools/school.model.js");
const Institute = require("../../models/institute/institute.model.js");
const Employee = require("../../models/patient/employee/employee.model.js");
const IndividualUser = require("../../models/individualUser/induvidualUser.model.js");
const otpModel = require("../../models/otp.model.js");
const { generateOtp } = require("../../utils/otpGenerator.js");
const { sendOtp } = require("../../helper/otp/sentOtp.helper.js");
// register super admin
const register = async (req, res) => {
  try {
    // const { error } = registerSchema.validate(req.body);
    // if (error) {
    //   return Response.error(
    //     res,
    //     400,
    //     AppConstant.FAILED,
    //     error.message || "validation failed !"
    //   );
    // }
    // console.log("ok");
    // return;
    const { phone, email, password, role, addresses, ...otherFields } =
      req.body;
    // console.log("register: " + role);

    const existingSuperAdmin = await User.findOne({
      $or: [{ email: email }, { phone: phone }],
    });
    if (existingSuperAdmin) {
      return Response.error(
        res,
        409,
        AppConstant.FAILED,
        "User already exist with this email or phone !"
      );
    }

    // const password = req.body.password;

    const encryptedPassword = CryptoJS.AES.encrypt(
      password,
      process.env.AES_SEC
    ).toString();
    let uploadedLogo, user;
    let logo;
    let profileImg;
    let uploadedProfileImg;

    // employee
    let uploadedUltraSound;
    let uploadedtrimesterScreening;
    let uploadedotherReport;

    const addressIds = [];
    switch (role) {
      case "Superadmin":
        const requestedUser = req.user.role;
        if (requestedUser !== "Superadmin") {
          return Response.error(
            res,
            400,
            AppConstant.FAILED,
            "You are not allowed to perform this operation"
          );
        }
        const { error: adminValidationError } = adminRegisterSchema.validate(
          req.body
        );
        if (adminValidationError) {
          return Response.error(
            res,
            400,
            AppConstant.FAILED,
            adminValidationError.message || "validation failed !"
          );
        }

        user = new Superadmin({
          phone,
          email,
          password: encryptedPassword,
          role,
          ...otherFields,
        });
        break;

      case "Corporate":
        logo = req.files.logo[0];
        // console.log(logo);
        // return;
        if (!logo) {
          return Response.error(
            res,
            404,
            AppConstant.FAILED,
            "logo is required !"
          );
        }
        const { error: corporateRegisterValidationError } =
          corporateRegisterSchema.validate(req.body);
        if (corporateRegisterValidationError) {
          return Response.error(
            res,
            400,
            AppConstant.FAILED,
            corporateRegisterValidationError.message || "validation failed !"
          );
        }

        // const addressIds = [];
        for (const address of addresses) {
          const newAddress = new Address(address);
          const savedAddress = await newAddress.save();
          addressIds.push(savedAddress._id);
        }
        uploadedLogo = await uploadToS3(logo);
        if (!uploadedLogo) {
          return Response.error(
            res,
            404,
            AppConstant.FAILED,
            "logo not uploaded to aws is required !"
          );
        }
        user = new Corporate({
          phone,
          email,
          password: encryptedPassword,
          role,
          addresses: addressIds,
          logo: uploadedLogo.Location,
          ...otherFields,
        });
        break;
      case "School":
        logo = req.files.logo[0];
        if (!logo) {
          return Response.error(
            res,
            404,
            AppConstant.FAILED,
            "logo is required !"
          );
        }
        const { error: schoolRegisterValidationError } =
          schoolRegisterSchema.validate(req.body);
        if (schoolRegisterValidationError) {
          return Response.error(
            res,
            400,
            AppConstant.FAILED,
            schoolRegisterValidationError.message || "validation failed !"
          );
        }

        // const addressIds = [];
        for (const address of addresses) {
          const newAddress = new Address(address);
          const savedAddress = await newAddress.save();
          addressIds.push(savedAddress._id);
        }
        uploadedLogo = await uploadToS3(logo);
        if (!uploadedLogo) {
          return Response.error(
            res,
            404,
            AppConstant.FAILED,
            "logo not uploaded to aws is required !"
          );
        }
        user = new School({
          phone,
          email,
          password: encryptedPassword,
          role,
          addresses: addressIds,
          logo: uploadedLogo.Location,
          ...otherFields,
        });
        break;
      case "Institute":
        logo = req.files.logo[0];
        if (!logo) {
          return Response.error(
            res,
            404,
            AppConstant.FAILED,
            "logo is required !"
          );
        }
        const { error: instituteRegisterValidationError } =
          instituteRegisterSchema.validate(req.body);
        if (instituteRegisterValidationError) {
          return Response.error(
            res,
            400,
            AppConstant.FAILED,
            instituteRegisterValidationError.message || "validation failed !"
          );
        }

        // const addressIds = [];
        for (const address of addresses) {
          const newAddress = new Address(address);
          const savedAddress = await newAddress.save();
          addressIds.push(savedAddress._id);
        }
        uploadedLogo = await uploadToS3(logo);
        if (!uploadedLogo) {
          return Response.error(
            res,
            404,
            AppConstant.FAILED,
            "logo not uploaded to aws is required !"
          );
        }
        user = new Institute({
          phone,
          email,
          password: encryptedPassword,
          role,
          addresses: addressIds,
          logo: uploadedLogo.Location,
          ...otherFields,
        });
        break;

      case "Doctor":
        // console.log("doctor");
        let medicalRegistrationProof = null;
        let medicalDegreeProof = null;
        let eSign = null;

        // Check if the files exist and assign them accordingly
        // Helper function to safely retrieve the first file
        const getFile = (files, field) =>
          files && files[field] && files[field].length > 0
            ? files[field][0]
            : null;

        // Assign files if they exist
        profileImg = getFile(req.files, "profileImg");
        eSign = getFile(req.files, "eSign");

        medicalRegistrationProof = getFile(
          req.files,
          "medicalRegistrationProof"
        );
        medicalDegreeProof = getFile(req.files, "medicalDegreeProof");

        // validation error check
        const { error: doctorRegisterValidationError } =
          DoctorRegistrationSchema.validate(req.body);
        if (doctorRegisterValidationError) {
          return Response.error(
            res,
            400,
            AppConstant.FAILED,
            doctorRegisterValidationError.message || "validation failed !"
          );
        }

        uploadedProfileImg = profileImg
          ? (await uploadToS3(profileImg)).Location
          : null;
        const uploadedEsign = eSign ? (await uploadToS3(eSign)).Location : null;
        const uploadedMedicalRegistrationProof = medicalRegistrationProof
          ? (await uploadToS3(medicalRegistrationProof)).Location
          : null;
        const uploadedmedicalDegreeProof = medicalDegreeProof
          ? (await uploadToS3(medicalDegreeProof)).Location
          : null;

        const parsedPreviousWorkExperience =
          req.body.previousWorkExperience.map((exp) => ({
            ...exp,
            startAt: new Date(exp.startAt), // Convert startAt string to Date
            endAt: exp.endAt ? new Date(exp.endAt) : null, // Convert endAt string to Date if provided
          }));

        const parsedEducation = req.body.education.map((edu) => ({
          ...edu,
          startAt: new Date(edu.startAt), // Convert startAt string to Date
          endAt: edu.endAt ? new Date(edu.endAt) : null, // Convert endAt string to Date if provided
        }));
        // try {
        user = new Doctor({
          profileImg: uploadedProfileImg,
          eSign: uploadedEsign,
          phone,
          email,
          password: encryptedPassword,
          role,
          medicalRegistrationProof: uploadedMedicalRegistrationProof,
          medicalDegreeProof: uploadedmedicalDegreeProof,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          gender: req.body.gender,
          address: req.body.address,
          noOfYearExperience: req.body.noOfYearExperience,
          // Add other fields explicitly here as per DoctorSchema
          specialization: req.body.specialization,
          consultationFees: +req.body.consultationFees,
          availableDays: req.body.availableDays,
          medicalRegistrationNumber: req.body.medicalRegistrationNumber || null,
          consultationInterestedIn: req.body.consultationInterestedIn,
          offlineConsultationAddress: req.body.offlineConsultationAddress,
          previousWorkExperience: parsedPreviousWorkExperience,
          education: parsedEducation,
        });
        // console.log(role);
        break;

      // patient - corporate
      case "Employee":
        profileImg =
          req.files && req.files.profileImg && req.files.profileImg[0];
        // console.log(profileImg);
        // return;

        // if login user is corporate then take corporate id from req.user
        let corporate = null;
        const { _id, role: corporateRole } = req.user;
        if (corporateRole === "Corporate") {
          corporate = _id;
        }
        const { error: employeeRegisterValidationError } =
          employeeRegisterSchema.validate(req.body);
        if (employeeRegisterValidationError) {
          return Response.error(
            res,
            400,
            AppConstant.FAILED,
            employeeRegisterValidationError.message || "validation failed !"
          );
        }
        // let uploadedCurrentReport = [];

        uploadedProfileImg = profileImg
          ? (await uploadToS3(profileImg)).Location
          : null;

        const identifyWhoCreatedRole = req.user.role;
        let assignedDoctors = [];
        if (identifyWhoCreatedRole === "Doctor") {
          assignedDoctors.push(req.user._id);
        } else {
          assignedDoctors = req.body.assignedDoctors;
        }
        user =
          corporateRole === "Corporate"
            ? new Employee({
                profileImg: uploadedProfileImg,
                phone,
                email,
                password: encryptedPassword,
                role,

                assignedDoctors,
                corporate: corporate,
                ...otherFields,
              })
            : new Employee({
                profileImg: uploadedProfileImg,
                phone,
                email,
                password: encryptedPassword,
                role,
                assignedDoctors,
                ...otherFields,
              });
        break;

      case "IndividualUser":
        // console.log("individual user hitted");
        // verify the request source mobile or web
        const clientType = req.headers["x-client-type"];
        if (!clientType || !["web", "mobile"].includes(clientType)) {
          return Response.error(
            res,
            400,
            AppConstant.FAILED,
            "Please provide valid client type !"
          );
        }
        profileImg =
          req.files && req.files.length > 0 && req.files.profileImg[0];

        // if login user is corporate then take corporate id from req.user
        // let corporate = null;
        // const { _id, role: corporateRole } = req.user;

        // const { error: employeeRegisterValidationError } =
        //   employeeRegisterSchema.validate(req.body);
        // if (employeeRegisterValidationError) {
        //   return Response.error(
        //     res,
        //     400,
        //     AppConstant.FAILED,
        //     employeeRegisterValidationError.message || "validation failed !"
        //   );
        // }
        // let uploadedCurrentReport = [];

        uploadedProfileImg = profileImg
          ? (await uploadToS3(profileImg)).Location
          : null;
        // const identifyWhoCreatedRole = req.user.role;
        // let assignedDoctors = [];
        // if (identifyWhoCreatedRole === "Doctor") {
        //   assignedDoctors.push(req.user._id);
        // } else {
        //   assignedDoctors = req.body.assignedDoctors;
        // }

        // check if otp is verified or not
        if (clientType === "mobile") {
          const isExistingOtpVerified = await otpModel.findOne({
            $and: [{ phone }, { isVerified: true }],
          });

          if (!isExistingOtpVerified) {
            return Response.error(
              res,
              400,
              AppConstant.FAILED,
              "Please verify otp first !"
            );
          }
        }

        // generate access and refresh token
        user = new IndividualUser({
          profileImg: uploadedProfileImg,
          phone,
          email,
          password: encryptedPassword,
          role,
          ...otherFields,
        });

        const accessToken = generateToken(user);
        const refreshToken = generateRefreshToken(user);
        user.accessToken.push(accessToken);
        user.refreshToken.push(refreshToken);
        break;

      default:
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "Invalid role specified!"
        );
    }

    // const user = new User({ ...req.body, password: encrypPassword });
    const savedUser = await user.save();

    return Response.success(
      res,
      savedUser,
      201,
      "User registered successfully !"
    );
  } catch (err) {
    // console.log(err);

    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal Server error !"
    );
  }
};

// login --> admin
const login = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation failed"
      );
    }
    const { login } = req.body;
    console.log("Request Body: ", req.body);
    let existingUser;
    if (login.includes("@")) {
      existingUser = await User.findOne({ email: login });
    } else {
      existingUser = await User.findOne({ phone: login });
    }

    if (!existingUser) {
      return Response.error(res, 401, AppConstant.FAILED, "User not found !");
    }
    const encryptedPassword = existingUser.password;

    const decryptPassword = CryptoJS.AES.decrypt(
      encryptedPassword,
      process.env.AES_SEC
    ).toString(CryptoJS.enc.Utf8);
    console.log("decrypted password: ", decryptPassword);
    console.log(" user role: ", existingUser.role);
    console.log(process.env.AES_SEC);

    if (decryptPassword !== req.body.password) {
      return Response.error(
        res,
        401,
        AppConstant.FAILED,
        "Password is wrong !"
      );
    }

    const { password, ...userInfo } = existingUser._doc;

    // accessToken
    const accessToken = generateToken(existingUser);
    const refreshToken = generateRefreshToken(existingUser);
    existingUser.accessToken.push(accessToken);
    existingUser.refreshToken.push(refreshToken);
    await existingUser.save();
    return Response.success(
      res,
      { ...userInfo, accessToken, refreshToken },
      200,
      AppConstant.SUCCESS,
      "User logged in !"
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

// app login -->> check if user exist with no or email and emr exist of that user if yes login (accessToken, refreshToken)
const appLogin = async (req, res) => {
  try {
    const { "x-api-key": apiKey } = req.headers;
    const decodedBase64 = Buffer.from(apiKey, "base64")
      .toString("utf-8")
      .trim();
    const appLoginSecretKey = process.env.APP_LOGIN_KEY;
    // console.log("=" + decodedBase64 + "+");
    // console.log("=" + appLoginSecretKey + "+");
    if (decodedBase64 !== appLoginSecretKey) {
      return Response.error(
        res,
        401,
        AppConstant.FAILED,
        "You are not authenticated !"
      );
    }

    const { error } = appLoginSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation failed"
      );
    }

    const { phone } = req.body;
    // let existingUser = await User.findOne({ phone: login });
    // if (login.includes("@")) {
    //   existingUser = await User.findOne({ email: login });
    // } else {
    //   existingUser = await User.findOne({ phone: login });
    // }

    // create random 6-digit otp and sent using msg 91
    await otpModel.deleteMany({ phone });
    const otp = generateOtp();
    const newOtp = new otpModel({ phone, otp });
    await sendOtp(phone, otp);
    await newOtp.save();
    // if (!existingUser) {
    //   return Response.error(res, 404, AppConstant.FAILED, "User not found !");
    // }
    return Response.success(
      res,
      {
        phone,
        // firstName,
        // lastName,
        // profileImg,
        // phone,
        // gender,
        // role,
        // accessToken,
        // refreshToken,
      },
      200,
      AppConstant.SUCCESS,
      "Otp has been send to your phone !"
    );
  } catch (err) {
    // console.log(err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error !"
    );
  }
};

// verify otp
const verifyOtpAndLogin = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "phone or otp is missing!"
      );
    }

    // compare otp if ok then delete from otp
    const existingOtp = await otpModel.findOne({
      $and: [{ phone }, { otp }],
    });
    if (!existingOtp) {
      return Response.error(res, 404, AppConstant.FAILED, "wrong otp !");
    }
    // await otpModel.deleteMany({ phone });
    existingOtp.isVerified = true;
    await existingOtp.save();
    const existingUser = await User.findOne({ phone });
    // if (!existingUser) {
    //   return Response.error(res, 404, AppConstant.FAILED, "user not found !");
    // }
    // accessToken
    if (existingUser) {
      const accessToken = generateToken(existingUser);
      const refreshToken = generateRefreshToken(existingUser);
      existingUser.accessToken.push(accessToken);
      existingUser.refreshToken.push(refreshToken);
      await existingUser.save();

      const { _id, firstName, lastName, profileImg, gender, role } =
        existingUser._doc;

      return Response.success(
        res,
        {
          _id,
          isUserExist: true,
          firstName,
          lastName,
          profileImg,
          phone,
          gender,
          role,
          accessToken,
          refreshToken,
        },
        200,
        "User logged in successfully !"
      );
    } else {
      return Response.success(
        res,
        {
          isUserExist: false,
        },
        200,
        "User logged in successfully !"
      );
    }
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error !"
    );
  }
};

// logout
const logout = async (req, res) => {
  try {
    const user = req.user;
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return Response.error(res, 404, AppConstant.FAILED, "token not found !");
    }
    const token = authHeader.split(" ")[1];

    const existingUser = await User.findById(user._id);

    existingUser.accessToken = existingUser.accessToken.filter((item) => {
      return item !== token;
    });
    const existinRefreshToken = existingUser.refreshToken.includes(
      req.body.refreshToken
    );
    if (!existinRefreshToken) {
      return Response.error(
        res,
        401,
        AppConstant.FAILED,
        "refresh token not match"
      );
    }
    // remove refreshToken
    existingUser.refreshToken = existingUser.refreshToken.filter((item) => {
      return item !== req.body.refreshToken;
    });

    const savedUser = await existingUser.save();

    return Response.success(
      res,
      savedUser,
      200,
      AppConstant.SUCCESS,
      "User logout successful"
    );
  } catch (error) {
    // console.log(error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      "Internal server error"
    );
  }
};

// refresh accessToken just before expiry --> pre expiry
const refreshAccessToken = async (req, res) => {
  // verify refresh token
  const refreshToken = req.body.refreshToken;
  if (!refreshToken) {
    return Response.error(
      res,
      404,
      AppConstant.FAILED,
      "refreshToken not found !"
    );
  }

  // generate new accessToken
  const newAccessToken = generateRefreshAcessToken(refreshToken);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return Response.error(res, 404, AppConstant.FAILED, "token not found !");
  }
  const token = authHeader.split(" ")[1];
  const user = req.user;
  const existingUser = await User.findById(user._id);
  existingUser.accessToken = existingUser.accessToken.filter((item) => {
    return item !== token;
  });

  existingUser.accessToken.push(newAccessToken);
  const savedUser = await existingUser.save();
  // console.log(savedUser);

  return Response.success(
    res,
    { accessToken: newAccessToken },
    200,
    AppConstant.SUCCESS,
    "new access token generated!"
  );
};

// forgot password
const forgotPassword = async (req, res) => {
  try {
    //
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "user  not found with given email !"
      );
    }

    const resetToken = generateResetToken(user);

    // const resetLink = `http://localhost:8000/v1/admin/update-password/${resetToken}`;
    const resetLink = `http://localhost:5173/admin/reset-password/${resetToken}`;

    // mail
    const text = `Click here to reset your password ${resetLink}`;
    sendNotification(
      process.env.GMAIL_USER,
      user.email,
      "Reset password",
      text
    );

    return Response.success(
      res,
      {},
      200,
      AppConstant.SUCCESS,
      "Reset mail has been sent to your email !"
    );
  } catch (err) {
    // console.log(err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      "Internal server error !"
    );
  }
};

// reset password - update
const updatePassword = async (req, res) => {
  try {
    //
    const { resetToken } = req.params;
    if (!resetToken) {
      return Response.error(
        res,
        401,
        AppConstant.FAILED,
        "reset token not found !"
      );
    }
    const decodedToken = jwt.verify(
      resetToken,
      process.env.JWT_RESET_TOKEN_SEC
    );

    const user = await User.findById(decodedToken._id);
    if (!user) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "user not found with decoded token !"
      );
    }
    // update password
    const { password } = req.body;
    if (!password) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "please send password in the body!"
      );
    }
    user.password = CryptoJS.AES.encrypt(password, process.env.AES_SEC);

    await user.save();

    // Send a notification to the user
    sendNotification(
      process.env.GMAIL_USER,
      user.email,
      "Password updation",
      "Your password has been updated successfully !"
    );
    return Response.success(
      res,
      {},
      200,
      AppConstant.SUCCESS,
      "Password updated successfully !"
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
  register,
  login,
  verifyOtpAndLogin,
  appLogin,
  logout,
  refreshAccessToken,
  forgotPassword,
  updatePassword,
};
