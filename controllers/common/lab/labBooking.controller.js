const mongoose = require("mongoose");
const AppConstant = require("../../../utils/AppConstant");
const Response = require("../../../utils/Response");
const LabBooking = require("../../../models/lab/labBooking.model");
const IndividualLabTest = require("../../../models/lab/individualLabTest.model");
const LabPackage = require("../../../models/lab/labPackage.model");
const Lab = require("../../../models/lab/lab.model");
const userModel = require("../../../models/common/user.model")
const {
  labBookingCreateSchema,
  labBookingUpdateSchema,
} = require("../../../validators/lab/labBooking.validator");
const dayjs = require("dayjs");
const { razorpayInstance } = require("../../../config/razorpay.config");
const moment = require("moment-timezone")
const axios = require("axios")

/**
 * Create a new lab test/package booking
 * @route POST /v1/app/lab-bookings
 */

function adjustSchedule(scheduledDate, scheduledTime) {
  // Parse the scheduled date and time
  let scheduledDateTime = moment(`${scheduledDate} ${scheduledTime}`, 'YYYY-MM-DD HH:mm');

  // Get current time
  const currentTime = moment();

  let adjustedDate;
  let adjustedTime;

  // Check if the scheduled time is before or after noon
  if (scheduledDateTime.isBefore(moment().startOf('day').add(12, 'hours'))) {
    // Before 12:00 PM (same day)
    if (currentTime.isBefore(scheduledDateTime)) {
      adjustedDate = scheduledDate;
      adjustedTime = currentTime.add(3, 'hours').format('HH:mm'); // Add 3 hours
    }
  } else if (scheduledDateTime.isAfter(moment().startOf('day').add(12, 'hours')) && scheduledDateTime.isBefore(moment().startOf('day').add(20, 'hours'))) {
    // After 12:00 PM to 7:59 PM, next day
    adjustedDate = moment().add(1, 'days').format('YYYY-MM-DD');  // Set the next day
    adjustedTime = '07:00'; // Set start time to 7:00 AM
  } else if (scheduledDateTime.isAfter(moment().startOf('day').add(20, 'hours'))) {
    // After 8:00 PM, day after tomorrow
    adjustedDate = moment().add(2, 'days').format('YYYY-MM-DD');  // Set the day after tomorrow
    adjustedTime = '07:00'; // Set start time to 7:00 AM
  } else {
    // Default case (Anytime), 24-hour rule
    adjustedDate = currentTime.add(1, 'days').format('YYYY-MM-DD');
    adjustedTime = moment().add(24, 'hours').format('HH:mm');
  }

  return { adjustedDate, adjustedTime };
}

