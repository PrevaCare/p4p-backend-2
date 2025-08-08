const RequestLog = require('../models/common/request.log.model');

const logRequest = async (req, res, next) => {
  try {
    const logData = {
      userId: req.user?._id || null,
      appLatestVersion: req.headers['x-app-latest-version'] || 'Not Provided', // Header for latest app version
      appStableVersion: req.headers['x-app-stable-version'] || 'Not Provided', // Header for stable app version
      deviceType: req.headers['x-device-type'] || 'Unknown', // Header for device type
      path: req.originalUrl // Path of the request
    };

    // Save the log in the database
    const logEntry = new RequestLog(logData);
    await logEntry.save();

    next(); // Pass control to the next middleware or route handler
  } catch (error) {
    console.error('Error logging request:', error);
    next(); // Ensure that the request continues even if logging fails
  }
};

module.exports = {
  logRequest
};
