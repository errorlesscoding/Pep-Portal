const Resume = require('../models/Resume');
const Interview = require('../models/Interview');

// @desc    Get aggregated stats for dashboard & charts
// @route   GET /api/analytics
// @access  Private
const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Core Resume count and latest ATS Score
    const resumeCount = await Resume.countDocuments({ user: userId });
    const latestResume = await Resume.findOne({ user: userId }).sort({ createdAt: -1 });
    const latestATS = latestResume ? latestResume.atsScore : 0;

    // 2. Core Interview counts
    const completedInterviews = await Interview.find({ user: userId, status: 'completed' })
      .populate('questions')
      .populate('answers')
      .populate({
        path: 'results',
        populate: ['question', 'answer'],
      })
      .sort({ createdAt: -1 });

    const totalInterviewsCount = completedInterviews.length;

    // Calculate average and best scores
    let avgScore = 0;
    let bestScore = 0;
    if (totalInterviewsCount > 0) {
      const sum = completedInterviews.reduce((acc, curr) => acc + curr.overallScore, 0);
      avgScore = Math.round(sum / totalInterviewsCount);
      bestScore = Math.max(...completedInterviews.map(i => i.overallScore));
    }

    // 3. Category distribution (Technical vs HR vs Behavioral scores)
    const categoryStats = {};
    completedInterviews.forEach(int => {
      const topicKey = int.type.toLowerCase();
      if (!categoryStats[topicKey]) {
        categoryStats[topicKey] = [];
      }
      categoryStats[topicKey].push(int.overallScore);
    });

    const skillsPerformance = Object.entries(categoryStats).map(([key, scores]) => {
      const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      return {
        category: key.toUpperCase(),
        average: avg,
        count: scores.length
      };
    });

    // Identify strongest and weakest topic areas
    let strongestTopic = 'none';
    let weakestTopic = 'none';
    if (skillsPerformance.length > 0) {
      // Sort to find max/min
      const sorted = [...skillsPerformance].sort((a, b) => b.average - a.average);
      strongestTopic = sorted[0].category.toLowerCase();
      weakestTopic = sorted[sorted.length - 1].category.toLowerCase();
    }

    // 4. Monthly progress tracker (for line charts)
    const monthlyAggregate = await Interview.aggregate([
      { $match: { user: userId, status: 'completed' } },
      {
        $group: {
          _id: { $month: '$createdAt' },
          averageScore: { $avg: '$overallScore' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyProgress = monthlyAggregate.map((item) => ({
      month: months[item._id - 1] || 'Unknown',
      average: Math.round(item.averageScore),
      interviewsCompleted: item.count,
    }));

    // 5. Recent Activity Feed
    const recentResumes = await Resume.find({ user: userId }).sort({ createdAt: -1 }).limit(3);
    const recentInterviews = completedInterviews.slice(0, 3);

    const activityFeed = [];
    recentResumes.forEach(r => {
      activityFeed.push({
        type: 'resume_scan',
        title: `Optimized: ${r.fileName}`,
        meta: `ATS Score: ${r.atsScore}%`,
        date: r.createdAt
      });
    });

    recentInterviews.forEach(i => {
      activityFeed.push({
        type: 'interview_complete',
        title: `Completed ${i.type.toUpperCase()} Room`,
        meta: `AI Score: ${i.overallScore}%`,
        date: i.createdAt
      });
    });

    // Sort combined feed by date descending
    activityFeed.sort((a, b) => b.date - a.date);

    res.status(200).json({
      success: true,
      data: {
        totalResumes: resumeCount,
        latestATSScore: latestATS,
        totalInterviews: totalInterviewsCount,
        averageInterviewScore: avgScore,
        bestInterviewScore: bestScore,
        recentInterview: recentInterviews.length > 0 ? {
          _id: recentInterviews[0]._id,
          type: recentInterviews[0].type,
          targetRole: recentInterviews[0].targetRole,
          overallScore: recentInterviews[0].overallScore,
          createdAt: recentInterviews[0].createdAt
        } : null,
        strongestTopic,
        weakestTopic,
        skillsPerformance,
        monthlyProgress: monthlyProgress.length > 0 ? monthlyProgress : [{ month: 'Current', average: avgScore, interviewsCompleted: totalInterviewsCount }],
        recentActivity: activityFeed.slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Error fetching analytics details:', error);
    res.status(500).json({ success: false, message: 'Server error processing analytics pipeline' });
  }
};

module.exports = {
  getUserAnalytics,
};
