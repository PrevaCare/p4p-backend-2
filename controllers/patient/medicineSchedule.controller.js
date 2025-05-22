const MedicineSchedule = require("../../models/patient/medicineSchedule.model");
const EMR = require("../../models/common/emr.model");
const AdultFemaleEMR = require("../../models/EMR/adultFemaleEMR.model");
const AdultMaleEMR = require("../../models/EMR/adultMaleEMR.model");
const User = require("../../models/common/user.model");
const mongoose = require("mongoose");
const AppConstant = require("../../utils/AppConstant");
const Response = require("../../utils/Response");
const {
  employeeMedicinesValidationSchema,
} = require("../../validators/patient/employeeMedicines.validation");
const puppeteer = require("puppeteer");
const { launchPuppeteerBrowser } = require("../common/corporates/employees/emr/generateEMRPdf.controller");

// 1. Get medicine schedules for Individual User - App API
exports.getMedicineSchedulesForUser = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find active medicine schedules for the user
    const medicineSchedules = await MedicineSchedule.find({
      user: userId,
      isActive: true,
    })
      .populate({
        path: "medicines.source.doctor",
        select: "firstName lastName education specialization",
      })
      .sort({ lastModified: -1 });

    if (!medicineSchedules || medicineSchedules.length === 0) {
      return Response.success(res, 200, AppConstant.SUCCESS, {
        schedules: [],
        message: "No medicine schedules found for the user",
      });
    }

    // Process and return the schedules
    const processedSchedules = medicineSchedules.map((schedule) => {
      const data = {
        _id: schedule._id,
        title: schedule.title,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        isActive: schedule.isActive,
        lastModified: schedule.lastModified,
        medicines: schedule.medicines.map((medicine) => ({
          _id: medicine._id,
          drugName: medicine.drugName,
          dosage: medicine.dosage,
          scheduleType: medicine.scheduleType,
          source: medicine.source,
          frequency: medicine.frequency,
          timing: medicine.timing,
          instructions: medicine.instructions,
          startDate: medicine.startDate,
          endDate: medicine.endDate,
          status: medicine.status,
        })),
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
        pdfLink: schedule.pdfLink || null, // Include PDF link in response
      };
      return data;
    });

    return Response.success(res, 200, AppConstant.SUCCESS, {
      schedules: processedSchedules,
    });
  } catch (error) {
    console.error("Error fetching medicine schedules:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Error fetching medicine schedules"
    );
  }
};

// 2. Create or update medicine schedule from EMR ID
exports.createOrUpdateScheduleFromEMR = async (req, res) => {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const { emrId } = req.params;
    const userId = req.user._id;
    const emrDetails = await EMR.findById(emrId).session(session);

    if (!emrDetails) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "EMR not found with the given ID"
      );
    }

    if (emrDetails.user.toString() !== userId.toString()) {
      return Response.error(
        res,
        403,
        AppConstant.FAILED,
        "The EMR does not belong to the requesting user"
      );
    }

    // Get medicine details from EMR prescriptions
    const prescriptionMedicines = [];
    if (emrDetails.diagnosis && emrDetails.diagnosis.length > 0) {
      emrDetails.diagnosis.forEach((diagnosis) => {
        if (diagnosis.prescription && diagnosis.prescription.length > 0) {
          diagnosis.prescription.forEach((prescription) => {
            prescriptionMedicines.push({
              drugName: prescription.drugName,
              dosage: prescription.quantity,
              frequency: prescription.frequency,
              timing: prescription.howToTake ? [prescription.howToTake] : [],
              instructions: prescription.advice,
              routeOfAdministration: prescription.routeOfAdministration,
              duration: prescription.duration,
              investigations: prescription.investigations,
            });
          });
        }
      });
    }

    console.log("Prescription Medicines", prescriptionMedicines);

    if (prescriptionMedicines.length === 0) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "No medicines found in the EMR prescriptions"
      );
    }

    // Create new medicine schedule document
    const medicineSchedule = new MedicineSchedule({
      user: emrDetails.user,
      title: `Prescription from ${new Date(
        emrDetails.createdAt
      ).toLocaleDateString()}`,
      startDate: new Date(),
      medicines: prescriptionMedicines.map((med) => ({
        drugName: med.drugName,
        dosage: med.dosage,
        scheduleType: "EMR",
        source: {
          emrId: emrDetails._id,
          doctor: emrDetails.doctor,
          organization: {
            name: "Hospital", // Default name
          },
        },
        frequency: med.frequency,
        timing: med.timing,
        instructions: med.instructions,
        startDate: new Date(),
        status: "Active",
        medicineHistory: [
          {
            drugName: med.drugName,
            changeType: "Started",
            newSchedule: {
              frequency: med.frequency,
              timing: med.timing,
              dosage: med.dosage,
            },
            changedBy: "Doctor",
            changedAt: new Date(),
          },
        ],
      })),
      isActive: true,
    });

    // Add medicines from past history
    if (emrDetails.history && emrDetails.history.pastHistory) {
      emrDetails.history.pastHistory.forEach((history) => {
        if (history.drugName && history.drugName.length > 0) {
          history.drugName.forEach((drug, index) => {
            medicineSchedule.medicines.push({
              drugName: drug,
              dosage: "As prescribed",
              scheduleType: "EMR",
              source: {
                emrId: emrDetails._id,
                doctor: emrDetails.doctor,
                organization: {
                  name: "Hospital",
                },
              },
              frequency: history.frequency?.[index] || "As directed",
              timing: [],
              instructions: history.pastHistoryNotes || "",
              startDate: new Date(),
              status: "Active",
              medicineHistory: [
                {
                  drugName: drug,
                  changeType: "Started",
                  newSchedule: {
                    frequency: history.frequency?.[index] || "As directed",
                    timing: [],
                    dosage: "As prescribed",
                  },
                  changedBy: "Doctor",
                  changedAt: new Date(),
                },
              ],
            });
          });
        }
      });
    }

    // Add medicines from allergies
    if (emrDetails.history && emrDetails.history.allergies) {
      // Handle past allergy prescriptions
      if (
        emrDetails.history.allergies.pastAllergyPrescription &&
        Array.isArray(emrDetails.history.allergies.pastAllergyPrescription) &&
        emrDetails.history.allergies.pastAllergyPrescription.length > 0
      ) {
        emrDetails.history.allergies.pastAllergyPrescription.forEach(
          (allergy) => {
            if (allergy.pastAllergyDrugName) {
              medicineSchedule.medicines.push({
                drugName: allergy.pastAllergyDrugName,
                dosage: "As prescribed",
                scheduleType: "EMR",
                source: {
                  emrId: emrDetails._id,
                  doctor: emrDetails.doctor,
                  organization: {
                    name: "Hospital",
                  },
                },
                frequency: allergy.pastAllergyFrequency || "As directed",
                timing: [],
                instructions: allergy.pastAllergyNotes || "",
                startDate: new Date(),
                status: "Active",
                medicineHistory: [
                  {
                    drugName: allergy.pastAllergyDrugName,
                    changeType: "Started",
                    newSchedule: {
                      frequency: allergy.pastAllergyFrequency || "As directed",
                      timing: [],
                      dosage: "As prescribed",
                    },
                    changedBy: allergy.pastAllergyPrescriptionBy || "Doctor",
                    changedAt: new Date(),
                  },
                ],
              });
            }
          }
        );
      }

      // Handle new allergy prescriptions
      if (
        emrDetails.history.allergies.newAllergyPrescription &&
        Array.isArray(emrDetails.history.allergies.newAllergyPrescription) &&
        emrDetails.history.allergies.newAllergyPrescription.length > 0
      ) {
        emrDetails.history.allergies.newAllergyPrescription.forEach(
          (allergy) => {
            if (allergy.allergyDrugName) {
              medicineSchedule.medicines.push({
                drugName: allergy.allergyDrugName,
                dosage: "As prescribed",
                scheduleType: "EMR",
                source: {
                  emrId: emrDetails._id,
                  doctor: emrDetails.doctor,
                  organization: {
                    name: "Hospital", // Default name
                  },
                },
                frequency: allergy.allergyFrequency || "As directed",
                timing: [],
                instructions: allergy.allergyNotes || "",
                startDate: new Date(),
                status: "Active",
                medicineHistory: [
                  {
                    drugName: allergy.allergyDrugName,
                    changeType: "Started",
                    newSchedule: {
                      frequency: allergy.allergyFrequency || "As directed",
                      timing: [],
                      dosage: "As prescribed",
                    },
                    changedBy: allergy.allergyPrescriptionBy || "Doctor",
                    changedAt: new Date(),
                  },
                ],
              });
            }
          }
        );
      }
    }

    await medicineSchedule.save({ session });
    await session.commitTransaction();
    session.endSession();

    return Response.success(
      res,
      { schedule: medicineSchedule },
      201,
      "Medicine schedule created from EMR successfully"
    );
  } catch (error) {
    console.error("Error in createOrUpdateScheduleFromEMR:", error);
    if (session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch (sessionError) {
        console.error("Error aborting transaction:", sessionError);
      }
    }
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error while creating medicine schedule"
    );
  }
};

