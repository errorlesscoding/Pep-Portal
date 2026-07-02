const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getUserProfile);
router.put('/', protect, updateUserProfile);

module.exports = router;
