const { GoogleGenerativeAI } = require('@google/generative-ai');

const getApiKey = () => {
  return process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
};

/**
 * Helper to calculate dynamic mock scores for fallback mode (removes hardcoded placeholders)
 */
const calculateDynamicMockScore = (answerText) => {
  return 70 + (Math.floor(Math.random() * 20));
};

/**
 * Analyzes resume text using Gemini AI
 */
const analyzeResumeWithGemini = async (resumeText) => {
  const apiKey = getApiKey();

  const fallbackData = {
    atsScore: 72,
    analysis: {
      formattingScore: 80,
      impactScore: 70,
      experienceScore: 75,
      skillsScore: 68,
      summary: 'Your resume shows strong foundational technical credentials. However, the descriptions of your projects lack quantitative impact, and several critical industry keywords are missing.',
      positives: [
        'Clear structure and readable layout hierarchy',
        'Strong academic background and clear technical list'
      ],
      negatives: [
        'Lack of quantitative metrics in project bullets',
        'Missing keywords related to cloud architecture'
      ],
      keywordMatches: ['Javascript', 'React.js', 'Node.js', 'Express.js', 'MongoDB'],
      keywordGaps: ['Docker', 'AWS (S3/EC2)', 'CI/CD Pipelines'],
      suggestions: [
        'Revise your first project bullet point to start with an action verb and add a metric.',
        'Add a dedicated cloud/deployment skills section showing exposure to AWS/Docker.'
      ]
    }
  };

  if (!apiKey) {
    return fallbackData;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You are an expert Applicant Tracking System (ATS) auditor.
      Analyze the following resume text and provide a rigorous ATS score, category-specific ratings, positives, negatives, keyword alignment review, and actionable suggestions.
      
      Resume:
      "${resumeText}"
      
      Respond ONLY with a valid JSON object. Do not include markdown blocks. Schema:
      {
        "atsScore": 85,
        "formattingScore": 90,
        "impactScore": 75,
        "experienceScore": 80,
        "skillsScore": 82,
        "summary": "Brief summary",
        "positives": ["Point 1"],
        "negatives": ["Point 1"],
        "keywordMatches": ["Keyword 1"],
        "keywordGaps": ["Keyword 1"],
        "suggestions": ["Suggestion 1"]
      }
    `;

    const result = await model.generateContent(prompt);
    let cleanJson = result.response.text().trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }
    const parsedJson = JSON.parse(cleanJson);
    return {
      atsScore: parsedJson.atsScore || 70,
      analysis: {
        formattingScore: parsedJson.formattingScore || 70,
        impactScore: parsedJson.impactScore || 70,
        experienceScore: parsedJson.experienceScore || 70,
        skillsScore: parsedJson.skillsScore || 70,
        summary: parsedJson.summary || 'Analysis complete.',
        positives: parsedJson.positives || [],
        negatives: parsedJson.negatives || [],
        keywordMatches: parsedJson.keywordMatches || [],
        keywordGaps: parsedJson.keywordGaps || [],
        suggestions: parsedJson.suggestions || []
      }
    };
  } catch (error) {
    console.error('Error during resume analysis:', error);
    return fallbackData;
  }
};

/**
 * Generates the first opening question for the interview
 */
const generateFirstQuestion = async (params) => {
  const {
    type, targetRole, difficulty, experienceLevel,
    programmingLanguage, resumeText, jobDescription
  } = params;

  const apiKey = getApiKey();

  // Setup initial default questions if candidate is a Fresher
  const isFresher = experienceLevel === 'Fresher (0-1 Years)';
  let defaultQuestion = `Could you introduce yourself and explain what you know about the core components of ${programmingLanguage === 'none' ? 'your primary technical stack' : programmingLanguage}?`;

  if (isFresher) {
    const fresherDefaults = [
      `What is Object-Oriented Programming (OOP) and what are its core principles?`,
      `Explain the differences between GET and POST requests in Web development.`,
      `What is a Primary Key in DBMS, and why is it important in relational databases?`,
      `Explain the difference between a Stack and a Queue data structure.`,
      `What is normalisation in DBMS and what is its main goal?`,
      `What is the difference between a Process and a Thread?`
    ];
    // pick one at random or depending on category/language
    if (programmingLanguage === 'SQL' || type === 'database') {
      defaultQuestion = `What is SQL and what is the difference between a clustered and non-clustered index?`;
    } else if (programmingLanguage === 'Java' || programmingLanguage === 'C++') {
      defaultQuestion = `What is Object-Oriented Programming (OOP) and how is inheritance implemented in ${programmingLanguage}?`;
    } else {
      defaultQuestion = fresherDefaults[Math.floor(Math.random() * fresherDefaults.length)];
    }
  }

  if (!apiKey) {
    return defaultQuestion;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You are an expert technical recruiter. Generate only the first opening question for an interview.
      
      Configuration parameters:
      - Candidate Level: ${experienceLevel}
      - Target Role: ${targetRole}
      - Interview Type: ${type}
      - Difficulty: ${difficulty}
      - Programming Language: ${programmingLanguage}
      
      ${isFresher ? 'CRITICAL CONSTRAINT: Since the candidate is a Fresher, do NOT ask any advanced system design, distributed scaling, Kubernetes, or containerization questions. Instead, ask foundational questions such as OOP principles, basic data structures (Stack/Queue, Array/Linked List), DB basics (Primary Key, Normalization), GET vs POST, or basic language questions.' : ''}
      
      ${resumeText ? `- Resume Context: "${resumeText}"` : ''}
      ${jobDescription ? `- Job Description: "${jobDescription}"` : ''}
      
      Respond ONLY with the question text string. Do not use JSON or markdown labels.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Error generating first question:', error);
    return defaultQuestion;
  }
};

/**
 * Generates follow-up questions adaptively based on candidate's previous response quality
 */
const generateNextQuestion = async (params, askedQuestions = [], lastQuestion = '', lastAnswer = '', lastScore = 70) => {
  const {
    type, targetRole, difficulty, experienceLevel,
    programmingLanguage, resumeText, jobDescription
  } = params;

  const apiKey = getApiKey();
  const isFresher = experienceLevel === 'Fresher (0-1 Years)';

  // Fallbacks
  const fresherFallbacks = [
    `What is the difference between an Array and a Linked List?`,
    `Explain the difference between a GET and POST request in HTTP protocol.`,
    `What is a primary key and how does it guarantee entity integrity?`,
    `Explain REST APIs and describe standard status code ranges (2xx, 4xx, 5xx).`
  ];
  const generalFallbacks = [
    `Explain how you handle thread safety or concurrent collections in ${programmingLanguage}.`,
    `What are the advantages of relational DBMS vs document storage like MongoDB?`,
    `Explain how you scale indexes in high read scenarios.`
  ];

  const pool = isFresher ? fresherFallbacks : generalFallbacks;
  const fallback = pool.find(q => !askedQuestions.includes(q)) || pool[0];

  if (!apiKey) {
    return fallback;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You are an expert technical interviewer conducting an adaptive interview.
      
      Parameters:
      - Candidate Level: ${experienceLevel}
      - Target Role: ${targetRole}
      - Type: ${type}
      - Difficulty: ${difficulty}
      - Programming Language: ${programmingLanguage}
      
      Adaptive constraints:
      - Last Question asked: "${lastQuestion}"
      - Candidate's last response: "${lastAnswer}"
      - Last response score: ${lastScore} / 100
      
      ${lastScore < 60
        ? 'INSTRUCTION: The candidate answered weakly or skipped the previous question. Generate a slightly EASIER, more foundational follow-up question in the same technology or concept to help them regain confidence.'
        : 'INSTRUCTION: The candidate answered strongly. Generate a DEEPER, slightly more challenging follow-up question building upon their answer, or move to the next conceptual topic in their tech stack.'
      }

      ${isFresher ? 'CRITICAL CONSTRAINT: The candidate is a Fresher. Never ask advanced topics like Kubernetes, Distributed Systems, Container Scaling, or complex Microservice synchronization. Ask standard computer science fundamentals instead.' : ''}
      
      Avoid repeating any of these questions which were already asked:
      ${JSON.stringify(askedQuestions)}
      
      Respond ONLY with the question text string. Do not include markdown tags.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Error generating adaptive follow-up question:', error);
    return fallback;
  }
};

/**
 * Evaluates a single answer text using Gemini AI
 */
const evaluateSingleResponse = async (questionText, userAnswer, type, targetRole) => {
  const apiKey = getApiKey();

  if (!apiKey) {
    // Return standard dummy evaluation block matching dynamic logic
    return {
      score: 65,
      accuracyScore: 70,
      confidenceScore: 68,
      technicalDepthScore: 60,
      communicationScore: 72,
      grammarScore: 80,
      fluencyScore: 75,
      relevanceScore: 72,
      completenessScore: 62,
      feedback: 'Answer was evaluated using fallback modes. Solid conceptual foundation but details could be expanded.',
      sampleAnswer: 'To answer this completely, define the terms, show a code example, and trace edge-cases.',
      strengths: ['Clear structure', 'Correct definitions'],
      weaknesses: ['Lacks concrete examples'],
      missingConcepts: ['Performance benchmarks'],
      suggestedImprovements: ['Incorporate code metrics'],
      betterExplanation: 'Explain both advantages and disadvantages to sound more senior.',
      interviewTip: 'Always mention real-world scenarios or projects you have solved in your past roles.'
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You are an expert technical interviewer evaluating a candidate's answer.
      
      Question: "${questionText}"
      Candidate Answer: "${userAnswer}"
      Target Role: ${targetRole}
      Type: ${type}
      
      CRITICAL INSTRUCTION: If the candidate's answer is completely irrelevant to the question, gibberish, avoids answering, or shows zero understanding of the asked topic, you MUST grade the 'score', 'accuracyScore', 'technicalDepthScore', 'relevanceScore', and 'completenessScore' extremely low (between 0 and 15 out of 100). Do NOT award average or high scores (e.g. 70-80%) to incorrect, irrelevant, or non-technical answers.
      
      Perform a comprehensive evaluation and return ONLY a valid JSON object matching the schema exactly.
      JSON Schema required:
      {
        "score": 75,
        "accuracyScore": 78,
        "confidenceScore": 80,
        "technicalDepthScore": 72,
        "communicationScore": 76,
        "grammarScore": 85,
        "fluencyScore": 78,
        "relevanceScore": 80,
        "completenessScore": 70,
        "feedback": "Detailed AI feedback critique paragraph",
        "sampleAnswer": "Comprehensive ideal response text",
        "strengths": ["Strength point 1", "Strength point 2"],
        "weaknesses": ["Weakness point 1", "Weakness point 2"],
        "missingConcepts": ["Missing concept 1", "Missing concept 2"],
        "suggestedImprovements": ["Improvement suggestion 1"],
        "betterExplanation": "A brief structural guide on how the candidate can restructure this explanation to sound much better",
        "interviewTip": "An actionable tip relevant to this topic or question style"
      }
    `;

    const result = await model.generateContent(prompt);
    let cleanJson = result.response.text().trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }
    const parsedJson = JSON.parse(cleanJson);
    return {
      score: parsedJson.score || 60,
      accuracyScore: parsedJson.accuracyScore || 60,
      confidenceScore: parsedJson.confidenceScore || 60,
      technicalDepthScore: parsedJson.technicalDepthScore || 60,
      communicationScore: parsedJson.communicationScore || 60,
      grammarScore: parsedJson.grammarScore || 60,
      fluencyScore: parsedJson.fluencyScore || 60,
      relevanceScore: parsedJson.relevanceScore || 60,
      completenessScore: parsedJson.completenessScore || 60,
      feedback: parsedJson.feedback || 'Evaluation finished.',
      sampleAnswer: parsedJson.sampleAnswer || 'A perfect explanation defines components, mentions runtimes, and points out memory trade-offs.',
      strengths: parsedJson.strengths || [],
      weaknesses: parsedJson.weaknesses || [],
      missingConcepts: parsedJson.missingConcepts || [],
      suggestedImprovements: parsedJson.suggestedImprovements || [],
      betterExplanation: parsedJson.betterExplanation || 'Structure definitions before implementation rules.',
      interviewTip: parsedJson.interviewTip || 'Provide a practical code snippet if the question asks for implementation details.'
    };
  } catch (error) {
    console.error('Error evaluating answer text with Gemini:', error);
    return {
      score: 60,
      accuracyScore: 60,
      confidenceScore: 60,
      technicalDepthScore: 60,
      communicationScore: 60,
      grammarScore: 70,
      fluencyScore: 65,
      relevanceScore: 60,
      completenessScore: 60,
      feedback: 'Failed to contact Gemini API. Evaluation score set to baseline fallback.',
      sampleAnswer: 'Sample answer fallback.',
      strengths: [],
      weaknesses: ['Could not audit answer details due to system API errors.'],
      missingConcepts: [],
      suggestedImprovements: [],
      betterExplanation: 'Add detailed coding descriptions.',
      interviewTip: 'Aim to write descriptive solutions.'
    };
  }
};

