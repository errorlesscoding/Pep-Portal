const TfIdf = require('natural/lib/natural/tfidf/tfidf');
const WordTokenizer = require('natural/lib/natural/tokenizers/regexp_tokenizer').WordTokenizer;
const nlp = require('compromise');
const stringSimilarity = require('string-similarity');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Define common industry skills for matching
const INDUSTRY_SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'php',
  'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'flask', 'spring boot',
  'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'sqlite',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'git', 'github', 'linux',
  'html', 'css', 'sass', 'tailwind', 'bootstrap', 'graphql', 'rest api', 'microservices',
  'machine learning', 'data science', 'ai', 'devops', 'testing', 'jest', 'agile', 'scrum'
];

// Define common action verbs
const ACTION_VERBS = [
  'led', 'developed', 'built', 'designed', 'implemented', 'optimized', 'managed', 'created',
  'architected', 'scaled', 'increased', 'reduced', 'improved', 'delivered', 'launched',
  'coordinated', 'automated', 'streamlined', 'mentored', 'engineered', 'formulated'
];

// Define weak phrases that should be avoided
const WEAK_PHRASES = [
  'responsible for', 'worked on', 'helped', 'assisted', 'duties included', 'part of'
];

// Define common certification keywords
const CERTIFICATIONS = [
  'aws', 'azure', 'gcp', 'pmp', 'csm', 'scrum', 'oracle', 'ccna', 'comptia', 'itil',
  'prince2', 'salesforce', 'red hat', 'certified', 'certification'
];

/**
 * Escapes regex special characters
 */
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Checks if a term is present in text using dynamic word/boundary matching
 */
const containsKeyword = (text, term) => {
  const escaped = escapeRegExp(term);
  const pattern = /^[a-zA-Z0-9_]+$/.test(term)
    ? `\\b${escaped}\\b`
    : `(?:^|\\s|[.,;:\\/()\\-\\[\\]])${escaped}(?:$|\\s|[.,;:\\/()\\-\\[\\]])`;
  const regex = new RegExp(pattern, 'i');
  return regex.test(text);
};

/**
 * Perform industry-grade weighted ATS analysis matching the user's specific weights:
 * - Resume Formatting (10%)
 * - Skills Match (20%)
 * - Experience (20%)
 * - Projects (15%)
 * - Education (10%)
 * - Job Keywords (15%)
 * - Measurable Achievements / Verbs (5%)
 * - Grammar & Readability (5%)
 */
