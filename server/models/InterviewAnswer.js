const mongoose = require('mongoose');

const interviewAnswerSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
    },
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewQuestion',
      required: true,
    },
    answerText: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('InterviewAnswer', interviewAnswerSchema);
