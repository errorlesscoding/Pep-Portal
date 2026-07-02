const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    candidateName: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      required: true,
    },
    targetRole: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    experienceLevel: {
      type: String,
      enum: ['Fresher (0-1 Years)', 'Junior (1-3 Years)', 'Mid Level (3-5 Years)', 'Senior (5+ Years)'],
      default: 'Fresher (0-1 Years)',
    },
    experienceYears: {
      type: Number,
      default: 0,
    },
    programmingLanguage: {
      type: String,
      default: 'none',
    },
    companyType: {
      type: String,
      default: 'Product Based',
    },
    durationLimit: {
      type: Number,
      default: 20, // in minutes
    },
    topic: {
      type: String,
      default: 'General',
    },
    duration: {
      type: Number,
      default: 0, // in seconds
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewQuestion',
      },
    ],
    answers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewAnswer',
      },
    ],
    results: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewResult',
      },
    ],
    
    // --- Final Evaluation Report Scores ---
    overallScore: { type: Number, default: 0 },
    technicalScore: { type: Number, default: 0 },
    communicationScore: { type: Number, default: 0 },
    confidenceScore: { type: Number, default: 0 },
    problemSolvingScore: { type: Number, default: 0 },
    behaviorScore: { type: Number, default: 0 },
    grammarScore: { type: Number, default: 0 },
    hiringRecommendation: {
      type: String,
      enum: ['Excellent', 'Good', 'Average', 'Needs Improvement'],
      default: 'Average',
    },
    overallFeedback: { type: String, default: '' },
    strongAreas: [{ type: String }],
    weakAreas: [{ type: String }],

    // --- AI Recommendations ---
    recommendationTopics: [{ type: String }],
    recommendationDSA: [{ type: String }],
    recommendationProjects: [{ type: String }],
    recommendationTips: [{ type: String }],
    recommendationResources: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Interview', interviewSchema);
