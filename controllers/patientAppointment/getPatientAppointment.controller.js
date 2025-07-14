const patientAppointmentModel = require("../../models/patient/patientAppointment/patientAppointment.model");
const AppConstant = require("../../utils/AppConstant");
const Response = require("../../utils/Response");
const mongoose = require("mongoose");

const {
  patientAppointmentvadatorSchema,
} = require("../../validators/patient/patientAppointmentWithDoctor/patientAppointment.validator");
const { razorpayInstance } = require("../../config/razorpay.config");
const doctorModel = require("../../models/doctors/doctor.model");
const userModel = require("../../models/common/user.model");
const employeePlanModel = require("../../models/patient/employee/employeePlan.model");
const individualUserPlanModel = require("../../models/individualUser/individualUserPlan.model");
const patientAppointmentPaymentModel = require("../../models/patient/patientAppointment/patientAppointmentPayment.model");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
// get patients( employee + individual user for appointment booking)
const getAssignedDoctorPatientForAppointmentBooking = async (req, res) => {
  try {
    const { doctorId } = req.body;
    if (!doctorId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "doctor id is missing !"
      );
    }
    const existingAssignedPatientList = await userModel.find(
      {
        $or: [{ role: "Employee" }, { role: "IndividualUser" }],
        assignedDoctors: {
          $in: [new mongoose.Types.ObjectId(doctorId)],
        },
      },
      "firstName lastName"
    );

    return Response.success(
      res,
      existingAssignedPatientList,
      200,
      "patient found successfully !"
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
// get date, isAvaialable and available timeslot array to book an appointment
// const getDateIsAvailableAndAvailableTimeSlotToBookAnAppointment = async (
//   req,
//   res
// ) => {
//   try {
//     const { doctorId, consultationType } = req.body;

//     if (!doctorId || !consultationType) {
//       return Response.error(
//         res,
//         400,
//         AppConstant.FAILED,
//         "Doctor ID and consultation type are required"
//       );
//     }

//     const DoctorAvailability = mongoose.model("DoctorAvailability");
//     const Appointment = mongoose.model("Appointment");

//     // Get next 7 days
//     const nextSevenDays = Array.from({ length: 7 }, (_, i) => {
//       const date = dayjs().add(i, "day");
//       return {
//         date: date.format("YYYY-MM-DD"),
//         dayOfWeek: date.format("dddd"),
//         isAvailable: false,
//         availableTimeSlots: [],
//       };
//     });

//     // Get doctor's availability schedule
//     const doctorSchedule = await DoctorAvailability.findOne({
//       doctorId,
//       status: "approved",
//       consultationType,
//     });
//     // console.log("doctorSchedule" + doctorSchedule);

//     if (!doctorSchedule) {
//       return Response.error(
//         res,
//         400,
//         AppConstant.FAILED,
//         "No availability schedule found for the doctor"
//       );
//     }

//     // Process each day
//     for (let dayInfo of nextSevenDays) {
//       const daySchedule = doctorSchedule.weeklySchedule.find(
//         (schedule) =>
//           schedule.day.toLowerCase() === dayInfo.dayOfWeek.toLowerCase()
//       );

//       if (!daySchedule || daySchedule.timeSlots.length === 0) {
//         continue; // Skip if doctor is not available on this day
//       }

//       // Get all appointments for this day
//       const existingAppointments = await Appointment.find({
//         doctorId,
//         appointmentDate: dayInfo.date,
//         status: "scheduled",
//         // paymentStatus: "completed",
//       });

//       // Generate 30-minute slots from doctor's availability
//       let availableSlots = [];
//       for (const slot of daySchedule.timeSlots) {
//         let currentTime = dayjs(
//           `2000-01-01 ${slot.startTime}`,
//           "YYYY-MM-DD HH:mm"
//         );
//         const slotEndTime = dayjs(
//           `2000-01-01 ${slot.endTime}`,
//           "YYYY-MM-DD HH:mm"
//         );

//         while (currentTime.isBefore(slotEndTime)) {
//           const nextSlotTime = currentTime.add(30, "minute");
//           const currentTimeStr = currentTime.format("HH:mm");
//           const nextSlotTimeStr = nextSlotTime.format("HH:mm");

//           // Check if the next slot would exceed the end time
//           if (nextSlotTime.isAfter(slotEndTime)) {
//             break;
//           }

//           // Check if slot overlaps with any existing appointment
//           const isSlotAvailable = !existingAppointments.some((appointment) => {
//             const appointmentStart = dayjs(
//               `2000-01-01 ${appointment.startTime}`,
//               "YYYY-MM-DD HH:mm"
//             );
//             const appointmentEnd = dayjs(
//               `2000-01-01 ${appointment.endTime}`,
//               "YYYY-MM-DD HH:mm"
//             );

//             return (
//               currentTime.isBefore(appointmentEnd) &&
//               nextSlotTime.isAfter(appointmentStart)
//             );
//           });

//           if (isSlotAvailable) {
//             availableSlots.push({
//               startTime: currentTimeStr,
//               endTime: nextSlotTimeStr,
//             });
//           }

//           currentTime = nextSlotTime;
//         }
//       }

//       dayInfo.isAvailable = availableSlots.length > 0;
//       dayInfo.availableTimeSlots = availableSlots;
//     }

//     return Response.success(
//       res,
//       nextSevenDays,
//       200,
//       "Doctor availability retrieved successfully!"
//     );
//   } catch (err) {
//     return Response.error(
//       res,
//       500,
//       AppConstant.FAILED,
//       err.message || "Internal server error!"
//     );
//   }
// };

// get appointment card data

const getDateIsAvailableAndAvailableTimeSlotToBookAnAppointment = async (
  req,
  res
) => {
  try {
    const { doctorId, consultationType } = req.body;
    if (!doctorId || !consultationType) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Doctor ID and consultation type are required"
      );
    }
    const DoctorAvailability = mongoose.model("DoctorAvailability");
    const Appointment = mongoose.model("Appointment");
    // Get next 7 days
    const nextSevenDays = Array.from({ length: 7 }, (_, i) => {
      const date = dayjs().add(i, "day");
      return {
        date: date.format("YYYY-MM-DD"),
        dayOfWeek: date.format("dddd"),
        isAvailable: false,
        availableTimeSlots: [],
      };
    });
    // Get doctor's availability schedule
    const doctorSchedule = await DoctorAvailability.findOne({
      doctorId,
      status: "approved",
      consultationType,
    });

    if (!doctorSchedule) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "No availability schedule found for the doctor"
      );
    }

    // Get current time for today's slots filtering
    const currentTime = dayjs();

    // Process each day
    for (let dayInfo of nextSevenDays) {
      const daySchedule = doctorSchedule.weeklySchedule.find(
        (schedule) =>
          schedule.day.toLowerCase() === dayInfo.dayOfWeek.toLowerCase()
      );
      if (!daySchedule || daySchedule.timeSlots.length === 0) {
        continue; // Skip if doctor is not available on this day
      }
      // Get all appointments for this day
      const existingAppointments = await Appointment.find({
        doctorId,
        appointmentDate: dayInfo.date,
        status: "scheduled",
      });

      // Generate 30-minute slots from doctor's availability
      let availableSlots = [];
      for (const slot of daySchedule.timeSlots) {
        let currentSlotTime = dayjs(
          `2000-01-01 ${slot.startTime}`,
          "YYYY-MM-DD HH:mm"
        );
        const slotEndTime = dayjs(
          `2000-01-01 ${slot.endTime}`,
          "YYYY-MM-DD HH:mm"
        );

        while (currentSlotTime.isBefore(slotEndTime)) {
          const nextSlotTime = currentSlotTime.add(30, "minute");
          const currentSlotTimeStr = currentSlotTime.format("HH:mm");
          const nextSlotTimeStr = nextSlotTime.format("HH:mm");

          // Check if the next slot would exceed the end time
          if (nextSlotTime.isAfter(slotEndTime)) {
            break;
          }

          // For today's date, check if the slot is in the future
          const isToday = dayjs(dayInfo.date).isSame(currentTime, "day");
          const slotDateTime = dayjs(dayInfo.date + " " + currentSlotTimeStr);

          // Skip this slot if it's today and the slot time is in the past
          if (isToday && slotDateTime.isBefore(currentTime)) {
            currentSlotTime = nextSlotTime;
            continue;
          }

          // Check if slot overlaps with any existing appointment
          const isSlotAvailable = !existingAppointments.some((appointment) => {
            const appointmentStart = dayjs(
              `2000-01-01 ${appointment.startTime}`,
              "YYYY-MM-DD HH:mm"
            );
            const appointmentEnd = dayjs(
              `2000-01-01 ${appointment.endTime}`,
              "YYYY-MM-DD HH:mm"
            );
            return (
              currentSlotTime.isBefore(appointmentEnd) &&
              nextSlotTime.isAfter(appointmentStart)
            );
          });

          if (isSlotAvailable) {
            availableSlots.push({
              startTime: currentSlotTimeStr,
              endTime: nextSlotTimeStr,
            });
          }
          currentSlotTime = nextSlotTime;
        }
      }
      dayInfo.isAvailable = availableSlots.length > 0;
      dayInfo.availableTimeSlots = availableSlots;
    }
    return Response.success(
      res,
      nextSevenDays,
      200,
      "Doctor availability retrieved successfully!"
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

const getAppointmentDashboardCardDataByDoctorId = async (req, res) => {
  try {
    const { doctorId } = req.body;

    if (!doctorId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Doctor ID is required"
      );
    }

    const [result] = await mongoose.model("Appointment").aggregate([
      {
        $match: {
          doctorId: new mongoose.Types.ObjectId(doctorId),
        },
      },
      {
        $facet: {
          // Total Appointments
          totalAppointments: [{ $count: "count" }],
          // Online Consultations
          teleConsultations: [
            {
              $match: {
                consultationType: "online",
                status: { $ne: "cancelled" },
              },
            },
            { $count: "count" },
          ],
          // Offline Consultations
          clinicConsultations: [
            {
              $match: {
                consultationType: "offline",
                status: { $ne: "cancelled" },
              },
            },
            { $count: "count" },
          ],
          // Cancelled Appointments
          cancelledAppointments: [
            {
              $match: {
                status: "cancelled",
              },
            },
            { $count: "count" },
          ],
          // Total Earnings
          totalEarnings: [
            {
              $lookup: {
                from: "patientappointmentpayments",
                localField: "_id",
                foreignField: "appointmentId",
                as: "payment",
              },
            },
            { $unwind: "$payment" },
            {
              $match: {
                "payment.status": "completed",
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$payment.amount" },
              },
            },
          ],
        },
      },
      {
        // Format the response
        $project: {
          cards: [
            {
              totalCount: {
                $ifNull: [{ $arrayElemAt: ["$totalAppointments.count", 0] }, 0],
              },
              bottomTitle: "Total Appointments",
            },
            {
              totalCount: {
                $ifNull: [{ $arrayElemAt: ["$teleConsultations.count", 0] }, 0],
              },
              bottomTitle: "Tele Consultations",
            },
            {
              totalCount: {
                $ifNull: [
                  { $arrayElemAt: ["$clinicConsultations.count", 0] },
                  0,
                ],
              },
              bottomTitle: "Clinic Consultations",
            },
            {
              totalCount: {
                $ifNull: [
                  { $arrayElemAt: ["$cancelledAppointments.count", 0] },
                  0,
                ],
              },
              bottomTitle: "Cancel Appointments",
            },
            {
              totalCount: {
                $ifNull: [{ $arrayElemAt: ["$totalEarnings.total", 0] }, 0],
              },
              bottomTitle: "Total Earnings",
            },
          ],
        },
      },
    ]);

    return Response.success(
      res,
      result.cards,
      200,
      "Dashboard data retrieved successfully!"
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

// my appointment table data
const myAppointmentTableList = async (req, res) => {
  try {
    const { doctorId, date } = req.body;

    if (!date || !doctorId) {
      return Response.error(
        res,
        500,
        AppConstant.FAILED,
        "Date or doctor ID is missing!"
      );
    }

    const data = await patientAppointmentModel.aggregate([
      {
        $match: {
          doctorId: new mongoose.Types.ObjectId(doctorId),
          $expr: {
            $eq: [
              {
                $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" },
              },
              date, // The input date in YYYY-MM-DD format
            ],
          },
        },
      },
      {
        $lookup: {
          from: "users", // Assuming "users" collection contains the patient data
          localField: "patientId",
          foreignField: "_id",
          as: "patientDetails",
        },
      },
      {
        $unwind: {
          path: "$patientDetails",
          preserveNullAndEmptyArrays: true, // In case there's no patient data
        },
      },
      {
        $project: {
          appointmentDate: 1,
          startTime: 1,
          endTime: 1,
          status: 1,
          consultationType: 1,
          profileImg: "$patientDetails.profileImg" || null,
          firstName: "$patientDetails.firstName",
          lastName: "$patientDetails.lastName",
          phone: "$patientDetails.phone",
          location: "$patientDetails.address.city" || null,
        },
      },
    ]);

    return Response.success(res, data, 200, "Appointment table data found!");
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

const myAppointmentsList = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;

    // Initialize status filter
    let statusQuery = {};
    if (status) {
      switch (status) {
        case 'active': {
          statusQuery.status = { $nin: ['completed', 'cancelled'] };  // Active appointments
          break;
        }
        case 'past': {
          statusQuery.status = { $in: ['completed', 'cancelled'] };  // Past appointments
          break;
        }
        default: {
          statusQuery.status = status;  // Exact status match
        }
      }
    }

    // Handle date range filter
    let dateQuery = {};
    if (startDate && endDate) {
      // Both start and end dates provided
      dateQuery.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      // Only start date provided
      dateQuery.appointmentDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      // Only end date provided
      dateQuery.appointmentDate = { $lte: new Date(endDate) };
    }

    // Build the aggregation pipeline with filters
    const aggregationPipeline = [
      {
        $match: {
          ...statusQuery,  // Status filter
          ...dateQuery,    // Date range filter
          patientId: new mongoose.Types.ObjectId(req.user._id)
        },
      },
      // Lookup for doctor details
      {
        $lookup: {
          from: "users",  // Assuming "users" collection contains the doctor data
          localField: "doctorId",
          foreignField: "_id",
          as: "doctorDetails",
        },
      },
      {
        $unwind: {
          path: "$doctorDetails",  // Unwind the doctor details array (since $lookup returns an array)
          preserveNullAndEmptyArrays: true,  // If no doctor data exists
        },
      },
      {
        $project: {
          appointmentDate: 1,
          startTime: 1,
          endTime: 1,
          status: 1,
          consultationType: 1,
          cancellationReason: 1,
          doctorNotes: 1,
          symptoms: 1,
          symptomsInDetail: 1,
          patientId: 1,
          doctorDetails: {
            name: { 
              $concat: [
                "$doctorDetails.firstName", 
                " ",
                "$doctorDetails.lastName"
              ]
            },
            phone: "$doctorDetails.phone",
            email: "$doctorDetails.email",
            profileImg: "$doctorDetails.profileImg"
          }
        },
      },
      {
        $facet: {
          paginatedResults: [
            {
              $skip: (Number(page) - 1) * Number(limit),  // Pagination
            },
            {
              $limit: Number(limit),
            },
          ],
          totalCount: [
            {
              $count: "total",  // Count total appointments
            },
          ],
        },
      },
    ];

    // Execute aggregation query
    const results = await patientAppointmentModel.aggregate(aggregationPipeline);

    const appointmentList = results[0].paginatedResults;
    const totalCount = results[0].totalCount[0]?.total || 0;

    return Response.success(
      res,
      {
        appointmentList,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Number(page),
        totalAppointments: totalCount,
      },
      200,
      AppConstant.SUCCESS,
      "Appointments retrieved successfully!"
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

// my appointment table data
const upcomingConsultationTableData = async (req, res) => {
  try {
    const { doctorId } = req.body;

    if (!doctorId) {
      return Response.error(
        res,
        500,
        AppConstant.FAILED,
        "doctor ID is missing!"
      );
    }

    const data = await patientAppointmentModel.aggregate([
      {
        $match: {
          doctorId: new mongoose.Types.ObjectId(doctorId),
          status: "scheduled",
        },
      },
      {
        $lookup: {
          from: "users", // Assuming "users" collection contains the patient data
          localField: "patientId",
          foreignField: "_id",
          as: "patientDetails",
        },
      },
      {
        $unwind: {
          path: "$patientDetails",
          preserveNullAndEmptyArrays: true, // In case there's no patient data
        },
      },
      {
        $project: {
          appointmentDate: 1,
          startTime: 1,
          endTime: 1,
          consultationType: 1,
          profileImg: "$patientDetails.profileImg" || null,
          firstName: "$patientDetails.firstName",
          lastName: "$patientDetails.lastName",
          phone: "$patientDetails.phone",
          location: "$patientDetails.address.city" || null,
        },
      },
    ]);

    return Response.success(
      res,
      data,
      200,
      "Upcoming Appointment table data found!"
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
// get appointment of single patient
const getAppointmentById = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        status: "FAILED",
        message: "Appointment ID is missing!",
      });
    }

    // Use aggregation to join and fetch appointment details along with related data (patient, doctor, payment)
    const appointmentDetails = await patientAppointmentModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(appointmentId),
        },
      },
      {
        $lookup: {
          from: "users", // Assuming the 'User' collection contains patient data
          localField: "patientId",
          foreignField: "_id",
          as: "patientDetails",
        },
      },
      {
        $unwind: {
          path: "$patientDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "doctors", // Assuming the 'Doctor' collection contains doctor data
          localField: "doctorId",
          foreignField: "_id",
          as: "doctorDetails",
        },
      },
      {
        $unwind: {
          path: "$doctorDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "patientappointmentpayments", // Assuming the collection for payments is 'PatientAppointmentPayments'
          localField: "_id",
          foreignField: "appointmentId",
          as: "paymentDetails",
        },
      },
      {
        $unwind: {
          path: "$paymentDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          firstName: "$patientDetails.firstName",
          lastName: "$patientDetails.lastName",
          role: "$patientDetails.role",
          userId: "$patientDetails._id",
          profileImg: "$patientDetails.profileImg" || null,
          email: "$patientDetails.email",
          phone: "$patientDetails.phone",
          address: "$patientDetails.address.city" || null,
          age: "$patientDetails.age" || null,
          jobProfile: "$patientDetails.jobProfile" || null,
          appointmentDate: {
            $dateToString: { format: "%Y-%m-%d", date: "$appointmentDate" },
          },
          startTime: "$startTime",
          endTime: "$endTime",
          emrId: "$emrId" || null,
          prescriptionId: "$prescriptionId" || null,
          consultationType: "$consultationType",
          status: "$status",
          symptoms: "$symptoms",
          symptomsInDetail: "$symptomsInDetail",
          amount: "$paymentDetails.amount",
          currency: { $ifNull: ["$paymentDetails.currency", "INR"] },
          paymentStatus: { $ifNull: ["$paymentDetails.status", "created"] },
        },
      },
    ]);

    if (appointmentDetails.length === 0) {
      return res.status(404).json({
        status: "FAILED",
        message: "Appointment not found!",
      });
    }

    return res.status(200).json({
      status: "SUCCESS",
      message: "Appointment details fetched successfully!",
      data: appointmentDetails[0], // Only one result expected
    });
  } catch (error) {
    console.error("Error fetching appointment details:", error);
    return res.status(500).json({
      status: "FAILED",
      message: "An error occurred while fetching appointment details.",
      error: error.message,
    });
  }
};
// patient appointment model for superadmin
const getAllPatientDoctorAppointmentListForAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "appointmentDate",
      sortOrder = "desc",
      status,
      consultationType,
      fromDate,
      toDate,
    } = req.query;

    // Build match conditions
    const matchConditions = {};

    // Add date range filter if provided
    if (fromDate && toDate) {
      matchConditions.appointmentDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    // Add status filter if provided
    if (status) {
      matchConditions.status = status;
    }

    // Add consultationType filter if provided
    if (consultationType) {
      matchConditions.consultationType = consultationType;
    }

    // Create search regex
    const searchRegex = new RegExp(search, "i");

    const aggregationPipeline = [
      {
        $match: matchConditions,
      },
      // Join with patients (users)
      {
        $lookup: {
          from: "users",
          localField: "patientId",
          foreignField: "_id",
          as: "patient",
        },
      },
      {
        $unwind: "$patient",
      },
      // Join with doctors
      {
        $lookup: {
          from: "users",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctor",
        },
      },
      {
        $unwind: "$doctor",
      },
      // Join with payments
      {
        $lookup: {
          from: "patientappointmentpayments",
          localField: "_id",
          foreignField: "appointmentId",
          as: "payment",
        },
      },
      {
        $unwind: {
          path: "$payment",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Search conditions
      {
        $match: {
          $or: [
            { "patient.firstName": searchRegex },
            { "patient.lastName": searchRegex },
            { "patient.phone": searchRegex },
            { "patient.city": searchRegex },
            { "doctor.firstName": searchRegex },
            { "doctor.lastName": searchRegex },
            { "doctor.specialization": searchRegex },
          ],
        },
      },
      // Transform data to match required format
      {
        $project: {
          _id: 1,
          patientProfileImg: "$patient.profileImg",
          patientFirstName: "$patient.firstName",
          patientLastName: "$patient.lastName",
          patientPhone: "$patient.phone",
          patientCity: "$patient.address.city",
          profileImg: "$doctor.profileImg",
          firstName: "$doctor.firstName",
          lastName: "$doctor.lastName",
          phone: "$doctor.phone",
          city: "$doctor.address.city",
          specialization: "$doctor.specialization",
          appointmentDate: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$appointmentDate",
            },
          },
          startTime: 1,
          endTime: 1,
          status: 1,
          consultationType: 1,
          paymentStatus: "$payment.status",
          amount: "$payment.amount",
        },
      },
      // Facet for pagination
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

    const results = await mongoose
      .model("Appointment")
      .aggregate(aggregationPipeline);

    const appointmentList = results[0].paginatedResults;
    const totalCount = results[0].totalCount[0]?.total || 0;

    return Response.success(
      res,
      {
        appointmentList,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Number(page),
        totalAppointments: totalCount,
      },
      200,
      AppConstant.SUCCESS,
      "Appointments found successfully!"
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
  getAssignedDoctorPatientForAppointmentBooking,
  getDateIsAvailableAndAvailableTimeSlotToBookAnAppointment,
  getAppointmentDashboardCardDataByDoctorId,
  myAppointmentTableList,
  myAppointmentsList,
  upcomingConsultationTableData,
  getAppointmentById,
  getAllPatientDoctorAppointmentListForAdmin,
};
