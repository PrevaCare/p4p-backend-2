const dotenv = require("dotenv");
const axios = require("axios");
dotenv.config();

const sendReminderMsgToDoctor = async (
  doctorMobile,
  doctorName,
  patientName,
  startTime
) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID;
  const route = process.env.MSG91_ROUTE;
  const templateId =
    process.env.MSG91_APPOINTMENT_REMINDER_TEMPLATE_ID_FOR_DOCTOR;

  const url = `https://control.msg91.com/api/v5/flow/`;

  try {
    const response = await axios.post(
      url,
      {
        flow_id: templateId,
        recipients: [
          {
            mobiles: `91${doctorMobile}`,
            var1: doctorName,
            var2: patientName,
            var3: startTime,
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
      console.log("Reminder msg sent successfully!");
      return true;
    } else {
      //   return new Error(response.data);
      throw new Error(response.data);
    }
  } catch (error) {
    return new Error(error);
  }
};

const sendReminderMsgToPatient = async (
  patientMobile,
  patientName,
  doctorName,
  startTime
) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID;
  const route = process.env.MSG91_ROUTE;
  const templateId =
    process.env.MSG91_APPOINTMENT_REMINDER_TEMPLATE_ID_FOR_PATIENT;

  const url = `https://control.msg91.com/api/v5/flow/`;

  try {
    const response = await axios.post(
      url,
      {
        flow_id: templateId,
        recipients: [
          {
            mobiles: `91${patientMobile}`,
            var1: patientName,
            var2: doctorName,
            var3: startTime,
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
      console.log("Reminder msg sent successfully!");
      return true;
    } else {
      //   return new Error(response.data);
      throw new Error(response.data);
    }
  } catch (error) {
    return new Error(error);
  }
};

const sendBeginAppointmentMsgToPatient = async (
  patientMobile,
  patientName,
  doctorName
) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID;
  const route = process.env.MSG91_ROUTE;
  const templateId =
    process.env.MSG91_APPOINTMENT_BEGIN_TEMPLATE_ID_FOR_PATIENT;

  const url = `https://control.msg91.com/api/v5/flow/`;

  try {
    const response = await axios.post(
      url,
      {
        flow_id: templateId,
        recipients: [
          {
            mobiles: `91${patientMobile}`,
            var1: patientName,
            var2: doctorName,
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
      console.log("Reminder msg sent successfully!");
      return true;
    } else {
      //   return new Error(response.data);
      throw new Error(response.data);
    }
  } catch (error) {
    return new Error(error);
  }
};
const sendBeginAppointmentMsgToDoctor = async (
  doctorMobile,
  doctorName,
  patientName
) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID;
  const route = process.env.MSG91_ROUTE;
  const templateId = process.env.MSG91_APPOINTMENT_BEGIN_TEMPLATE_ID_FOR_DOCTOR;

  const url = `https://control.msg91.com/api/v5/flow/`;

  try {
    const response = await axios.post(
      url,
      {
        flow_id: templateId,
        recipients: [
          {
            mobiles: `91${doctorMobile}`,
            var1: doctorName,
            var2: patientName,
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
      console.log("Reminder msg sent successfully!");
      return true;
    } else {
      //   return new Error(response.data);
      throw new Error(response.data);
    }
  } catch (error) {
    return new Error(error);
  }
};

const sendEndAppointmentMsgToDoctor = async (
  doctorMobile,
  doctorName,
  patientName
) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID;
  const route = process.env.MSG91_ROUTE;
  const templateId = process.env.MSG91_APPOINTMENT_END_TEMPLATE_ID_FOR_DOCTOR;

  const url = `https://control.msg91.com/api/v5/flow/`;

  try {
    const response = await axios.post(
      url,
      {
        flow_id: templateId,
        recipients: [
          {
            mobiles: `91${doctorMobile}`,
            var1: doctorName,
            var2: patientName,
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
      console.log("Reminder msg sent successfully!");
      return true;
    } else {
      //   return new Error(response.data);
      throw new Error(response.data);
    }
  } catch (error) {
    return new Error(error);
  }
};

const sendEndAppointmentMsgToPatient = async (
  patientMobile,
  patientName,
  doctorName
) => {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID;
  const route = process.env.MSG91_ROUTE;
  const templateId = process.env.MSG91_APPOINTMENT_END_TEMPLATE_ID_FOR_PATIENT;

  const url = `https://control.msg91.com/api/v5/flow/`;

  try {
    const response = await axios.post(
      url,
      {
        flow_id: templateId,
        recipients: [
          {
            mobiles: `91${patientMobile}`,
            var1: patientName,
            var2: doctorName,
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
      console.log("Reminder msg sent successfully!");
      return true;
    } else {
      //   return new Error(response.data);
      throw new Error(response.data);
    }
  } catch (error) {
    return new Error(error);
  }
};

module.exports = {
  sendReminderMsgToDoctor,
  sendReminderMsgToPatient,
  sendBeginAppointmentMsgToPatient,
  sendBeginAppointmentMsgToDoctor,
  sendEndAppointmentMsgToDoctor,
  sendEndAppointmentMsgToPatient,
};
