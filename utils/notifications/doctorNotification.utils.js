const appointmentBookedTemplate = (
  patientName,
  doctorId,
  appointmentDate,
  startTime,
  endTime,
  consultationType,
  symptoms,
  symptomsInDetail,
  patientPhone,
  doctorName
) => {
  if (!doctorId) {
    throw new Error("User ID is missing!");
  }

  return {
    userId: doctorId,
    title: "Appointment Booked",
    message: `A **${consultationType}** appointment with patient name **${patientName}** and phone no **${patientPhone}** has been created at **${appointmentDate}** from **${startTime}** to **${endTime}**. 
  
  Appointment Details:
  - Patient Name: **${patientName}**
  - Patient Phone: **${patientPhone}**
  - Appointment Date: **${appointmentDate}**
  - Start Time: **${startTime}**
  - End Time: **${endTime}**
  - Consultation Type: **${consultationType}**
  - Symptoms: **${symptoms}**
  - Symptoms in Detail: **${symptomsInDetail}**`,
  };
};

module.exports = {
  appointmentBookedTemplate,
};
