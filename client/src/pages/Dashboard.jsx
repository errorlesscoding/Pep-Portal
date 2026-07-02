import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FileText, 
  Video, 
  ChevronRight, 
  Sparkles, 
  Award, 
  Activity, 
  TrendingUp,
  Loader2,
  AlertCircle,
  ShieldAlert,
  FolderDot
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardStats = async () => {
    try {
      const res = await axios.get('/api/analytics');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
      setError('Could not connect to database analytics services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Gathering dashboard analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-destructive/20 bg-destructive/10 text-destructive rounded-2xl flex items-center gap-3">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <span className="text-sm font-semibold">{error}</span>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Latest ATS Score',
      value: stats?.latestATSScore > 0 ? `${stats.latestATSScore}%` : 'N/A',
      description: stats?.latestATSScore > 0 ? 'Extracted from latest scan' : 'No resumes optimized yet',
      icon: FileText,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      action: () => navigate('/resume')
    },
    {
      title: 'Interviews Completed',
      value: stats?.totalInterviews > 0 ? `${stats.totalInterviews}` : '0',
      description: stats?.totalInterviews > 0 ? 'AI grader sessions' : 'No simulations started yet',
      icon: Video,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      action: () => navigate('/interview')
    },
    {
      title: 'Average AI Rating',
      value: stats?.averageInterviewScore > 0 ? `${stats.averageInterviewScore}%` : 'N/A',
      description: stats?.averageInterviewScore > 0 ? 'Consolidated average rating' : 'Complete interviews to view score',
      icon: Award,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      action: () => navigate('/performance')
    },
    {
      title: 'Best Simulator Score',
      value: stats?.bestInterviewScore > 0 ? `${stats.bestInterviewScore}%` : 'N/A',
      description: stats?.bestInterviewScore > 0 ? 'Top mock evaluation record' : 'No graded scores recorded',
      icon: TrendingUp,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
      action: () => navigate('/performance')
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/90 to-purple-600 p-8 text-primary-foreground shadow-lg shadow-primary/20">
        <div className="absolute right-0 top-0 -mr-6 -mt-6 w-52 h-52 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/10 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            AI Preparation Portal Active
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-primary-foreground/80 leading-relaxed text-sm">
            Optimize your placement success. Audit your resume using state-of-the-art hybrid ATS keywords scanners, or test your skills in adaptive simulated interview rooms.
          </p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              onClick={card.action}
              className="p-5 rounded-2xl border bg-card text-card-foreground shadow-sm flex items-start gap-4 hover:border-primary/30 hover:shadow-md cursor-pointer transition duration-200"
            >
              <div className={`p-2.5 rounded-xl border shrink-0 ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{card.title}</p>
                <h3 className="text-xl font-black mt-1.5 tracking-tight">{card.value}</h3>
                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{card.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Quick Actions Panel */}
        <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm space-y-6 lg:col-span-1">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Action shortcuts</h2>
            <p className="text-sm text-muted-foreground">Jump directly to core dashboard modules.</p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => navigate('/resume')}
              className="w-full flex items-center justify-between p-4 rounded-xl border bg-secondary/20 hover:bg-secondary/40 transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Audit Resume Match</h4>
                  <p className="text-xs text-muted-foreground">Get ATS scores and bullet improvements.</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              onClick={() => navigate('/interview')}
              className="w-full flex items-center justify-between p-4 rounded-xl border bg-secondary/20 hover:bg-secondary/40 transition text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Launch AI Simulator</h4>
                  <p className="text-xs text-muted-foreground">Select Tech, HR, or Situational rooms.</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Diagnostic Topics & Recent Interview */}
        <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm space-y-6 lg:col-span-1">
          <div>
            <h2 className="text-lg font-bold tracking-tight">AI Skills Diagnostic</h2>
            <p className="text-sm text-muted-foreground">Topic-based strengths and weaknesses.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Strongest Subject Area</p>
                <h4 className="font-bold text-sm capitalize text-emerald-600 dark:text-emerald-400 mt-0.5">{stats?.strongestTopic || 'N/A'}</h4>
              </div>
              <Award className="h-5 w-5 text-emerald-500 shrink-0" />
            </div>

            <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">Weakest Focus Area</p>
                <h4 className="font-bold text-sm capitalize text-rose-600 dark:text-rose-400 mt-0.5">{stats?.weakestTopic || 'N/A'}</h4>
              </div>
              <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0" />
            </div>

            {stats?.recentInterview && (
              <div className="p-4 border rounded-xl bg-indigo-500/5 border-indigo-500/20 space-y-2 mt-2">
                <h4 className="font-bold text-indigo-500 text-xs uppercase tracking-wider">Most Recent Interview Session</h4>
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold capitalize">{stats.recentInterview.type} Room</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{stats.recentInterview.targetRole}</p>
                  </div>
                  <span className="text-sm font-black px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10 rounded-lg">
                    {stats.recentInterview.overallScore}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="p-6 rounded-2xl border bg-card text-card-foreground shadow-sm space-y-6 lg:col-span-1">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Recent Activity Feed</h2>
            <p className="text-sm text-muted-foreground">Logs of your completed optimizations and interviews.</p>
          </div>

          {stats?.recentActivity?.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground flex flex-col items-center justify-center space-y-2">
              <Activity className="h-8 w-8 text-muted/40 animate-pulse" />
              <p>No activity recorded yet. Try uploading a resume or starting an interview!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
              {stats?.recentActivity?.map((act, idx) => (
                <div key={idx} className="flex gap-4 items-start text-xs border-b pb-3 last:border-0 last:pb-0">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    act.type === 'resume_scan' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'
                  }`}>
                    {act.type === 'resume_scan' ? <FileText className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold truncate">{act.title}</h4>
                    <p className="text-muted-foreground mt-0.5">{act.meta}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {new Date(act.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
