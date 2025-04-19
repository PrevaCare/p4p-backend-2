const { uploadToS3 } = require("../../../../middlewares/uploads/awsConfig");
const Report = require("../../../../models/lab/reports.model");
const User = require("../../../../models/common/user.model");
const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const {
    reportValidationSchema, } = require("../../../../validators/lab/reports.validator")
const mongoose = require("mongoose");

const createReport = async (req, res) => {
    try {
        const files = req.files.labReportFile; // expecting multiple files
        if (!files || files.length === 0) {
            return Response.error(
                res,
                400,
                AppConstant.FAILED,
                "Please upload at least one lab report file"
            );
        }

        // Validate body
        const { error } = reportValidationSchema.validate(req.body);
        if (error) {
            return Response.error(
                res,
                400,
                AppConstant.FAILED,
                error.message || "Validation failed"
            );
        }

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

        // Upload all files to S3
        const uploadedFiles = await Promise.all(
            files.map(async (file) => {
                const uploaded = await uploadToS3(file);
                return {
                    fileName: file.originalname,
                    url: uploaded?.Location,
                };
            })
        );

        // Save to DB
        const newLabReport = new Report({
            reportName: req.body.reportName,
            indication: req.body.indication,
            remarks: req.body.remarks,
            doctor: assignedGeneralPhysicianDoctor[0]._id,
            user: req.body.user,

            documents: uploadedFiles, // Array of { name, url }
        });

        const savedLabReport = await newLabReport.save();
        // console.log(savedLabReport);
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
            sortOrder = "desc"
        } = req.query;

        // Validate user ID
        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            return Response.error(res, 400, AppConstant.FAILED, "Invalid user ID");
        }

        const searchRegex = search ? new RegExp(search, "i") : null;

        const aggregationPipeline = [
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "doctor",
                    foreignField: "_id",
                    as: "doctorDetails"
                }
            },
            {
                $unwind: "$doctorDetails"
            },
            // Apply search if provided
            ...(searchRegex ? [{
                $match: {
                    $or: [
                        { "doctorDetails.firstName": searchRegex },
                        { "doctorDetails.lastName": searchRegex },
                        { "doctorDetails.specialization": searchRegex },
                        { "reportName": searchRegex }
                    ]
                }
            }] : []),
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
                        specialization: "$doctorDetails.specialization"
                    }
                }
            },
            {
                $facet: {
                    paginatedResults: [
                        {
                            $sort: {
                                [sortBy]: sortOrder === "asc" ? 1 : -1
                            }
                        },
                        {
                            $skip: (Number(page) - 1) * Number(limit)
                        },
                        {
                            $limit: Number(limit)
                        }
                    ],
                    totalCount: [
                        {
                            $count: "total"
                        }
                    ]
                }
            }
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