async function sendLabBookingRequestMsgToPatient(
  mobile,
  patientname,
  testName,
  appointmentDate,
  appointmentTime,
  paymentLink
) {
  mobile = '7455090168'
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID;
  const templateId =
    process.env.MSG91_LAB_BOOKING_TEMPLATE_ID_FOR_PATIENT;
    
    const url = `https://control.msg91.com/api/v5/flow/`;
    console.log(url,
      {
        flow_id: templateId,
        recipients: [
          {
            mobiles: `91${mobile}`,
            var1: patientname,
            var2: testName,
            var3: appointmentDate,
            var4: appointmentTime,
            var5: paymentLink,
          },
        ],
        sender: senderId,
        authkey: authKey,
      })

  try {
    const response = await axios.post(
      url,
      {
        flow_id: templateId,
        recipients: [
          {
            mobiles: `91${mobile}`,
            var1: patientname,
            var2: testName,
            var3: appointmentDate,
            var4: appointmentTime,
            var5: paymentLink,
          },
        ],
        sender: senderId,
        authkey: authKey,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log({response})

    if (response.data.type === "success") {
      console.log("Booking msg sent successfully!");
      return true;
    } else {
      //   return new Error(response.data);
      throw new Error(response.data);
    }
  } catch (error) {
    console.log({error})
    return new Error(error);
  }
};

const createLabBooking = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = labBookingCreateSchema.validate(req.body);
    if (error) {
      console.log("Validation error:", error.details);
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.details[0].message
      );
    }

    const {
      labId,
      // bookingType,
      testId,
      // packageId,
      scheduledDate,
      scheduledTime,
      homeCollection = false,
      // location,
      bookingFor = "self",
      patientId,
      pinCode
    } = value;

    const { adjustedDate, adjustedTime } = adjustSchedule(scheduledDate, scheduledTime);

    // Verify lab exists
    const lab = await Lab.findById(labId);
    if (!lab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // Determine bookedFor based on bookingFor field
    let bookedFor = req.user._id; // Default: booking for self

    // If booking for someone else, create or find user
    if (bookingFor !== "self") {
      bookedFor = patientId
    }

    // Verify test or package exists based on bookingType
    let bookingType = "Test"
    let serviceId = testId;
    let service = await IndividualLabTest.findById(testId);

    if (!service) {
      service = await LabPackage.findById(testId);
      bookingType = "Package"
    }

    if (bookingType === "Test") {
      if (!service) {
        return Response.error(res, 404, AppConstant.FAILED, "Test not found");
      }
      if (service.lab.toString() !== labId) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "The specified test is not offered by the selected lab"
        );
      }
    } else {
      if (!service) {
        return Response.error(
          res,
          404,
          AppConstant.FAILED,
          "Package not found"
        );
      }

      // Check if the package belongs to the specified lab
      if (service.labId.toString() !== labId) {
        return Response.error(
          res,
          400,
          AppConstant.FAILED,
          "The specified package is not offered by the selected lab"
        );
      }
    }

    const userInfo = await userModel.findOne(
      {
        _id: bookedFor,
        $or: [{ role: "Employee" }, { role: "IndividualUser" }, { role: "Superadmin"} ],
      },
      {
        email: 1,
        phone: 1,
        role: 1,
        profileImg: 1,
        firstName: 1,
        lastName: 1,
        gender: 1,
        address: 1,
        isMarried: 1,
        age: 1,
        weight: 1,
        jobProfile: 1,
        department: 1,
        corporate: 1,
        // createdAt: 1,
      }
    );

    console.log({userInfo})
    let userAddress = null;
    if (userInfo.role === "Employee") {
      userAddress = (await Employee.findById(patientId).select("address"))
        ?.address;
    } else if (userInfo.role === "IndividualUser") {
      userAddress = (
        await IndividualUser.findById(patientId).select("address")
      )?.address;
    }

    // Check if service is available in the specified userAddress
    // if (userAddress) {
    //   const { city, state, pinCode } = userAddress;
    //   console.log(
    //     `Checking availability in ${city}, ${state || ""} ${pinCode || ""}`
    //   );

    //   // Find matching city in the service's cityAvailability array
    //   let matchingCity = null;

    //   if (service.cityAvailability && service.cityAvailability.length > 0) {
    //     console.log(
    //       "Available cities:",
    //       service.cityAvailability.map((c) => c.cityName).join(", ")
    //     );

    //     // Try to match by city name (case-insensitive)
    //     const normalizedCityName = city.toLowerCase().trim();
    //     const normalizedState = state ? state.toLowerCase().trim() : null;

    //     matchingCity = service.cityAvailability.find((cityData) => {
    //       const cityMatches =
    //         cityData.cityName &&
    //         cityData.cityName.toLowerCase().trim() === normalizedCityName;

    //       // If state is provided, match that too
    //       if (normalizedState && cityMatches) {
    //         return (
    //           cityData.state &&
    //           cityData.state.toLowerCase().trim() === normalizedState
    //         );
    //       }

    //       return cityMatches;
    //     });

    //     // If no match by name, try by pin code if provided
    //     if (!matchingCity && pinCode) {
    //       matchingCity = service.cityAvailability.find((cityData) => {
    //         // Check if pinCode is not in the excluded list
    //         return (
    //           cityData.cityName.toLowerCase().includes(normalizedCityName) &&
    //           (!cityData.pinCodes_excluded ||
    //             !cityData.pinCodes_excluded.includes(pinCode))
    //         );
    //       });
    //     }
    //   }

    //   if (!matchingCity) {
    //     console.log("No matching city found for location");
    //     return Response.error(
    //       res,
    //       400,
    //       AppConstant.FAILED,
    //       `${bookingType} is not available in the specified location (${city}, ${
    //         state || ""
    //       } ${pinCode || ""})`
    //     );
    //   }

    //   console.log("Matching city found:", matchingCity.cityName);
    //   console.log(
    //     "Home collection available:",
    //     matchingCity.homeCollectionAvailable
    //   );

    //   // If home collection is requested, check if it's available in this location
    //   if (homeCollection && !matchingCity.homeCollectionAvailable) {
    //     return Response.error(
    //       res,
    //       400,
    //       AppConstant.FAILED,
    //       "Home collection is not available in this location"
    //     );
    //   }

    //   // Use the matching city for pricing
    //   var cityAvailability = matchingCity;
    // } else {
    //   // Fall back to finding any available city
    //   var cityAvailability = service.cityAvailability?.[0];
    // }

    // if (!cityAvailability) {
    //   return Response.error(
    //     res,
    //     400,
    //     AppConstant.FAILED,
    //     `${bookingType} is not available in any city`
    //   );
    // }

    let cityAvailability = service.cityAvailability?.find((cityData) => {
      const { pinCodes_included = [], pinCodes_excluded = [] } = cityData;
    
      return (
        pinCodes_included.includes(pinCode) || !pinCodes_excluded.includes(pinCode)
      );
    });

    if (homeCollection && !cityAvailability.homeCollectionAvailable) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Home collection is not available in this location"
      );
    }

    let amount = 0
    if (userInfo.role === "IndividualUser") {
      amount = cityAvailability.prevaCarePriceForIndividual;
    } else {
      amount = cityAvailability.prevaCarePriceForCorporate
    }

    // Calculate amounts
    let homeCollectionCharge = 0;

    // If home collection is requested and available
    if (homeCollection && cityAvailability.homeCollectionAvailable) {
      homeCollectionCharge = cityAvailability.homeCollectionCharge;
    }

    // Calculate discount and total amount
    // const discountAmount = (amount * cityAvailability.discountPercentage) / 100;
    const discountAmount = 0;
    console.log({amount, homeCollectionCharge, homeCollection, cityAvailability})
    const totalAmount = amount + homeCollectionCharge - discountAmount;

    // Create the booking
    const bookingData = {
      bookedby: req.user._id,
      bookedFor: bookedFor,
      labId,
      bookingType,
      scheduledDate: adjustedDate,
      scheduledTime: adjustedTime,
      homeCollection,
      amount,
      homeCollectionCharge,
      discountAmount,
      totalAmount,
      status: "Requested",
      bookingFor: bookingFor,
    };

    // Add location data if provided
    if (cityAvailability) {
      bookingData.location = {
        city: cityAvailability.cityName,
        state: cityAvailability.state,
        pinCode,
        address: cityAvailability.state || cityAvailability.cityName
      };
    }

    // Add patient relationship if provided
    if (bookedFor && bookedFor !== "self") {
      bookingData.patientRelationship = bookedFor;
    }

    // Add the appropriate ID field based on booking type
    if (bookingType === "Test") {
      bookingData.testId = testId;
    } else {
      bookingData.packageId = testId;
    }

    console.log({bookingData})

    const newBooking = new LabBooking(bookingData);
    try {
      await newBooking.save();
      console.log("Booking created successfully with ID:", newBooking._id);
    } catch (bookingError) {
      console.error("Error saving booking:", bookingError);
      return Response.error(
        res,
        500,
        AppConstant.FAILED,
        `Error saving booking: ${bookingError.message}`
      );
    }

    console.log({newBooking})

    const shortBookingId = newBooking.toString().substring(0, 10);
    const reference_id = `book_${shortBookingId}_${Date.now() % 10000000}`; // Ensure less than 40 chars

    const customerName =
    `${newBooking.bookedby.firstName || ""} ${
      newBooking.bookedby.lastName || ""
    }`.trim() || "Customer";

    // Get service name based on booking type
    const serviceName =
    newBooking.bookingType === "Test"
      ? newBooking.testId?.testName
      : newBooking.packageId?.packageName;

    const paymentLinkData = {
      amount: amount, // Amount in smallest currency unit (paise)
      // amount: 100, // Amount in smallest currency unit (paise)
      currency: "INR",
      accept_partial: false,
      description: `Payment for ${serviceName} at ${newBooking.labId.labName}`,
      customer: {
        name: customerName,
        email: newBooking.bookedby.email || `user${Date.now()}@example.com`,
        contact: newBooking.bookedby.phone ? `+91${newBooking.bookedby.phone}` : "+919899500873",
        // contact: "+917667629574",
      },
      notify: {
        sms: true, // Disable SMS notifications as requested
        email: false, // Disable email notifications as requested
      },
      reminder_enable: false, // Disable reminders as well
      notes: {
        booking_id: newBooking._id.toString(),
        service_name: serviceName,
        booking_type: newBooking.bookingType,
      },
      callback_url: `${
        process.env.FRONTEND_URL || "https://preva.care"
      }/payment/callback?bookingId=${newBooking._id.toString()}`,
      callback_method: "get",
      reference_id: reference_id,
    };

    try {
      // Create payment link using Razorpay API
      const paymentLink =
        await razorpayInstance.paymentLink.create(paymentLinkData);

      // Update booking with payment link details
      newBooking.paymentLink = paymentLink.short_url;
      newBooking.paymentLinkId = paymentLink.id;

      // Add note to status history
      newBooking.statusHistory.push({
        status: newBooking.status,
        timestamp: new Date(),
        notes: "Payment link generated",
        updatedBy: req.user._id,
      });

      await newBooking.save();

      await sendLabBookingRequestMsgToPatient(
        userInfo.mobile,
        customerName,
        bookingType === "Test" ? service.testName : service.packageName,
        adjustedDate,
        adjustedTime,
        paymentLink?.short_url
      )

      return Response.success(
        res,
        newBooking,
        200,
        `Lab ${bookingType.toLowerCase()} booking created successfully`
      );
    } catch (razorpayError) {
      console.error("Razorpay API error:", razorpayError);
      return Response.error(
        res,
        500,
        AppConstant.FAILED,
        `Error from payment gateway: ${
          razorpayError.error?.description ||
          razorpayError.message ||
          "Unknown payment gateway error"
        }`
      );
    }
  } catch (error) {
    console.error("Error creating lab booking:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error"
    );
  }
};

