const { uploadToS3 } = require("../../../../middlewares/uploads/awsConfig");
const Report = require("../../../../models/lab/reports.model");
const User = require("../../../../models/common/user.model");
const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const {
    reportValidationSchema, } = require("../../../../validators/lab/reports.validator")

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

        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            return Response.error(res, 400, AppConstant.FAILED, "Invalid user ID");
        }

        const reports = await Report.find({ user: userId })
            .populate({
                path: "doctor",
                select: "firstName lastName specialization", // only include these fields
            })
            .sort({ createdAt: -1 });

        return Response.success(res, reports, 200, "Reports fetched successfully");
    } catch (error) {
        return Response.error(
            res,
            500,
            AppConstant.FAILED,
            error.message || "Internal server error"
        );
    }
};

module.exports = { createReport, getReportsByUser };