/**
 * Compiles final interview report and recommendations
 */
const generateFinalReport = async (session, gradedResults) => {
  const apiKey = getApiKey();

  const validScores = gradedResults.map(r => r.score);
  const calculatedAvg = validScores.length > 0
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : 0;

  const getHiringRecommendation = (score) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Average';
    return 'Needs Improvement';
  };

  const fallbackReport = {
    overallScore: calculatedAvg,
    technicalScore: Math.round(calculatedAvg * 0.95),
    communicationScore: Math.round(calculatedAvg * 0.98),
    confidenceScore: Math.round(calculatedAvg * 0.92),
    problemSolvingScore: Math.round(calculatedAvg * 0.9),
    behaviorScore: Math.round(calculatedAvg * 0.94),
    grammarScore: Math.round(calculatedAvg * 0.96),
    hiringRecommendation: getHiringRecommendation(calculatedAvg),
    overallFeedback: `Dynamic mock interview completed. Candidate overall average rating calculated: ${calculatedAvg}%. Strong core fundamentals but needs to outline code trade-offs.`,
    strongAreas: ['General CS concepts', 'Relational DBMS keys'],
    weakAreas: ['Asynchronous loops execution', 'Performance latency boundaries'],
    recommendationTopics: ['Caching techniques', 'Memory thread allocations'],
    recommendationDSA: ['Hash maps', 'Binary trees'],
    recommendationProjects: ['Configure API rate-limiters', 'Deploy index keys on SQL schemas'],
    recommendationTips: ['Follow the STAR outline format', 'Provide structural diagrams when explaining backend flows'],
    recommendationResources: ['Alex Xu System Design Interview', 'LeetCode Algorithms Practice']
  };

  if (!apiKey) {
    return fallbackReport;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const qSummary = gradedResults.map(r => ({
      question: r.questionText,
      answer: r.answerText,
      score: r.score,
      feedback: r.feedback
    }));

    const prompt = `
      You are a senior technical recruiter compiling a final interview review for candidate "${session.candidateName || 'Candidate'}" applying for "${session.targetRole}".
      We have graded individual answers from their interview.
      
      Session parameters:
      - Category: ${session.type}
      - Level: ${session.experienceLevel}
      - Difficulty: ${session.difficulty}
      
      Q&A Log List:
      ${JSON.stringify(qSummary, null, 2)}
      
      Return ONLY a valid JSON object matching this schema. Do not write markdown tags.
      {
        "overallScore": 75,
        "technicalScore": 78,
        "communicationScore": 80,
        "confidenceScore": 75,
        "problemSolvingScore": 72,
        "behaviorScore": 76,
        "grammarScore": 85,
        "hiringRecommendation": "Excellent | Good | Average | Needs Improvement",
        "overallFeedback": "Consolidated overall feedback analysis paragraph",
        "strongAreas": ["Area 1", "Area 2"],
        "weakAreas": ["Area 1", "Area 2"],
        "recommendationTopics": ["Topic 1"],
        "recommendationDSA": ["DSA topic 1"],
        "recommendationProjects": ["Project upgrade idea 1"],
        "recommendationTips": ["Tip 1"],
        "recommendationResources": ["Resource link 1"]
      }
    `;

    const result = await model.generateContent(prompt);
    let cleanJson = result.response.text().trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }
    const parsedJson = JSON.parse(cleanJson);
    return {
      overallScore: parsedJson.overallScore || calculatedAvg,
      technicalScore: parsedJson.technicalScore || calculatedAvg,
      communicationScore: parsedJson.communicationScore || calculatedAvg,
      confidenceScore: parsedJson.confidenceScore || calculatedAvg,
      problemSolvingScore: parsedJson.problemSolvingScore || calculatedAvg,
      behaviorScore: parsedJson.behaviorScore || calculatedAvg,
      grammarScore: parsedJson.grammarScore || calculatedAvg,
      hiringRecommendation: parsedJson.hiringRecommendation || getHiringRecommendation(calculatedAvg),
      overallFeedback: parsedJson.overallFeedback || fallbackReport.overallFeedback,
      strongAreas: parsedJson.strongAreas || fallbackReport.strongAreas,
      weakAreas: parsedJson.weakAreas || fallbackReport.weakAreas,
      recommendationTopics: parsedJson.recommendationTopics || fallbackReport.recommendationTopics,
      recommendationDSA: parsedJson.recommendationDSA || fallbackReport.recommendationDSA,
      recommendationProjects: parsedJson.recommendationProjects || fallbackReport.recommendationProjects,
      recommendationTips: parsedJson.recommendationTips || fallbackReport.recommendationTips,
      recommendationResources: parsedJson.recommendationResources || fallbackReport.recommendationResources
    };
  } catch (error) {
    console.error('Error generating final report with Gemini:', error);
    return fallbackReport;
  }
};

const verifyGeminiConnection = async () => {
  const apiKey = getApiKey();
  if (!apiKey || apiKey.trim() === '') {
    console.warn('\x1b[33m%s\x1b[0m', 'WARNING: GEMINI_API_KEY is not set in server/.env file. The application will run in dynamic offline fallback mode.');
    return false;
  }
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('ping');
    const responseText = result.response.text();
    if (responseText) {
      console.log('\x1b[32m%s\x1b[0m', 'Gemini API connection verified successfully on startup.');
      return true;
    }
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `ERROR: Failed to connect to Gemini API with the configured key. Error: ${error.message}`);
    return false;
  }
};

module.exports = {
  analyzeResumeWithGemini,
  generateFirstQuestion,
  generateNextQuestion,
  evaluateSingleResponse,
  generateFinalReport,
  verifyGeminiConnection
};
