const express = require('express');
const router = express.Router();
const { getChatHistory, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/history', protect, getChatHistory);
router.post('/message', protect, sendMessage);

module.exports = router;