/**
 * Get all lab bookings for authenticated user
 * @route GET /v1/app/lab-bookings
 */
const getUserLabBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const bookingType = req.query.bookingType;

    // Build query to get bookings where user is either the booker or the person booked for
    // const query = {
    //   $or: [{ bookedby: req.user._id }, { bookedFor: req.user._id }],
    // };
    const query = {
      $or: [{ bookedFor: req.user._id }],
    };

    // Add filters if provided
    if (status) {
      switch (status) {
        case 'active':
          query.status = { $nin: ['Completed', 'Cancelled', 'Rejected'] };
          break;
        case 'closed':
          query.status = { $in: ['Cancelled', 'Rejected'] };
          break;
        case 'completed':
          query.status = 'Completed'
          break;
        default:
          query.status = status
      }
    };

    if (bookingType) query.bookingType = bookingType;

    const bookings = await LabBooking.find(query)
      .populate("labId", "labName")
      .populate("testId", "testName testCode")
      .populate("packageId", "packageName packageCode")
      .populate("bookedby", "firstName lastName email phone")
      .populate("bookedFor", "firstName lastName email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalBookings = await LabBooking.countDocuments(query);

    // Separate bookings into self and other bookings
    const selfBookings = bookings.filter(
      (booking) => booking.bookingFor === "self"
    );
    // const otherBookings = bookings.filter(
    //   (booking) => booking.bookingFor === "other"
    // );

    return Response.success(
      res,
      {
        // selfBookings,
        // otherBookings,
        bookings: selfBookings,
        pagination: {
          total: totalBookings,
          pages: Math.ceil(totalBookings / limit),
          page,
          limit,
        },
      },
      200,
      "Lab bookings retrieved successfully"
    );
  } catch (error) {
    console.error("Error fetching user lab bookings:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error"
    );
  }
};

