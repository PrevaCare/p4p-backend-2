const mongoose = require("mongoose");
const Employee = require("../../../models/patient/employee/employee.model");
const Response = require("../../../utils/Response");
const AppConstant = require("../../../utils/AppConstant");
const doctorAvailabilityModel = require("../../../models/doctors/doctorAvailability.model");
const {
  DoctorAvailabilitySchema,
} = require("../../../validators/doctor/doctorAvailability.validator");
const { RequestStatus } = require("../../../constants/request.contants");
const {
  doctorScheduleChangeRequestTemplate,
} = require("../../../utils/notifications/superadminNotification.utils");
const userModel = require("../../../models/common/user.model");
const notificationsModel = require("../../../models/notificationSystem/notifications.model");

// create doctor availability
const createDoctorAvailability = async (req, res) => {
  try {
    const { error } = DoctorAvailabilitySchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "validation failed !"
      );
    }

    // if already pending availability exist then throw error
    const existingPendingAvailability = await doctorAvailabilityModel.findOne({
      doctorId: req.body.doctorId,
      consultationType: req.body.consultationType,
      status: RequestStatus.PENDING,
    });
    if (existingPendingAvailability) {
      //   console.log(existingPendingAvailability);
      return Response.error(
        res,
        409,
        AppConstant.FAILED,
        "already one pending request found !"
      );
    }

    const { role } = req.user;
    // const role = "Doctor";

    const dataToBeCreated =
      role === "Superadmin"
        ? req.body
        : {
            ...req.body,
            status: RequestStatus.PENDING,
          };

    const existingSuperadmins = await userModel.find({ role: "Superadmin" });
    const existingDoctor = await userModel.findOne({
      _id: req.body.doctorId,
      role: "Doctor",
    });

    // Create notifications for each Superadmin
    const notifications = existingSuperadmins.map((superadmin) =>
      doctorScheduleChangeRequestTemplate(
        superadmin._id,
        `${existingDoctor.firstName} ${existingDoctor.lastName}`,
        existingDoctor.phone,
        req.body.doctorRemark
      )
    );

    // Bulk insert notifications
    await notificationsModel.insertMany(notifications);

    const newDoctorAvailability = new doctorAvailabilityModel(dataToBeCreated);
    const savedDoctorAvailability = await newDoctorAvailability.save();

    return Response.success(
      res,
      savedDoctorAvailability,
      201,
      "new schedule requested !"
    );
  } catch (err) {
    // console.log(err);
    if (err.name === "ValidationError") {
      const errorMessages = Object.values(err.errors).map(
        (error) => error.message
      );
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        errorMessages.join(", ") || "Validation error!"
      );
    }
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};
// update doctor availability status
const updateDoctorAvailabilityStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return Response.error(res, 404, AppConstant.FAILED, "id is misssing ");
    }
    const { status, adminRemark, consultationType } = req.body;

    if (!Object.values(RequestStatus).includes(status)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        `${status} must be one of ${Object.values(RequestStatus)}`
      );
    }

    if (status === RequestStatus.APPROVED) {
      const rejectAllExistingDoctorAvailability =
        await doctorAvailabilityModel.updateMany(
          {
            doctorId: doctorId,
            consultationType,
            status: RequestStatus.APPROVED,
          },
          {
            $set: {
              status: RequestStatus.REJECTED,
            },
          },
          { new: true, session }
        );
    }
    const approvedExistingDoctorAvailability =
      await doctorAvailabilityModel.updateOne(
        { doctorId: doctorId, consultationType, status: RequestStatus.PENDING },
        {
          $set: {
            status,
            adminRemark,
          },
        },
        { new: true, session }
      );

    await session.commitTransaction();
    // session.endSession();
    return Response.success(
      res,
      approvedExistingDoctorAvailability,
      200,
      "doctor availability updated !"
    );
  } catch (err) {
    await session.abortTransaction();
    // session.endSession();
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  } finally {
    session.endSession();
  }
};

// view doctory availability
const viewDoctorAvailability = async (req, res) => {
  try {
    const { doctorId, status, consultationType } = req.body;
    if (!doctorId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "doctorId is missing !"
      );
    }
    if (!Object.values(RequestStatus).includes(status)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        `${status} must be one of ${Object.values(RequestStatus)}`
      );
    }

    const allExistingDoctorAvailability = await doctorAvailabilityModel
      .findOne(
        {
          doctorId,
          status,
          consultationType,
        },
        "weeklySchedule status requestedAt"
      )
      .sort({ createdAt: -1 });

    return Response.success(
      res,
      allExistingDoctorAvailability,
      200,
      "doctor availability found !"
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

module.exports = {
  createDoctorAvailability,
  updateDoctorAvailabilityStatus,
  viewDoctorAvailability,
};
