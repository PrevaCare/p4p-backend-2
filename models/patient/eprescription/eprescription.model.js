const mongoose = require("mongoose");

const VitalsSchema = new mongoose.Schema({
  BP: String,
  PR: String,
  SpO2: String,
});

const PrescribedMedicationSchema = new mongoose.Schema({
  drugName: String,
  freequency: String,
  duration: String,
  quantity: String,
});
const dxSchema = new mongoose.Schema({
  diagnosisName: String,
  dateOfDiagnosis: Date,
});

const ePrescriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user is required !"],
    },
    patient: {
      name: String,
      age: Number,
      gender: String,
    },
    doctor: {
      firstName: String,
      lastName: String,
      degree: String,
      specialization: String,
      medicalRegistrationNumber: String,
      eSign: String,
    },
    date: Date,
    prescriptionID: String,
    sx: String,
    vitals: VitalsSchema,
    dx: [dxSchema],
    labTest: [String],
    rx: [PrescribedMedicationSchema],
    advice: [String],

    followUpSchedule: { type: String },
    consultationMode: {
      type: String,
      enum: ["on site", "online"],
    },

    ePrescriptionFileUrl: {
      type: String,
      // required: [true, "prescription pdf required !"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Eprescription", ePrescriptionSchema);

// // const mongoose = require("mongoose");

// // const ePrescriptionSchema = new mongoose.Schema(
// //   {
// //     user: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: "User",
// //       required: true,
// //     },
// //     documentName: {
// //       type: String,
// //       required: true,
// //     },
// //     selectedDate: {
// //       type: Date,
// //       required: true,
// //     },
// //     doctorName: {
// //       type: String,
// //       required: true,
// //     },
// //     speciality: {
// //       type: String,
// //       required: true,
// //     },
// //   },
// //   { timestamps: true }
// // );

// // module.exports = mongoose.model("Eprescription", ePrescriptionSchema);