// 3. Sync medicine schedule with updated EMR
exports.syncScheduleWithEMR = async (req, res) => {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const { emrId } = req.params;
    const userId = req.user._id;

    // Find the EMR using the base EMR model
    const emrDetails = await EMR.findById(emrId).session(session);

    if (!emrDetails) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "EMR not found with the given ID"
      );
    }

    // Check if the EMR belongs to the requesting user
    if (emrDetails.user.toString() !== userId.toString()) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return Response.error(
        res,
        403,
        AppConstant.FAILED,
        "The EMR does not belong to the requesting user"
      );
    }

    // Find existing schedule that contains medicines from this EMR
    const existingSchedule = await MedicineSchedule.findOne({
      user: userId,
      "medicines.source.emrId": emrId,
      isActive: true,
    }).session(session);

    if (!existingSchedule) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "No active medicine schedule found for this EMR"
      );
    }

    // Get all medicines from the EMR
    // 1. From prescriptions
    const prescriptionMedicines = [];
    if (emrDetails.diagnosis && emrDetails.diagnosis.length > 0) {
      emrDetails.diagnosis.forEach((diagnosis) => {
        if (diagnosis.prescription && diagnosis.prescription.length > 0) {
          diagnosis.prescription.forEach((prescription) => {
            prescriptionMedicines.push({
              drugName: prescription.drugName,
              dosage: prescription.quantity,
              frequency: prescription.frequency,
              timing: prescription.howToTake ? [prescription.howToTake] : [],
              instructions: prescription.advice,
              routeOfAdministration: prescription.routeOfAdministration,
              duration: prescription.duration,
              source: "prescription",
            });
          });
        }
      });
    }

    // 2. From past history
    const pastHistoryMedicines = [];
    if (emrDetails.history && emrDetails.history.pastHistory) {
      emrDetails.history.pastHistory.forEach((history) => {
        if (history.drugName && history.drugName.length > 0) {
          history.drugName.forEach((drug, index) => {
            pastHistoryMedicines.push({
              drugName: drug,
              dosage: "As prescribed",
              frequency: history.frequency?.[index] || "As directed",
              timing: [],
              instructions: history.pastHistoryNotes || "",
              source: "pastHistory",
            });
          });
        }
      });
    }

    // 3. From allergies
    const allergyMedicines = [];
    if (emrDetails.history && emrDetails.history.allergies) {
      // Handle past allergy prescriptions
      if (
        emrDetails.history.allergies.pastAllergyPrescription &&
        Array.isArray(emrDetails.history.allergies.pastAllergyPrescription) &&
        emrDetails.history.allergies.pastAllergyPrescription.length > 0
      ) {
        emrDetails.history.allergies.pastAllergyPrescription.forEach(
          (allergy) => {
            if (allergy.pastAllergyDrugName) {
              allergyMedicines.push({
                drugName: allergy.pastAllergyDrugName,
                dosage: "As prescribed",
                frequency: allergy.pastAllergyFrequency || "As directed",
                timing: [],
                instructions: allergy.pastAllergyNotes || "",
                source: "pastAllergy",
                prescribedBy: allergy.pastAllergyPrescriptionBy || "Doctor",
              });
            }
          }
        );
      }

      // Handle new allergy prescriptions
      if (
        emrDetails.history.allergies.newAllergyPrescription &&
        Array.isArray(emrDetails.history.allergies.newAllergyPrescription) &&
        emrDetails.history.allergies.newAllergyPrescription.length > 0
      ) {
        emrDetails.history.allergies.newAllergyPrescription.forEach(
          (allergy) => {
            if (allergy.allergyDrugName) {
              medicineSchedule.medicines.push({
                drugName: allergy.allergyDrugName,
                dosage: "As prescribed",
                scheduleType: "EMR",
                source: {
                  emrId: emrDetails._id,
                  doctor: emrDetails.doctor,
                  organization: {
                    name: "Hospital", // Default name
                  },
                },
                frequency: allergy.allergyFrequency || "As directed",
                timing: [],
                instructions: allergy.allergyNotes || "",
                startDate: new Date(),
                status: "Active",
                medicineHistory: [
                  {
                    drugName: allergy.allergyDrugName,
                    changeType: "Started",
                    newSchedule: {
                      frequency: allergy.allergyFrequency || "As directed",
                      timing: [],
                      dosage: "As prescribed",
                    },
                    changedBy: allergy.allergyPrescriptionBy || "Doctor",
                    changedAt: new Date(),
                  },
                ],
              });
            }
          }
        );
      }
    }

    // Combine all medicines from the EMR
    const allUpdatedMedicines = [
      ...prescriptionMedicines,
      ...pastHistoryMedicines,
      ...allergyMedicines,
    ];

    // Get existing drug names in the schedule that came from this EMR
    const existingDrugs = existingSchedule.medicines
      .filter(
        (med) =>
          med.source &&
          med.source.emrId &&
          med.source.emrId.toString() === emrId.toString()
      )
      .map((med) => med.drugName);

    // Add new medicines from EMR
    allUpdatedMedicines.forEach((newMed) => {
      if (!existingDrugs.includes(newMed.drugName)) {
        // This is a new medicine not previously in the schedule
        existingSchedule.medicines.push({
          drugName: newMed.drugName || "Unnamed medication",
          dosage: newMed.dosage || "As prescribed",
          scheduleType: "EMR",
          source: {
            emrId: emrDetails._id,
            doctor: emrDetails.doctor,
            organization: {
              name: "Hospital", // Default name
            },
          },
          frequency: newMed.frequency || "As directed",
          timing: newMed.timing || [],
          instructions: newMed.instructions || "",
          startDate: new Date(),
          status: "Active",
          medicineHistory: [
            {
              drugName: newMed.drugName || "Unnamed medication",
              changeType: "Started",
              newSchedule: {
                frequency: newMed.frequency || "As directed",
                timing: newMed.timing || [],
                dosage: newMed.dosage || "As prescribed",
              },
              changedBy: newMed.prescribedBy || "Doctor",
              reason: "Added in updated EMR",
              changedAt: new Date(),
            },
          ],
        });
      } else {
        // Update existing medicine
        const medicineToUpdate = existingSchedule.medicines.find(
          (med) =>
            med.drugName === newMed.drugName &&
            med.source &&
            med.source.emrId &&
            med.source.emrId.toString() === emrId.toString()
        );

        if (medicineToUpdate) {
          // Create history entry if there are changes
          if (
            medicineToUpdate.frequency !== newMed.frequency ||
            medicineToUpdate.dosage !== newMed.dosage ||
            JSON.stringify(medicineToUpdate.timing) !==
            JSON.stringify(newMed.timing) ||
            medicineToUpdate.instructions !== newMed.instructions
          ) {
            medicineToUpdate.medicineHistory.push({
              drugName: medicineToUpdate.drugName,
              changeType: "Modified",
              previousSchedule: {
                frequency: medicineToUpdate.frequency,
                timing: medicineToUpdate.timing,
                dosage: medicineToUpdate.dosage,
              },
              newSchedule: {
                frequency: changes.frequency || medicineToUpdate.frequency,
                timing: changes.timing || medicineToUpdate.timing,
                dosage: changes.dosage || medicineToUpdate.dosage,
              },
              changedBy: newMed.prescribedBy || "Doctor",
              reason: "Updated in new EMR",
              changedAt: new Date(),
            });

            // Update the medicine
            medicineToUpdate.frequency =
              newMed.frequency || medicineToUpdate.frequency;
            medicineToUpdate.dosage = newMed.dosage || medicineToUpdate.dosage;
            medicineToUpdate.timing = newMed.timing || medicineToUpdate.timing;
            medicineToUpdate.instructions =
              newMed.instructions || medicineToUpdate.instructions;

            // If medicine was previously stopped, reactivate it
            if (medicineToUpdate.status === "Stopped") {
              medicineToUpdate.status = "Active";
              medicineToUpdate.medicineHistory.push({
                drugName: medicineToUpdate.drugName,
                changeType: "Started",
                previousSchedule: {
                  frequency: medicineToUpdate.frequency,
                  timing: medicineToUpdate.timing,
                  dosage: medicineToUpdate.dosage,
                },
                changedBy: newMed.prescribedBy || "Doctor",
                reason: "Restarted in new EMR",
                changedAt: new Date(),
              });
            }
          }
        }
      }
    });

    // Check for discontinued medicines (in schedule but not in updated EMR)
    const updatedDrugNames = allUpdatedMedicines.map((med) => med.drugName);
    existingSchedule.medicines.forEach((med) => {
      if (
        med.source &&
        med.source.emrId &&
        med.source.emrId.toString() === emrId.toString() &&
        !updatedDrugNames.includes(med.drugName) &&
        med.status === "Active"
      ) {
        // Mark as stopped if no longer in EMR
        med.status = "Stopped";
        med.medicineHistory.push({
          drugName: med.drugName,
          changeType: "Stopped",
          previousSchedule: {
            frequency: med.frequency,
            timing: med.timing,
            dosage: med.dosage,
          },
          changedBy: "Doctor",
          reason: "Discontinued in updated EMR",
          changedAt: new Date(),
        });
      }
    });

    existingSchedule.lastModified = new Date();
    await existingSchedule.save({ session });
    await session.commitTransaction();
    session.endSession();

    return Response.success(
      res,
      { schedule: existingSchedule },
      200,
      "Medicine schedule synchronized with updated EMR successfully"
    );
  } catch (error) {
    console.error("Error in syncScheduleWithEMR:", error);
    if (session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch (sessionError) {
        console.error("Error aborting transaction:", sessionError);
      }
    }
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error while syncing medicine schedule"
    );
  }
};

