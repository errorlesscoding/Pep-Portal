const Interview = require('../models/Interview');
const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewAnswer = require('../models/InterviewAnswer');
const InterviewResult = require('../models/InterviewResult');
const Resume = require('../models/Resume');
const { generateFirstQuestion, generateNextQuestion, evaluateSingleResponse, generateFinalReport } = require('../utils/gemini');

// @desc    Start Interview Session, Generate Question 1 & Create Records
// @route   POST /api/interview/start
// @access  Private
const startInterview = async (req, res, next) => {
  try {
    const { 
      candidateName,
      type, 
      targetRole, 
      difficulty, 
      experienceLevel, 
      programmingLanguage, 
      companyType, 
      durationLimit,
      jobDescription 
    } = req.body;

    if (!type || !targetRole) {
      return res.status(400).json({ success: false, message: 'Please specify interview type and target role' });
    }

    // 1. Fetch latest resume context
    let resumeText = '';
    const latestResume = await Resume.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (latestResume) {
      resumeText = latestResume.extractedText || '';
    }

    const sessionParams = {
      type,
      targetRole,
      difficulty: difficulty || 'medium',
      experienceLevel: experienceLevel || 'Fresher (0-1 Years)',
      programmingLanguage: programmingLanguage || 'none',
      companyType: companyType || 'Product Based',
      durationLimit: Number(durationLimit) || 20,
      resumeText,
      jobDescription
    };

    // 2. Generate only Question 1
    const firstQuestionText = await generateFirstQuestion(sessionParams);

    // 3. Create Session Record
    const session = new Interview({
      user: req.user._id,
      candidateName: candidateName || 'Candidate',
      type,
      targetRole,
      difficulty: difficulty || 'medium',
      experienceLevel: experienceLevel || 'Fresher (0-1 Years)',
      programmingLanguage: programmingLanguage || 'none',
      companyType: companyType || 'Product Based',
      durationLimit: Number(durationLimit) || 20,
      topic: type.toUpperCase(),
      status: 'pending',
    });

    // 4. Create Question 1 Record
    const qRecord = await InterviewQuestion.create({
      session: session._id,
      questionText: firstQuestionText,
      difficulty: difficulty || 'medium',
      topic: type.toUpperCase(),
    });

    session.questions = [qRecord._id];
    await session.save();

    res.status(201).json({
      success: true,
      data: {
        _id: session._id,
        candidateName: session.candidateName,
        type: session.type,
        targetRole: session.targetRole,
        difficulty: session.difficulty,
        experienceLevel: session.experienceLevel,
        programmingLanguage: session.programmingLanguage,
        companyType: session.companyType,
        durationLimit: session.durationLimit,
        status: session.status,
        questions: [qRecord], // send array with Question 1
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Grade Single Response Immediately, then Generate next question if not complete
// @route   POST /api/interview/grade-answer
// @access  Private
const gradeAnswer = async (req, res, next) => {
  try {
    const { interviewId, questionId, answerText } = req.body;

    if (!interviewId || !questionId) {
      return res.status(400).json({ success: false, message: 'Please specify interview ID and question ID' });
    }

    const session = await Interview.findById(interviewId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'User not authorized to modify this interview' });
    }

    const questionRecord = await InterviewQuestion.findById(questionId);
    if (!questionRecord) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    if (questionRecord.session.toString() !== session._id.toString()) {
      return res.status(400).json({ success: false, message: 'Question does not belong to this interview' });
    }

    const cleanAnswer = (answerText || '').trim();
    const isSkipped = cleanAnswer === 'Skipped' || cleanAnswer === '';

    // 1. Create/Save Answer
    const answerRecord = await InterviewAnswer.create({
      session: session._id,
      question: questionId,
      answerText: isSkipped ? 'Skipped' : cleanAnswer,
    });

    // 2. Perform word-count constraints & skips penalty locally
    let evaluation;
    const wordsList = cleanAnswer.split(/\s+/).filter(w => w.length > 0);
    const wordsCount = wordsList.length;

    // Check one-word responses or matches like IDK, Don't know, Yes, No
    const oneWordRegex = /^(yes|no|ok|okay|idk|maybe|don't know|no idea)$/i;

    if (isSkipped) {
      evaluation = {
        score: 0,
        accuracyScore: 0,
        confidenceScore: 0,
        technicalDepthScore: 0,
        communicationScore: 0,
        grammarScore: 0,
        fluencyScore: 0,
        relevanceScore: 0,
        completenessScore: 0,
        feedback: 'Question was skipped by candidate.',
        sampleAnswer: 'No sample answer compiled for skipped questions.',
        strengths: [],
        weaknesses: ['Question Skipped'],
        missingConcepts: ['All relevant concepts'],
        suggestedImprovements: ['Attempt questions to receive evaluation advice.'],
        betterExplanation: 'Try giving at least a basic explanation or mention similar systems.',
        interviewTip: 'Even a partial guess is better than leaving an answer completely blank during interviews.'
      };
    } else if (wordsCount < 15 || oneWordRegex.test(cleanAnswer)) {
      // Short response overrides (Technical: 0-10, Communication: 0-20, Overall: Below 15)
      const dynamicTech = Math.floor(Math.random() * 11); // 0-10
      const dynamicComm = Math.floor(Math.random() * 21); // 0-20
      const dynamicOverall = Math.floor(Math.random() * 6) + 9; // 9-14 (Below 15)

      evaluation = {
        score: dynamicOverall,
        accuracyScore: 10,
        confidenceScore: 10,
        technicalDepthScore: dynamicTech,
        communicationScore: dynamicComm,
        grammarScore: 20,
        fluencyScore: 10,
        relevanceScore: 20,
        completenessScore: 10,
        feedback: 'Answer is too short for meaningful evaluation.',
        sampleAnswer: 'An ideal response should be a complete explanation of the technical principles, including code syntaxes or deployment structures.',
        strengths: [],
        weaknesses: ['Answer is too short', 'Lacks technical depth', 'One-word/simple response pattern detected'],
        missingConcepts: ['Comprehensive explanation', 'Coding examples', 'Architectural components'],
        suggestedImprovements: ['Expand your response to provide detailed technical definitions and examples.'],
        betterExplanation: 'Explain both definitions and functional layouts to satisfy technical depth expectations.',
        interviewTip: 'Aim to speak or type at least 2-3 sentences to fully explain a technical concept in an interview.'
      };
    } else {
      // Query Gemini
      evaluation = await evaluateSingleResponse(
        questionRecord.questionText,
        answerRecord.answerText,
        session.type,
        session.targetRole
      );
    }

    // 3. Create Result Record
    const resultRecord = await InterviewResult.create({
      session: session._id,
      question: questionId,
      answer: answerRecord._id,
      score: evaluation.score,
      feedback: evaluation.feedback,
      sampleAnswer: evaluation.sampleAnswer,
      accuracyScore: evaluation.accuracyScore,
      confidenceScore: evaluation.confidenceScore,
      technicalDepthScore: evaluation.technicalDepthScore,
      communicationScore: evaluation.communicationScore,
      grammarScore: evaluation.grammarScore,
      fluencyScore: evaluation.fluencyScore,
      relevanceScore: evaluation.relevanceScore,
      completenessScore: evaluation.completenessScore,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      missingConcepts: evaluation.missingConcepts,
      suggestedImprovements: evaluation.suggestedImprovements,
      betterExplanation: evaluation.betterExplanation || '',
      interviewTip: evaluation.interviewTip || ''
    });

    // Push into references arrays
    session.answers.push(answerRecord._id);
    session.results.push(resultRecord._id);
    await session.save();

    // 4. Check if we need to generate the NEXT question
    const maxQuestionsCount = session.durationLimit >= 30 ? 6 : 4;
    const currentQuestionsCount = session.questions.length;
    let nextQuestionRecord = null;
    let isLastQuestion = false;

    if (currentQuestionsCount < maxQuestionsCount) {
      const askedQuestions = await InterviewQuestion.find({ session: session._id });
      const askedQuestionsTexts = askedQuestions.map(q => q.questionText);

      let resumeText = '';
      const latestResume = await Resume.findOne({ user: session.user }).sort({ createdAt: -1 });
      if (latestResume) {
        resumeText = latestResume.extractedText || '';
      }

      const sessionParams = {
        type: session.type,
        targetRole: session.targetRole,
        difficulty: session.difficulty,
        experienceLevel: session.experienceLevel,
        programmingLanguage: session.programmingLanguage,
        resumeText
      };

      // Call adaptive question generator
      const nextQuestionText = await generateNextQuestion(
        sessionParams, 
        askedQuestionsTexts, 
        questionRecord.questionText, 
        answerRecord.answerText, 
        resultRecord.score
      );

      nextQuestionRecord = await InterviewQuestion.create({
        session: session._id,
        questionText: nextQuestionText,
        difficulty: session.difficulty,
        topic: session.type.toUpperCase(),
      });

      session.questions.push(nextQuestionRecord._id);
      await session.save();
    } else {
      isLastQuestion = true;
    }

    res.status(200).json({
      success: true,
      data: resultRecord,
      nextQuestion: nextQuestionRecord,
      isLastQuestion
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Finish Session, Calculate Aggregate Report & AI Recommendations
// @route   POST /api/interview/finish
// @access  Private
const finishInterview = async (req, res, next) => {
  try {
    const { interviewId, duration } = req.body;

    if (!interviewId) {
      return res.status(400).json({ success: false, message: 'Please specify interview ID' });
    }

    const session = await Interview.findById(interviewId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    if (session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'User not authorized to modify this interview' });
    }

    const questionsCount = session.questions.length;
    const answersCount = session.answers.length;

    if (answersCount < questionsCount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Interview not completed. No score available.' 
      });
    }

    // 1. Gather all graded results
    const resultsList = await InterviewResult.find({ session: session._id })
      .populate('question')
      .populate('answer');

    const formattedResults = resultsList.map(r => ({
      questionText: r.question?.questionText || '',
      answerText: r.answer?.answerText || '',
      score: r.score,
      feedback: r.feedback
    }));

    // 2. Query Gemini to compile report
    const report = await generateFinalReport(session, formattedResults);

    // 3. Save report details
    session.overallScore = report.overallScore;
    session.technicalScore = report.technicalScore;
    session.communicationScore = report.communicationScore;
    session.confidenceScore = report.confidenceScore;
    session.problemSolvingScore = report.problemSolvingScore;
    session.behaviorScore = report.behaviorScore;
    session.grammarScore = report.grammarScore;
    session.hiringRecommendation = report.hiringRecommendation;
    session.overallFeedback = report.overallFeedback;
    session.strongAreas = report.strongAreas;
    session.weakAreas = report.weakAreas;
    session.recommendationTopics = report.recommendationTopics;
    session.recommendationDSA = report.recommendationDSA;
    session.recommendationProjects = report.recommendationProjects;
    session.recommendationTips = report.recommendationTips;
    session.recommendationResources = report.recommendationResources;
    session.duration = duration || 0;
    session.status = 'completed';

    await session.save();

    const populatedSession = await Interview.findById(session._id)
      .populate('questions')
      .populate('answers')
      .populate({
        path: 'results',
        populate: ['question', 'answer'],
      });

    res.status(200).json({
      success: true,
      data: populatedSession,
    });
  } catch (error) {
    next(error);
  }
};



// @desc    Get user's mock interview history
// @route   GET /api/interview/history
// @access  Private
const getInterviewHistory = async (req, res, next) => {
  try {
    const interviews = await Interview.find({ user: req.user._id, status: 'completed' })
      .populate('questions')
      .populate('answers')
      .populate({
        path: 'results',
        populate: ['question', 'answer'],
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: interviews.length,
      data: interviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single mock interview details
// @route   GET /api/interview/:id
// @access  Private
const getInterviewById = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('questions')
      .populate('answers')
      .populate({
        path: 'results',
        populate: ['question', 'answer'],
      });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview report not found' });
    }

    if (interview.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'User not authorized to view this report' });
    }

    res.status(200).json({
      success: true,
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download professional diagnostic PDF report for mock interview
// @route   GET /api/interview/:id/pdf
// @access  Private
const downloadInterviewPDF = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('questions')
      .populate('answers')
      .populate({
        path: 'results',
        populate: ['question', 'answer'],
      });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview report not found' });
    }

    if (interview.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'User not authorized to download this report' });
    }

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Interview_Report_${interview.candidateName || 'Candidate'}.pdf`);

    doc.pipe(res);

    // Header styling
    doc.fillColor('#312E81').rect(0, 0, 595.28, 120).fill(); // Indigo banner
    doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('InterviewAI diagnostic report', 50, 40);
    doc.fontSize(10).font('Helvetica').text('Comprehensive Simulated Candidate Assessment', 50, 70);

    // Metadata block
    doc.fillColor('#1F2937').fontSize(10).font('Helvetica-Bold').text('Candidate Name:', 50, 140);
    doc.font('Helvetica').text(interview.candidateName || 'N/A', 150, 140);

    doc.font('Helvetica-Bold').text('Target Role:', 50, 160);
    doc.font('Helvetica').text(interview.targetRole || 'N/A', 150, 160);

    doc.font('Helvetica-Bold').text('Session Type:', 50, 180);
    doc.font('Helvetica').text((interview.type || 'N/A').toUpperCase(), 150, 180);

    doc.font('Helvetica-Bold').text('Interview Date:', 50, 200);
    doc.font('Helvetica').text(new Date(interview.createdAt).toLocaleDateString(), 150, 200);

    doc.font('Helvetica-Bold').text('Hiring Recommendation:', 50, 220);
    doc.fillColor('#4F46E5').font('Helvetica-Bold').text(interview.hiringRecommendation || 'N/A', 180, 220);

    // Score Badge
    doc.fillColor('#F3F4F6').rect(390, 140, 155, 90).fill(); // Background box
    doc.fillColor('#4F46E5').fontSize(32).font('Helvetica-Bold').text(`${interview.overallScore}%`, 390, 160, { width: 155, align: 'center' });
    doc.fillColor('#6B7280').fontSize(9).font('Helvetica').text('OVERALL SCORE', 390, 200, { width: 155, align: 'center' });

    // Divider
    doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(50, 250).lineTo(545, 250).stroke();

    // Category breakdown
    doc.fillColor('#1F2937').fontSize(12).font('Helvetica-Bold').text('Performance Breakdown', 50, 270);

    const categories = [
      { label: 'Technical Core', score: interview.technicalScore || 0 },
      { label: 'Communication skills', score: interview.communicationScore || 0 },
      { label: 'Confidence levels', score: interview.confidenceScore || 0 },
      { label: 'Problem solving', score: interview.problemSolvingScore || 0 },
      { label: 'Grammar & Clarity', score: interview.grammarScore || 0 }
    ];

    let startY = 295;
    categories.forEach((cat) => {
      doc.fillColor('#374151').fontSize(9).font('Helvetica').text(cat.label, 50, startY);
      doc.fillColor('#E5E7EB').rect(200, startY - 2, 250, 8).fill(); // empty
      doc.fillColor('#4F46E5').rect(200, startY - 2, (cat.score / 100) * 250, 8).fill(); // filled
      doc.fillColor('#1F2937').fontSize(9).font('Helvetica-Bold').text(`${cat.score}%`, 465, startY);
      startY += 18;
    });

    // Divider
    doc.strokeColor('#E5E7EB').moveTo(50, startY + 10).lineTo(545, startY + 10).stroke();

    // Strengths & Weaknesses
    startY += 25;
    doc.fillColor('#1F2937').fontSize(12).font('Helvetica-Bold').text('Strengths & Improvement Areas', 50, startY);

    doc.fillColor('#065F46').fontSize(10).font('Helvetica-Bold').text('Key Strengths:', 50, startY + 20);
    let strengthY = startY + 35;
    if (interview.strongAreas && interview.strongAreas.length > 0) {
      interview.strongAreas.forEach(sa => {
        doc.fillColor('#374151').font('Helvetica').text(`* ${sa}`, 50, strengthY, { width: 220 });
        strengthY += doc.heightOfString(`* ${sa}`, { width: 220 }) + 4;
      });
    } else {
      doc.fillColor('#6B7280').font('Helvetica').text('No specific strengths recorded.', 50, strengthY);
      strengthY += 15;
    }

    doc.fillColor('#991B1B').fontSize(10).font('Helvetica-Bold').text('Areas for Improvement:', 300, startY + 20);
    let weaknessY = startY + 35;
    if (interview.weakAreas && interview.weakAreas.length > 0) {
      interview.weakAreas.forEach(wa => {
        doc.fillColor('#374151').font('Helvetica').text(`* ${wa}`, 300, weaknessY, { width: 240 });
        weaknessY += doc.heightOfString(`* ${wa}`, { width: 240 }) + 4;
      });
    } else {
      doc.fillColor('#6B7280').font('Helvetica').text('No weaknesses identified.', 300, weaknessY);
      weaknessY += 15;
    }

    // AI feedback section
    let currentY = Math.max(strengthY, weaknessY) + 20;
    if (currentY > 680) {
      doc.addPage();
      currentY = 50;
    } else {
      doc.strokeColor('#E5E7EB').moveTo(50, currentY).lineTo(545, currentY).stroke();
      currentY += 15;
    }

    doc.fillColor('#1F2937').fontSize(11).font('Helvetica-Bold').text('AI Recruiter feedback summary', 50, currentY);
    doc.fillColor('#374151').fontSize(9).font('Helvetica').text(interview.overallFeedback || 'N/A', 50, currentY + 15, { width: 495, align: 'justify' });

    currentY += doc.heightOfString(interview.overallFeedback || 'N/A', { width: 495 }) + 35;

    if (currentY > 650) {
      doc.addPage();
      currentY = 50;
    } else {
      doc.strokeColor('#E5E7EB').moveTo(50, currentY).lineTo(545, currentY).stroke();
      currentY += 15;
    }

    // Roadmap recommendations
    doc.fillColor('#1F2937').fontSize(11).font('Helvetica-Bold').text('Personalized Learning & Prep Roadmap', 50, currentY);

    const roadmap = [
      { label: 'Recommended Study Topics', data: interview.recommendationTopics, color: '#4F46E5' },
      { label: 'DSA Practice Focus', data: interview.recommendationDSA, color: '#D97706' },
      { label: 'Suggested Capstone Upgrades', data: interview.recommendationProjects, color: '#059669' },
      { label: 'Study Resources & References', data: interview.recommendationResources, color: '#2563EB' }
    ];

    let roadY = currentY + 20;
    roadmap.forEach(sec => {
      if (roadY > 700) {
        doc.addPage();
        roadY = 50;
      }
      doc.fillColor(sec.color).fontSize(9).font('Helvetica-Bold').text(sec.label, 50, roadY);
      roadY += 14;
      if (sec.data && sec.data.length > 0) {
        sec.data.forEach(item => {
          if (roadY > 740) {
            doc.addPage();
            roadY = 50;
          }
          doc.fillColor('#374151').fontSize(8.5).font('Helvetica').text(`- ${item}`, 60, roadY, { width: 480 });
          roadY += doc.heightOfString(`- ${item}`, { width: 480 }) + 3;
        });
      } else {
        doc.fillColor('#6B7280').fontSize(8.5).font('Helvetica').text('No recommendation required.', 60, roadY);
        roadY += 12;
      }
      roadY += 8;
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startInterview,
  gradeAnswer,
  finishInterview,
  getInterviewHistory,
  getInterviewById,
  downloadInterviewPDF,
};
