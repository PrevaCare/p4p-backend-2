const Employee = require("../../../../models/patient/employee/employee.model.js");
const User = require("../../../../models/common/user.model.js");
const Response = require("../../../../utils/Response.js");
const {
  convertToDDMMMYYYY,
} = require("../../../../utils/dateFormat/dateFormat.utils.js");
const AppConstant = require("../../../../utils/AppConstant.js");
const EMR = require("../../../../models/common/emr.model.js");
const Insurance = require("../../../../models/patient/insurance/insurance.model.js");
const mongoose = require("mongoose");
const healthScoreModel = require("../../../../models/patient/healthScore/healthScore.model.js");
const Corporate = require("../../../../models/corporates/corporate.model.js");
const userModel = require("../../../../models/common/user.model.js");
const emrModel = require("../../../../models/common/emr.model.js");
const GlobalSetting = require("../../../../models/settings/globalSetting.model.js");

const getAllCorporateEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search?.trim() || "";
    const skip = (page - 1) * limit;

    const { _id, role } = req.user;
    const { corporateid } = req.query;

    let corporateEmployees;

    let searchQuery = {};

    if (search) {
      searchQuery = {
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { "address.city": { $regex: search, $options: "i" } }
        ]
      };
    }

    if (role === "Doctor") {
      corporateEmployees = await Employee.find(
        {
          assignedDoctors: _id,
          ...searchQuery
        },
        "profileImg firstName lastName department address jobProfile gender phone"
      )
        .skip(skip)
        .limit(limit)
        .populate({ path: "corporate", select: "companyName" });
    } else if (role === "Corporate") {
      corporateEmployees = await Employee.find(
        { corporate: _id, ...searchQuery },
        "profileImg firstName lastName department address jobProfile gender phone"
      )
        .skip(skip)
        .limit(limit)
        .populate({ path: "corporate", select: "companyName" });
    } else if (role === "Superadmin" && corporateid) {
      corporateEmployees = await Employee.find(
        { corporate: corporateid, ...searchQuery },
        "profileImg firstName lastName department address jobProfile assignedDoctors phone"
      )
        .skip(skip)
        .limit(limit)
        .populate({ path: "corporate", select: "companyName" })
        .populate({
          path: "assignedDoctors",
          select: "firstName lastName",
        });
    } else {
      corporateEmployees = await Employee.find(
        { ...searchQuery },
        "profileImg firstName lastName department address jobProfile assignedDoctors phone"
      )
        .skip(skip)
        .limit(limit)
        .populate({ path: "corporate", select: "companyName" })
        .populate({
          path: "assignedDoctors",
          select: "firstName lastName",
        });
    }

    if (!corporateEmployees) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Corporate Employees not found !"
      );
    }

    // Adding EMR status and health score
    const corporateEmployeesWithEmrStatus = await Promise.all(
      corporateEmployees.map(async (employee) => {
        const emrStatus = await EMR.findOne({ user: employee._id });
        const healthScoreDoc = await healthScoreModel
          .findOne({ user: employee._id })
          .select("overallHealthScore -_id");
        const healthScore = healthScoreDoc
          ? healthScoreDoc.overallHealthScore
          : null;
        return {
          ...employee.toObject(),
          emrStatus: !!emrStatus,
          healthScore,
        };
      })
    );

    // Get total count of employees for pagination info
    const totalEmployeesCount = await Employee.countDocuments(
      role === "Doctor"
        ? { assignedDoctors: _id, ...searchQuery }
        : role === "Corporate"
        ? { corporate: _id, ...searchQuery }
        : role === "Superadmin" && corporateid
        ? { corporate: corporateid, ...searchQuery }
        : { ...searchQuery }
    );

    const pagination = {
      total: totalEmployeesCount,
      totalPages: Math.ceil(totalEmployeesCount / limit),
      page: page,
      limit: limit,
    };

    return Response.success(
      res,
      {
        data: corporateEmployeesWithEmrStatus,
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

const getAllCorporateEmployeesOfParticularCorporateById = async (req, res) => {
  try {
    const { corporateId } = req.body;
    // console.log(corporateId);

    const corporateEmployees = await Employee.find({
      corporate: corporateId,
    }).select("firstName lastName");
    // .select(
    //   "-profileImg -department -address -jobProfile -assignedDoctors -phone"
    // );
    // firstName lastName
    // console.log(corporateEmployees);

    if (!corporateEmployees) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Corporate Employees not found !"
      );
    }

    return Response.success(
      res,
      corporateEmployees,
      200,
      "all employees of particular corporate  found !"
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

// get employee for emr page app
// const getEmployeeForEMRPageApp = async (req, res) => {
//   try {
//     const { _id } = req.user;
//     // const doctorId = _id;
//     // const demo = await Employee.find({});
//     // console.log(demo);
//     const employeeForEMRPage = await Employee.findOne(
//       { _id },
//       "profileImg firstName lastName gender age"
//     );

//     if (!employeeForEMRPage) {
//       return Response.error(
//         res,
//         404,
//         AppConstant.FAILED,
//         "Corporate Employees not found !"
//       );
//     }

//     // emr = blood and conditions
//     const latestEmr = await EMR.findOne({ user: _id }).sort({createdAt: -1});
//     const { bloodGroup } = lastEMRData.basicInfo;
//     const { sufferingFrom } = lastEMRData.history;
//     const { diagonosisName } = lastEMRData.diagonosis;

//     // find insurance
//     const employeeExistingInsurance = await Insurance.findOne({ user: _id });
//     if (employeeExistingInsurance) {
//       var { insuranceName, insuranceFile } = employeeExistingInsurance._doc;
//     }

//     return Response.success(
//       res,
//       {
//         ...employeeForEMRPage.toObject(),
//         bloodGroup,
//         condition: {
//           sufferingFrom,
//           diagonosisName: diagonosisName ? diagonosisName : null,
//         },
//         insuranceName,
//         insuranceFile,
//         allergies: null,
//       },
//       200,
//       AppConstant.SUCCESS,
//       "Total EMR of an employee found !"
//     );
//   } catch (err) {
//     return Response.error(
//       res,
//       500,
//       AppConstant.FAILED,
//       err.message || "Internal server error !"
//     );
//   }
// };

const getFormattedConsultationMode = (consultationMode) => {
  switch (consultationMode) {
    case "on site":
      return "On Site";
    case "online":
      return "Tele Consultation";
    case "home":
      return "At Home";
    default:
      return "";
  }
};

const getEmployeeEmrs = async (req, res) => {
  try {
    const { _id } = req.user;

    // Get page and limit from query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const emrs = await emrModel.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(_id),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "doctor",
          foreignField: "_id",
          as: "doctorDetails",
        },
      },
      {
        $unwind: {
          path: "$doctorDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                link: 1,
                doctor: "$doctorDetails",
                history: 1,
                consultationMode: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },
    ]);

    
    // Extract metadata and data
    const totalCount = emrs?.[0]?.metadata[0]?.total || 0;
    const paginatedEmrs = emrs?.[0]?.data || [];
    
    // Format the data
    const formattedEmrs = paginatedEmrs?.map((emr) => {
      return {
        emrDocumentLink: emr.link || "",
        consultationMode: getFormattedConsultationMode(emr.consultationMode),
        chiefComplaint: emr?.history?.chiefComplaint || 
          emr?.history?.complaints?.map(complaint => complaint?.chiefComplaint).join(", ") || "",
        date: convertToDDMMMYYYY(emr.createdAt),
        doctorDetails: {
          name: `${emr.doctor?.firstName} ${emr.doctor?.lastName}`,
          specialization: emr.doctor?.specialization,
          gender: emr.doctor?.gender,
        },
      };
    });

    const pagination = {
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      pageSize: limit,
    };

    return Response.success(
      res,
      {
        emrs: formattedEmrs,
        pagination,
      },
      200,
      AppConstant.SUCCESS,
      "Total EMR of an employee found !"
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

// get list of assigned doctors
const getListOfAssignedDoctorsOfEmployee = async (req, res) => {
  try {
    const { userId } = req.body;
    const getAssignedDoctorsList = await User.findById(userId).populate({
      path: "assignedDoctors",
      select: "_id firstName lastName profileImg education",
    });
    // console.log(userId);
    // console.log(getAssignedDoctorsList);
    if (!getAssignedDoctorsList) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "No Doctor assigned to this employee !"
      );
    }

    //
    const responseData = getAssignedDoctorsList.assignedDoctors.map(
      (doctor) => {
        const { _id, firstName, lastName, profileImg, education } = doctor;
        console.log("Doctor object:", doctor);
        return {
          _id,
          doctorName: `${firstName} ${lastName}`,
          profileImg,
          education,
        };
      }
    );

    return Response.success(
      res,
      responseData,
      200,
      AppConstant.SUCCESS,
      "list of all assigned doctors found successfully !"
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

const getListOfAssignedDoctorsOfCorporateForDashboard = async (req, res) => {
  try {
    const { userId } = req.body;
    const getAssignedDoctorsList = await User.findById(userId).populate({
      path: "assignedDoctors",
      select: "_id firstName lastName profileImg education specialization",
    });
    // console.log(userId);
    // console.log(getAssignedDoctorsList);
    if (!getAssignedDoctorsList) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "No Doctor assigned to this employee !"
      );
    }

    //
    const responseData = getAssignedDoctorsList.assignedDoctors.map(
      (doctor) => {
        const {
          _id,
          firstName,
          lastName,
          profileImg,
          education,
          specialization,
        } = doctor;
        console.log("Doctor object:", doctor);
        return {
          _id,
          doctorName: `${firstName} ${lastName}`,
          profileImg,
          education,
          specialization,
        };
      }
    );

    return Response.success(
      res,
      responseData,
      200,
      AppConstant.SUCCESS,
      "list of all assigned doctors found successfully !"
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
const getListOfAssignedDoctorsOfCorporate = async (req, res) => {
  try {
    const { corporateId } = req.body;
    const existingUser = await Corporate.findById(corporateId).populate({
      path: "assignedDoctors",
      select: "_id firstName lastName profileImg education specialization",
    });

    // const getAssignedDoctorsList = await User.findById(
    //   existingUser.corporate
    // ).populate({
    //   path: "assignedDoctors",
    //   select: "_id firstName lastName profileImg education specialization",
    // });
    // console.log(userId);
    // console.log(getAssignedDoctorsList);
    if (!existingUser) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "No Doctor assigned to this corporate !"
      );
    }

    //
    const responseData = existingUser.assignedDoctors.map((doctor) => {
      const { _id, firstName, lastName } = doctor;
      console.log("Doctor object:", doctor);
      return { _id, doctorName: `${firstName} ${lastName}` };
    });

    return Response.success(
      res,
      responseData,
      200,
      AppConstant.SUCCESS,
      "list of all assigned doctors found successfully !"
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
const getListOfAssignedDoctorByPatientId = async (req, res) => {
  try {
    const { patientId } = req.body;

    // Find a single user
    const existingUser = await User.findOne({
      _id: patientId,
      $or: [{ role: "Employee" }, { role: "IndividualUser" }],
    }).populate({
      path: "assignedDoctors",
      select:
        "_id firstName lastName profileImg education specialization noOfYearExperience",
    });

    // Check if the user exists
    if (!existingUser) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "User not found or invalid role!"
      );
    }

    // Prepare assigned doctor list
    const assignedDoctors = existingUser.assignedDoctors || [];

    const globalSettings = await GlobalSetting.findOne().select("consultationFee corporateDiscount individualUserDiscount")
    
    const responseData = assignedDoctors.map((doctor) => {
      const {
        _id,
        firstName,
        lastName,
        education,
        profileImg,
        noOfYearExperience,
        specialization,
        role,
      } = doctor;

      // Extract courses and degrees if education exists
      const courseList = Array.isArray(education)
        ? education.map((item) => item.course || null)
        : [];
      const degreeList = Array.isArray(education)
        ? education.map((item) => item.degree || null)
        : [];

      const discount = existingUser.role === "Employee" ? globalSettings.corporateDiscount : globalSettings.individualUserDiscount

      return {
        _id,
        profileImg: profileImg !== "null" ? profileImg : null,
        firstName,
        lastName,
        course: courseList,
        degree: degreeList,
        noOfYearExperience: noOfYearExperience || null,
        specialization: specialization || null,
        role: role || null,
        consultationFee: globalSettings.consultationFee,
        sellingPrice: globalSettings.consultationFee - (discount.type === "percentage" ? ((globalSettings.consultationFee * discount.value)/100) : discount.value),
        remainingConsultationsAvailable: 0,
        discount
      };
    });

    return Response.success(
      res,
      responseData,
      200,
      AppConstant.SUCCESS,
      "Assigned doctor list fetched successfully!"
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

// get coroprate info by employeeId
const getCorrporateInfoByEmployeeId = async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "employeeId is missing!"
      );
    }

    const existingEmployee = await Employee.findById(employeeId).populate({
      path: "corporate",
      select: "email phone companyName logo",
      populate: {
        path: "addresses",
        select: "name street phoneNumber city state zipCode landmark", // Select fields from addresses
      },
    });

    if (!existingEmployee) {
      return Response.error(res, 404, AppConstant.FAILED, "patient not found!");
    }

    const responseData = {
      email: existingEmployee.corporate.email,
      phone: existingEmployee.corporate.phone,
      companyName: existingEmployee.corporate.companyName,
      logo: existingEmployee.corporate?.logo
        ? existingEmployee.corporate?.logo
        : null,
      addresses:
        existingEmployee?.corporate?.addresses &&
        existingEmployee?.corporate?.addresses.length > 0
          ? existingEmployee?.corporate?.addresses.map((address) => {
              return {
                name: address?.name || null,
                street: address?.street || null,
                phoneNumber: address?.phoneNumber || null,
                city: address?.city || null,
                state: address?.state || null,
                zipCode: address?.zipCode || null,
                landmark: address?.landmark || null,
              };
            })
          : [],
    };

    return Response.success(
      res,
      responseData,
      200,
      AppConstant.SUCCESS,
      "corporate date fetch!"
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

// get emr info of an employee for health score calculation.
const healthScoreCalculationEmrData = async (req, res) => {
  try {
    const { userId } = req.body;
    const existingEmployee = await userModel.findOne({
      $and: [
        { _id: userId },
        { $or: [{ role: "Employee" }, { role: "IndividualUser" }] },
      ],
    });
    if (!existingEmployee) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Employee not found !"
      );
    }
    const mostRecentEmr = await EMR.findOne({ user: userId }).sort({
      createdAt: -1,
    });

    // const {BMI, PR, BP, alcohol,smoking, sleep, stressScreening,depressionScreening  } = mostRecentEmr;
    const responseData = {
      BMI: mostRecentEmr.generalPhysicalExamination.BMI,
      PR: mostRecentEmr.generalPhysicalExamination.PR,
      BP: mostRecentEmr.generalPhysicalExamination.BP,
      alcoholIntake: mostRecentEmr.history.habits.alcohol,
      smoking: mostRecentEmr.history.habits.smoking,
      sleep: mostRecentEmr.history.sleep,
      phq9Score: mostRecentEmr.history.depressionScreening.score,
      streesRiskScore: mostRecentEmr.history.stressScreening.score,
      profileImg: existingEmployee.profileImg,
      firstName: existingEmployee.firstName,
      lastName: existingEmployee.lastName,
      gender: existingEmployee.gender,
    };

    return Response.success(
      res,
      responseData,
      200,
      AppConstant.SUCCESS,
      "emr data of an employee !"
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
  getAllCorporateEmployees,
  getEmployeeEmrs,
  getListOfAssignedDoctorsOfEmployee,
  getListOfAssignedDoctorsOfCorporateForDashboard,
  getAllCorporateEmployeesOfParticularCorporateById,
  healthScoreCalculationEmrData,
  getListOfAssignedDoctorsOfCorporate,
  getListOfAssignedDoctorByPatientId,
  getCorrporateInfoByEmployeeId,
};