// 4. Get medicine schedules from previous EMRs for the user
exports.getMedicineSchedulesFromEMRs = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all EMRs for the user
    let maleEMRs = await AdultMaleEMR.find({ user: userId })
      .select("_id doctor diagnosis createdAt")
      .populate("doctor", "firstName lastName")
      .sort({ createdAt: -1 });

    let femaleEMRs = await AdultFemaleEMR.find({ user: userId })
      .select("_id doctor diagnosis createdAt")
      .populate("doctor", "firstName lastName")
      .sort({ createdAt: -1 });

    // Combine and sort EMRs by createdAt
    const allEMRs = [...maleEMRs, ...femaleEMRs].sort(
      (a, b) => b.createdAt - a.createdAt
    );

    if (!allEMRs || allEMRs.length === 0) {
      return Response.success(
        res,
        { schedules: [] },
        200,
        "No EMRs found for the user"
      );
    }

    // Format the response with medicine information from each EMR
    const emrMedicineSchedules = allEMRs.map((emr) => {
      const medicines = [];

      if (emr.diagnosis && emr.diagnosis.length > 0) {
        emr.diagnosis.forEach((diag) => {
          if (diag.prescription && diag.prescription.length > 0) {
            diag.prescription.forEach((med) => {
              medicines.push({
                drugName: med.drugName || "Unnamed medication",
                dosage: med.quantity || "As prescribed",
                frequency: med.freequency || "As directed",
                timing: med.howToTake ? [med.howToTake] : [],
                instructions: med.advice || "",
                date: diag.dateOfDiagnosis,
              });
            });
          }
        });
      }

      return {
        emrId: emr._id,
        doctor: `Dr. ${emr.doctor.firstName} ${emr.doctor.lastName}`,
        createdAt: emr.createdAt,
        medicines: medicines,
      };
    });

    return Response.success(
      res,
      { emrMedicineSchedules },
      200,
      "Medicine schedules from EMRs retrieved successfully"
    );
  } catch (error) {
    console.error("Error in getMedicineSchedulesFromEMRs:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message ||
      "Internal server error while fetching EMR medicine schedules"
    );
  }
};