/**
 * Get single lab booking details
 * @route GET /v1/app/lab-bookings/:bookingId
 */
const getLabBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid booking ID format"
      );
    }

    const booking = await LabBooking.findById(bookingId)
      .populate("labId", "labName logo address")
      .populate(
        "testId",
        "testName testCode desc category testIncluded sampleRequired preparationRequired"
      )
      .populate(
        "packageId",
        "packageName packageCode desc category testIncluded sampleRequired preparationRequired"
      )
      .populate("bookedby", "name email phone address")
      .populate("statusHistory.updatedBy", "name email");

    if (!booking) {
      return Response.error(res, 404, AppConstant.FAILED, "Booking not found");
    }

    // Check if the booking belongs to the authenticated user
    if (booking.bookedby._id.toString() !== req.user._id.toString()) {
      return Response.error(
        res,
        403,
        AppConstant.FAILED,
        "You don't have permission to view this booking"
      );
    }

    return Response.success(
      res,
      booking,
      200,
      "Booking details retrieved successfully"
    );
  } catch (error) {
    console.error("Error fetching booking details:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error"
    );
  }
};

/**
 * Update user's lab booking (date, time, etc.)
 * @route PATCH /v1/app/lab-bookings/:bookingId
 */
const updateLabBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Invalid booking ID format"
      );
    }

    // Validate request body
    const { error, value } = labBookingUpdateSchema.validate(req.body);
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.details[0].message
      );
    }

    // Find the booking
    const booking = await LabBooking.findById(bookingId);

    if (!booking) {
      return Response.error(res, 404, AppConstant.FAILED, "Booking not found");
    }

    // Check if the booking belongs to the authenticated user
    if (booking.bookedby.toString() !== req.user._id.toString()) {
      return Response.error(
        res,
        403,
        AppConstant.FAILED,
        "You don't have permission to update this booking"
      );
    }

    // Check if booking is in a state that can be updated
    if (!["Requested", "Confirmed"].includes(booking.status)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "This booking cannot be updated because it is already in progress"
      );
    }

    const { scheduledDate, scheduledTime, homeCollection, cancellationReason } =
      value;

    // If user is cancelling the booking
    if (cancellationReason) {
      booking.status = "Cancelled";
      booking.cancellationReason = cancellationReason;
      booking.statusHistory.push({
        status: "Cancelled",
        timestamp: new Date(),
        notes: `Cancelled by user: ${cancellationReason}`,
        updatedBy: req.user._id,
      });
    } else {
      // If rescheduling
      const updates = {};
      let needsValidation = false;

      if (scheduledDate) {
        updates.scheduledDate = scheduledDate;
        needsValidation = true;
      }

      if (scheduledTime) {
        updates.scheduledTime = scheduledTime;
        needsValidation = true;
      }

      if (homeCollection !== undefined) {
        updates.homeCollection = homeCollection;
      }

      // If date or time was updated, validate the new slot
      if (needsValidation) {
        const validationError = await LabBooking.validateTimeSlot({
          labId: booking.labId,
          scheduledDate: scheduledDate || booking.scheduledDate,
          scheduledTime: scheduledTime || booking.scheduledTime,
        });

        if (validationError) {
          return Response.error(res, 400, AppConstant.FAILED, validationError);
        }
      }

      // Update booking with new values
      Object.assign(booking, updates);

      // Add reschedule note to status history if date or time changed
      if (scheduledDate || scheduledTime) {
        booking.statusHistory.push({
          status: booking.status,
          timestamp: new Date(),
          notes: "Booking rescheduled by user",
          updatedBy: req.user._id,
        });
      }
    }

    await booking.save();

    return Response.success(
      res,
      booking,
      200,
      cancellationReason
        ? "Booking cancelled successfully"
        : "Booking updated successfully"
    );
  } catch (error) {
    console.error("Error updating lab booking:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error"
    );
  }
};

