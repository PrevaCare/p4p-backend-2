const eprescriptionModel = require("../../../models/patient/eprescription/eprescription.model");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const mongoose = require("mongoose");

const getAllEPrescriptionListPaginatedByUserId = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "date",
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
    //   console.log("search");
    //   console.log(search);
    //   console.log(limit);
    const searchRegex = new RegExp(search, "i");

    // Regular EMR Aggregation
    const emrAggregation = [
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
        },
      },
      //   {
      //     $lookup: {
      //       from: "users", // Assuming the doctor is in users collection with discriminator
      //       localField: "doctor",
      //       foreignField: "_id",
      //       as: "doctorDetails",
      //     },
      //   },
      //   {
      //     $unwind: "$doctorDetails",
      //   },
      {
        $match: {
          $or: [
            { "doctor.firstName": searchRegex },
            { "doctor.lastName": searchRegex },
            { "doctor.specialization": searchRegex },
          ],
        },
      },
      {
        $project: {
          date: 1,
          firstName: "$doctor.firstName",
          lastName: "$doctor.lastName",
          specialization: "$doctor.specialization",
          documentName: { $literal: "E- prescription" },
          pdfUrl: "$link",
        },
      },
    ];

    // Existing EMR Aggregation
    const existingUserEPrescriptionAggregation = [
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $match: {
          $or: [{ doctorName: searchRegex }, { specialization: searchRegex }],
        },
      },
      {
        $project: {
          createdAt: 1,
          firstName: { $arrayElemAt: [{ $split: ["$doctorName", " "] }, 0] },
          lastName: { $arrayElemAt: [{ $split: ["$doctorName", " "] }, 1] },
          specialization: "$specialization",
          documentName: 1,
          pdfUrl: "$link",
        },
      },
    ];

    // Combine both EMR types using $unionWith
    const combinedAggregation = [
      ...emrAggregation,
      {
        $unionWith: {
          coll: "userexistingeprescriptions",
          pipeline: existingUserEPrescriptionAggregation,
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

    const results = await eprescriptionModel.aggregate(combinedAggregation);

    const ePrescriptionList = results[0].paginatedResults;
    const totalCount = results[0].totalCount[0]?.total || 0;

    return Response.success(
      res,
      {
        ePrescriptionList,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Number(page),
        totalEPrescriptions: totalCount,
      },
      200,
      AppConstant.SUCCESS,
      "EPrescriptions records found!"
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

module.exports = { getAllEPrescriptionListPaginatedByUserId };
