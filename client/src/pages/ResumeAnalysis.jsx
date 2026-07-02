import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Upload, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  Trash2, 
  Award,
  AlertCircle,
  FileSpreadsheet,
  Globe
} from 'lucide-react';

const ResumeAnalysis = () => {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [uploadProgressMsg, setUploadProgressMsg] = useState('');

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/resume/history');
      if (res.data.success) {
        setHistory(res.data.data);
        if (res.data.data.length > 0 && !currentAnalysis) {
          setCurrentAnalysis(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching resume history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError('');
    
    if (!selectedFile) return;

    const allowedExtensions = ['pdf', 'docx'];
    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      setError('Invalid file type. Please upload a PDF or DOCX file.');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size too large. Maximum size allowed is 5MB.');
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a file to upload.');
      return;
    }

    setLoading(true);
    setError('');
    
    const stages = [
      'Extracting document text metrics...',
      'Auditing spelling and formatting standards...',
      'Parsing work history and education references...',
      'Calculating weighted ATS categories (Contact, Skills, Education, Achievements)...',
      'Comparing string similarity against job description...',
      'Consulting Gemini AI API for recruiter feedback...'
    ];
    
    let stageIndex = 0;
    setUploadProgressMsg(stages[0]);
    const timer = setInterval(() => {
      if (stageIndex < stages.length - 1) {
        stageIndex++;
        setUploadProgressMsg(stages[stageIndex]);
      }
    }, 2000);

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);

    try {
      const res = await axios.post('/api/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setCurrentAnalysis(res.data.data);
        setFile(null);
        setJobDescription('');
        await fetchHistory();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing document scan.');
    } finally {
      clearInterval(timer);
      setLoading(false);
      setUploadProgressMsg('');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this resume scan audit?')) return;

    try {
      const res = await axios.delete(`/api/resume/${id}`);
      if (res.data.success) {
        setHistory(prev => prev.filter(item => item._id !== id));
        if (currentAnalysis?._id === id) {
          setCurrentAnalysis(null);
        }
      }
    } catch (err) {
      setError('Failed to delete analysis log.');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">AI Resume Optimizer</h1>
        <p className="text-muted-foreground mt-1">Audit credentials, matches against Job Descriptions, and generate rewrite suggestions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form & History */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Form */}
          <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm space-y-4">
            <h3 className="font-bold text-lg tracking-tight flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload & Compare
            </h3>
            
            <form onSubmit={handleUpload} className="space-y-4">
              
              {/* File selection dropzone */}
              <div className="border-2 border-dashed rounded-xl p-5 text-center hover:border-primary/50 transition cursor-pointer relative bg-secondary/10">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={loading}
                />
                <div className="space-y-2">
                  <div className="p-2.5 bg-background rounded-full inline-flex border shadow-sm">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                  </div>
                  <p className="text-[10px] text-muted-foreground">PDF or DOCX (Max 5MB)</p>
                </div>
              </div>

              {file && (
                <div className="p-3 bg-secondary/30 rounded-xl flex items-center justify-between border">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs font-semibold truncate">{file.name}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-[10px] text-destructive hover:underline font-bold"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Job Description Text Area */}
              <div className="space-y-1.5">
                <label htmlFor="jd" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Target Job Description (Optional)</label>
                <textarea
                  id="jd"
                  rows={4}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the target job description here to perform algorithmic and AI keyword matching audits..."
                  className="w-full p-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-xs leading-relaxed"
                />
              </div>

              {error && (
                <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !file}
                className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Auditing ATS...
                  </>
                ) : (
                  'Analyze Resume'
                )}
              </button>
            </form>

            {loading && (
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 text-center space-y-2">
                <Loader2 className="h-5 w-5 text-primary animate-spin mx-auto" />
                <p className="text-xs font-semibold text-primary tracking-wide animate-pulse">{uploadProgressMsg}</p>
              </div>
            )}
          </div>

          {/* History */}
          <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Scan Audits History</h3>
            
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No uploaded resume records found.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => setCurrentAnalysis(item)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-center justify-between gap-3 ${
                      currentAnalysis?._id === item._id 
                        ? 'bg-primary/5 border-primary shadow-sm' 
                        : 'bg-background hover:bg-secondary/40'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate text-foreground">{item.fileName}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold px-2 py-0.5 bg-secondary rounded-lg">
                        {item.atsScore}%
                      </span>
                      <button
                        onClick={(e) => handleDelete(item._id, e)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Display Analysis Details */}
        <div className="lg:col-span-2 space-y-6">
          {!currentAnalysis ? (
            <div className="p-12 rounded-2xl border bg-card text-center text-muted-foreground space-y-4 h-full flex flex-col items-center justify-center">
              <FileText className="h-12 w-12 text-muted" />
              <div>
                <h3 className="font-bold text-lg text-foreground">No Document Scanned</h3>
                <p className="text-sm mt-1 max-w-xs text-muted-foreground">Upload your resume to perform real-time weighted ATS audits.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Score header */}
              <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                
                {/* Dial */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative flex items-center justify-center h-28 w-28 rounded-full border-8 border-secondary bg-secondary/5">
                    <span className="text-3xl font-black tracking-tight">{currentAnalysis.atsScore}%</span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-3">ATS score match</span>
                </div>

                {/* Sub Scores Breakdown Grid */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Formatting Check', score: currentAnalysis.analysis?.formattingScore || 0, max: 10 },
                    { label: 'Technical Skills', score: currentAnalysis.analysis?.skillsScore || 0, max: 20 },
                    { label: 'Experience Depth', score: currentAnalysis.analysis?.experienceScore || 0, max: 20 },
                    { label: 'Featured Projects', score: currentAnalysis.analysis?.projectsScore || 0, max: 15 },
                    { label: 'Academic Credentials', score: currentAnalysis.analysis?.educationScore || 0, max: 10 },
                    { label: 'JD Keyword Matching', score: currentAnalysis.analysis?.keywordsScore || 0, max: 15 },
                    { label: 'Grammar & Clarity', score: currentAnalysis.analysis?.grammarScore || 0, max: 5 },
                    { label: 'Measurable Achievements', score: currentAnalysis.analysis?.achievementsScore || 0, max: 5 },
                  ].map((bar, idx) => {
                    const percentage = Math.round((bar.score / bar.max) * 100);
                    return (
                      <div key={idx} className="space-y-1.5 p-2 bg-secondary/10 rounded-xl border border-secondary/20">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-muted-foreground">{bar.label}</span>
                          <span className="text-foreground">{bar.score} / {bar.max}</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Extra Scores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border bg-card rounded-xl space-y-1 text-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Industry Readiness Rating</span>
                  <h4 className="text-xl font-extrabold text-indigo-500">{currentAnalysis.analysis?.techReadinessScore || 0}%</h4>
                </div>
                <div className="p-4 border bg-card rounded-xl space-y-1 text-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Extracted Action Verbs Count</span>
                  <h4 className="text-xl font-extrabold text-emerald-500">{currentAnalysis.analysis?.actionVerbsList?.length || 0} verbs</h4>
                </div>
              </div>

              {/* Recruiter Summary */}
              <div className="p-6 rounded-2xl border bg-card space-y-3">
                <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-widest">Recruiter's Executive Summary</h3>
                <p className="text-sm leading-relaxed text-foreground/90">{currentAnalysis.analysis?.summary}</p>
              </div>

              {/* Strengths vs Weaknesses (Fixes) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border bg-card space-y-4">
                  <h3 className="font-bold text-sm text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Strong Elements
                  </h3>
                  <ul className="space-y-2 text-xs">
                    {currentAnalysis.analysis?.positives?.map((item, idx) => (
                      <li key={idx} className="flex gap-2 items-start leading-relaxed text-foreground/95">
                        <span className="text-emerald-500 font-bold shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 rounded-2xl border bg-card space-y-4">
                  <h3 className="font-bold text-sm text-rose-500 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Priority Fixes Required
                  </h3>
                  <ul className="space-y-2 text-xs">
                    {currentAnalysis.analysis?.negatives?.map((item, idx) => (
                      <li key={idx} className="flex gap-2 items-start leading-relaxed text-foreground/95">
                        <span className="text-rose-500 font-bold shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* parsed sections matching */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Edu */}
                <div className="p-5 border bg-card rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Detected Academic Credentials</h4>
                  {currentAnalysis.analysis?.educationMatches?.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No degrees found.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {currentAnalysis.analysis?.educationMatches?.map((edu, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-secondary text-foreground text-[10px] font-semibold rounded-md border capitalize">
                          {edu}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Certifications */}
                <div className="p-5 border bg-card rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Detected Certifications</h4>
                  {currentAnalysis.analysis?.certificationMatches?.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No certifications detected (AWS, CSM, PMP, etc.).</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {currentAnalysis.analysis?.certificationMatches?.map((cert, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-secondary text-foreground text-[10px] font-semibold rounded-md border">
                          {cert}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Skills matched / gaps */}
              <div className="p-6 rounded-2xl border bg-card space-y-6">
                <div>
                  <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-widest">Skill Matching Breakdown</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Matches */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Matched Skills ({currentAnalysis.analysis?.keywordMatches?.length || 0})</h4>
                    {currentAnalysis.analysis?.keywordMatches?.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No skills matched. Ensure your skills are listed clearly.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {currentAnalysis.analysis?.keywordMatches?.map((skill, idx) => (
                          <span key={idx} className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-500/10 capitalize">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Gaps */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400">Missing Gaps ({currentAnalysis.analysis?.keywordGaps?.length || 0})</h4>
                    {currentAnalysis.analysis?.keywordGaps?.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Excellent! No missing skill gaps detected.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {currentAnalysis.analysis?.keywordGaps?.map((skill, idx) => (
                          <span key={idx} className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md border border-amber-500/10 capitalize">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Verbs Gaps */}
              <div className="p-6 rounded-2xl border bg-card space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Suggested Action Verbs to Incorporate</h4>
                <div className="flex flex-wrap gap-1.5">
                  {currentAnalysis.analysis?.missingActionVerbs?.map((verb, idx) => (
                    <span key={idx} className="px-2 py-1 bg-secondary hover:bg-muted text-foreground text-[10px] font-semibold rounded-lg border capitalize">
                      +{verb}
                    </span>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div className="p-6 rounded-2xl border bg-card space-y-4">
                <h3 className="font-bold text-sm text-primary uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> AI Suggestion & Bullet Rewrites
                </h3>
                <div className="space-y-3">
                  {currentAnalysis.analysis?.suggestions?.map((item, idx) => (
                    <div key={idx} className="p-3 bg-secondary/20 rounded-xl text-xs leading-relaxed flex gap-3 border">
                      <div className="p-1 bg-primary/10 text-primary rounded-lg font-bold shrink-0 h-6 w-6 flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <p className="text-foreground/90">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ResumeAnalysis;