/**
 * Get available time slots for a lab test/package
 * @route GET /v1/app/labs/:labId/available-slots
 */
const getAvailableTimeSlots = async (req, res) => {
  try {
    const { labId } = req.params;
    const { date, bookingType, serviceId } = req.query;

    console.log(
      `Getting available time slots for lab ${labId} on date ${date}`
    );

    if (!date) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Date parameter is required"
      );
    }

    // Verify lab exists
    const lab = await Lab.findById(labId);
    if (!lab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // If serviceId is provided, verify it exists and belongs to the lab
    if (bookingType && serviceId) {
      let service;

      if (bookingType === "Test") {
        service = await IndividualLabTest.findById(serviceId);
        if (!service) {
          return Response.error(res, 404, AppConstant.FAILED, "Test not found");
        }
        if (service.lab.toString() !== labId) {
          return Response.error(
            res,
            400,
            AppConstant.FAILED,
            "The specified test is not offered by the selected lab"
          );
        }
      } else if (bookingType === "Package") {
        service = await LabPackage.findById(serviceId);
        if (!service) {
          return Response.error(
            res,
            404,
            AppConstant.FAILED,
            "Package not found"
          );
        }
        if (service.labId.toString() !== labId) {
          return Response.error(
            res,
            400,
            AppConstant.FAILED,
            "The specified package is not offered by the selected lab"
          );
        }
      }
    }

    // Prepare date range for the selected date
    const selectedDate = dayjs(date);
    const startOfDay = selectedDate.startOf("day").toDate();
    const endOfDay = selectedDate.endOf("day").toDate();

    // Generate all possible time slots from 7 AM to 8 PM in 30-minute intervals
    const allTimeSlots = [];
    const slotDuration = 30; // in minutes

    // Create time slots from 7 AM to 8 PM (20:00)
    const startTime = dayjs().hour(7).minute(0).second(0); // 7 AM
    const endTime = dayjs().hour(20).minute(0).second(0); // 8 PM

    let currentSlot = startTime;
    while (currentSlot.isBefore(endTime)) {
      const timeSlot = currentSlot.format("HH:mm");
      allTimeSlots.push(timeSlot);
      currentSlot = currentSlot.add(slotDuration, "minute");
    }

    console.log(`Generated ${allTimeSlots.length} possible time slots`);

    // Maximum bookings per time slot - should match the value in validateTimeSlot
    const MAX_BOOKINGS_PER_SLOT = 5;

    // Find existing bookings for the date and get counts by time slot
    const existingBookings = await LabBooking.find({
      labId,
      scheduledDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: { $nin: ["Cancelled", "Rejected"] },
    }).select("scheduledTime");

    console.log(
      `Found ${existingBookings.length} existing bookings on this date`
    );

    // Count bookings per time slot
    const bookingsCountBySlot = {};
    existingBookings.forEach((booking) => {
      const time = booking.scheduledTime;
      bookingsCountBySlot[time] = (bookingsCountBySlot[time] || 0) + 1;
    });

    console.log("Booking counts by slot:", bookingsCountBySlot);

    // Create time slot details with availability and capacity information
    const timeSlotDetails = allTimeSlots.map((slot) => {
      const bookingCount = bookingsCountBySlot[slot] || 0;
      return {
        time: slot,
        available: bookingCount < MAX_BOOKINGS_PER_SLOT,
        currentBookings: bookingCount,
        remainingCapacity: MAX_BOOKINGS_PER_SLOT - bookingCount,
        isFull: bookingCount >= MAX_BOOKINGS_PER_SLOT,
      };
    });

    // Filter to just available slots if needed
    const availableSlots = timeSlotDetails
      .filter((slot) => slot.available)
      .map((slot) => slot.time);

    return Response.success(
      res,
      {
        date,
        availableSlots,
        allSlots: timeSlotDetails,
        operationalHours: {
          start: "07:00",
          end: "20:00",
        },
        slotDuration: slotDuration,
        maxBookingsPerSlot: MAX_BOOKINGS_PER_SLOT,
      },
      200,
      "Available time slots retrieved successfully"
    );
  } catch (error) {
    console.error("Error fetching available time slots:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error"
    );
  }
};

