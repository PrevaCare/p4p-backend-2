const UserMedicineSchedule = require('../../models/patient/userMedicineSchedule.model');
const Response = require('../../utils/Response');
const AppConstant = require('../../utils/AppConstant');

// Get all medicine schedules for a user
exports.getUserMedicineSchedules = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    const schedules = await UserMedicineSchedule.find({ user: userId })
      .sort({ lastModified: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await UserMedicineSchedule.countDocuments({ user: userId });

    return Response.success(
        res,
        {
            schedules,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        },
        200,
        AppConstant.SUCCESS,
        "User medicine schedules retreived successfully"
    );
  } catch (error) {
    console.error('Error fetching medicine schedules:', error);
    return Response.error(res, 500, AppConstant.FAILED, error.message);
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

    return Response.success(res, schedule, 201, AppConstant.SUCCESS, "User medicine schedule created successfully!");
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

    return Response.success(res, 200, AppConstant.SUCCESS, {
      schedule
    });
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

    return Response.success(res, 200, AppConstant.SUCCESS, {
      message: 'Medicine schedule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting medicine schedule:', error);
    return Response.error(res, 500, AppConstant.FAILED, error.message);
  }
};
