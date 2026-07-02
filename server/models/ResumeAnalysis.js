const mongoose = require('mongoose');

const resumeAnalysisSchema = new mongoose.Schema(
  {
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    atsScore: { type: Number, default: 0 },
    formattingScore: { type: Number, default: 0 }, // Out of 10
    skillsScore: { type: Number, default: 0 },     // Out of 20
    experienceScore: { type: Number, default: 0 }, // Out of 20
    projectsScore: { type: Number, default: 0 },   // Out of 15
    educationScore: { type: Number, default: 0 },  // Out of 10
    keywordsScore: { type: Number, default: 0 },  // Out of 15
    grammarScore: { type: Number, default: 0 },    // Out of 5
    achievementsScore: { type: Number, default: 0 }, // Out of 5
    
    // Kept for backward compatibility or direct UI bindings
    impactScore: { type: Number, default: 0 },     
    techReadinessScore: { type: Number, default: 0 },

    summary: { type: String, default: '' },
    positives: [{ type: String }],
    negatives: [{ type: String }],
    keywordMatches: [{ type: String }],
    keywordGaps: [{ type: String }],
    suggestions: [{ type: String }],
    educationMatches: [{ type: String }],
    certificationMatches: [{ type: String }],
    actionVerbsList: [{ type: String }],
    missingActionVerbs: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
