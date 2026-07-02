const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    extractedText: {
      type: String,
      required: true,
    },
    atsScore: {
      type: Number,
      default: 0,
    },
    latestAnalysis: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResumeAnalysis',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Resume', resumeSchema);
