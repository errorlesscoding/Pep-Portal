import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Loader2, Award, BarChart3, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Performance = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('/api/analytics');
      if (res.data.success) {
        setAnalytics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load performance analytics:', err);
      setError('Could not connect to database analytics pipelines.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Gathering performance metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-destructive/20 bg-destructive/10 text-destructive rounded-2xl flex items-center gap-3">
        <AlertCircle className="h-5 w-5" />
        <span className="text-sm font-semibold">{error}</span>
      </div>
    );
  }

  // Calculate weak vs strong areas from skillsPerformance
  const strongAreas = analytics?.skillsPerformance?.filter(item => item.average >= 70) || [];
  const weakAreas = analytics?.skillsPerformance?.filter(item => item.average < 70 && item.count > 0) || [];

  // Monthly Chart configurations
  const barChartData = {
    labels: analytics?.monthlyProgress?.map(item => item.month) || ['Current'],
    datasets: [
      {
        label: 'Average Mock Score (%)',
        data: analytics?.monthlyProgress?.map(item => item.average) || [0],
        backgroundColor: 'rgba(99, 102, 241, 0.65)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const lineChartData = {
    labels: analytics?.monthlyProgress?.map(item => item.month) || ['Current'],
    datasets: [
      {
        label: 'ATS Match Score progress (%)',
        data: analytics?.monthlyProgress?.map(() => analytics.latestATSScore) || [0], // show latest progression trend
        fill: false,
        borderColor: 'rgb(16, 185, 129)',
        tension: 0.2,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 10, weight: 'bold' },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          font: { size: 10 },
        },
      },
      x: {
        ticks: {
          font: { size: 10 },
        },
      },
    },
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Performance Analytics</h1>
        <p className="text-muted-foreground mt-1">Audit score timelines and diagnostic skill distributions.</p>
      </div>

      {/* Main Aggregates */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'Total Scanned Resumes', value: analytics?.totalResumes || 0, icon: BarChart3 },
          { title: 'Latest Scanned ATS Score', value: analytics?.latestATSScore > 0 ? `${analytics.latestATSScore}%` : 'N/A', icon: TrendingUp },
          { title: 'Mock Sessions Completed', value: analytics?.totalInterviews || 0, icon: Award },
          { title: 'Average Interview Rating', value: analytics?.averageInterviewScore > 0 ? `${analytics.averageInterviewScore}%` : 'N/A', icon: Award },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="p-5 border rounded-2xl bg-card shadow-sm text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider">{card.title}</span>
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="text-2xl font-black mt-2 text-foreground">{card.value}</h3>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Mock Scores Progression */}
        <div className="p-6 border rounded-2xl bg-card space-y-4 shadow-sm flex flex-col">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-widest">Monthly Mock Interview Scores</h3>
          <div className="h-64 relative flex-1">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        {/* ATS Scores Progression */}
        <div className="p-6 border rounded-2xl bg-card space-y-4 shadow-sm flex flex-col">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-widest">ATS Match Progressions</h3>
          <div className="h-64 relative flex-1">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

      </div>

      {/* Diagnostic lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Strong Areas */}
        <div className="p-6 border rounded-2xl bg-card space-y-4">
          <h3 className="font-bold text-sm text-emerald-500 uppercase tracking-widest flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Core Strengths (Rating &ge; 70%)
          </h3>
          
          {strongAreas.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4">No strengths recorded. Keep testing to view metrics.</p>
          ) : (
            <div className="space-y-3">
              {strongAreas.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs border-b pb-2 last:border-0 last:pb-0">
                  <span className="font-bold capitalize">{item.category} Rooms</span>
                  <span className="font-black px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-lg">{item.average}% avg</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weak Areas */}
        <div className="p-6 border rounded-2xl bg-card space-y-4">
          <h3 className="font-bold text-sm text-rose-500 uppercase tracking-widest flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Areas for Improvement (Rating &lt; 70%)
          </h3>

          {weakAreas.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4">Excellent! No weak segments recorded, or more sessions needed.</p>
          ) : (
            <div className="space-y-3">
              {weakAreas.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs border-b pb-2 last:border-0 last:pb-0">
                  <span className="font-bold capitalize">{item.category} Rooms</span>
                  <span className="font-black px-2 py-0.5 bg-rose-500/10 text-rose-600 rounded-lg">{item.average}% avg</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Performance;