// Utility function to create medicine schedule from EMR
exports.createMedicineScheduleFromEMR = async (emr, userId, session) => {
  try {
    // Get medicine details from EMR prescriptions
    const prescriptionMedicines = [];
    if (emr.diagnosis && emr.diagnosis.length > 0) {
      emr.diagnosis.forEach((diagnosis) => {
        if (diagnosis.prescription && diagnosis.prescription.length > 0) {
          diagnosis.prescription.forEach((prescription) => {
            prescriptionMedicines.push({
              drugName: prescription.drugName,
              dosage: prescription.quantity,
              frequency: prescription.frequency,
              timing: prescription.howToTake ? [prescription.howToTake] : [],
              instructions: prescription.advice,
              routeOfAdministration: prescription.routeOfAdministration,
              duration: prescription.duration,
            });
          });
        }
      });
    }

    // Create new medicine schedule document
    const medicineSchedule = new MedicineSchedule({
      user: userId,
      title: `Prescription from ${new Date(
        emr.createdAt
      ).toLocaleDateString()}`,
      startDate: new Date(),
      medicines: prescriptionMedicines.map((med) => ({
        drugName: med.drugName,
        dosage: med.dosage,
        scheduleType: "EMR",
        source: {
          emrId: emr._id,
          doctor: emr.doctor,
          organization: {
            name: "Hospital", // Default name
          },
        },
        frequency: med.frequency,
        timing: med.timing,
        instructions: med.instructions,
        startDate: new Date(),
        status: "Active",
        medicineHistory: [
          {
            drugName: med.drugName,
            changeType: "Started",
            newSchedule: {
              frequency: med.frequency,
              timing: med.timing,
              dosage: med.dosage,
            },
            changedBy: "Doctor",
            changedAt: new Date(),
          },
        ],
      })),
      isActive: true,
    });

    // Add medicines from past history
    if (emr.history && emr.history.pastHistory) {
      emr.history.pastHistory.forEach((history) => {
        if (history.drugName && history.drugName.length > 0) {
          history.drugName.forEach((drug, index) => {
            medicineSchedule.medicines.push({
              drugName: drug,
              dosage: "As prescribed",
              scheduleType: "EMR",
              source: {
                emrId: emr._id,
                doctor: emr.doctor,
                organization: {
                  name: "Hospital",
                },
              },
              frequency: history.frequency?.[index] || "As directed",
              timing: [],
              instructions: history.pastHistoryNotes || "",
              startDate: new Date(),
              status: "Active",
              medicineHistory: [
                {
                  drugName: drug,
                  changeType: "Started",
                  newSchedule: {
                    frequency: history.frequency?.[index] || "As directed",
                    timing: [],
                    dosage: "As prescribed",
                  },
                  changedBy: "Doctor",
                  changedAt: new Date(),
                },
              ],
            });
          });
        }
      });
    }

    // Add medicines from allergies
    if (emr.history && emr.history.allergies) {
      // Handle past allergy prescriptions
      if (
        emr.history.allergies.pastAllergyPrescription &&
        Array.isArray(emr.history.allergies.pastAllergyPrescription) &&
        emr.history.allergies.pastAllergyPrescription.length > 0
      ) {
        emr.history.allergies.pastAllergyPrescription.forEach((allergy) => {
          if (allergy.pastAllergyDrugName) {
            medicineSchedule.medicines.push({
              drugName: allergy.pastAllergyDrugName,
              dosage: "As prescribed",
              scheduleType: "EMR",
              source: {
                emrId: emr._id,
                doctor: emr.doctor,
                organization: {
                  name: "Hospital",
                },
              },
              frequency: allergy.pastAllergyFrequency || "As directed",
              timing: [],
              instructions: allergy.pastAllergyNotes || "",
              startDate: new Date(),
              status: "Active",
              medicineHistory: [
                {
                  drugName: allergy.pastAllergyDrugName,
                  changeType: "Started",
                  newSchedule: {
                    frequency: allergy.pastAllergyFrequency || "As directed",
                    timing: [],
                    dosage: "As prescribed",
                  },
                  changedBy: allergy.pastAllergyPrescriptionBy || "Doctor",
                  changedAt: new Date(),
                },
              ],
            });
          }
        });
      }

      // Handle new allergy prescriptions
      if (
        emr.history.allergies.newAllergyPrescription &&
        Array.isArray(emr.history.allergies.newAllergyPrescription) &&
        emr.history.allergies.newAllergyPrescription.length > 0
      ) {
        emr.history.allergies.newAllergyPrescription.forEach((allergy) => {
          if (allergy.allergyDrugName) {
            medicineSchedule.medicines.push({
              drugName: allergy.allergyDrugName,
              dosage: "As prescribed",
              scheduleType: "EMR",
              source: {
                emrId: emr._id,
                doctor: emr.doctor,
                organization: {
                  name: "Hospital",
                },
              },
              frequency: allergy.allergyFrequency || "As directed",
              timing: [],
              instructions: allergy.allergyNotes || "",
              startDate: new Date(),
              status: "Active",
              medicineHistory: [
                {
                  drugName: allergy.allergyDrugName,
                  changeType: "Started",
                  newSchedule: {
                    frequency: allergy.allergyFrequency || "As directed",
                    timing: [],
                    dosage: "As prescribed",
                  },
                  changedBy: allergy.allergyPrescriptionBy || "Doctor",
                  changedAt: new Date(),
                },
              ],
            });
          }
        });
      }
    }

    // Only save and return if there are medicines
    if (medicineSchedule.medicines.length > 0) {
      await medicineSchedule.save({ session });
      return medicineSchedule;
    }

    return null;
  } catch (error) {
    console.error("Error creating medicine schedule from EMR:", error);
    return null;
  }
};

// Helper function for EMR controller to create medicine schedule
exports.hookCreateMedicineSchedule = async (emr) => {
  let session;
  try {
    if (!emr || !emr.user) {
      console.error("Invalid EMR data provided to hookCreateMedicineSchedule");
      return null;
    }

    session = await mongoose.startSession();
    session.startTransaction();

    console.log("Creating medicine schedule for EMR:", emr._id);

    // Get all medicine details from EMR
    const schedule = await exports.createMedicineScheduleFromEMR(
      emr,
      emr.user,
      session
    );

    if (schedule) {
      // Log the medicine details for debugging
      console.log(
        `Created schedule with ${schedule.medicines.length} medicines`
      );
      if (schedule.medicines.length > 0) {
        console.log("First medicine:", schedule.medicines[0].drugName);
      }

      await session.commitTransaction();
      session.endSession();
      return schedule;
    } else {
      // No medicines found or other issues
      console.log("No medicine schedule created - no medicines found in EMR");
      await session.abortTransaction();
      session.endSession();
      return null;
    }
  } catch (error) {
    console.error("Error in hookCreateMedicineSchedule:", error);
    if (session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch (sessionError) {
        console.error("Error aborting transaction in hook:", sessionError);
      }
    }
    return null;
  }
};

// 5. Add self-created medicine
exports.addSelfCreatedMedicine = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      drugName,
      dosage,
      frequency,
      timing,
      instructions,
      startDate,
      endDate,
    } = req.body;

    if (!drugName || !dosage || !frequency) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Drug name, dosage, and frequency are required"
      );
    }

    // Find if user has any active schedule
    let schedule = await MedicineSchedule.findOne({
      user: userId,
      isActive: true,
    });

    // If no schedule exists, create a new one
    if (!schedule) {
      schedule = new MedicineSchedule({
        user: userId,
        title: "My Medications",
        startDate: new Date(),
        medicines: [],
        isActive: true,
        lastModified: new Date(),
      });
    }

    // Add the new medicine
    const newMedicine = {
      drugName,
      dosage,
      scheduleType: "Self",
      frequency,
      timing: timing || [],
      instructions: instructions || "",
      startDate: startDate || new Date(),
      endDate: endDate || null,
      status: "Active",
      medicineHistory: [
        {
          drugName,
          changeType: "Started",
          newSchedule: {
            frequency,
            timing: timing || [],
            dosage,
          },
          changedBy: "User",
          reason: "Self-added medication",
          changedAt: new Date(),
        },
      ],
    };

    schedule.medicines.push(newMedicine);
    schedule.lastModified = new Date();

    await schedule.save();

    return Response.success(
      res,
      { schedule },
      201,
      "Self-created medicine added successfully"
    );
  } catch (error) {
    console.error("Error in addSelfCreatedMedicine:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error while adding medicine"
    );
  }
};

