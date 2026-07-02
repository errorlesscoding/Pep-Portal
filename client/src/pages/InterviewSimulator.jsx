import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Video, Sparkles, ArrowRight, ChevronRight, Mic, MicOff, 
  ChevronDown, ChevronUp, Loader2, CheckCircle, AlertCircle, 
  Clock, ShieldAlert, Award, FileText, BarChart3, HelpCircle, 
  TrendingUp, Download, Play, RefreshCw, Layers, CheckSquare, XCircle
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip as ChartTooltip, 
  Legend 
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const InterviewSimulator = () => {
  // Stage state: setup, active, loading_grade, results
  const [stage, setStage] = useState('setup');
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  
  // Setup config states
  const [candidateName, setCandidateName] = useState('');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Fresher (0-1 Years)');
  const [type, setType] = useState('technical');
  const [difficulty, setDifficulty] = useState('medium');
  const [programmingLanguage, setProgrammingLanguage] = useState('JavaScript');
  const [durationLimit, setDurationLimit] = useState(20);
  const [jobDescription, setJobDescription] = useState('');

  // Active interview room states
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [speechError, setSpeechError] = useState('');

  // Live feedback states
  const [liveFeedback, setLiveFeedback] = useState({});
  const [gradingQuestionId, setGradingQuestionId] = useState(null);
  const [nextQuestionPayload, setNextQuestionPayload] = useState(null);
  const [isLastQuestion, setIsLastQuestion] = useState(false);

  // Final report states
  const [report, setReport] = useState(null);
  const [reportError, setReportError] = useState('');
  const [expandedRecCard, setExpandedRecCard] = useState('topics');

  // References
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  // Initializing Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript) {
          setAnswerText(prev => prev + (prev ? ' ' : '') + transcript);
        }
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setSpeechError('Microphone not recognized or permission denied.');
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (stage === 'active' && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleFinishInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage, timeRemaining]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Voice dictation is not supported in this browser. Please type your response.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setSpeechError('');
      setIsRecording(true);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleStartInterview = async (e) => {
    e.preventDefault();
    if (!candidateName.trim()) {
      alert('Please enter Candidate Name.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/interview/start', {
        candidateName,
        type,
        targetRole,
        difficulty,
        experienceLevel,
        programmingLanguage,
        durationLimit: Number(durationLimit),
        jobDescription
      });

      if (res.data.success) {
        setActiveSession(res.data.data);
        setQuestions(res.data.data.questions);
        setCurrentQuestionIndex(0);
        setAnswerText('');
        setLiveFeedback({});
        setNextQuestionPayload(null);
        setIsLastQuestion(false);
        setStartTime(Date.now());
        setTimeRemaining(Number(durationLimit) * 60);
        setStage('active');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to start interview. Please check server connections.');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeCurrentAnswer = async (skippedText = null) => {
    const isSkip = skippedText !== null;
    const responsePayload = isSkip ? 'Skipped' : answerText;

    if (!isSkip && !responsePayload.trim()) {
      alert('Please type or speak an answer before submitting.');
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    setGradingQuestionId(currentQuestion._id);

    try {
      const res = await axios.post('/api/interview/grade-answer', {
        interviewId: activeSession._id,
        questionId: currentQuestion._id,
        answerText: responsePayload
      });

      if (res.data.success) {
        setLiveFeedback(prev => ({
          ...prev,
          [currentQuestion._id]: res.data.data
        }));
        
        setNextQuestionPayload(res.data.nextQuestion);
        setIsLastQuestion(res.data.isLastQuestion);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to evaluate answer.');
    } finally {
      setGradingQuestionId(null);
    }
  };

  const handleProceedToNext = () => {
    if (nextQuestionPayload) {
      setQuestions(prev => [...prev, nextQuestionPayload]);
      setCurrentQuestionIndex(prev => prev + 1);
      setAnswerText('');
      setNextQuestionPayload(null);
    }
  };

  const handleFinishInterview = async () => {
    setStage('loading_grade');
    setReportError('');
    const totalDurationSeconds = Math.round((Date.now() - startTime) / 1000);

    try {
      const res = await axios.post('/api/interview/finish', {
        interviewId: activeSession._id,
        duration: totalDurationSeconds
      });

      if (res.data.success) {
        setReport(res.data.data);
        setStage('results');
      }
    } catch (err) {
      console.error(err);
      setReportError(err.response?.data?.message || 'Server error compiling final report.');
      setStage('results');
    }
  };

  const handlePrintPDF = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/interview/${activeSession._id}/pdf`, {
        responseType: 'blob'
      });
      const file = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const pdfWindow = window.open(fileURL, '_blank');
      if (!pdfWindow) {
        const link = document.createElement('a');
        link.href = fileURL;
        link.setAttribute('download', `Interview_Report_${activeSession.candidateName || 'Candidate'}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Failed to download PDF report.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const getHiringBadgeColor = (rec) => {
    switch (rec) {
      case 'Excellent': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Good': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'Average': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default: return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    }
  };

  const countWords = (str) => {
    return (str || '').trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn text-foreground">
      
      {/* Title */}
      <div className="print:hidden">
        <h1 className="text-3xl font-extrabold tracking-tight">Adaptive AI Interview System</h1>
        <p className="text-muted-foreground mt-1">Foundational Q&amp;A simulator that adapts question depth based on response quality.</p>
      </div>

      {/* SETUP PHASE */}
      {stage === 'setup' && (
        <div className="p-6 md:p-8 border rounded-2xl bg-card shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Configure Interview Session</h2>
            <p className="text-sm text-muted-foreground">Select candidate parameters to calibrate adaptive grading scopes.</p>
          </div>

          <form onSubmit={handleStartInterview} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              
              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground uppercase">Candidate Name</label>
                <input
                  type="text"
                  required
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full p-2.5 bg-background border rounded-xl font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground uppercase">Job Role</label>
                <input
                  type="text"
                  required
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Junior Node Developer"
                  className="w-full p-2.5 bg-background border rounded-xl font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground uppercase">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full p-2.5 bg-background border rounded-xl font-semibold"
                >
                  {['Fresher (0-1 Years)', 'Junior (1-3 Years)', 'Mid Level (3-5 Years)', 'Senior (5+ Years)'].map(el => (
                    <option key={el} value={el}>{el}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground uppercase">Interview Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-2.5 bg-background border rounded-xl font-semibold uppercase"
                >
                  {['HR', 'Technical', 'Behavioral', 'Coding', 'Mixed'].map(t => (
                    <option key={t} value={t.toLowerCase()}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground uppercase">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full p-2.5 bg-background border rounded-xl font-semibold capitalize"
                >
                  {['easy', 'medium', 'hard'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground uppercase">Programming Language</label>
                <select
                  value={programmingLanguage}
                  onChange={(e) => setProgrammingLanguage(e.target.value)}
                  className="w-full p-2.5 bg-background border rounded-xl font-semibold"
                >
                  {['Java', 'C++', 'Python', 'JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'SQL', 'none'].map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground uppercase">Session Duration</label>
                <select
                  value={durationLimit}
                  onChange={(e) => setDurationLimit(e.target.value)}
                  className="w-full p-2.5 bg-background border rounded-xl font-semibold"
                >
                  {[10, 20, 30, 45].map(time => (
                    <option key={time} value={time}>{time} minutes</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-muted-foreground uppercase">Job Description (Optional)</label>
              <textarea
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target role description here to align adaptive follow-ups..."
                className="w-full p-3 bg-background border rounded-xl text-xs font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/95 transition shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Simulator Room...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  Enter Simulation
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ACTIVE RUNNING INTERVIEW */}
      {stage === 'active' && activeSession && questions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Simulator Panel */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="p-6 border rounded-2xl bg-card shadow-sm space-y-6 relative overflow-hidden">
              
              {/* Top row */}
              <div className="flex justify-between items-center pb-4 border-b">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase font-black px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg">
                    {type} Session
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(timeRemaining)} remaining</span>
                  </div>
                </div>
                
                <span className="text-xs font-bold text-muted-foreground">
                  Question {currentQuestionIndex + 1}
                </span>
              </div>

              {/* Question card */}
              <div className="p-5 bg-secondary/20 rounded-2xl border flex items-start gap-4 animate-fadeIn">
                <div className="h-8 w-8 rounded-full bg-primary/15 text-primary border border-primary/20 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  Q
                </div>
                <p className="text-sm font-semibold leading-relaxed">
                  {questions[currentQuestionIndex].questionText}
                </p>
              </div>

              {/* Answer input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Your response</label>
                <textarea
                  rows={6}
                  value={answerText}
                  disabled={!!liveFeedback[questions[currentQuestionIndex]._id]}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder={
                    liveFeedback[questions[currentQuestionIndex]._id]
                      ? "Answer submitted."
                      : "Record using the mic below or type your response..."
                  }
                  className="w-full p-4 bg-background border rounded-xl text-sm leading-relaxed"
                />
                
                {/* Empty check message */}
                {!answerText.trim() && (
                  <p className="text-[10px] text-rose-500 font-bold mt-1">Please answer before continuing.</p>
                )}

                {/* Short count warning message */}
                {answerText.trim() && countWords(answerText) < 15 && (
                  <p className="text-[10px] text-amber-500 font-bold mt-1">Answer is too short for meaningful evaluation.</p>
                )}
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between">
                
                {/* Speech Dictation buttons */}
                <div className="flex items-center gap-2">
                  {!liveFeedback[questions[currentQuestionIndex]._id] && (
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition ${
                        isRecording 
                          ? 'bg-rose-500 text-white border-rose-500 animate-pulse' 
                          : 'bg-secondary text-secondary-foreground hover:bg-muted'
                      }`}
                    >
                      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-primary" />}
                      {isRecording ? 'Stop Recording' : 'Speak Answer'}
                    </button>
                  )}
                  {speechError && (
                    <span className="text-[10px] text-destructive font-semibold flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" /> {speechError}
                    </span>
                  )}
                </div>

                {/* Submits */}
                <div className="flex items-center gap-2">
                  
                  {/* Skip question */}
                  {!liveFeedback[questions[currentQuestionIndex]._id] && (
                    <button
                      onClick={() => handleGradeCurrentAnswer('Skipped')}
                      disabled={gradingQuestionId === questions[currentQuestionIndex]._id}
                      className="px-4 py-2.5 border border-muted hover:bg-destructive/10 hover:text-destructive text-muted-foreground rounded-xl text-xs font-bold transition"
                    >
                      Skip Question
                    </button>
                  )}

                  {/* Submit current answer */}
                  {!liveFeedback[questions[currentQuestionIndex]._id] && (
                    <button
                      onClick={() => handleGradeCurrentAnswer()}
                      disabled={gradingQuestionId === questions[currentQuestionIndex]._id || !answerText.trim()}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
                    >
                      {gradingQuestionId === questions[currentQuestionIndex]._id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Evaluating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Submit Answer
                        </>
                      )}
                    </button>
                  )}

                  {/* Load next question (after current is evaluated) */}
                  {liveFeedback[questions[currentQuestionIndex]._id] && nextQuestionPayload && (
                    <button
                      onClick={handleProceedToNext}
                      className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-primary/95 transition flex items-center gap-1 shadow-md"
                    >
                      Proceed to Next Question
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}

                  {/* Generate final report (if it's the last question and evaluated) */}
                  {liveFeedback[questions[currentQuestionIndex]._id] && isLastQuestion && (
                    <button
                      onClick={handleFinishInterview}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition shadow-md"
                    >
                      Generate Report
                    </button>
                  )}
                </div>

              </div>

            </div>
          </div>

          {/* Live Feedback Column */}
          <div className="lg:col-span-1">
            {(() => {
              const currentQ = questions[currentQuestionIndex];
              const feedbackItem = liveFeedback[currentQ._id];

              if (!feedbackItem) {
                return (
                  <div className="p-6 border rounded-2xl bg-card text-center text-muted-foreground h-full flex flex-col items-center justify-center space-y-3">
                    <HelpCircle className="h-10 w-10 text-muted/30" />
                    <div>
                      <h4 className="font-bold text-sm text-foreground">Awaiting Answer Submission</h4>
                      <p className="text-xs mt-1 leading-relaxed">Please submit an answer or click Skip to proceed to the next question and view real-time diagnostics.</p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="border rounded-2xl bg-card p-5 space-y-6 shadow-sm max-h-[85vh] overflow-y-auto pr-1 animate-fadeIn">
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-widest text-indigo-500 flex items-center gap-1">
                      <Sparkles className="h-4 w-4" /> Live AI Diagnostics
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Calculated metric scores out of 100.</p>
                  </div>

                  {/* Score warning if length is short */}
                  {feedbackItem.feedback === 'Answer is too short for meaningful evaluation.' && (
                    <div className="p-3 border border-amber-500/20 bg-amber-500/5 text-amber-500 rounded-xl text-xs leading-relaxed flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span><strong>Warning:</strong> Answer has fewer than 15 words. Low-score penalties applied automatically.</span>
                    </div>
                  )}

                  {/* Subscores breakdown list */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Overall', val: feedbackItem.score },
                      { label: 'Accuracy', val: feedbackItem.accuracyScore },
                      { label: 'Confidence', val: feedbackItem.confidenceScore },
                      { label: 'Tech Depth', val: feedbackItem.technicalDepthScore },
                      { label: 'Grammar', val: feedbackItem.grammarScore },
                      { label: 'Relevance', val: feedbackItem.relevanceScore }
                    ].map((metric, idx) => (
                      <div key={idx} className="p-2.5 bg-secondary/15 border rounded-xl text-center space-y-1">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">{metric.label}</span>
                        <h4 className="text-lg font-black">{metric.val}%</h4>
                      </div>
                    ))}
                  </div>

                  {/* Strengths */}
                  {feedbackItem.strengths?.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Strengths
                      </h4>
                      <ul className="text-xs space-y-1 pl-4 list-disc leading-relaxed text-foreground/80">
                        {feedbackItem.strengths?.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {feedbackItem.weaknesses?.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-rose-500 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> Weaknesses Gaps
                      </h4>
                      <ul className="text-xs space-y-1 pl-4 list-disc leading-relaxed text-foreground/80">
                        {feedbackItem.weaknesses?.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Missing Concepts */}
                  {feedbackItem.missingConcepts?.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-amber-500 flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5" /> Missing Concepts
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {feedbackItem.missingConcepts?.map((c, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-secondary border rounded text-[10px] font-semibold text-foreground/85">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Better Explanation */}
                  {feedbackItem.betterExplanation && (
                    <div className="space-y-1.5 border-t pt-3">
                      <h4 className="text-xs font-bold text-indigo-500">Better Explanation Structure</h4>
                      <p className="text-xs leading-relaxed text-foreground/80">
                        {feedbackItem.betterExplanation}
                      </p>
                    </div>
                  )}

                  {/* Interview Tip */}
                  {feedbackItem.interviewTip && (
                    <div className="space-y-1.5 border-t pt-3">
                      <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Interview Tip
                      </h4>
                      <p className="text-xs leading-relaxed text-foreground/80 italic p-3 bg-secondary/25 border rounded-xl">
                        {feedbackItem.interviewTip}
                      </p>
                    </div>
                  )}

                  {/* Perfect answer */}
                  <div className="space-y-1.5 border-t pt-3">
                    <h4 className="text-xs font-bold text-primary">AI Exemplar Response</h4>
                    <p className="text-xs leading-relaxed p-3 bg-secondary/20 rounded-xl border border-secondary/30 text-foreground/90">
                      {feedbackItem.sampleAnswer}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

        </div>
      )}

      {/* LOADING GRADER SCREEN */}
      {stage === 'loading_grade' && (
        <div className="p-12 border rounded-2xl bg-card text-center space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
          <h3 className="font-bold text-lg animate-pulse text-foreground">AI Grader Aggregating Final Report</h3>
          <p className="text-xs font-semibold text-primary">Compiling score graphs, recommendation resources, and printable certificate PDF templates...</p>
        </div>
      )}

      {/* FINAL REPORT RESULTS PHASE */}
      {stage === 'results' && (
        <div className="space-y-8 animate-fadeIn">
          
          {reportError ? (
            <div className="p-6 border border-destructive/20 bg-destructive/10 text-destructive rounded-2xl flex flex-col items-center gap-3 text-center">
              <ShieldAlert className="h-8 w-8 text-destructive shrink-0" />
              <h3 className="font-bold text-sm">Evaluation Report Failed</h3>
              <p className="text-xs leading-relaxed max-w-sm">{reportError}</p>
              <button
                onClick={() => setStage('setup')}
                className="mt-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-primary/95 transition shadow-sm"
              >
                Back to setup
              </button>
            </div>
          ) : report && (
            <>
              {/* Header Row */}
              <div className="p-6 md:p-8 border rounded-2xl bg-card shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-28 w-28 rounded-full border-[8px] border-primary bg-secondary/15 flex flex-col items-center justify-center shadow-md">
                    <span className="text-3xl font-black">{report.overallScore}%</span>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground">Score rating</span>
                  </div>
                  <span className={`text-[10px] uppercase font-black px-3 py-1 rounded-full border mt-4 ${getHiringBadgeColor(report.hiringRecommendation)}`}>
                    Rec: {report.hiringRecommendation}
                  </span>
                </div>
                
                <div className="md:col-span-3 space-y-4">
                  <div className="flex justify-between items-center print:hidden">
                    <h3 className="font-black text-xl tracking-tight">AI Diagnostic Interview Report</h3>
                    
                    <button
                      onClick={handlePrintPDF}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition shadow-sm"
                    >
                      <Download className="h-4 w-4" /> Download completion certificate
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80 font-semibold">{report.overallFeedback}</p>
                </div>
              </div>

              {/* Strong and Weak areas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 border rounded-2xl bg-card space-y-3">
                  <h4 className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" /> Strong Areas
                  </h4>
                  <ul className="text-xs space-y-1.5 list-disc pl-5 leading-relaxed text-foreground/80">
                    {report.strongAreas?.map((sa, idx) => <li key={idx}>{sa}</li>)}
                  </ul>
                </div>

                <div className="p-5 border rounded-2xl bg-card space-y-3">
                  <h4 className="text-sm font-bold text-rose-500 flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" /> Weak Areas
                  </h4>
                  <ul className="text-xs space-y-1.5 list-disc pl-5 leading-relaxed text-foreground/80">
                    {report.weakAreas?.map((wa, idx) => <li key={idx}>{wa}</li>)}
                  </ul>
                </div>
              </div>

              {/* Scores chart display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:hidden">
                
                {/* Sub-scores radar */}
                <div className="p-6 border rounded-2xl bg-card shadow-sm flex flex-col h-80">
                  <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground pb-4 border-b">Recruitment Scores Radar</h4>
                  <div className="flex-1 relative mt-4">
                    <Bar 
                      data={{
                        labels: ['Tech', 'Comm', 'Confidence', 'Problem Solving', 'Behavioral', 'Grammar'],
                        datasets: [
                          {
                            label: 'Rating Score (%)',
                            data: [
                              report.technicalScore,
                              report.communicationScore,
                              report.confidenceScore,
                              report.problemSolvingScore,
                              report.behaviorScore,
                              report.grammarScore
                            ],
                            backgroundColor: 'rgba(99, 102, 241, 0.65)',
                            borderColor: 'rgb(99, 102, 241)',
                            borderWidth: 1,
                            borderRadius: 6,
                          }
                        ]
                      }} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false }
                        },
                        scales: {
                          y: {
                            min: 0,
                            max: 100,
                            ticks: { font: { size: 9 } }
                          },
                          x: {
                            ticks: { font: { size: 9 } }
                          }
                        }}
                      }
                    />
                  </div>
                </div>

                {/* AI Recommendations accordion */}
                <div className="p-6 border rounded-2xl bg-card shadow-sm space-y-6 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground pb-4 border-b">AI Diagnostic Recommendations</h4>
                    
                    {/* Navigation tags */}
                    <div className="flex gap-2 mt-4">
                      {[
                        { key: 'topics', label: 'Study Topics' },
                        { key: 'dsa', label: 'DSA Focus' },
                        { key: 'projects', label: 'Projects' },
                        { key: 'resources', label: 'Resources' }
                      ].map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setExpandedRecCard(tab.key)}
                          className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition ${
                            expandedRecCard === tab.key
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-secondary/40 text-muted-foreground hover:bg-secondary'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Content rendering */}
                    <div className="mt-4 text-xs space-y-2 max-h-[160px] overflow-y-auto pr-1 text-foreground/80">
                      {expandedRecCard === 'topics' && report.recommendationTopics?.map((t, idx) => (
                        <div key={idx} className="flex gap-2 items-start"><span className="text-primary font-bold">•</span><span>{t}</span></div>
                      ))}
                      {expandedRecCard === 'dsa' && report.recommendationDSA?.map((d, idx) => (
                        <div key={idx} className="flex gap-2 items-start"><span className="text-amber-500 font-bold">•</span><span>{d}</span></div>
                      ))}
                      {expandedRecCard === 'projects' && report.recommendationProjects?.map((p, idx) => (
                        <div key={idx} className="flex gap-2 items-start"><span className="text-emerald-500 font-bold">•</span><span>{p}</span></div>
                      ))}
                      {expandedRecCard === 'resources' && report.recommendationResources?.map((r, idx) => (
                        <div key={idx} className="flex gap-2 items-start"><span className="text-indigo-500 font-bold">•</span><span>{r}</span></div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-3 text-[10px] text-muted-foreground font-semibold italic flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 animate-pulse text-indigo-500" /> Focus recommendations drawn from session answer critiques.
                  </div>
                </div>

              </div>

              {/* Detailed Question breakdown logs */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Session Graded Q&amp;A Logs</h4>
                
                <div className="space-y-4">
                  {report.results?.map((resItem, idx) => (
                    <div key={idx} className="p-5 border rounded-2xl bg-card space-y-4 animate-fadeIn">
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-xs font-bold text-muted-foreground">Question {idx + 1}</span>
                        <span className="text-xs font-extrabold px-2.5 py-0.5 bg-secondary border rounded-lg">Score: {resItem.score}%</span>
                      </div>
                      
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-foreground">Question Text:</p>
                        <p className="p-3 bg-secondary/10 rounded-xl leading-relaxed">{resItem.question?.questionText}</p>
                      </div>

                      <div className="text-xs space-y-1">
                        <p className="font-bold text-muted-foreground">Your Response:</p>
                        <p className="p-3 bg-secondary/15 rounded-xl leading-relaxed italic">{resItem.answer?.answerText}</p>
                      </div>

                      <div className="text-xs space-y-1">
                        <p className="font-bold text-primary">AI Evaluation Critic:</p>
                        <p className="p-3 bg-primary/5 border border-primary/10 rounded-xl leading-relaxed">{resItem.feedback}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reset button */}
              <div className="flex justify-center print:hidden">
                <button
                  onClick={() => {
                    setStage('setup');
                    setActiveSession(null);
                    setQuestions([]);
                    setReport(null);
                  }}
                  className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-primary/95 transition shadow-md flex items-center gap-1.5"
                >
                  <RefreshCw className="h-4 w-4" /> Start New Simulation
                </button>
              </div>
            </>
          )}

        </div>
      )}

    </div>
  );
};

export default InterviewSimulator;