/**
 * Check if a specific time slot is available
 * @route GET /v1/app/labs/:labId/check-slot
 */
const checkTimeSlotAvailability = async (req, res) => {
  try {
    const { labId } = req.params;
    const { date, time } = req.query;

    console.log(
      `Checking time slot availability for lab ${labId} on date ${date} at time ${time}`
    );

    if (!date || !time) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Date and time parameters are required"
      );
    }

    // Verify lab exists
    const lab = await Lab.findById(labId);
    if (!lab) {
      return Response.error(res, 404, AppConstant.FAILED, "Lab not found");
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Time must be in HH:MM format"
      );
    }

    // Check if the time is within operational hours
    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const requestedTimeMinutes = timeToMinutes(time);
    if (
      requestedTimeMinutes < timeToMinutes("07:00") ||
      requestedTimeMinutes > timeToMinutes("20:00")
    ) {
      return Response.success(
        res,
        {
          date,
          time,
          isAvailable: false,
          reason: "Booking time must be between 7AM and 8PM",
        },
        200,
        "Time slot availability checked"
      );
    }

    // Check for existing bookings in the same time slot
    const selectedDate = dayjs(date);
    const startOfDay = selectedDate.startOf("day").toDate();
    const endOfDay = selectedDate.endOf("day").toDate();

    const existingBookings = await LabBooking.find({
      labId,
      scheduledDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      scheduledTime: time,
      status: { $nin: ["Cancelled", "Rejected"] },
    }).countDocuments();

    console.log(
      `Found ${existingBookings} existing bookings at this time slot`
    );

    // Set maximum bookings per time slot
    const MAX_BOOKINGS_PER_SLOT = 5; // Should match the value in the model

    let isAvailable = true;
    let capacityMessage = null;

    if (existingBookings >= MAX_BOOKINGS_PER_SLOT) {
      isAvailable = false;
      capacityMessage = `This time slot has reached maximum capacity (${MAX_BOOKINGS_PER_SLOT} bookings). Please try a different time.`;
    }

    return Response.success(
      res,
      {
        date,
        time,
        isAvailable,
        currentBookings: existingBookings,
        maxCapacity: MAX_BOOKINGS_PER_SLOT,
        reason: isAvailable ? null : capacityMessage,
        operationalHours: {
          start: "07:00",
          end: "20:00",
        },
      },
      200,
      "Time slot availability checked"
    );
  } catch (error) {
    console.error("Error checking time slot availability:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error"
    );
  }
};

module.exports = {
  createLabBooking,
  getUserLabBookings,
  getLabBookingDetails,
  updateLabBooking,
  getAvailableTimeSlots,
  checkTimeSlotAvailability,
};
