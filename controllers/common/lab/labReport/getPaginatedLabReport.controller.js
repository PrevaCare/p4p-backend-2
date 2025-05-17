const LabReport = require("../../../../models/lab/labReport/labReport.model");
const ExistingPatientLabReport = require("../../../../models/lab/labReport/ExistingPatientLabReport.model");
const AppConstant = require("../../../../utils/AppConstant");
const Response = require("../../../../utils/Response");
const axios = require("axios");

const getPaginatedLabReportsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 100,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Validate user ID
    if (!userId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "User ID is required"
      );
    }

    // Build search query
    const searchQuery = search
      ? {
          $or: [
            { testName: { $regex: search, $options: "i" } },
            { labName: { $regex: search, $options: "i" } },
            { documentType: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Build base queries for both collections
    const baseQuery = {
      user: userId,
      ...searchQuery,
    };

    // Get lab reports from both collections
    const [labReports, existingLabReports] = await Promise.all([
      LabReport.find(baseQuery)
        .populate("lab", "labName")
        .populate("createdBy", "firstName lastName")
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .lean(),
      ExistingPatientLabReport.find(baseQuery)
        .populate("createdBy", "firstName lastName")
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .lean(),
    ]);

    // Format lab reports to have consistent structure
    const formattedLabReports = labReports.map((report) => ({
      _id: report._id,
      testName: report.testName,
      labName: report.lab?.labName || "Unknown Lab",
      documentType: report.documentType,
      labReportFile: report.labReportFile,
      createdAt: report.createdAt,
      createdBy: report.createdBy
        ? `${report.createdBy.firstName} ${report.createdBy.lastName}`
        : "Unknown",
      reportType: "LabReport",
    }));

    // Format existing patient lab reports
    const formattedExistingLabReports = existingLabReports.map((report) => ({
      _id: report._id,
      testName: report.testName,
      labName: report.labName || "Unknown Lab",
      documentType: report.documentType,
      labReportFile: report.labReportFile,
      createdAt: report.createdAt,
      createdBy: report.createdBy
        ? `${report.createdBy.firstName} ${report.createdBy.lastName}`
        : "Unknown",
      reportType: "ExistingPatientLabReport",
    }));

    // Combine and sort all reports
    const allReports = [
      ...formattedLabReports,
      ...formattedExistingLabReports,
    ].sort((a, b) => {
      if (sortOrder === "asc") {
        return a[sortBy] > b[sortBy] ? 1 : -1;
      }
      return a[sortBy] < b[sortBy] ? 1 : -1;
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedReports = allReports.slice(startIndex, endIndex);

    return Response.success(
      res,
      {
        labReports: paginatedReports,
        totalReports: allReports.length,
        currentPage: page,
        totalPages: Math.ceil(allReports.length / limit),
      },
      200,
      "Lab reports fetched successfully"
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

const getLabReportPdf = async (req, res) => {
  const { reportId } = req.params;

  try {
    // Fetch the PDF URL from your database or service
    const labReport = await LabReport.findById(reportId); // Assuming you have a LabReport model
    if (!labReport || !labReport.labReportFile) {
      return res.status(404).send("Lab report not found");
    }

    const pdfUrl = labReport.labReportFile;
    console.log(labReport);
    // console.log(pdfUrl); // Assuming this is the URL to the PDF

    // Fetch the PDF file

    // Send the PDF blob directly
    res.send({ pdfUrl });
  } catch (error) {
    console.error("Error fetching PDF:", error);
    res.status(500).send("Failed to fetch PDF");
  }
};

const deleteLabReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { reportType } = req.query;

    if (!reportId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Report ID is required"
      );
    }

    if (reportType === "ExistingPatientLabReport") {
      const existingReport = await ExistingPatientLabReport.findById(reportId);
      if (!existingReport) {
        return Response.error(
          res,
          404,
          AppConstant.FAILED,
          "Lab report not found"
        );
      }
      await ExistingPatientLabReport.findByIdAndDelete(reportId);
    } else {
      const labReport = await LabReport.findById(reportId);
      if (!labReport) {
        return Response.error(
          res,
          404,
          AppConstant.FAILED,
          "Lab report not found"
        );
      }
      await LabReport.findByIdAndDelete(reportId);
    }

    return Response.success(res, null, 200, "Lab report deleted successfully");
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
  getPaginatedLabReportsByUserId,
  getLabReportPdf,
  deleteLabReport,
};
