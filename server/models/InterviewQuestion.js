const mongoose = require('mongoose');

const interviewQuestionSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
    },
    questionText: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    topic: {
      type: String,
      default: 'General',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('InterviewQuestion', interviewQuestionSchema);
