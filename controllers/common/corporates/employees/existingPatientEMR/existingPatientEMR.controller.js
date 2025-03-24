const ExistingPatientEMR = require("../../../../../models/patient/existingPatientEMR/existingPatientEMR.model.js");
const Response = require("../../../../../utils/Response.js");
const AppConstant = require("../../../../../utils/AppConstant.js");
const {
  createExistingPatientEMRSchema,
} = require("../../../../../validators/existingPatientEMR/existingPatientEMR.validator.js");
const EMR = require("../../../../../models/common/emr.model.js");
const mongoose = require("mongoose");
// create
const createExistingPatientEMR = async (req, res) => {
  try {
    const { _id, role } = req.user;
    if (!_id) {
      return Response.error(res, 400, AppConstant.FAILED, "User is required !");
    }
    if (role !== "Employee" || role !== "IndividualUser") {
      return Response.error(res, 400, AppConstant.FAILED, "not a valid user !");
    }
    // validation check
    const { error } = createExistingPatientEMRSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation failed !"
      );
    }

    // create new
    const newExistingPatientEMR = new ExistingPatientEMR({
      user: _id,
      ...req.body,
    });
    const savedExistingPatientEMR = await newExistingPatientEMR.save();

    return Response.success(
      res,
      savedExistingPatientEMR,
      201,
      "patient Existing EMR uploaded  successfully !"
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

// get emr - our system + existing both
const getListOfEMRsMobile = async (req, res) => {
  try {
    const { _id, role } = req.user;
    if (!_id) {
      return Response.error(res, 404, AppConstant.FAILED, "User is required !");
    }
    if (!["Employee", "IndividualUser"].includes(role)) {
      return Response.error(res, 400, AppConstant.FAILED, "not a valid user !");
    }
    // find emr form our system
    const userEmrOurSystem = await EMR.find(
      { user: _id },
      "_id createdAt doctor emrPdfFileUrl"
    ).populate({
      path: "doctor",
      select: "firstName lastName specialization",
    });

    const userEmrOurSystemRequiredFieldOnly = userEmrOurSystem
      ? userEmrOurSystem.map((item) => {
          const validItems = {
            _id: item._id,
            date: item.createdAt,
            doctorName: item?.doctor.firstName + " " + item?.doctor.lastName,
            speciality: item?.doctor.specialization,
            emrPdfFileUrl: item.emrPdfFileUrl,
            documentType: "EMR",
            hospitalName: "Preva Care",
          };
          return validItems;
        })
      : [];

    // find all existing emr from other system --> ExistingPatientEMR
    const existingPatientEMRs = await ExistingPatientEMR.find(
      { user: _id },
      "createdAt doctorName doctorSpeciality hospitalName documentType existingEMRFile"
    );

    let userEmrOtherSystemRequiredFieldOnly = existingPatientEMRs
      ? existingPatientEMRs.map((item) => {
          const validItems = {
            _id: item._id,
            date: item.createdAt,
            doctorName: item.doctorName,
            speciality: item.doctorSpeciality,
            documentType: item.documentType,
            hospitalName: item.hospitalName,
            existingEMRFile: item.existingEMRFile,
          };
          return validItems;
        })
      : [];

    const totalResponseEmr = [
      ...userEmrOurSystemRequiredFieldOnly,
      ...userEmrOtherSystemRequiredFieldOnly,
    ];

    return Response.success(
      res,
      totalResponseEmr,
      200,
      "Total employee emr found !"
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

// get emr nboth existing and our system paginated
const getAllEmrListPaginatedByUserId = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const { userId } = req.body; // Assuming userId is passed in params
    if (!userId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "userId is missing !"
      );
    }
    // console.log("search");
    // console.log(search);
    // console.log(limit);
    const searchRegex = new RegExp(search, "i");

    // Regular EMR Aggregation
    const emrAggregation = [
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "users", // Assuming the doctor is in users collection with discriminator
          localField: "doctor",
          foreignField: "_id",
          as: "doctorDetails",
        },
      },
      {
        $unwind: "$doctorDetails",
      },
      {
        $match: {
          $or: [
            { "doctorDetails.firstName": searchRegex },
            { "doctorDetails.lastName": searchRegex },
            { "doctorDetails.specialization": searchRegex },
          ],
        },
      },
      {
        $project: {
          createdAt: 1,
          firstName: "$doctorDetails.firstName",
          lastName: "$doctorDetails.lastName",
          specialization: "$doctorDetails.specialization",
          documentType: { $literal: "doctor visit" },
          pdfUrl: "$emrPdfFileUrl",
        },
      },
    ];

    // Existing EMR Aggregation
    const existingEmrAggregation = [
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $match: {
          $or: [{ doctorName: searchRegex }, { doctorSpeciality: searchRegex }],
        },
      },
      {
        $project: {
          createdAt: 1,
          firstName: { $arrayElemAt: [{ $split: ["$doctorName", " "] }, 0] },
          lastName: { $arrayElemAt: [{ $split: ["$doctorName", " "] }, 1] },
          specialization: "$doctorSpeciality",
          documentType: 1,
          pdfUrl: "$existingEMRFile",
        },
      },
    ];

    // Combine both EMR types using $unionWith
    const combinedAggregation = [
      ...emrAggregation,
      {
        $unionWith: {
          coll: "existingpatientemrs",
          pipeline: existingEmrAggregation,
        },
      },
      {
        $facet: {
          paginatedResults: [
            {
              $sort: {
                [sortBy]: sortOrder === "asc" ? 1 : -1,
              },
            },
            {
              $skip: (Number(page) - 1) * Number(limit),
            },
            {
              $limit: Number(limit),
            },
          ],
          totalCount: [
            {
              $count: "total",
            },
          ],
        },
      },
    ];

    const results = await EMR.aggregate(combinedAggregation);

    const emrList = results[0].paginatedResults;
    const totalCount = results[0].totalCount[0]?.total || 0;

    return Response.success(
      res,
      {
        emrList,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Number(page),
        totalEmr: totalCount,
      },
      200,
      AppConstant.SUCCESS,
      "EMR records found!"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

module.exports = {
  createExistingPatientEMR,
  getListOfEMRsMobile,
  getAllEmrListPaginatedByUserId,
};
