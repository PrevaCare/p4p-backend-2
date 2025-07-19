const GlobalSetting = require('../../models/settings/globalSetting.model');

// Get global settings (assume only one document)
exports.getGlobalSettings = async (req, res) => {
  try {
    const settings = await GlobalSetting.findOne();
    if (!settings) return res.status(404).json({ message: 'Global settings not found' });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update global settings (upsert)
exports.updateGlobalSettings = async (req, res) => {
  try {
    const update = req.body;
    const settings = await GlobalSetting.findOneAndUpdate({}, update, { new: true, upsert: true });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 