const express = require('express');
const router = express.Router();
const { getGlobalSettings, updateGlobalSettings } = require('../../controllers/settings/globalSetting.controller');
const { validateGlobalSetting } = require('../../validators/globalSetting.validator');
const { verifyAndSuperAdmin } = require('../../middlewares/jwt/verifyToken');

// Get global settings
router.get('/', verifyAndSuperAdmin, getGlobalSettings);
// Update global settings
router.put('/', verifyAndSuperAdmin, validateGlobalSetting, updateGlobalSettings);

module.exports = router; 