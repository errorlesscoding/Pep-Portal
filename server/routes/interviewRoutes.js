const express = require('express');
const router = express.Router();
const { 
  startInterview, 
  gradeAnswer, 
  finishInterview, 
  getInterviewHistory, 
  getInterviewById,
  downloadInterviewPDF
} = require('../controllers/interviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/start', protect, startInterview);
router.post('/grade-answer', protect, gradeAnswer);
router.post('/finish', protect, finishInterview);
router.get('/history', protect, getInterviewHistory);
router.get('/:id/pdf', protect, downloadInterviewPDF);
router.get('/:id', protect, getInterviewById);

module.exports = router;
