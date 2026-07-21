const fs = require('fs');
const path = require('path');
const Resume = require('../models/Resume');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const { parseResume } = require('../utils/parser');
const { analyzeResumeHybrids } = require('../utils/atsAnalyzer');

// @desc    Upload, Parse & Analyze Resume (Hybrid engine)
// @route   POST /api/resume/upload
// @access  Private
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a resume file' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const jobDescription = req.body.jobDescription || '';

    // 1. Extract plain text content
    let extractedText;
    try {
      extractedText = await parseResume(filePath);
    } catch (parseError) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(400).json({ success: false, message: parseError.message });
    }

    if (!extractedText.trim()) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(400).json({ success: false, message: 'Document is empty or could not be parsed' });
    }

    // 2. Perform hybrid analysis (Algorithmic + Gemini AI)
    const analysisResults = await analyzeResumeHybrids(extractedText, jobDescription);

    // 3. Create the Resume record (placeholder to get ID)
    const resumeRecord = new Resume({
      user: req.user._id,
      fileName,
      filePath: path.relative(path.join(__dirname, '..'), filePath),
      extractedText,
      atsScore: analysisResults.atsScore,
    });

    // 4. Create the detailed ResumeAnalysis record linked to the resume
    const analysisRecord = await ResumeAnalysis.create({
      resume: resumeRecord._id,
      user: req.user._id,
      ...analysisResults,
    });

    // 5. Update Resume record with the analysis reference
    resumeRecord.latestAnalysis = analysisRecord._id;
    await resumeRecord.save();

    res.status(201).json({
      success: true,
      data: {
        _id: resumeRecord._id,
        fileName: resumeRecord.fileName,
        filePath: resumeRecord.filePath,
        atsScore: resumeRecord.atsScore,
        createdAt: resumeRecord.createdAt,
        analysis: {
          ...analysisRecord.toObject(),
          skillsFound: analysisResults.skillsFound,
          skillsMissing: analysisResults.skillsMissing,
          recruiterSummary: analysisResults.recruiterSummary,
          strengths: analysisResults.strengths,
          weaknesses: analysisResults.weaknesses,
          industryRecommendations: analysisResults.industryRecommendations,
          sectionWiseScores: analysisResults.sectionWiseScores
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's upload history
// @route   GET /api/resume/history
// @access  Private
const getResumeHistory = async (req, res, next) => {
  try {
    // Find resumes and populate their latest analysis data
    const resumes = await Resume.find({ user: req.user._id })
      .populate('latestAnalysis')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: resumes.length,
      data: resumes.map(r => {
        const analysis = r.latestAnalysis ? r.latestAnalysis.toObject() : null;
        return {
          _id: r._id,
          fileName: r.fileName,
          filePath: r.filePath,
          atsScore: r.atsScore,
          createdAt: r.createdAt,
          analysis: analysis ? {
            ...analysis,
            skillsFound: analysis.keywordMatches || [],
            skillsMissing: analysis.keywordGaps || [],
            recruiterSummary: analysis.summary || '',
            strengths: analysis.positives || [],
            weaknesses: analysis.negatives || [],
            industryRecommendations: analysis.suggestions || [],
            sectionWiseScores: {
              formatting: analysis.formattingScore || 0,
              skills: analysis.skillsScore || 0,
              experience: analysis.experienceScore || 0,
              projects: analysis.projectsScore || 0,
              education: analysis.educationScore || 0,
              keywords: analysis.keywordsScore || 0,
              verbs: analysis.verbsScore || 0,
              grammar: analysis.grammarScore || 0
            }
          } : null
        };
      }),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete custom resume scan
// @route   DELETE /api/resume/:id
// @access  Private
const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume analysis record not found' });
    }

    // Check ownership
    if (resume.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'User not authorized to delete this record' });
    }

    // Attempt to delete physical file from disk
    const absolutePath = path.join(__dirname, '..', resume.filePath);
    if (fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
      } catch (fileError) {
        console.error('Failed to delete physical file from storage:', fileError);
      }
    }

    // Delete associated analyses first
    await ResumeAnalysis.deleteMany({ resume: resume._id });

    // Delete the resume record
    await resume.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Resume and analysis records deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadResume,
  getResumeHistory,
  deleteResume,
};