const performAlgorithmicATSAnalysis = (text, jobDescription = '') => {
  const cleanText = text.toLowerCase();
  const cleanJD = jobDescription.toLowerCase();
  const emails = cleanText.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
  const phones = cleanText.match(/[\d\s-]{8,15}/g) || [];
  const wordCount = cleanText.split(/\s+/).length;

  // --- 1. Resume Formatting (Max 10 points) ---
  let formattingScore = 0;
  // Length metrics
  if (wordCount >= 400 && wordCount <= 900) {
    formattingScore += 6;
  } else if (wordCount >= 300 && wordCount <= 1300) {
    formattingScore += 4;
  } else {
    formattingScore += 2;
  }
  // Section Headers: Experience, Education, Skills, Projects
  const sections = [
    { keywords: ['experience', 'work history', 'employment', 'career'] },
    { keywords: ['education', 'academic', 'university', 'college'] },
    { keywords: ['skills', 'technologies', 'expertise', 'tools'] },
    { keywords: ['projects', 'personal projects', 'applications'] }
  ];
  let sectionsFound = 0;
  sections.forEach(sec => {
    if (sec.keywords.some(kw => cleanText.includes(kw))) sectionsFound++;
  });
  formattingScore += Math.min(4, sectionsFound * 1.0);

  // --- 2. Skills Match (Max 20 points) ---
  const matchedSkills = [];
  const stuffedSkills = [];
  INDUSTRY_SKILLS.forEach(skill => {
    if (containsKeyword(cleanText, skill)) {
      matchedSkills.push(skill);
      const occurrences = (cleanText.match(new RegExp(`\\b${escapeRegExp(skill)}\\b`, 'gi')) || []).length;
      if (occurrences > 3) {
        stuffedSkills.push(skill);
      }
    }
  });
  let skillsScore = Math.min(20, matchedSkills.length * 2);
  // keyword stuffing penalty: deduct 1.5 points per stuffed term, max penalty 6 points
  const stuffingPenalty = Math.min(6, stuffedSkills.length * 1.5);
  skillsScore = Math.max(0, skillsScore - stuffingPenalty);

  // --- 3. Experience check (Max 20 points) ---
  let experienceScore = 0;
  const hasExpHeader = ['experience', 'work history', 'employment'].some(kw => cleanText.includes(kw));
  if (hasExpHeader) experienceScore += 4;
  // Matching job title words
  const titles = ['developer', 'engineer', 'analyst', 'consultant', 'architect', 'intern', 'lead', 'manager'];
  let matchedTitles = 0;
  titles.forEach(t => {
    if (containsKeyword(cleanText, t)) matchedTitles++;
  });
  experienceScore += Math.min(8, matchedTitles * 2);
  // Matching dates/durations
  const durationPatterns = cleanText.match(/\b(20\d{2}|19\d{2})\b\s*[-–to]\s*\b(20\d{2}|present)\b/g) || [];
  experienceScore += Math.min(8, durationPatterns.length * 4);

  // --- 4. Education check (Max 10 points) ---
  let educationScore = 0;
  const hasEduHeader = ['education', 'academic', 'scholastic'].some(kw => cleanText.includes(kw));
  if (hasEduHeader) educationScore += 3;
  // Degree terms
  const degreeTerms = ['bachelor', 'master', 'b.tech', 'm.tech', 'mca', 'bca', 'phd', 'bs', 'ms'];
  const foundEdu = [];
  degreeTerms.forEach(deg => {
    if (containsKeyword(cleanText, deg)) foundEdu.push(deg);
  });
  if (foundEdu.length > 0) educationScore += 4;
  // College/University words
  const hasUniWord = ['university', 'college', 'institute'].some(kw => cleanText.includes(kw));
  if (hasUniWord) educationScore += 3;

  // --- 5. Projects check (Max 15 points) ---
  let projectsScore = 0;
  const hasProjHeader = ['projects', 'personal projects', 'featured applications'].some(kw => cleanText.includes(kw));
  if (hasProjHeader) projectsScore += 5;
  // Action verbs in projects descriptions
  const projTerms = ['built', 'developed', 'designed', 'implemented', 'created'];
  let projTermsCount = 0;
  projTerms.forEach(term => {
    if (containsKeyword(cleanText, term)) projTermsCount++;
  });
  projectsScore += Math.min(6, projTermsCount * 2);
  // Portfolio link
  if (cleanText.includes('github.com') || cleanText.includes('gitlab.com') || cleanText.includes('portfolio')) {
    projectsScore += 4;
  }

  // --- 6. Job Keywords match (Max 15 points) ---
  let keywordsScore = 0;
  let keywordMatches = [];
  let keywordGaps = [];

  if (cleanJD.trim()) {
    const jdDoc = nlp(cleanJD);
    const jdNouns = jdDoc.nouns().out('array');
    const uniqueJDKeywords = [...new Set(jdNouns)]
      .map(n => n.toLowerCase())
      .filter(n => n.length > 3 && !['requirements', 'skills', 'experience', 'duties', 'responsibilities'].includes(n));

    uniqueJDKeywords.forEach(kw => {
      if (containsKeyword(cleanText, kw)) {
        keywordMatches.push(kw);
      } else {
        keywordGaps.push(kw);
      }
    });

    const jdSimilarity = stringSimilarity.compareTwoStrings(cleanText, cleanJD);
    let baseKeywordScore = (keywordMatches.length / Math.max(1, uniqueJDKeywords.length)) * 11;
    const semanticScore = jdSimilarity * 4;
    keywordsScore = baseKeywordScore + semanticScore;
    // Missing penalty
    const penalty = Math.min(4, keywordGaps.length * 1);
    keywordsScore = Math.max(0, keywordsScore - penalty);
    keywordsScore = Math.min(15, Math.round(keywordsScore));
  } else {
    // If NO JD is entered, the category score is 0. Maximum possible score is 85.
    keywordsScore = 0;
    keywordMatches = matchedSkills.slice(0, 8);
    keywordGaps = INDUSTRY_SKILLS.filter(s => !matchedSkills.includes(s)).slice(0, 6);
  }

  // --- 7. Action Verbs / Achievements (Max 5 points) ---
  let achievementsScore = 0;
  const foundActionVerbs = [];
  ACTION_VERBS.forEach(verb => {
    if (containsKeyword(cleanText, verb)) {
      foundActionVerbs.push(verb);
    }
  });
  achievementsScore = Math.min(5, foundActionVerbs.length * 1);

  // --- 8. Grammar & Readability (Max 5 points) ---
  let grammarScore = 0;
  // Contact details completeness: emails and phone numbers present
  const hasContactInfo = emails.length > 0 && phones.length > 0;
  if (hasContactInfo) grammarScore += 2;
  // Readability metrics
  if (wordCount > 300) grammarScore += 3;
  // Weak phrases penalty
  let foundWeakPhrases = [];
  WEAK_PHRASES.forEach(phrase => {
    if (cleanText.includes(phrase)) foundWeakPhrases.push(phrase);
  });
  grammarScore = Math.max(0, grammarScore - foundWeakPhrases.length);

  // Final score aggregates
  const totalATSScore = formattingScore + skillsScore + experienceScore + projectsScore + educationScore + keywordsScore + achievementsScore + grammarScore;
  const finalATSScore = Math.min(100, Math.max(10, Math.round(totalATSScore)));

  // Tech Readiness check
  const techReadinessScore = Math.min(100, Math.round((skillsScore / 20) * 50 + (keywordsScore / 15) * 50));

  const matchedCerts = [];
  CERTIFICATIONS.forEach(cert => {
    if (containsKeyword(cleanText, cert)) matchedCerts.push(cert);
  });

  return {
    atsScore: finalATSScore,
    formattingScore,
    skillsScore,
    experienceScore,
    projectsScore,
    educationScore,
    keywordsScore,
    achievementsScore,
    grammarScore,
    verbsScore: achievementsScore, // keep alias
    techReadinessScore,
    keywordMatches: [...new Set(keywordMatches)].slice(0, 15),
    keywordGaps: [...new Set(keywordGaps)].slice(0, 10),
    foundActionVerbs,
    missingActionVerbs: ACTION_VERBS.filter(v => !foundActionVerbs.includes(v)).slice(0, 6),
    foundWeakPhrases,
    stuffedSkills,
    wordCount,
    foundEdu,
    matchedCerts
  };
};

