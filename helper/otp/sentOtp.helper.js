const dotenv = require("dotenv");
const axios = require("axios");
dotenv.config();
const sendOtp = async (mobile, otp) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID;
  const route = process.env.MSG91_ROUTE;
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID;

  const url = `https://api.msg91.com/api/v5/otp`;

  try {
    const response = await axios.post(
      url,
      {
        template_id: templateId,
        mobile: `91${mobile}`, // Ensure mobile number format is correct
        otp: otp,
        sender: senderId,
        authkey: authKey,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.type === "success") {
      console.log("OTP sent successfully!");
      return true;
    } else {
      //   return new Error(response.data);
      throw new Error(response.data);
    }
  } catch (error) {
    return new Error(error);
  }
};

// send general messages
const sendMessage = async (mobile, templateId) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID;
  const route = process.env.MSG91_ROUTE; // Ensure the route is configured for transactional messages

  const url = `https://api.msg91.com/api/v5/sms`;

  try {
    const response = await axios.post(
      url,
      {
        sender: senderId,
        route: route,
        country: "91", // Country code for India
        template_id: templateId,
        mobiles: [`91${mobile}`], // Ensure the mobile number format is correct
        message: "Hello, this is a test message",
        // sms: [
        //   {
        //     message: message, // The message content
        //     to: [`91${mobile}`], // Ensure the mobile number format is correct
        //   },
        // ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          authkey: authKey, // Add the authkey in the headers if required
        },
      }
    );

    if (response.data.type === "success") {
      console.log("Message sent successfully!");
      return true;
    } else {
      throw new Error(response.data);
    }
  } catch (error) {
    console.error("Error sending message:", error.message);
    return new Error(error);
  }
};

const sendBookingMsgToDoctor = async (mobile, patientname, appointmentDate, startTime, endTime) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID;
  const route = process.env.MSG91_ROUTE;
  const templateId = process.env.MSG91_APPOINTMENT_BOOKED_TEMPLATE_ID_FOR_DOCTOR;

  const url = `https://control.msg91.com/api/v5/flow/`;

  try {
    const response = await axios.post(
      url,
      {
        flow_id: templateId,
        recipients: [
          {
            mobiles: `91${mobile}`,
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

    if (response.data.type === "success") {
      console.log("Booking msg sent successfully!");
      return true;
    } else {
      //   return new Error(response.data);
      throw new Error(response.data);
    }
  } catch (error) {
    return new Error(error);
  }
};


const sendBookingMsgToPatient = async (mobile, doctorName, appointmentDate, startTime, endTime) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID;
  const route = process.env.MSG91_ROUTE;
  const templateId = process.env.MSG91_APPOINTMENT_BOOKED_TEMPLATE_ID_FOR_PATIENT;

  const url = `https://control.msg91.com/api/v5/flow/`;

  try {
    const response = await axios.post(
      url,
      {
        flow_id: templateId,
        recipients: [
          {
            mobiles: `91${mobile}`,
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

    if (response.data.type === "success") {
      console.log("Booking msg sent successfully!");
      return true;
    } else {
      //   return new Error(response.data);
      throw new Error(response.data);
    }
  } catch (error) {
    return new Error(error);
  }
};
module.exports = { sendOtp, sendMessage, sendBookingMsgToPatient, sendBookingMsgToDoctor };