// 6. Update medicine (both EMR and self-created)
exports.updateMedicine = async (req, res) => {
  try {
    const userId = req.user._id;
    const { scheduleId, medicineId } = req.params;
    const { status, dosage, frequency, timing, instructions, reason } =
      req.body;

    // Find the schedule
    const schedule = await MedicineSchedule.findOne({
      _id: scheduleId,
      user: userId,
    });

    if (!schedule) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Medicine schedule not found"
      );
    }

    // Find the medicine
    const medicine = schedule.medicines.id(medicineId);
    if (!medicine) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Medicine not found in the schedule"
      );
    }

    // Create history entry if there are changes
    const changes = {};
    if (dosage && dosage !== medicine.dosage) changes.dosage = dosage;
    if (frequency && frequency !== medicine.frequency)
      changes.frequency = frequency;
    if (timing && JSON.stringify(timing) !== JSON.stringify(medicine.timing))
      changes.timing = timing;
    if (status && status !== medicine.status) changes.status = status;

    if (Object.keys(changes).length > 0) {
      const historyEntry = {
        drugName: medicine.drugName,
        changeType: status === "Stopped" ? "Stopped" : "Modified",
        previousSchedule: {
          frequency: medicine.frequency,
          timing: medicine.timing,
          dosage: medicine.dosage,
        },
        newSchedule: {
          frequency: changes.frequency || medicine.frequency,
          timing: changes.timing || medicine.timing,
          dosage: changes.dosage || medicine.dosage,
        },
        changedBy: "User",
        reason: reason || "User update",
        changedAt: new Date(),
      };

      medicine.medicineHistory.push(historyEntry);

      // Update medicine fields
      if (dosage) medicine.dosage = dosage;
      if (frequency) medicine.frequency = frequency;
      if (timing) medicine.timing = timing;
      if (instructions) medicine.instructions = instructions;
      if (status) medicine.status = status;

      schedule.lastModified = new Date();

      await schedule.save();
    }

    return Response.success(
      res,
      { medicine },
      200,
      "Medicine updated successfully"
    );
  } catch (error) {
    console.error("Error in updateMedicine:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error while updating medicine"
    );
  }
};

// 7. Delete medicine (only for self-created)
exports.deleteMedicine = async (req, res) => {
  try {
    const userId = req.user._id;
    const { scheduleId, medicineId } = req.params;

    // Find the schedule
    const schedule = await MedicineSchedule.findOne({
      _id: scheduleId,
      user: userId,
    });

    if (!schedule) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Medicine schedule not found"
      );
    }

    // Find the medicine
    const medicine = schedule.medicines.id(medicineId);
    if (!medicine) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Medicine not found in the schedule"
      );
    }

    // Check if it's a self-created medicine
    if (medicine.scheduleType !== "Self") {
      return Response.error(
        res,
        403,
        AppConstant.FAILED,
        "Only self-created medicines can be deleted"
      );
    }

    // Remove the medicine
    medicine.remove();
    schedule.lastModified = new Date();

    await schedule.save();

    return Response.success(res, null, 200, "Medicine deleted successfully");
  } catch (error) {
    console.error("Error in deleteMedicine:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error while deleting medicine"
    );
  }
};

// 8. Get medicine history
exports.getMedicineHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { scheduleId, medicineId } = req.params;

    // Find the schedule
    const schedule = await MedicineSchedule.findOne({
      _id: scheduleId,
      user: userId,
    });

    if (!schedule) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Medicine schedule not found"
      );
    }

    // Find the medicine
    const medicine = schedule.medicines.id(medicineId);
    if (!medicine) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Medicine not found in the schedule"
      );
    }

    return Response.success(
      res,
      {
        medicine: {
          drugName: medicine.drugName,
          status: medicine.status,
          scheduleType: medicine.scheduleType,
          history: medicine.medicineHistory,
        },
      },
      200,
      "Medicine history retrieved successfully"
    );
  } catch (error) {
    console.error("Error in getMedicineHistory:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error while retrieving medicine history"
    );
  }
};

// 9. Get medicines for corporate employee from recent EMRs
exports.getCorporateEmployeeMedicines = async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Validate parameters
    const { error } = employeeMedicinesValidationSchema.validate({
      employeeId,
    });
    if (error) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        error.message || "Validation failed!"
      );
    }

    // First check if user exists and is a corporate employee
    const employee = await User.findById(employeeId);

    if (!employee) {
      return Response.error(res, 404, AppConstant.FAILED, "Employee not found");
    }

    if (employee.role !== "Employee") {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "User is not a corporate employee"
      );
    }

    // Find most recent EMRs for the employee (both male and female formats)
    let maleEMRs = await AdultMaleEMR.find({ user: employeeId })
      .select(
        "_id doctor diagnosis history generalPhysicalExamination createdAt"
      )
      .populate("doctor", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(3); // Get latest 3 EMRs

    let femaleEMRs = await AdultFemaleEMR.find({ user: employeeId })
      .select(
        "_id doctor diagnosis history generalPhysicalExamination createdAt"
      )
      .populate("doctor", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(3); // Get latest 3 EMRs

    // Combine and sort EMRs by createdAt
    const recentEMRs = [...maleEMRs, ...femaleEMRs]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 3); // Get 3 most recent EMRs

    if (!recentEMRs || recentEMRs.length === 0) {
      return Response.success(
        res,
        { medicines: [] },
        200,
        "No EMRs found for the employee"
      );
    }

    // Get medicine schedules associated with these EMRs
    const schedules = await MedicineSchedule.find({
      user: employeeId,
      "medicines.source.emrId": { $in: recentEMRs.map((emr) => emr._id) },
    }).populate({
      path: "medicines.source.doctor",
      select: "firstName lastName specialization",
    });

    // Extract all medicines from these EMRs
    const allMedicines = [];

    // 1. Add medicines from medicine schedules
    if (schedules && schedules.length > 0) {
      schedules.forEach((schedule) => {
        if (schedule.medicines && schedule.medicines.length > 0) {
          schedule.medicines.forEach((med) => {
            // Find the associated EMR
            const sourceEmr = recentEMRs.find(
              (emr) =>
                med.source &&
                med.source.emrId &&
                med.source.emrId.toString() === emr._id.toString()
            );

            if (sourceEmr) {
              allMedicines.push({
                drugName: med.drugName,
                dosage: med.dosage,
                frequency: med.frequency,
                instructions: med.instructions,
                status: med.status,
                source: "EMR",
                emrDate: sourceEmr.createdAt,
                doctor: sourceEmr.doctor
                  ? `Dr. ${sourceEmr.doctor.firstName} ${sourceEmr.doctor.lastName}`
                  : "Unknown Doctor",
                scheduleType: med.scheduleType,
              });
            }
          });
        }
      });
    }

    // 2. Add medicines directly from EMRs if not already in schedules
    recentEMRs.forEach((emr) => {
      // Add from diagnosis prescriptions
      if (emr.diagnosis && emr.diagnosis.length > 0) {
        emr.diagnosis.forEach((diagnosis) => {
          if (diagnosis.prescription && diagnosis.prescription.length > 0) {
            diagnosis.prescription.forEach((prescription) => {
              // Check if already in allMedicines
              const exists = allMedicines.some(
                (med) =>
                  med.drugName === prescription.drugName &&
                  med.emrDate.toISOString() === emr.createdAt.toISOString()
              );

              if (!exists) {
                allMedicines.push({
                  drugName: prescription.drugName,
                  dosage: prescription.quantity,
                  frequency: prescription.frequency,
                  instructions: prescription.advice,
                  status: "Active", // Assume active if in recent EMR
                  source: "EMR Prescription",
                  emrDate: emr.createdAt,
                  doctor: emr.doctor
                    ? `Dr. ${emr.doctor.firstName} ${emr.doctor.lastName}`
                    : "Unknown Doctor",
                  scheduleType: "EMR",
                });
              }
            });
          }
        });
      }

      // Add from past history
      if (
        emr.history &&
        emr.history.pastHistory &&
        emr.history.pastHistory.length > 0
      ) {
        emr.history.pastHistory.forEach((history) => {
          if (history.drugName && history.drugName.length > 0) {
            history.drugName.forEach((drug, index) => {
              // Check if already in allMedicines
              const exists = allMedicines.some(
                (med) =>
                  med.drugName === drug &&
                  med.emrDate.toISOString() === emr.createdAt.toISOString() &&
                  med.source === "EMR Past History"
              );

              if (!exists) {
                allMedicines.push({
                  drugName: drug,
                  dosage: "As prescribed",
                  frequency: history.frequency?.[index] || "As directed",
                  instructions: history.pastHistoryNotes || "",
                  status: "Active", // Assume active
                  source: "EMR Past History",
                  emrDate: emr.createdAt,
                  doctor: emr.doctor
                    ? `Dr. ${emr.doctor.firstName} ${emr.doctor.lastName}`
                    : "Unknown Doctor",
                  scheduleType: "EMR",
                });
              }
            });
          }
        });
      }

      // Add from allergies
      if (emr.history && emr.history.allergies) {
        // From past allergy prescriptions
        if (
          emr.history.allergies.pastAllergyPrescription &&
          Array.isArray(emr.history.allergies.pastAllergyPrescription) &&
          emr.history.allergies.pastAllergyPrescription.length > 0
        ) {
          emr.history.allergies.pastAllergyPrescription.forEach((allergy) => {
            if (allergy.pastAllergyDrugName) {
              // Check if already in allMedicines
              const exists = allMedicines.some(
                (med) =>
                  med.drugName === allergy.pastAllergyDrugName &&
                  med.emrDate.toISOString() === emr.createdAt.toISOString() &&
                  med.source === "EMR Past Allergy"
              );

              if (!exists) {
                allMedicines.push({
                  drugName: allergy.pastAllergyDrugName,
                  dosage: "As prescribed",
                  frequency: allergy.pastAllergyFrequency || "As directed",
                  instructions: allergy.pastAllergyNotes || "",
                  status: "Active", // Assume active
                  source: "EMR Past Allergy",
                  emrDate: emr.createdAt,
                  doctor: emr.doctor
                    ? `Dr. ${emr.doctor.firstName} ${emr.doctor.lastName}`
                    : "Unknown Doctor",
                  scheduleType: "EMR",
                });
              }
            }
          });
        }

        // From new allergy prescriptions
        if (
          emr.history.allergies.newAllergyPrescription &&
          Array.isArray(emr.history.allergies.newAllergyPrescription) &&
          emr.history.allergies.newAllergyPrescription.length > 0
        ) {
          emr.history.allergies.newAllergyPrescription.forEach((allergy) => {
            if (allergy.allergyDrugName) {
              // Check if already in allMedicines
              const exists = allMedicines.some(
                (med) =>
                  med.drugName === allergy.allergyDrugName &&
                  med.emrDate.toISOString() === emr.createdAt.toISOString() &&
                  med.source === "EMR New Allergy"
              );

              if (!exists) {
                allMedicines.push({
                  drugName: allergy.allergyDrugName,
                  dosage: "As prescribed",
                  frequency: allergy.allergyFrequency || "As directed",
                  instructions: allergy.allergyNotes || "",
                  status: "Active", // Assume active
                  source: "EMR New Allergy",
                  emrDate: emr.createdAt,
                  doctor: emr.doctor
                    ? `Dr. ${emr.doctor.firstName} ${emr.doctor.lastName}`
                    : "Unknown Doctor",
                  scheduleType: "EMR",
                });
              }
            }
          });
        }
      }
    });

    // Group medicines by name
    const groupedMedicines = {};
    allMedicines.forEach((med) => {
      if (!groupedMedicines[med.drugName]) {
        groupedMedicines[med.drugName] = [];
      }
      groupedMedicines[med.drugName].push(med);
    });

    // For each medicine group, keep the most recent one
    const latestMedicines = Object.values(groupedMedicines).map((medGroup) => {
      // Sort by date descending
      medGroup.sort((a, b) => b.emrDate - a.emrDate);
      return medGroup[0]; // Return the most recent
    });

    return Response.success(
      res,
      { medicines: latestMedicines },
      200,
      "Employee medicines retrieved successfully"
    );
  } catch (error) {
    console.error("Error in getCorporateEmployeeMedicines:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message ||
      "Internal server error while retrieving employee medicines"
    );
  }
};

