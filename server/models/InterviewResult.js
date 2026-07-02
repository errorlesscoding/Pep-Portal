const mongoose = require('mongoose');

const interviewResultSchema = new mongoose.Schema(
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
    answer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewAnswer',
      required: true,
    },
    score: { type: Number, default: 0 },
    feedback: { type: String, default: '' },
    sampleAnswer: { type: String, default: '' },

    // --- Granular Sub-Metrics ---
    accuracyScore: { type: Number, default: 0 },
    confidenceScore: { type: Number, default: 0 },
    technicalDepthScore: { type: Number, default: 0 },
    communicationScore: { type: Number, default: 0 },
    grammarScore: { type: Number, default: 0 },
    fluencyScore: { type: Number, default: 0 },
    relevanceScore: { type: Number, default: 0 },
    completenessScore: { type: Number, default: 0 },

    // --- Live Feedback details ---
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    missingConcepts: [{ type: String }],
    suggestedImprovements: [{ type: String }],
    betterExplanation: { type: String, default: '' },
    interviewTip: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('InterviewResult', interviewResultSchema);
