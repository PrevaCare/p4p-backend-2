const notificationsModel = require("../../../models/notificationSystem/notifications.model");
const AppConstant = require("../../../utils/AppConstant");
const {
  getCurrentMonthDates,
} = require("../../../utils/dateFormat/dateFormat.utils");
const Response = require("../../../utils/Response");

const getNotificationCountByUserId = async (req, res) => {
  try {
    //
    const { _id } = req.user;
    if (!_id) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "user id is missing!"
      );
    }

    //
    const notificationCountDoc = await notificationsModel.countDocuments({
      userId: _id,
      read: false,
      createdAt: {
        $gte: getCurrentMonthDates().startDate,
        $lte: getCurrentMonthDates().endDate,
      },
    });

    return Response.success(
      res,
      { count: notificationCountDoc || 0 },
      200,
      "notification count fetched !"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal Server error!"
    );
  }
};

const getAllNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query?.limit || 50)
    const { _id } = req.user;
    if (!_id) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "user id is missing!"
      );
    }

    const notifications = await notificationsModel.find(
      {
        userId: _id,
      },
      "title message read createdAt"
    ).limit(limit)
      .lean();

    // Set all notification as read
    await notificationsModel.updateMany(
      { userId: _id, read: { $ne: true } },  // Update only unread notifications
      { $set: { read: true } }  // Set 'read' to true
    );

    return Response.success(
      res,
      {
        notifications,
        total: notifications?.length,
        limit
      },
      200,
      "notification count fetched !"
    );
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal Server error!"
    );
  }
};

// update notification by id - mark read
const markReadNotificationById = async (req, res) => {
  try {
    //
    const { notificationId } = req.body;
    if (!notificationId) {
      return Response.error(
        res,
        404,
        AppConstant.FAILED,
        "notification Id is missing!"
      );
    }

    //
    await notificationsModel.findByIdAndUpdate(
      notificationId,
      {
        $set: { read: true },
      },
      { new: true }
    );

    return Response.success(res, null, 200, "mark read success !");
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal Server error!"
    );
  }
};

// update user notification - mark read
const markAsReadUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id

    const result = await notificationsModel.updateMany(
      { userId, read: { $ne: true } },  // Update only unread notifications
      { $set: { read: true } }  // Set 'read' to true
    );

    if (result.nModified > 0) {
      return Response.success(res, null, 200, "All notifications marked as read!");
    }

    return Response.success(res, null, 200, "No unread notifications found.");
  } catch (err) {
    return Response.error(
      res,
      500,
      AppConstant.FAILED,
      err.message || "Internal Server error!"
    );
  }
};

module.exports = {
  getNotificationCountByUserId,
  getAllNotifications,
  markReadNotificationById,
  markAsReadUserNotifications
};
