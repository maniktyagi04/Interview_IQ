const prisma = require('../prisma/client');

// Get Progress Analytics for candidate dashboard
const getProgressAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all approved interviews with reports
    const interviews = await prisma.interview.findMany({
      where: {
        userId,
        status: 'APPROVED',
        report: {
          isNot: null,
        },
      },
      include: {
        report: true,
      },
      orderBy: {
        submittedAt: 'asc',
      },
    });

    if (interviews.length === 0) {
      return res.json({
        hasData: false,
        message: 'No completed and approved interviews found to generate analytics.',
        growth: [],
        monthlyPerformance: [],
        domainPerformance: [],
        bestDomain: null,
        weakestDomain: null,
      });
    }

    // 1. Growth Over Time (chronological scores)
    const growth = interviews.map((iv) => ({
      interviewId: iv.id,
      domain: iv.domain,
      difficulty: iv.difficulty,
      date: iv.submittedAt,
      overallScore: iv.report.aiScore,
      technicalScore: iv.report.technicalScore || iv.report.aiScore,
      communicationScore: iv.report.communicationScore || iv.report.aiScore,
      confidenceScore: iv.report.confidenceScore || iv.report.aiScore,
    }));

    // 2. Monthly Performance
    const monthlyMap = {};
    interviews.forEach((iv) => {
      const date = new Date(iv.submittedAt);
      const monthLabel = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyMap[monthLabel]) {
        monthlyMap[monthLabel] = { count: 0, overall: 0, tech: 0, comm: 0, conf: 0 };
      }
      monthlyMap[monthLabel].count++;
      monthlyMap[monthLabel].overall += iv.report.aiScore;
      monthlyMap[monthLabel].tech += iv.report.technicalScore || iv.report.aiScore;
      monthlyMap[monthLabel].comm += iv.report.communicationScore || iv.report.aiScore;
      monthlyMap[monthLabel].conf += iv.report.confidenceScore || iv.report.aiScore;
    });

    const monthlyPerformance = Object.entries(monthlyMap).map(([month, data]) => ({
      month,
      overallScore: Number((data.overall / data.count).toFixed(2)),
      technicalScore: Number((data.tech / data.count).toFixed(2)),
      communicationScore: Number((data.comm / data.count).toFixed(2)),
      confidenceScore: Number((data.conf / data.count).toFixed(2)),
      count: data.count,
    }));

    // 3. Domain Performance
    const domainMap = {};
    interviews.forEach((iv) => {
      const domain = iv.domain;
      if (!domainMap[domain]) {
        domainMap[domain] = { count: 0, overall: 0, tech: 0, comm: 0, conf: 0 };
      }
      domainMap[domain].count++;
      domainMap[domain].overall += iv.report.aiScore;
      domainMap[domain].tech += iv.report.technicalScore || iv.report.aiScore;
      domainMap[domain].comm += iv.report.communicationScore || iv.report.aiScore;
      domainMap[domain].conf += iv.report.confidenceScore || iv.report.aiScore;
    });

    const domainPerformance = Object.entries(domainMap).map(([domain, data]) => ({
      domain,
      overallScore: Number((data.overall / data.count).toFixed(2)),
      technicalScore: Number((data.tech / data.count).toFixed(2)),
      communicationScore: Number((data.comm / data.count).toFixed(2)),
      confidenceScore: Number((data.conf / data.count).toFixed(2)),
      count: data.count,
    }));

    // 4. Best & Weakest Domain
    let bestDomain = null;
    let weakestDomain = null;
    let highestScore = -1;
    let lowestScore = 11;

    domainPerformance.forEach((dp) => {
      if (dp.overallScore > highestScore) {
        highestScore = dp.overallScore;
        bestDomain = { domain: dp.domain, score: dp.overallScore };
      }
      if (dp.overallScore < lowestScore) {
        lowestScore = dp.overallScore;
        weakestDomain = { domain: dp.domain, score: dp.overallScore };
      }
    });

    res.json({
      hasData: true,
      growth,
      monthlyPerformance,
      domainPerformance,
      bestDomain,
      weakestDomain,
    });
  } catch (error) {
    console.error('Get Progress Analytics Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get Coding Assessment Analytics
const getCodingAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all submissions for the user, including the associated problem and report
    const submissions = await prisma.submission.findMany({
      where: { userId },
      include: {
        problem: true,
        report: true
      },
      orderBy: { submittedAt: 'asc' }
    });

    if (submissions.length === 0) {
      return res.json({
        hasData: false,
        message: 'No submissions found to generate coding analytics.',
        totalSolved: 0,
        accuracyRate: 0,
        submissionCount: 0,
        difficultyBreakdown: { Easy: 0, Medium: 0, Hard: 0 },
        weeklyProgress: [],
        accuracyTrend: [],
        solvedTrend: [],
        strongTopics: [],
        weakTopics: [],
        repeatedMistakes: []
      });
    }

    // 1. Calculate General Stats
    const submissionCount = submissions.length;
    const acceptedSubmissions = submissions.filter(sub => sub.verdict === 'ACCEPTED');
    const accuracyRate = Number(((acceptedSubmissions.length / submissionCount) * 100).toFixed(1));

    // Get unique problems solved
    const solvedProblemIds = new Set(acceptedSubmissions.map(sub => sub.problemId));
    const totalSolved = solvedProblemIds.size;

    // Difficulty breakdown of solved problems
    const solvedProblemsMap = new Map();
    acceptedSubmissions.forEach(sub => {
      solvedProblemsMap.set(sub.problemId, sub.problem.difficulty);
    });

    const difficultyBreakdown = { Easy: 0, Medium: 0, Hard: 0 };
    solvedProblemsMap.forEach(difficulty => {
      if (difficultyBreakdown[difficulty] !== undefined) {
        difficultyBreakdown[difficulty]++;
      }
    });

    // 2. Generate Weekly Progress
    const weeklyMap = {};
    submissions.forEach(sub => {
      const date = new Date(sub.submittedAt);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? 0 : 7);
      const weekEnd = new Date(date.setDate(diff));
      const weekLabel = weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      if (!weeklyMap[weekLabel]) {
        weeklyMap[weekLabel] = { date: weekEnd, total: 0, accepted: 0, solvedIds: new Set() };
      }
      weeklyMap[weekLabel].total++;
      if (sub.verdict === 'ACCEPTED') {
        weeklyMap[weekLabel].accepted++;
        weeklyMap[weekLabel].solvedIds.add(sub.problemId);
      }
    });

    const weeklyProgress = Object.entries(weeklyMap)
      .sort((a, b) => a[1].date - b[1].date)
      .map(([week, data]) => ({
        week,
        submissions: data.total,
        solved: data.solvedIds.size,
        accuracy: Number(((data.accepted / data.total) * 100).toFixed(1))
      }));

    // Trends: solved trend (cumulative solved problems) & accuracy trend
    const solvedTrend = [];
    const accuracyTrend = [];
    const cumulativeSolvedIds = new Set();
    let cumulativeSubmissions = 0;
    let cumulativeAccepted = 0;

    submissions.forEach((sub) => {
      const dateLabel = new Date(sub.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      cumulativeSubmissions++;
      if (sub.verdict === 'ACCEPTED') {
        cumulativeAccepted++;
        cumulativeSolvedIds.add(sub.problemId);
      }

      const existingSolvedEntry = solvedTrend.find(entry => entry.date === dateLabel);
      if (existingSolvedEntry) {
        existingSolvedEntry.count = cumulativeSolvedIds.size;
      } else {
        solvedTrend.push({
          date: dateLabel,
          timestamp: new Date(sub.submittedAt).getTime(),
          count: cumulativeSolvedIds.size
        });
      }

      const existingAccuracyEntry = accuracyTrend.find(entry => entry.date === dateLabel);
      const dayAccuracy = Number(((cumulativeAccepted / cumulativeSubmissions) * 100).toFixed(1));
      if (existingAccuracyEntry) {
        existingAccuracyEntry.accuracy = dayAccuracy;
      } else {
        accuracyTrend.push({
          date: dateLabel,
          timestamp: new Date(sub.submittedAt).getTime(),
          accuracy: dayAccuracy
        });
      }
    });

    const sortedSolvedTrend = solvedTrend.sort((a, b) => a.timestamp - b.timestamp).map(({ date, count }) => ({ date, count }));
    const sortedAccuracyTrend = accuracyTrend.sort((a, b) => a.timestamp - b.timestamp).map(({ date, accuracy }) => ({ date, accuracy }));

    // 3. Topic strengths & weaknesses
    const tagStats = {};
    submissions.forEach(sub => {
      const tags = sub.problem.tags || [];
      tags.forEach(tag => {
        if (!tagStats[tag]) {
          tagStats[tag] = { total: 0, accepted: 0, qualitySum: 0, qualityCount: 0 };
        }
        tagStats[tag].total++;
        if (sub.verdict === 'ACCEPTED') {
          tagStats[tag].accepted++;
        }
        if (sub.report && sub.report.codeQualityScore) {
          tagStats[tag].qualitySum += sub.report.codeQualityScore;
          tagStats[tag].qualityCount++;
        }
      });
    });

    const topicMetrics = Object.entries(tagStats).map(([tag, data]) => {
      const accuracy = Number(((data.accepted / data.total) * 100).toFixed(1));
      const avgQuality = data.qualityCount > 0 ? Number((data.qualitySum / data.qualityCount).toFixed(1)) : null;
      return {
        topic: tag,
        accuracy,
        avgQuality,
        solved: data.accepted,
        total: data.total
      };
    });

    const strongTopics = topicMetrics
      .filter(t => t.solved > 0 && (t.accuracy >= 70 || (t.avgQuality && t.avgQuality >= 80)))
      .sort((a, b) => b.accuracy - a.accuracy || (b.avgQuality || 0) - (a.avgQuality || 0))
      .slice(0, 5)
      .map(t => ({
        topic: t.topic,
        accuracy: t.accuracy,
        avgQuality: t.avgQuality || 80,
        solved: t.solved
      }));

    const weakTopics = topicMetrics
      .filter(t => t.accuracy < 60 || (t.total - t.solved > 1))
      .sort((a, b) => a.accuracy - b.accuracy || (b.total - b.solved) - (a.total - a.solved))
      .slice(0, 5)
      .map(t => ({
        topic: t.topic,
        accuracy: t.accuracy,
        failedCount: t.total - t.solved,
        avgQuality: t.avgQuality || 60
      }));

    // 4. Repeated mistakes
    const mistakesCount = {};
    const recentSuggestions = [];

    submissions.forEach(sub => {
      if (sub.report && sub.report.optimizationSuggestions) {
        let suggestions = [];
        try {
          suggestions = JSON.parse(sub.report.optimizationSuggestions);
        } catch (e) {
          suggestions = [sub.report.optimizationSuggestions];
        }

        suggestions.forEach(suggestion => {
          recentSuggestions.push(suggestion);
          const text = suggestion.toLowerCase();
          let category = null;

          if (text.includes('nested loop') || text.includes('o(n^2)') || text.includes('quadratic')) {
            category = 'Nested loops causing quadratic O(N²) complexity';
          } else if (text.includes('space') || text.includes('extra space') || text.includes('memory')) {
            category = 'Sub-optimal auxiliary space complexity';
          } else if (text.includes('variable naming') || text.includes('rename') || text.includes('meaningful name')) {
            category = 'Poor or non-standard variable naming conventions';
          } else if (text.includes('comment') || text.includes('explain') || text.includes('document')) {
            category = 'Lack of logic explanation or source comments';
          } else if (text.includes('edge case') || text.includes('empty') || text.includes('boundary')) {
            category = 'Inadequate handling of boundary edge-cases';
          } else if (text.includes('correctness') || text.includes('fail') || text.includes('wrong')) {
            category = 'Logic bugs causing wrong answers on test cases';
          }

          if (category) {
            mistakesCount[category] = (mistakesCount[category] || 0) + 1;
          }
        });
      }

      if (sub.verdict === 'TIME_LIMIT_EXCEEDED') {
        const cat = 'Infinite loops or TLE (Time Limit Exceeded)';
        mistakesCount[cat] = (mistakesCount[cat] || 0) + 1;
      } else if (sub.verdict === 'RUNTIME_ERROR') {
        const cat = 'Uncaught Runtime exceptions (crashes)';
        mistakesCount[cat] = (mistakesCount[cat] || 0) + 1;
      } else if (sub.verdict === 'COMPILE_ERROR') {
        const cat = 'Code syntax compilation errors';
        mistakesCount[cat] = (mistakesCount[cat] || 0) + 1;
      }
    });

    const repeatedMistakes = Object.entries(mistakesCount)
      .sort((a, b) => b[1] - a[1])
      .map(([mistake, count]) => ({
        mistake,
        count
      }));

    if (repeatedMistakes.length === 0 && recentSuggestions.length > 0) {
      const uniqueSuggestions = [...new Set(recentSuggestions)].slice(0, 5);
      uniqueSuggestions.forEach((s) => {
        repeatedMistakes.push({
          mistake: s,
          count: 1
        });
      });
    }

    res.json({
      hasData: true,
      totalSolved,
      accuracyRate,
      submissionCount,
      difficultyBreakdown,
      weeklyProgress,
      accuracyTrend: sortedAccuracyTrend,
      solvedTrend: sortedSolvedTrend,
      strongTopics,
      weakTopics,
      repeatedMistakes: repeatedMistakes.slice(0, 5)
    });
  } catch (error) {
    console.error('Get Coding Analytics Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getProgressAnalytics,
  getCodingAnalytics,
};