// Get or generate medicine PDF link for a user
exports.getMedicinePDFLinkByUserId = async (req, res) => {
  let browser = null;
  let pdfFilePath = null;
  let logoTempPath = null;

  try {
    const userId = req.params.userId || (req.user && req.user._id);

    if (!userId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "User ID is required"
      );
    }

    // Find only the latest active medicine schedule for the user
    const medicineSchedule = await MedicineSchedule.findOne({
      user: userId,
      isActive: true,
    })
      .populate({
        path: "medicines.source.doctor",
        select: "firstName lastName education specialization",
      })
      .sort({ lastModified: -1 }); // Sort by last modified to get the latest

    if (!medicineSchedule) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "No medicine schedules found for the user"
      );
    }

    // Check if PDF link already exists and is valid
    if (medicineSchedule.pdfLink) {
      console.log("Existing PDF link found:", medicineSchedule.pdfLink);

      // Return the existing PDF link
      return Response.success(
        res,
        {
          pdfLink: medicineSchedule.pdfLink,
          scheduleId: medicineSchedule._id,
        },
        200,
        "Existing PDF link found"
      );
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return Response.error(res, 404, AppConstant.FAILED, "User not found");
    }

    // Ensure temp directory exists
    const fs = require("fs");
    const path = require("path");
    const tempDir = path.resolve(__dirname, "../../public/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Copy logo to a location accessible by the browser
    const logoSourcePath = path.resolve(__dirname, "../../public/logo.png");
    logoTempPath = path.join(tempDir, `temp_logo_${Date.now()}.png`);
    if (fs.existsSync(logoSourcePath)) {
      fs.copyFileSync(logoSourcePath, logoTempPath);
    }

    // Try to load logo as base64
    let logoBase64 = null;
    try {
      const logoPath = path.resolve(__dirname, "../../public/logo1.png");
      console.log("Looking for logo at:", logoPath);
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
        console.log("Logo loaded successfully");
      } else {
        console.error("Logo file not found at path:", logoPath);
      }
    } catch (err) {
      console.error("Error loading logo:", err);
    }

    // Launch a headless browser for PDF generation
    console.log("Launching browser for medicine PDF generation...");
    try {
      browser = await launchPuppeteerBrowser();
      if (!browser) {
        throw new Error('Browser launch returned null');
      }
    } catch (browserError) {
      console.error("Error launching browser:", browserError);
      throw new Error(`Failed to launch browser: ${browserError.message}`);
    }

    // Create a new page
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({
      width: 1200,
      height: 800,
    });

    // Allow all requests to proceed, including file access
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      req.continue();
    });

    // Generate HTML content for medicine schedule
    const htmlContent = getMedicinePDFTableHTML(
      user,
      medicineSchedule,
      logoBase64
    );

    // Add embedded Bootstrap CSS
    const bootstrapCSS = `
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          line-height: 1.6;
          font-size: 12px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #4b90e2;
          padding-bottom: 15px;
        }
        .logo-container {
          display: flex;
          align-items: center;
        }
        .logo-container img {
          width: 180px; /* Enlarged logo - bigger */
          height: auto;
        }
        .patient-info {
          text-align: right;
        }
        .patient-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .document-title {
          font-size: 24px;
          font-weight: bold;
          color: #4b90e2;
          text-align: center;
          margin: 20px 0;
        }
        .schedule-container {
          margin-bottom: 30px;
        }
        .schedule-title {
          font-size: 20px;
          color: #2c3e50;
          margin-bottom: 5px;
        }
        .schedule-date {
          color: #7f8c8d;
          font-size: 14px;
          margin-bottom: 15px;
        }
        
        /* Table styling for medicines */
        .medicine-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .medicine-table th {
          background-color: #4b90e2;
          color: white;
          text-align: left;
          padding: 10px;
          font-size: 12px;
          font-weight: 600;
        }
        .medicine-table td {
          padding: 10px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 11px;
        }
        .medicine-table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .medicine-table tr:hover {
          background-color: #f1f5f9;
        }
        .status-pill {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: bold;
        }
        .status-active {
          background-color: #e8f5e9;
          color: #388e3c;
        }
        .status-completed {
          background-color: #e3f2fd;
          color: #1976d2;
        }
        .status-stopped {
          background-color: #ffebee;
          color: #d32f2f;
        }
        
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #95a5a6;
        }
        
        @media print {
          body {
            padding: 0;
          }
          .header, .footer {
            background-color: #ffffff !important;
            color: #333 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .medicine-table th {
            background-color: #4b90e2 !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .medicine-table tr:nth-child(even) {
            background-color: #f9f9f9 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .status-active {
            background-color: #e8f5e9 !important;
            color: #388e3c !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .status-completed {
            background-color: #e3f2fd !important;
            color: #1976d2 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .status-stopped {
            background-color: #ffebee !important;
            color: #d32f2f !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      </style>
    `;

    const enhancedHtml = htmlContent.replace(
      "</head>",
      `${bootstrapCSS}</head>`
    );

    // Set content and wait for it to load
    console.log("Setting HTML content");
    await page.setContent(enhancedHtml, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    // Wait for images to load
    await page
      .waitForSelector(".logo-container img", { visible: true, timeout: 5000 })
      .catch(() => {
        console.log("Logo image may not have loaded, continuing anyway");
      });

    console.log("Generating PDF...");

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:10px; text-align:center; width:100%; padding-top:5mm;">Patient Medicine Schedule</div>`,
      footerTemplate: `<div style="font-size:8px; text-align:center; width:100%; padding-bottom:10mm;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        <div> 2025 Preva Care</div>
      </div>`,
      preferCSSPageSize: true,
      timeout: 60000,
    });

    console.log("PDF generated successfully");

    // Close browser before file operations
    await browser.close();
    browser = null;

    // Import AWS S3 upload utility
    const { uploadToS3 } = require("../../middlewares/uploads/awsConfig");

    // Save the PDF to a file (temporary, will be uploaded to S3)
    const safeId = String(userId).replace(/[^a-z0-9]/gi, "");
    const timestamp = Date.now();
    const pdfFileName = `MedicineSchedule_${safeId}_${timestamp}.pdf`;

    // Upload the PDF buffer directly to S3
    console.log("Uploading PDF to S3...");
    const s3UploadResult = await uploadToS3({
      buffer: pdfBuffer,
      originalname: pdfFileName,
      mimetype: "application/pdf",
    });

    console.log("PDF uploaded to S3:", s3UploadResult.Location);

    // Update the medicine schedule with the S3 PDF link
    medicineSchedule.pdfLink = s3UploadResult.Location;
    await medicineSchedule.save();

    console.log(
      "Medicine schedule updated with S3 PDF link:",
      s3UploadResult.Location
    );

    // Return the S3 PDF link in the response
    return Response.success(
      res,
      {
        pdfLink: s3UploadResult.Location,
        scheduleId: medicineSchedule._id,
      },
      200,
      "PDF link generated and uploaded to S3 successfully"
    );
  } catch (err) {
    console.error("Error generating medicine PDF link:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  } finally {
    // Ensure browser is closed and temp files are cleaned up
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error("Error closing browser:", closeErr);
      }
    }

    // Clean up any temporary logo file
    if (logoTempPath) {
      const fs = require("fs");
      try {
        if (fs.existsSync(logoTempPath)) {
          fs.unlinkSync(logoTempPath);
        }
      } catch (err) {
        console.error("Error removing temporary logo:", err);
      }
    }

    // Clean up any temporary PDF file
    if (pdfFilePath) {
      const fs = require("fs");
      try {
        if (fs.existsSync(pdfFilePath)) {
          fs.unlinkSync(pdfFilePath);
        }
      } catch (err) {
        console.error("Error removing temporary PDF file:", err);
      }
    }
  }
};

