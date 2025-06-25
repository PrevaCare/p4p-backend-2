const UserMedicineSchedule = require('../../models/patient/userMedicineSchedule.model');
const Response = require('../../utils/Response');
const AppConstant = require('../../utils/AppConstant');
const AdultMaleEMR = require('../../models/EMR/adultMaleEMR.model')
const AdultFemaleEMR = require('../../models/EMR/adultFemaleEMR.model')

// Get all medicine schedules for a user
exports.getUserMedicineSchedules = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    // Fetch User Medicine Schedules with pagination
    let schedules = await UserMedicineSchedule.find({ user: userId })
      .sort({ lastModified: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    schedules = schedules?.map(s => ({ ...s, dateOfDiagnosis: s.createdAt }));

    // Fetch Adult Male and Female EMR schedules
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

    const emrSchedules = [];

    // Format EMR medicine schedules
    const emrMedicineSchedules = allEMRs.map((emr) => {
      if (emr.diagnosis && emr.diagnosis.length > 0) {
        emr.diagnosis.forEach((diag) => {
          const medicines = [];
          if (diag.prescription && diag.prescription.length > 0) {
            diag.prescription.forEach((med) => {
              medicines.push({
                _id: med._id,
                drugName: med.drugName || "Unnamed medication",
                dosage: med.quantity || "As prescribed",
                frequency: med.frequency || med.freequency || "As directed",
                doseCycleGap: med.howToTake ? med.howToTake : "0",
                startDate: diag.dateOfDiagnosis,
                endDate: null,
                status: "Active"
              });
            });
          }

          if (medicines?.length > 0) {
            emrSchedules.push({
              _id: emr._id,
              user: emr.user,
              diagnosisName: diag.diagnosisName,
              diagnosisDate: diag.dateOfDiagnosis,
              startDate: diag.dateOfDiagnosis,
              endDate: null,
              medicines,
              isActive: true,
              lastModified: emr.updatedAt,
              createdAt: emr.createdAt,
              updatedAt: emr.updatedAt,
              __v: emr?.__v || 0,
            });
          }
        });
      }
    });

    // Combine the user medicine schedules and EMR schedules
    const combinedSchedules = [...schedules, ...emrSchedules];

    // Sort the combined schedules by lastModified (or createdAt)
    const sortedSchedules = combinedSchedules.sort((a, b) => b.lastModified - a.lastModified);

    // Calculate the total number of schedules (maximum of user schedules and EMR schedules)
    const userMedicineSchedulesTotal = await UserMedicineSchedule.countDocuments({ user: userId });
    const emrSchedulesTotal = emrSchedules.length;

    // The total will be the maximum of the two
    const total = Math.max(userMedicineSchedulesTotal, emrSchedulesTotal);

    // Calculate pagination parameters
    const totalPages = Math.ceil(total / limit);

    // Return the combined schedules with pagination information
    return Response.success(
      res,
      {
        schedules: sortedSchedules,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages
        }
      },
      200,
      "User medicine schedules retrieved successfully",
      AppConstant.SUCCESS
    );
  } catch (error) {
    console.error('Error fetching medicine schedules:', error);
    return Response.error(res, 500, AppConstant.FAILED, error.message || "Internal server error");
  }
};

// Create a new medicine schedule
exports.createUserMedicineSchedule = async (req, res) => {
  try {
    const userId = req.user._id;
    const scheduleData = {
      ...req.body,
      user: userId,
      lastModified: new Date()
    };

    const schedule = new UserMedicineSchedule(scheduleData);
    await schedule.save();

    return Response.success(res, schedule, 201, "User medicine schedule created successfully!", AppConstant.SUCCESS);
  } catch (error) {
    console.error('Error creating medicine schedule:', error);
    return Response.error(res, 500, AppConstant.FAILED, error.message);
  }
};

// Update a medicine schedule
exports.updateUserMedicineSchedule = async (req, res) => {
  try {
    const userId = req.user._id;
    const { scheduleId } = req.params;
    const updateData = {
      ...req.body,
      lastModified: new Date()
    };

    const schedule = await UserMedicineSchedule.findOneAndUpdate(
      { _id: scheduleId, user: userId },
      updateData,
      { new: true }
    );

    if (!schedule) {
      return Response.error(res, 404, AppConstant.FAILED, 'Medicine schedule not found');
    }

    return Response.success(res, schedule, 200, 'User medicine schedule updated successfully!', AppConstant.SUCCESS);
  } catch (error) {
    console.error('Error updating medicine schedule:', error);
    return Response.error(res, 500, AppConstant.FAILED, error.message);
  }
};

// Delete a medicine schedule
exports.deleteUserMedicineSchedule = async (req, res) => {
  try {
    const userId = req.user._id;
    const { scheduleId } = req.params;

    const schedule = await UserMedicineSchedule.findOneAndDelete({
      _id: scheduleId,
      user: userId
    });

    if (!schedule) {
      return Response.error(res, 404, AppConstant.FAILED, 'Medicine schedule not found');
    }

    return Response.success(res, schedule, 200, 'Medicine schedule deleted successfully', AppConstant.SUCCESS);
  } catch (error) {
    console.error('Error deleting medicine schedule:', error);
    return Response.error(res, 500, AppConstant.FAILED, error.message);
  }
};
