const { uploadToS3 } = require("../../../../middlewares/uploads/awsConfig");
const Report = require("../../../../models/lab/reports.model");
const User = require("../../../../models/common/user.model");
const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const {
  reportValidationSchema,
} = require("../../../../validators/lab/reports.validator");
const mongoose = require("mongoose");

const createReport = async (req, res) => {
  try {
    console.log("==== Starting createReport handler ====");
    console.log(`Request body: ${JSON.stringify(req.body)}`);

    const files = req.files.labReportFile; // expecting multiple files
    console.log(`Received ${files ? files.length : 0} files`);

    if (!files || files.length === 0) {
      console.error("No files received in request");
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Please upload at least one lab report file"
      );
    }

    console.log(
      `Files received: ${files.map((f) => f.originalname).join(", ")}`
    );

    // Validate body
    console.log("Validating request body");
    const { error } = reportValidationSchema.validate(req.body);
    if (error) {
      console.error(`Validation error: ${error.message}`);
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed"
      );
    }

    console.log(`Finding user with ID: ${req.body.user}`);
    const user = await User.findById(req.body.user).populate({
      path: "assignedDoctors",
      select: "firstName lastName specialization",
    });

    if (!user) {
      console.error(`User not found with ID: ${req.body.user}`);
      return Response.error(res, 400, AppConstant.FAILED, "User not found");
    }

    console.log(`User found: ${user._id}, checking assigned doctors`);

    if (!user.assignedDoctors || user.assignedDoctors.length === 0) {
      console.error("No doctors assigned to this user");
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

    console.log(
      `Found ${assignedGeneralPhysicianDoctor.length} general physician doctors assigned`
    );

    if (
      !assignedGeneralPhysicianDoctor ||
      assignedGeneralPhysicianDoctor.length === 0
    ) {
      console.error("No general physician doctor assigned to this user");
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "no general physician doctor assigned to this employee !"
      );
    }

    // Upload all files to S3
    console.log(`Starting upload of ${files.length} files to S3`);
    const uploadedFiles = await Promise.all(
      files.map(async (file, index) => {
        console.log(
          `Uploading file ${index + 1}/${files.length}: ${file.originalname}`
        );
        try {
          const uploaded = await uploadToS3(file);
          console.log(`Successfully uploaded file to S3: ${file.originalname}`);
          return {
            fileName: file.originalname,
            url: uploaded?.Location,
          };
        } catch (error) {
          console.error(
            `Failed to upload file to S3: ${file.originalname}`,
            error
          );
          throw new Error(`Failed to upload file: ${file.originalname}`);
        }
      })
    );

    console.log(`All files uploaded successfully. Creating new report record`);

    // Get system doctor name from request
    const systemDoctorNameFromRequest = req.body.systemDoctorName || "";
    console.log(
      `System doctor name from request: ${systemDoctorNameFromRequest}`
    );

    // Save to DB
    const newLabReport = new Report({
      reportName: req.body.reportName,
      indication: req.body.indication,
      remarks: req.body.remarks,
      doctor: assignedGeneralPhysicianDoctor[0]._id,
      user: req.body.user,
      documents: uploadedFiles, // Array of { name, url }

      // Add new fields
      prescribingDoctor: req.body.prescribingDoctor || "Self",
      labName: req.body.labName || "",
      systemDoctorName: systemDoctorNameFromRequest,
    });

    const savedLabReport = await newLabReport.save();
    console.log(`Report saved successfully with ID: ${savedLabReport._id}`);

    return Response.success(
      res,
      savedLabReport,
      201,
      "Lab report created successfully"
    );
  } catch (err) {
    console.error("Lab Report Upload Error:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

const getReportsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Validate user ID
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return Response.error(res, 400, AppConstant.FAILED, "Invalid user ID");
    }

    const searchRegex = search ? new RegExp(search, "i") : null;

    const aggregationPipeline = [
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
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
        $unwind: "$doctorDetails",
      },
      // Apply search if provided
      ...(searchRegex
        ? [
            {
              $match: {
                $or: [
                  { "doctorDetails.firstName": searchRegex },
                  { "doctorDetails.lastName": searchRegex },
                  { "doctorDetails.specialization": searchRegex },
                  { reportName: searchRegex },
                ],
              },
            },
          ]
        : []),
      {
        $project: {
          reportName: 1,
          indication: 1,
          remarks: 1,
          createdAt: 1,
          documents: 1,
          doctor: {
            firstName: "$doctorDetails.firstName",
            lastName: "$doctorDetails.lastName",
            specialization: "$doctorDetails.specialization",
          },
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

    const [result] = await Report.aggregate(aggregationPipeline);

    const reports = result.paginatedResults;
    const totalReports = result.totalCount[0]?.total || 0;

    return Response.success(
      res,
      {
        reports,
        totalReports,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReports / parseInt(limit)),
      },
      200,
      "Reports fetched successfully"
    );
  } catch (error) {
    console.error("Error in getReportsByUser:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error"
    );
  }
};

module.exports = { createReport, getReportsByUser };