// Generate medicine PDF for a patient (for download)
exports.generateMedicinePDF = async (req, res) => {
  let browser = null;
  let pdfFilePath = null;
  let logoTempPath = null;

  try {
    const userId = req.body.userId || (req.user && req.user._id);

    if (!userId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "User ID is required"
      );
    }

    // Find only the latest active medicine schedule for the user
    const medicineSchedule = await MedicineSchedule.findOne({
      user: userId,
      isActive: true,
    })
      .populate({
        path: "medicines.source.doctor",
        select: "firstName lastName education specialization",
      })
      .sort({ lastModified: -1 }); // Sort by last modified to get the latest

    if (!medicineSchedule) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "No medicine schedules found for the user"
      );
    }

    // Check if PDF link already exists and is valid
    if (medicineSchedule.pdfLink) {
      console.log("Using existing PDF link:", medicineSchedule.pdfLink);

      // Redirect to the existing PDF for download
      return res.redirect(medicineSchedule.pdfLink);
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return Response.error(res, 404, AppConstant.FAILED, "User not found");
    }

    // Ensure temp directory exists
    const fs = require("fs");
    const path = require("path");
    const tempDir = path.resolve(__dirname, "../../public/temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Copy logo to a location accessible by the browser
    const logoSourcePath = path.resolve(__dirname, "../../public/logo.png");
    logoTempPath = path.join(tempDir, `temp_logo_${Date.now()}.png`);
    if (fs.existsSync(logoSourcePath)) {
      fs.copyFileSync(logoSourcePath, logoTempPath);
    }

    // Try to load logo as base64
    let logoBase64 = null;
    try {
      const logoPath = path.resolve(__dirname, "../../public/logo1.png");
      console.log("Looking for logo at:", logoPath);
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
        console.log("Logo loaded successfully");
      } else {
        console.error("Logo file not found at path:", logoPath);
      }
    } catch (err) {
      console.error("Error loading logo:", err);
    }

    // Launch a headless browser for PDF generation
    console.log("Launching browser for medicine PDF generation...");
    try {
      browser = await launchPuppeteerBrowser();
      if (!browser) {
        throw new Error('Browser launch returned null');
      }
    } catch (browserError) {
      console.error("Error launching browser:", browserError);
      throw new Error(`Failed to launch browser: ${browserError.message}`);
    }

    // Create a new page
    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({
      width: 1200,
      height: 800,
    });

    // Allow all requests to proceed, including file access
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      req.continue();
    });

    // Generate HTML content for medicine schedule
    const htmlContent = getMedicinePDFTableHTML(
      user,
      medicineSchedule,
      logoBase64
    );

    // Add embedded Bootstrap CSS
    const bootstrapCSS = `
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          line-height: 1.6;
          font-size: 12px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #4b90e2;
          padding-bottom: 15px;
        }
        .logo-container {
          display: flex;
          align-items: center;
        }
        .logo-container img {
          width: 180px; /* Enlarged logo - bigger */
          height: auto;
        }
        .patient-info {
          text-align: right;
        }
        .patient-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .document-title {
          font-size: 24px;
          font-weight: bold;
          color: #4b90e2;
          text-align: center;
          margin: 20px 0;
        }
        .schedule-container {
          margin-bottom: 30px;
        }
        .schedule-title {
          font-size: 20px;
          color: #2c3e50;
          margin-bottom: 5px;
        }
        .schedule-date {
          color: #7f8c8d;
          font-size: 14px;
          margin-bottom: 15px;
        }
        
        /* Table styling for medicines */
        .medicine-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .medicine-table th {
          background-color: #4b90e2;
          color: white;
          text-align: left;
          padding: 10px;
          font-size: 12px;
          font-weight: 600;
        }
        .medicine-table td {
          padding: 10px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 11px;
        }
        .medicine-table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .medicine-table tr:hover {
          background-color: #f1f5f9;
        }
        .status-pill {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: bold;
        }
        .status-active {
          background-color: #e8f5e9;
          color: #388e3c;
        }
        .status-completed {
          background-color: #e3f2fd;
          color: #1976d2;
        }
        .status-stopped {
          background-color: #ffebee;
          color: #d32f2f;
        }
        
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #95a5a6;
        }
        
        @media print {
          body {
            padding: 0;
          }
          .header, .footer {
            background-color: #ffffff !important;
            color: #333 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .medicine-table th {
            background-color: #4b90e2 !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .medicine-table tr:nth-child(even) {
            background-color: #f9f9f9 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .status-active {
            background-color: #e8f5e9 !important;
            color: #388e3c !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .status-completed {
            background-color: #e3f2fd !important;
            color: #1976d2 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .status-stopped {
            background-color: #ffebee !important;
            color: #d32f2f !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      </style>
    `;

    const enhancedHtml = htmlContent.replace(
      "</head>",
      `${bootstrapCSS}</head>`
    );

    // Set content and wait for it to load
    console.log("Setting HTML content");
    await page.setContent(enhancedHtml, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    // Wait for images to load
    await page
      .waitForSelector(".logo-container img", { visible: true, timeout: 5000 })
      .catch(() => {
        console.log("Logo image may not have loaded, continuing anyway");
      });

    console.log("Generating PDF...");

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:10px; text-align:center; width:100%; padding-top:5mm;">Patient Medicine Schedule</div>`,
      footerTemplate: `<div style="font-size:8px; text-align:center; width:100%; padding-bottom:10mm;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        <div> 2025 Preva Care</div>
      </div>`,
      preferCSSPageSize: true,
      timeout: 60000,
    });

    console.log("PDF generated successfully");

    // Close browser before file operations
    await browser.close();
    browser = null;

    // Import AWS S3 upload utility
    const { uploadToS3 } = require("../../middlewares/uploads/awsConfig");

    // Prepare file name for S3 upload
    const safeId = String(userId).replace(/[^a-z0-9]/gi, "");
    const timestamp = Date.now();
    const pdfFileName = `MedicineSchedule_${safeId}_${timestamp}.pdf`;

    // Upload the PDF buffer directly to S3
    console.log("Uploading PDF to S3...");
    const s3UploadResult = await uploadToS3({
      buffer: pdfBuffer,
      originalname: pdfFileName,
      mimetype: "application/pdf",
    });

    console.log("PDF uploaded to S3:", s3UploadResult.Location);

    // Update the medicine schedule with the S3 PDF link
    medicineSchedule.pdfLink = s3UploadResult.Location;
    await medicineSchedule.save();

    // Redirect to the S3 PDF link for download
    return res.redirect(s3UploadResult.Location);
  } catch (err) {
    console.error("Error generating medicine PDF:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  } finally {
    // Ensure browser is closed and temp files are cleaned up
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error("Error closing browser:", closeErr);
      }
    }

    // Clean up any temporary logo file
    if (logoTempPath) {
      const fs = require("fs");
      try {
        if (fs.existsSync(logoTempPath)) {
          fs.unlinkSync(logoTempPath);
        }
      } catch (err) {
        console.error("Error removing temporary logo:", err);
      }
    }

    // Clean up any temporary PDF file
    if (pdfFilePath) {
      const fs = require("fs");
      try {
        if (fs.existsSync(pdfFilePath)) {
          fs.unlinkSync(pdfFilePath);
        }
      } catch (err) {
        console.error("Error removing temporary PDF file:", err);
      }
    }
  }
};

