const MedicineSchedule = require("../../models/patient/medicineSchedule.model");
const EMR = require("../../models/common/emr.model");
const AdultFemaleEMR = require("../../models/EMR/adultFemaleEMR.model");
const AdultMaleEMR = require("../../models/EMR/adultMaleEMR.model");
const User = require("../../models/common/user.model");
const mongoose = require("mongoose");
const AppConstant = require("../../utils/AppConstant");
const Response = require("../../utils/Response");

// 1. Get medicine schedules for Individual User - App API
exports.getMedicineSchedulesForUser = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all active medicine schedules for the user
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
      return Response.success(
        res,
        { schedules: [] },
        200,
        "No medicine schedules found for the user"
      );
    }

    return Response.success(
      res,
      { schedules: medicineSchedules },
      200,
      "Medicine schedules retrieved successfully"
    );
  } catch (error) {
    console.error("Error in getMedicineSchedulesForUser:", error);
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      error.message || "Internal server error while fetching medicine schedules"
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
      // Correct approach: allergies is an object with nested arrays, not an array itself
      // Check pastAllergyPrescription array
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
                    changedBy: "Doctor",
                    changedAt: new Date(),
                  },
                ],
              });
            }
          }
        );
      }

      // Check newAllergyPrescription array
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
      // Handle new allergies schema structure
      // Past allergy medications
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
              });
            }
          }
        );
      }

      // New allergy medications
      if (
        emrDetails.history.allergies.newAllergyPrescription &&
        Array.isArray(emrDetails.history.allergies.newAllergyPrescription) &&
        emrDetails.history.allergies.newAllergyPrescription.length > 0
      ) {
        emrDetails.history.allergies.newAllergyPrescription.forEach(
          (allergy) => {
            if (allergy.allergyDrugName) {
              allergyMedicines.push({
                drugName: allergy.allergyDrugName,
                dosage: "As prescribed",
                frequency: allergy.allergyFrequency || "As directed",
                timing: [],
                instructions: allergy.allergyNotes || "",
                source: "newAllergy",
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
              changedBy: "Doctor",
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
                frequency: newMed.frequency || medicineToUpdate.frequency,
                timing: newMed.timing || medicineToUpdate.timing,
                dosage: newMed.dosage || medicineToUpdate.dosage,
              },
              changedBy: "Doctor",
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
                changedBy: "Doctor",
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
      // Handle new allergies schema structure
      // Past allergy medications
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
                  changedBy: "Doctor",
                  changedAt: new Date(),
                },
              ],
            });
          }
        });
      }

      // New allergy medications
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

    // Get all medicine details from EMR
    const schedule = await exports.createMedicineScheduleFromEMR(
      emr,
      emr.user,
      session
    );

    if (schedule) {
      await session.commitTransaction();
      session.endSession();
      return schedule;
    } else {
      // No medicines found or other issues
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