/**
 * Generate hybrid analysis combining weighted algorithm stats with Gemini AI reviews
 */
const analyzeResumeHybrids = async (resumeText, jobDescription = '') => {
  const algo = performAlgorithmicATSAnalysis(resumeText, jobDescription);
  
  // Try retrieving trimmed key safely
  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';

  const formattingIssues = [];
  if (algo.wordCount < 400) {
    formattingIssues.push('The resume length is under 400 words. Consider adding descriptive details to your achievements.');
  } else if (algo.wordCount > 1000) {
    formattingIssues.push('The resume length is over 1000 words. Consider tightening layout formats.');
  }
  if (algo.stuffedSkills.length > 0) {
    formattingIssues.push(`Keyword stuffing detected for terms: [${algo.stuffedSkills.join(', ')}]. Avoid stuffing terms to bypass modern filters.`);
  }

  const grammarSuggestions = [];
  if (algo.foundWeakPhrases.length > 0) {
    grammarSuggestions.push(`Replace passive, weak phrases like [${algo.foundWeakPhrases.join(', ')}] with strong action verbs (e.g. 'orchestrated', 'implemented').`);
  }

  const fallbackAI = {
    summary: `Based on a rigorous industry parsing, your resume scores an ATS match of ${algo.atsScore}%. It has strong keyword references to [${algo.keywordMatches.slice(0, 4).join(', ')}] but needs more action-oriented descriptions of work experience.`,
    positives: [
      `Skills coverage is well-referenced (Score: ${algo.skillsScore}/20).`,
      `Academic records are clear and include key degrees (Score: ${algo.educationScore}/10).`
    ],
    negatives: [
      `Lack of quantifiable metrics and achievements on projects (Score: ${algo.formattingScore}/10).`,
      `Missing key terms from the job description: ${algo.keywordGaps.slice(0, 3).join(', ')}.`
    ],
    suggestions: [
      'Incorporate concrete metrics to statements, e.g. "Increased rendering efficiency by 25% by caching API response lists."',
      `Incorporate missing skills: ${algo.keywordGaps.slice(0, 3).join(', ')}.`
    ]
  };

  if (!apiKey) {
    return {
      atsScore: algo.atsScore,
      formattingScore: algo.formattingScore,
      skillsScore: algo.skillsScore,
      experienceScore: algo.experienceScore,
      projectsScore: algo.projectsScore,
      educationScore: algo.educationScore,
      keywordsScore: algo.keywordsScore,
      grammarScore: algo.grammarScore,
      verbsScore: algo.verbsScore,
      achievementsScore: algo.achievementsScore,
      techReadinessScore: algo.techReadinessScore,
      keywordMatches: algo.keywordMatches,
      keywordGaps: algo.keywordGaps,
      actionVerbsList: algo.foundActionVerbs,
      missingActionVerbs: algo.missingActionVerbs,
      educationMatches: algo.foundEdu,
      certificationMatches: algo.matchedCerts || [],
      
      // Exact requested aliases
      skillsFound: algo.keywordMatches,
      skillsMissing: algo.keywordGaps,
      recruiterSummary: fallbackAI.summary,
      strengths: fallbackAI.positives,
      weaknesses: [...fallbackAI.negatives, ...formattingIssues, ...grammarSuggestions],
      industryRecommendations: fallbackAI.suggestions,
      sectionWiseScores: {
        formatting: algo.formattingScore,
        skills: algo.skillsScore,
        experience: algo.experienceScore,
        projects: algo.projectsScore,
        education: algo.educationScore,
        keywords: algo.keywordsScore,
        verbs: algo.verbsScore,
        achievementsScore: algo.achievementsScore,
        grammar: algo.grammarScore
      },
      summary: fallbackAI.summary,
      positives: fallbackAI.positives,
      negatives: [...fallbackAI.negatives, ...formattingIssues, ...grammarSuggestions],
      suggestions: fallbackAI.suggestions
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You are an expert Applicant Tracking System (ATS) auditor.
      An algorithmic scanner has run on a candidate's resume and job description.
      
      Algorithmic metrics:
      - ATS Match Score: ${algo.atsScore}/100
      - Formatting Score: ${algo.formattingScore}/10
      - Skills Score: ${algo.skillsScore}/20
      - Experience Score: ${algo.experienceScore}/20
      - Projects Score: ${algo.projectsScore}/15
      - Education Score: ${algo.educationScore}/10
      - Keywords Match vs JD: ${algo.keywordsScore}/15
      - Achievements Score: ${algo.achievementsScore}/5
      - Grammar Score: ${algo.grammarScore}/5
      - Extracted Skills Matches: ${JSON.stringify(algo.keywordMatches)}
      - Missing Skill Gaps: ${JSON.stringify(algo.keywordGaps)}
      - Extracted Action Verbs: ${JSON.stringify(algo.foundActionVerbs)}
      - Missing Action Verbs: ${JSON.stringify(algo.missingActionVerbs)}
      - Detected Weak Phrases: ${JSON.stringify(algo.foundWeakPhrases)}
      - Detected Stuffed Keywords: ${JSON.stringify(algo.stuffedSkills)}
      
      Resume text:
      "${resumeText}"
      
      Job Description:
      "${jobDescription}"
      
      Provide a qualitative expert assessment in JSON format. Do not use markdown tags, comments, or header text. The JSON object must match this schema exactly:
      {
        "summary": "Recruiter's executive summary string detailing job fitness and calculated score details.",
        "positives": ["Clear list of positive elements or strengths on the resume"],
        "negatives": ["Issues, weaknesses, or formatting errors that need fixing"],
        "suggestions": ["Actionable rewrite suggestions for bullet points, grammar fixes, or achievements addition"]
      }
    `;

    const result = await model.generateContent(prompt);
    let cleanJson = result.response.text().trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }

    const parsedJson = JSON.parse(cleanJson);

    return {
      atsScore: algo.atsScore,
      formattingScore: algo.formattingScore,
      skillsScore: algo.skillsScore,
      experienceScore: algo.experienceScore,
      projectsScore: algo.projectsScore,
      educationScore: algo.educationScore,
      keywordsScore: algo.keywordsScore,
      grammarScore: algo.grammarScore,
      verbsScore: algo.verbsScore,
      achievementsScore: algo.achievementsScore,
      techReadinessScore: algo.techReadinessScore,
      keywordMatches: algo.keywordMatches,
      keywordGaps: algo.keywordGaps,
      actionVerbsList: algo.foundActionVerbs,
      missingActionVerbs: algo.missingActionVerbs,
      educationMatches: algo.foundEdu,
      certificationMatches: algo.matchedCerts || [],
      
      // Exact requested aliases
      skillsFound: algo.keywordMatches,
      skillsMissing: algo.keywordGaps,
      recruiterSummary: parsedJson.summary || fallbackAI.summary,
      strengths: parsedJson.positives || fallbackAI.positives,
      weaknesses: [...(parsedJson.negatives || fallbackAI.negatives), ...formattingIssues, ...grammarSuggestions],
      industryRecommendations: parsedJson.suggestions || fallbackAI.suggestions,
      sectionWiseScores: {
        formatting: algo.formattingScore,
        skills: algo.skillsScore,
        experience: algo.experienceScore,
        projects: algo.projectsScore,
        education: algo.educationScore,
        keywords: algo.keywordsScore,
        verbs: algo.verbsScore,
        achievementsScore: algo.achievementsScore,
        grammar: algo.grammarScore
      },
      summary: parsedJson.summary || fallbackAI.summary,
      positives: parsedJson.positives || fallbackAI.positives,
      negatives: [...(parsedJson.negatives || fallbackAI.negatives), ...formattingIssues, ...grammarSuggestions],
      suggestions: parsedJson.suggestions || fallbackAI.suggestions
    };
  } catch (error) {
    console.error('Error combining algorithmic analysis with Gemini AI:', error);
    return {
      atsScore: algo.atsScore,
      formattingScore: algo.formattingScore,
      skillsScore: algo.skillsScore,
      experienceScore: algo.experienceScore,
      projectsScore: algo.projectsScore,
      educationScore: algo.educationScore,
      keywordsScore: algo.keywordsScore,
      grammarScore: algo.grammarScore,
      verbsScore: algo.verbsScore,
      achievementsScore: algo.achievementsScore,
      techReadinessScore: algo.techReadinessScore,
      keywordMatches: algo.keywordMatches,
      keywordGaps: algo.keywordGaps,
      actionVerbsList: algo.foundActionVerbs,
      missingActionVerbs: algo.missingActionVerbs,
      educationMatches: algo.foundEdu,
      certificationMatches: algo.matchedCerts || [],
      
      // Exact requested aliases
      skillsFound: algo.keywordMatches,
      skillsMissing: algo.keywordGaps,
      recruiterSummary: fallbackAI.summary,
      strengths: fallbackAI.positives,
      weaknesses: [...fallbackAI.negatives, ...formattingIssues, ...grammarSuggestions],
      industryRecommendations: fallbackAI.suggestions,
      sectionWiseScores: {
        formatting: algo.formattingScore,
        skills: algo.skillsScore,
        experience: algo.experienceScore,
        projects: algo.projectsScore,
        education: algo.educationScore,
        keywords: algo.keywordsScore,
        verbs: algo.verbsScore,
        achievementsScore: algo.achievementsScore,
        grammar: algo.grammarScore
      },
      summary: fallbackAI.summary,
      positives: fallbackAI.positives,
      negatives: [...fallbackAI.negatives, ...formattingIssues, ...grammarSuggestions],
      suggestions: fallbackAI.suggestions
    };
  }
};

module.exports = {
  analyzeResumeHybrids
};
