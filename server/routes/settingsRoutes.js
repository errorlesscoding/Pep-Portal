const express = require('express');
const router = express.Router();
const { getUserSettings, updateUserSettings } = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getUserSettings);
router.put('/', protect, updateUserSettings);

module.exports = router;
