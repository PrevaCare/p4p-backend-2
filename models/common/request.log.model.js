const mongoose = require('mongoose');

const requestLogSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  appLatestVersion: { type: String, required: true },
  appStableVersion: { type: String, required: true },
  deviceType: { type: String, required: true },
  path: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const RequestLog = mongoose.model('RequestLog', requestLogSchema);

module.exports = RequestLog;