// Get medicine PDF by schedule ID
exports.getMedicinePDFByScheduleId = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    if (!scheduleId) {
      return Response.error(
        res,
        400,
        AppConstant.FAILED,
        "Schedule ID is required"
      );
    }

    // Find the medicine schedule by ID
    const medicineSchedule = await MedicineSchedule.findById(scheduleId);

    if (!medicineSchedule) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "Medicine schedule not found"
      );
    }

    // Check if the user has permission to access this schedule
    if (req.user._id.toString() !== medicineSchedule.user.toString()) {
      return Response.error(
        res,
        403,
        AppConstant.FAILED,
        "You don't have permission to access this schedule"
      );
    }

    // Check if PDF link exists
    if (!medicineSchedule.pdfLink) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "PDF not found for this schedule. Generate a PDF first."
      );
    }

    // Redirect to the PDF link
    return res.redirect(medicineSchedule.pdfLink);
  } catch (err) {
    console.error("Error retrieving medicine PDF:", err);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal server error!"
    );
  }
};

// HTML template for medicine PDF with tabular format
const getMedicinePDFTableHTML = (user, medicineSchedule, logoBase64) => {
  const userName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.email || "Patient";

  // Create a table of medicines
  const medicinesTableHTML = `
    <table class="medicine-table">
      <thead>
        <tr>
          <th>Medicine</th>
          <th>Dosage</th>
          <th>Frequency</th>
          <th>Timing</th>
          <th>Period</th>
          <th>Status</th>
          <th>Prescribed By</th>
        </tr>
      </thead>
      <tbody>
        ${medicineSchedule.medicines
      .map((med) => {
        // Format timing array to readable string
        const timingStr =
          med.timing && med.timing.length > 0
            ? med.timing.join(", ")
            : "As directed";

        // Get doctor name if available
        let doctorName = "N/A";
        if (med.source && med.source.doctor) {
          const doctor = med.source.doctor;
          if (typeof doctor === "object" && doctor.firstName) {
            doctorName = `Dr. ${doctor.firstName} ${doctor.lastName || ""}`;
            if (doctor.specialization) {
              doctorName += ` (${doctor.specialization})`;
            }
          }
        }

        // Format start date
        const startDate = med.startDate
          ? new Date(med.startDate).toLocaleDateString()
          : "N/A";

        // Format end date if available
        const endDate = med.endDate
          ? new Date(med.endDate).toLocaleDateString()
          : "Ongoing";

        // Period string
        const periodStr = `${startDate} to ${endDate}`;

        return `
            <tr>
              <td><strong>${med.drugName}</strong>${med.instructions
            ? `<br><small><em>${med.instructions}</em></small>`
            : ""
          }</td>
              <td>${med.dosage}</td>
              <td>${med.frequency}</td>
              <td>${timingStr}</td>
              <td>${periodStr}</td>
              <td><span class="status-pill status-${med.status.toLowerCase()}">${med.status
          }</span></td>
              <td>${doctorName}</td>
            </tr>
          `;
      })
      .join("")}
      </tbody>
    </table>
  `;

  // Create the logo HTML - enlarged logo without "Preva Care" text when logo is present
  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="Preva Care Logo" style="max-height:90px;" />`
    : `<span style="font-size:2.2rem; font-weight:bold; color:#4b90e2;">Preva Care</span>`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Medicine Schedule</title>
    </head>
    <body>
      <div class="header">
        <div class="logo-container">
          ${logoHtml}
        </div>
        <div class="patient-info">
          <div class="patient-name">${userName}</div>
          <div class="document-date">Date: ${new Date().toLocaleDateString()}</div>
        </div>
      </div>
      
      <h1 class="document-title">Medicine Schedule</h1>
      
      <div class="schedule-container">
        <h2 class="schedule-title">${medicineSchedule.title}</h2>
        
        
        ${medicinesTableHTML}
      </div>
      
      <div class="footer">
        <p>This document is generated for informational purposes only.</p>
        <p>Please follow your doctor's directions regarding medication usage.</p>
      </div>
    </body>
    </html>
  `;
};
