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

module.exports = {
  getProgressAnalytics,
};
