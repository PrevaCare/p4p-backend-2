const DoctorBankDetail = require("../../../models/doctors/doctorBankDetails.model");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const {
  doctorBankDetailsValidation,
} = require("../../../validators/doctor/doctorBankDetails.validator");

const doctorBankDetailController = {
  // Add new bank detail
  async addBankDetail(req, res) {
    const { error } = doctorBankDetailsValidation.create.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    try {
      // Check if bank details already exist for this doctor
      const existingDetail = await DoctorBankDetail.findOne({
        doctor: req.body.doctor,
      });
      if (existingDetail) {
        return Response.error(
          res,
          409,
          AppConstant.FAILED,
          "Bank details already exist for this doctor!"
        );
      }

      const newBankDetail = new DoctorBankDetail(req.body);
      const savedBankDetail = await newBankDetail.save();

      return Response.success(
        res,
        savedBankDetail,
        201,
        "Bank details added successfully!"
      );
    } catch (err) {
      return Response.error(
        res,
        500,
        AppConstant.FAILED,
        err.message || "Internal server error!"
      );
    }
  },

  // Update bank detail by ID
  async updateBankDetailById(req, res) {
    const { doctorBankDetailId } = req.params;
    const { error } = doctorBankDetailsValidation.update.validate(req.body);

    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    try {
      const updatedBankDetail = await DoctorBankDetail.findByIdAndUpdate(
        doctorBankDetailId,
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!updatedBankDetail) {
        return Response.error(
          res,
          404,
          AppConstant.FAILED,
          "Bank detail not found!"
        );
      }

      return Response.success(
        res,
        updatedBankDetail,
        200,
        "Bank details updated successfully!"
      );
    } catch (err) {
      return Response.error(
        res,
        500,
        AppConstant.FAILED,
        err.message || "Internal server error!"
      );
    }
  },

  // Delete bank detail by ID
  async deleteBankDetailById(req, res) {
    const { doctorBankDetailId } = req.params;

    try {
      const deletedBankDetail = await DoctorBankDetail.findByIdAndDelete(
        doctorBankDetailId
      );

      if (!deletedBankDetail) {
        return Response.error(
          res,
          404,
          AppConstant.FAILED,
          "Bank detail not found!"
        );
      }

      return Response.success(
        res,
        null,
        200,
        "Bank details deleted successfully!"
      );
    } catch (err) {
      return Response.error(
        res,
        500,
        AppConstant.FAILED,
        err.message || "Internal server error!"
      );
    }
  },

  // Get bank detail by ID
  async getBankDetailById(req, res) {
    const { doctorBankDetailId } = req.params;

    try {
      const bankDetail = await DoctorBankDetail.findById(
        doctorBankDetailId
      ).populate("doctor", "firstName lastName email");

      if (!bankDetail) {
        return Response.error(
          res,
          404,
          AppConstant.FAILED,
          "Bank detail not found!"
        );
      }

      return Response.success(
        res,
        bankDetail,
        200,
        "Bank details retrieved successfully!"
      );
    } catch (err) {
      return Response.error(
        res,
        500,
        AppConstant.FAILED,
        err.message || "Internal server error!"
      );
    }
  },

  // Get all bank details with pagination
  async getAllBankDetails(req, res) {
    try {
      const { doctorId } = req.params;
      if (!doctorId) {
        return Response.error(
          res,
          404,
          AppConstant.FAILED,
          "doctor id not found !"
        );
      }

      const bankDetails = await DoctorBankDetail.find({ doctor: doctorId });

      return Response.success(
        res,
        bankDetails,
        200,
        "Bank details retrieved successfully!"
      );
    } catch (err) {
      return Response.error(
        res,
        500,
        AppConstant.FAILED,
        err.message || "Internal server error!"
      );
    }
  },

  // Get bank detail by doctor ID
  async getBankDetailsByDoctorId(req, res) {
    const { doctorId } = req.params;

    try {
      const bankDetail = await DoctorBankDetail.find({
        doctor: doctorId,
      });

      if (!bankDetail) {
        return Response.error(
          res,
          404,
          AppConstant.FAILED,
          "Bank detail not found for this doctor!"
        );
      }

      return Response.success(
        res,
        bankDetail,
        200,
        "Bank details retrieved successfully!"
      );
    } catch (err) {
      return Response.error(
        res,
        500,
        AppConstant.FAILED,
        err.message || "Internal server error!"
      );
    }
  },
};

module.exports = { doctorBankDetailController };
