const appointmentCancellationTemplate = (
  superadminId,
  patientName,
  patientPhone,
  doctorName,
  doctorPhone,
  cancelBy,
  cancellationReason
) => {
  if (!superadminId) {
    throw new Error("User ID is missing!");
  }

  return {
    userId: superadminId,
    title: "Appointment Cancelled",
    message: `The appointment with patient name **${patientName}** and phone no **${patientPhone}** has been cancelled by a **${cancelBy}**. 
  
  Cancellation Details:
  - Patient Name: **${patientName}**
  - Patient Phone: **${patientPhone}**
  - Doctor Name: **${doctorName}**
  - Doctor Phone: **${doctorPhone}**
  - Cancelled By: **${cancelBy}**
  
  Cancellation Reason: **${cancellationReason}**`,
  };
};
const doctorScheduleChangeRequestTemplate = (
  superadminId,
  doctorName,
  doctorPhone,
  reason
) => {
  if (!superadminId) {
    throw new Error("Superadmin ID is missing!");
  }

  return {
    userId: superadminId,
    title: "Doctor Schedule Change Request",
    message: `
      A request has been made to change the schedule for the following doctor:

    **Doctor Details:**
    - Name: **${doctorName}**
    - Phone: **${doctorPhone}**

    **Reason for Change:**
    - ${reason}

    Please review and approve this request at your earliest convenience.
    `,
  };
};

module.exports = {
  appointmentCancellationTemplate,
  doctorScheduleChangeRequestTemplate,
};
