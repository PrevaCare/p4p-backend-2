const { uploadToS3 } = require("../../../../middlewares/uploads/awsConfig");
const User = require("../../../../models/common/user.model");
const LabReport = require("../../../../models/lab/labReport/labReport.model");
const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const {
  labReportValidationSchema,
} = require("../../../../validators/lab/labReport/labReport.validator");
const Lab = require("../../../../models/lab/lab.model");
const LabPackage = require("../../../../models/lab/labPackage.model");
const mongoose = require("mongoose");

const createlabReport = async (req, res) => {
  try {
    // const { _id } = req.user;
    const labReportFile = req.files.labReportFile[0];
    if (!labReportFile) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "labReportFile is required !"
      );
    }

    const { error } = labReportValidationSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation failed !"
      );
    }

    // find whether user has assinged general physician or not
    const user = await User.findById(req.body.user).populate({
      path: "assignedDoctors",
      select: "firstName lastName specialization",
    });
    // console.log(user);
    //
    if (!user.assignedDoctors || user.assignedDoctors.length === 0) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "no doctor assigned to this user !"
      );
    }

    const assignedGeneralPhysicianDoctor = user.assignedDoctors.filter(
      (doctor) => {
        return doctor.specialization === "General Physician";
      }
    );

    if (
      !assignedGeneralPhysicianDoctor ||
      assignedGeneralPhysicianDoctor.length === 0
    ) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "no general physician doctor assigned to this employee !"
      );
    }
    // console.log(assignedGeneralPhysicianDoctor);

    // return;

    // upload to aws -- lab file
    const uploadedLabReportFile = await uploadToS3(labReportFile);
    if (!uploadedLabReportFile) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "lab report failed to upload !"
      );
    }

    const newLabReport = new LabReport({
      ...req.body,
      user: req.body.user,
      doctor: assignedGeneralPhysicianDoctor[0]._id,
      labReportFile: uploadedLabReportFile.Location,
      createdBy: req.body.createdBy,
    });
    const savedLabReport = await newLabReport.save();
    return Response.success(
      res,
      savedLabReport,
      201,
      "Lab report created successfully !"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server failed !"
    );
  }
};

