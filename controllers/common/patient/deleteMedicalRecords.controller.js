const AdultFemaleEMR = require("../../../models/EMR/adultFemaleEMR.model");
const AdultMaleEMR = require("../../../models/EMR/adultMaleEMR.model");
const EPrescription = require("../../../models/patient/eprescription/eprescription.model");
const Report = require("../../../models/lab/reports.model");
const LabReport = require("../../../models/lab/labReport/labReport.model");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const mongoose = require("mongoose");
const User = require("../../../models/common/user.model");
const EMR = require("../../../models/common/emr.model");

// Delete EMR
const deleteEmr = async (req, res) => {
  try {
    const { emrId } = req.params;

    if (!emrId) {
      return Response.error(res, 400, AppConstant.FAILED, "EMR ID is required");
    }

    // Check if it's a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(emrId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid EMR ID format"
      );
    }

    // Look for the EMR in the base model
    const emr = await EMR.findById(emrId);

    if (!emr) {
      return Response.error(res, 404, AppConstant.FAILED, "EMR not found");
    }

    // Delete the EMR
    await EMR.findByIdAndDelete(emrId);

    return Response.success(res, null, 200, "EMR deleted successfully");
  } catch (err) {
    console.error("Error deleting EMR:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

// Delete E-Prescription
const deleteEPrescription = async (req, res) => {
  try {
    const { ePrescriptionId } = req.params;

    if (!ePrescriptionId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "E-Prescription ID is required"
      );
    }

    // Check if it's a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(ePrescriptionId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid E-Prescription ID format"
      );
    }

    const ePrescription = await EPrescription.findById(ePrescriptionId);
    if (!ePrescription) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "E-Prescription not found"
      );
    }

    await EPrescription.findByIdAndDelete(ePrescriptionId);

    return Response.success(
      res,
      null,
      200,
      "E-Prescription deleted successfully"
    );
  } catch (err) {
    console.error("Error deleting E-Prescription:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

// Delete Report
const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!reportId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Report ID is required"
      );
    }

    // Check if it's a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid Report ID format"
      );
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return Response.error(res, 404, AppConstant.FAILED, "Report not found");
    }

    await Report.findByIdAndDelete(reportId);

    return Response.success(res, null, 200, "Report deleted successfully");
  } catch (err) {
    console.error("Error deleting Report:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

// Delete Lab Report
const deleteLabReport = async (req, res) => {
  try {
    const { labReportId } = req.params;

    if (!labReportId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Lab Report ID is required"
      );
    }

    // Check if it's a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(labReportId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid Lab Report ID format"
      );
    }

    const labReport = await LabReport.findById(labReportId);
    if (!labReport) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Lab Report not found"
      );
    }

    await LabReport.findByIdAndDelete(labReportId);

    return Response.success(res, null, 200, "Lab Report deleted successfully");
  } catch (err) {
    console.error("Error deleting Lab Report:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error"
    );
  }
};

module.exports = {
  deleteEmr,
  deleteEPrescription,
  deleteReport,
  deleteLabReport,
};
