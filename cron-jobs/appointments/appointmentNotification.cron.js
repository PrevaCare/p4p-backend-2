const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");

// Extend Day.js with custom parsing for HH:mm format
dayjs.extend(customParseFormat);

const patientAppointmentModel = require("../../models/patient/patientAppointment/patientAppointment.model");
const { sendReminderMsgToPatient,
    sendReminderMsgToDoctor,
    sendBeginAppointmentMsgToPatient,
    sendBeginAppointmentMsgToDoctor,
    sendEndAppointmentMsgToDoctor,
    sendEndAppointmentMsgToPatient } = require("../../helper/messageScheduler/appointmentMessage.helper");

const sendAppointmentNotification = async (req, res) => {
    const now = new Date();

    // Target slot time = 30 minutes from now
    const targetTime = new Date(now.getTime() + 30 * 60 * 1000);
    const hour = targetTime.getHours().toString().padStart(2, '0');
    const minute = targetTime.getMinutes().toString().padStart(2, '0');
    const targetTimeStr = `${hour}:${minute}`; // e.g., "09:30"
    const nowTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`; // e.g., "09:30"

    const today = targetTime.toISOString().split('T')[0]; // YYYY-MM-DD
    console.log("Target Time:", targetTimeStr);
    console.log("Now Time:", nowTimeStr);
    // 🔍 Get appointments for today starting at `targetTimeStr`

    const appointments = await patientAppointmentModel.find({
        appointmentDate: today,
        $or: [
            { startTime: nowTimeStr },      // Appointments starting now
            { startTime: targetTimeStr },   // Appointments starting in 30 minutes
            { endTime: nowTimeStr }         // Appointments ending now
        ],
        status: "scheduled"
    }).select('startTime endTime doctorId patientId') // only fetch what's needed
        .populate({
            path: 'doctorId',
            select: 'firstName lastName phone'
        })
        .populate({
            path: 'patientId',
            select: 'firstName lastName phone'
        }).lean();

    console.log("Appointments:", appointments);
    for (const appt of appointments) {
        const doctorName = appt.doctorId.firstName + " " + appt.doctorId.lastName;
        const patientName = appt.patientId.firstName + " " + appt.patientId.lastName;
        const patientMobile = appt.patientId.phone;
        const doctorMobile = appt.doctorId.phone;
        const startTime = "30 minutes";

        console.log("Single Appointment:", appt);

        if (appt.startTime == nowTimeStr) {
            console.log("Appointment is starting now");
            await sendBeginAppointmentMsgToDoctor(
                doctorMobile,
                doctorName,
                patientName
            );
            await sendBeginAppointmentMsgToPatient(
                patientMobile,
                patientName,
                doctorName
            );
        }
        if (appt.startTime == targetTimeStr) {
            await sendReminderMsgToDoctor(
                doctorMobile,
                doctorName,
                patientName,
                startTime
            );

            await sendReminderMsgToPatient(
                patientMobile,
                patientName,
                doctorName,
                startTime
            );
        }
        if (appt.endTime == nowTimeStr) {
            await sendEndAppointmentMsgToDoctor(
                doctorMobile,
                doctorName,
                patientName
            );
            await sendEndAppointmentMsgToPatient(
                patientMobile,
                patientName,
                doctorName
            );
        }
        res.status(200).json({ message: "Appointment notification sent successfully" });
    }
};

module.exports = {
    sendAppointmentNotification
};