const getLabPartners = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = "",
      sortBy = "labName",
      sortOrder = "desc",
      city = "",
      state = "",
      pincode = "",
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.max(parseInt(limit, 10), 1);
    const sortOrderNum = sortOrder.toLowerCase() === "asc" ? 1 : -1;

    const searchQuery = search
      ? { labName: { $regex: search, $options: "i" } }
      : {};

    // Valid sort fields to avoid injection
    const validSortFields = ["labName", "labPersonName", "contactNumber"];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : "labName";

    const aggregationPipeline = [
      { $match: searchQuery },

      {
        $addFields: {
          availableCities: {
            $filter: {
              input: "$availableCities",
              as: "city",
              cond: {
                $and: [
                  { $eq: ["$$city.isActive", true] },

                  city
                    ? {
                        $eq: [
                          { $toLower: "$$city.cityName" },
                          city.toLowerCase(),
                        ],
                      }
                    : { $literal: true },

                  state
                    ? {
                        $eq: [
                          { $toLower: "$$city.state" },
                          state.toLowerCase(),
                        ],
                      }
                    : { $literal: true },

                  pincode
                    ? {
                        $not: {
                          $in: [
                            pincode,
                            {
                              $ifNull: ["$$city.pinCodes_excluded", []],
                            },
                          ],
                        },
                      }
                    : { $literal: true },
                ],
              },
            },
          },
        },
      },

      {
        $match: {
          availableCities: { $ne: null },
          $expr: { $gt: [{ $size: "$availableCities" }, 0] },
        },
      },

      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: { [safeSortBy]: sortOrderNum } },
            { $skip: (pageNum - 1) * limitNum },
            { $limit: limitNum },
            {
              $project: {
                logo: 1,
                labName: 1,
                labPersonName: 1,
                contactNumber: 1,
                address: 1,
                availableCities: 1,
              },
            },
          ],
        },
      },
    ];

    const [result] = await Lab.aggregate(aggregationPipeline);

    const labs = result?.data || [];
    const total = result?.metadata[0]?.total || 0;

    // Clean _id in availableCities and address
    const cleanedLabPartners = labs.map((lab) => {
      if (Array.isArray(lab.availableCities)) {
        lab.availableCities = lab.availableCities.map((city) => {
          const c = { ...city };
          delete c._id;
          return c;
        });
      }
      if (lab.address) delete lab.address._id;
      return lab;
    });

    return Response.success(
      res,
      {
        labPartners: cleanedLabPartners,
        total,
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
      200,
      "Lab partners retrieved successfully"
    );
  } catch (err) {
    console.error("Error in getLabPartners:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

const getLabPartnerPackages = async (req, res) => {
  try {
    const { labId } = req.params;
    const {
      page = 1,
      limit = 50,
      search = "",
      sortBy = "packageCode", // Changed default to packageCode
      sortOrder = "asc",
      state = "",
      city = "",
    } = req.query;
    
    let pincode = req.query?.pincode
    
    if (!pincode) {
      const user = await User.findById(req.user?._id)
      pincode = user?.address?.zipCode || user?.address?.pinCode
    }
  
    // Validate labId format
    if (!mongoose.isValidObjectId(labId)) {
      return Response.error(res, 400, AppConstant.FAILED, "Invalid lab ID");
    }

    // Verify if lab exists
    const lab = await Lab.findById(labId).lean();
    if (!lab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // Parse and validate query parameters
    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.max(parseInt(limit, 10), 1);
    const sortOrderNum = sortOrder.toLowerCase() === "asc" ? 1 : -1;

    // Build match query
    const matchQuery = {
      labId: new mongoose.Types.ObjectId(labId),
      ...(search
        ? {
            $or: [
              { packageCode: { $regex: search, $options: "i" } }, // Prioritize packageCode
              { packageName: { $regex: search, $options: "i" } },
            ],
          }
        : {}),
    };

    // Define allowed sort fields to prevent injection
    const validSortFields = ["packageCode", "packageName", "category"];
    const safeSortBy = validSortFields.includes(sortBy)
      ? sortBy
      : "packageCode"; // Default to packageCode

    const aggregationPipeline = [
      { $match: matchQuery },
      // Filter cityAvailability array
      {
        $addFields: {
          cityAvailability: {
            $filter: {
              input: "$cityAvailability",
              as: "cityAvail",
              cond: {
                $and: [
                  { $eq: ["$$cityAvail.isActive", true] },

                  city
                    ? {
                        $eq: [
                          { $toLower: "$$cityAvail.cityName" },
                          city.toLowerCase(),
                        ],
                      }
                    : { $literal: true },

                  state
                    ? {
                        $eq: [
                          { $toLower: "$$cityAvail.state" },
                          state.toLowerCase(),
                        ],
                      }
                    : { $literal: true },

                  pincode
                    ? {
                        $and: [
                          {
                            $eq: [
                              {
                                $size: {
                                  $filter: {
                                    input: {
                                      $ifNull: [
                                        "$$cityAvail.pinCodes_excluded",
                                        [],
                                      ],
                                    },
                                    cond: { $eq: ["$$this", pincode] },
                                  },
                                },
                              },
                              0,
                            ],
                          },
                          // For pinCodes_included or other checks, keep as true or add logic
                          { $literal: true },
                        ],
                      }
                    : { $literal: true },
                ],
              },
            },
          },
        },
      },
      // Exclude packages with no matching cityAvailability
      { $match: { cityAvailability: { $ne: [] } } },
      // Facet for total count and paginated results
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: { [safeSortBy]: sortOrderNum } },
            { $skip: (pageNum - 1) * limitNum },
            { $limit: limitNum },
            {
              $project: {
                _id: 1,
                logo: 1,
                packageCode: 1,
                packageName: 1,
                desc: 1,
                long_desc: 1,
                category: 1,
                testIncluded: 1,
                sampleRequired: 1,
                preparationRequired: 1,
                gender: 1,
                ageGroup: 1,
                cityAvailability: {
                  $map: {
                    input: "$cityAvailability",
                    as: "cityAvail",
                    in: {
                      cityId: "$$cityAvail.cityId",
                      cityName: "$$cityAvail.cityName",
                      state: "$$cityAvail.state",
                      pinCodes_excluded: "$$cityAvail.pinCodes_excluded",
                      prevaCarePriceForCorporate:
                        "$$cityAvail.prevaCarePriceForCorporate",
                      prevaCarePriceForIndividual:
                        "$$cityAvail.prevaCarePriceForIndividual",
                      homeCollectionCharge: "$$cityAvail.homeCollectionCharge",
                      homeCollectionAvailable:
                        "$$cityAvail.homeCollectionAvailable",
                      isActive: "$$cityAvail.isActive",
                      totalPrice: "$$cityAvail.billingRate",
                      discountPercentageForCorporate: {
                        $cond: [
                          { $gt: ["$$cityAvail.billingRate", 0] },
                          {
                            $round: [
                              {
                                $multiply: [
                                  {
                                    $divide: [
                                      {
                                        $subtract: [
                                          "$$cityAvail.billingRate",
                                          "$$cityAvail.prevaCarePriceForCorporate",
                                        ],
                                      },
                                      "$$cityAvail.billingRate",
                                    ],
                                  },
                                  100,
                                ],
                              },
                              2, // rounds to 2 decimal places
                            ],
                          },
                          null,
                        ],
                      },
                      discountPercentageForIndividual: {
                        $cond: [
                          { $gt: ["$$cityAvail.billingRate", 0] }, // prevent division by zero
                          {
                            $round: [
                              {
                                $multiply: [
                                  {
                                    $divide: [
                                      {
                                        $subtract: [
                                          "$$cityAvail.billingRate",
                                          "$$cityAvail.prevaCarePriceForIndividual",
                                        ],
                                      },
                                      "$$cityAvail.billingRate",
                                    ],
                                  },
                                  100,
                                ],
                              },
                              2, // rounds to 2 decimal places
                            ],
                          },
                          null,
                        ],
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      },
    ];

    const [result] = await LabPackage.aggregate(aggregationPipeline);

    // Handle empty data
    const packages = result?.data || [];
    const total = result?.metadata[0]?.total || 0;

    return Response.success(
      res,
      {
        labName: lab.labName,
        packages,
        total,
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
      200,
      "Lab partner packages retrieved successfully"
    );
  } catch (err) {
    console.error("Error in getLabPartnerPackages:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      "Internal server error"
    );
  }
};

const getAllLabPartnerPackages = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = "",
      sortBy = "packageCode", // Changed default to packageCode
      sortOrder = "asc",
      state = "",
      city = "",
      pincode = ""
    } = req.query;

    // Parse and validate query parameters
    const pageNum = Math.max(parseInt(page, 10), 1);
    const limitNum = Math.max(parseInt(limit, 10), 1);
    const sortOrderNum = sortOrder.toLowerCase() === "asc" ? 1 : -1;

    // Build match query
    const matchQuery = {
      ...(search
        ? {
            $or: [
              { packageCode: { $regex: search, $options: "i" } }, // Prioritize packageCode
              { packageName: { $regex: search, $options: "i" } },
            ],
          }
        : {}),
    };

    // Define allowed sort fields to prevent injection
    const validSortFields = ["packageCode", "packageName", "category"];
    const safeSortBy = validSortFields.includes(sortBy)
      ? sortBy
      : "packageCode"; // Default to packageCode

    const aggregationPipeline = [
      { $match: matchQuery },
      // Filter cityAvailability array
      {
        $addFields: {
          cityAvailability: {
            $filter: {
              input: "$cityAvailability",
              as: "cityAvail",
              cond: {
                $and: [
                  { $eq: ["$$cityAvail.isActive", true] },

                  city
                    ? {
                        $eq: [
                          { $toLower: "$$cityAvail.cityName" },
                          city.toLowerCase(),
                        ],
                      }
                    : { $literal: true },

                  state
                    ? {
                        $eq: [
                          { $toLower: "$$cityAvail.state" },
                          state.toLowerCase(),
                        ],
                      }
                    : { $literal: true },

                  pincode
                    ? {
                        $and: [
                          {
                            $eq: [
                              {
                                $size: {
                                  $filter: {
                                    input: {
                                      $ifNull: [
                                        "$$cityAvail.pinCodes_excluded",
                                        [],
                                      ],
                                    },
                                    cond: { $eq: ["$$this", pincode] },
                                  },
                                },
                              },
                              0,
                            ],
                          },
                          // For pinCodes_included or other checks, keep as true or add logic
                          { $literal: true },
                        ],
                      }
                    : { $literal: true },
                ],
              },
            },
          },
        },
      },
      // Exclude packages with no matching cityAvailability
      { $match: { cityAvailability: { $ne: [] } } },
      // Facet for total count and paginated results
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: { [safeSortBy]: sortOrderNum } },
            { $skip: (pageNum - 1) * limitNum },
            { $limit: limitNum },
            {
              $project: {
                _id: 1,
                logo: 1,
                packageCode: 1,
                packageName: 1,
                desc: 1,
                long_desc: 1,
                category: 1,
                testIncluded: 1,
                sampleRequired: 1,
                preparationRequired: 1,
                gender: 1,
                ageGroup: 1,
                cityAvailability: {
                  $map: {
                    input: "$cityAvailability",
                    as: "cityAvail",
                    in: {
                      cityId: "$$cityAvail.cityId",
                      cityName: "$$cityAvail.cityName",
                      state: "$$cityAvail.state",
                      pinCodes_excluded: "$$cityAvail.pinCodes_excluded",
                      prevaCarePriceForCorporate:
                        "$$cityAvail.prevaCarePriceForCorporate",
                      prevaCarePriceForIndividual:
                        "$$cityAvail.prevaCarePriceForIndividual",
                      homeCollectionCharge: "$$cityAvail.homeCollectionCharge",
                      homeCollectionAvailable:
                        "$$cityAvail.homeCollectionAvailable",
                      isActive: "$$cityAvail.isActive",
                      totalPrice: "$$cityAvail.billingRate",
                      discountPercentageForCorporate: {
                        $cond: [
                          { $gt: ["$$cityAvail.billingRate", 0] },
                          {
                            $round: [
                              {
                                $multiply: [
                                  {
                                    $divide: [
                                      {
                                        $subtract: [
                                          "$$cityAvail.billingRate",
                                          "$$cityAvail.prevaCarePriceForCorporate",
                                        ],
                                      },
                                      "$$cityAvail.billingRate",
                                    ],
                                  },
                                  100,
                                ],
                              },
                              2, // rounds to 2 decimal places
                            ],
                          },
                          null,
                        ],
                      },
                      discountPercentageForIndividual: {
                        $cond: [
                          { $gt: ["$$cityAvail.billingRate", 0] }, // prevent division by zero
                          {
                            $round: [
                              {
                                $multiply: [
                                  {
                                    $divide: [
                                      {
                                        $subtract: [
                                          "$$cityAvail.billingRate",
                                          "$$cityAvail.prevaCarePriceForIndividual",
                                        ],
                                      },
                                      "$$cityAvail.billingRate",
                                    ],
                                  },
                                  100,
                                ],
                              },
                              2, // rounds to 2 decimal places
                            ],
                          },
                          null,
                        ],
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      },
    ];

    const [result] = await LabPackage.aggregate(aggregationPipeline);

    // Handle empty data
    const packages = result?.data || [];
    const total = result?.metadata[0]?.total || 0;

    return Response.success(
      res,
      {
        packages,
        total,
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
      200,
      "Lab partner packages retrieved successfully"
    );
  } catch (err) {
    console.error("Error in getLabPartnerPackages:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      "Internal server error"
    );
  }
};

const getLabPartnerPackageById = async (req, res) => {
  try {
    const { packageId } = req.params;

    if (!mongoose.isValidObjectId(packageId)) {
      return Response.error(res, 400, AppConstant.FAILED, "Invalid package ID");
    }

    const packageData = await LabPackage.findById(packageId)
      .populate({
        path: "labId",
        select: "labName logo",
      })
      .select(
        "-__v -cityAvailability.partnerRate -cityAvailability.discountPercentage"
      )
      .lean();

    if (!packageData) {
      return Response.error(res, 404, AppConstant.FAILED, "Package not found");
    }

    if (packageData.labId) {
      Object.assign(packageData, {
        logo: packageData.labId.logo,
        labName: packageData.labId.labName,
      });
      delete packageData.labId;
    }

    // Calculate discount percentages for each cityAvailability entry
    if (Array.isArray(packageData.cityAvailability)) {
      packageData.cityAvailability = packageData.cityAvailability.map(
        ({ billingRate, ...city }) => {
          const prevaCarePriceForCorporate =
            city.prevaCarePriceForCorporate || 0;
          const prevaCarePriceForIndividual =
            city.prevaCarePriceForIndividual || 0;

          return {
            ...city,
            totalPrice: billingRate,
            discountPercentageForCorporate:
              billingRate > 0
                ? (
                    ((billingRate - prevaCarePriceForCorporate) / billingRate) *
                    100
                  ).toFixed(2)
                : null,
            discountPercentageForIndividual:
              billingRate > 0
                ? (
                    ((billingRate - prevaCarePriceForIndividual) /
                      billingRate) *
                    100
                  ).toFixed(2)
                : null,
          };
        }
      );
    }

    return Response.success(
      res,
      packageData,
      200,
      "Lab partner package retrieved successfully"
    );
  } catch (err) {
    console.error("Error in getLabPartnerPackageById:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      "Internal server error"
    );
  }
};

module.exports = {
  createlabReport,
  getLabPartners,
  getLabPartnerPackages,
  getLabPartnerPackageById,
  getAllLabPartnerPackages
};
