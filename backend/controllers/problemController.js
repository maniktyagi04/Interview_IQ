const prisma = require('../prisma/client');

// Lazy streak reset helper
const checkAndResetStreak = async (userId) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.lastActiveDate) return user;
    
    const lastActiveDateOnly = new Date(user.lastActiveDate);
    lastActiveDateOnly.setHours(0, 0, 0, 0);
    
    const todayDateOnly = new Date();
    todayDateOnly.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(todayDateOnly - lastActiveDateOnly);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) {
      return await prisma.user.update({
        where: { id: userId },
        data: { currentStreak: 0 }
      });
    }
    return user;
  } catch (error) {
    console.error('Streak reset helper error:', error);
  }
};

// Get all coding problems, decorated with solving and bookmarking state
const getProblems = async (req, res) => {
  try {
    const userId = req.user.id;
    await checkAndResetStreak(userId);

    const [problems, userSubmissions, userBookmarks] = await Promise.all([
      prisma.problem.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      prisma.submission.findMany({
        where: { userId },
        select: { problemId: true, verdict: true }
      }),
      prisma.bookmark.findMany({
        where: { userId },
        select: { problemId: true }
      })
    ]);

    const solvedProblemIds = new Set(
      userSubmissions.filter(s => s.verdict === 'ACCEPTED').map(s => s.problemId)
    );
    const attemptedProblemIds = new Set(
      userSubmissions.map(s => s.problemId)
    );
    const bookmarkedProblemIds = new Set(
      userBookmarks.map(b => b.problemId)
    );

    const decoratedProblems = problems.map(p => {
      let status = 'UNSOLVED';
      if (solvedProblemIds.has(p.id)) {
        status = 'SOLVED';
      } else if (attemptedProblemIds.has(p.id)) {
        status = 'ATTEMPTED';
      }

      return {
        ...p,
        status,
        isBookmarked: bookmarkedProblemIds.has(p.id)
      };
    });

    res.json(decoratedProblems);
  } catch (error) {
    console.error('Get Problems Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get today's daily challenge. If none exists, create one dynamically.
const getDailyChallenge = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dailyChallenge = await prisma.dailyChallenge.findUnique({
      where: { date: today },
      include: {
        problem: true
      }
    });

    if (!dailyChallenge) {
      // Pick a random problem to be the daily challenge
      const problemsCount = await prisma.problem.count();
      if (problemsCount === 0) {
        return res.status(404).json({ message: 'No coding problems available to set daily challenge' });
      }

      const randomSkip = Math.floor(Math.random() * problemsCount);
      const randomProblem = await prisma.problem.findMany({
        take: 1,
        skip: randomSkip
      });

      if (randomProblem.length > 0) {
        dailyChallenge = await prisma.dailyChallenge.create({
          data: {
            problemId: randomProblem[0].id,
            date: today,
            points: 50
          },
          include: {
            problem: true
          }
        });
      }
    }

    if (!dailyChallenge) {
      return res.status(500).json({ message: 'Could not create daily challenge' });
    }

    // Check if the user has solved this daily challenge today
    const solvedToday = await prisma.submission.findFirst({
      where: {
        userId,
        problemId: dailyChallenge.problemId,
        verdict: 'ACCEPTED'
      }
    });

    res.json({
      id: dailyChallenge.id,
      points: dailyChallenge.points,
      date: dailyChallenge.date,
      problem: dailyChallenge.problem,
      isSolved: !!solvedToday
    });
  } catch (error) {
    console.error('Get Daily Challenge Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Toggle problem bookmarking
const toggleBookmark = async (req, res) => {
  try {
    const { id: problemId } = req.params;
    const userId = req.user.id;

    const problem = await prisma.problem.findUnique({
      where: { id: problemId }
    });

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_problemId: { userId, problemId }
      }
    });

    if (existingBookmark) {
      await prisma.bookmark.delete({
        where: {
          userId_problemId: { userId, problemId }
        }
      });
      return res.json({ bookmarked: false, message: 'Bookmark removed successfully' });
    } else {
      await prisma.bookmark.create({
        data: { userId, problemId }
      });
      return res.json({ bookmarked: true, message: 'Problem bookmarked successfully' });
    }
  } catch (error) {
    console.error('Toggle Bookmark Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get bookmarked problems
const getBookmarkedProblems = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        problem: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const problems = bookmarks.map(b => b.problem);
    res.json(problems);
  } catch (error) {
    console.error('Get Bookmarked Problems Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get global leaderboard sorted by points
const getLeaderboard = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        points: true,
        currentStreak: true,
        longestStreak: true
      },
      orderBy: { points: 'desc' }
    });

    // Decorate with rank
    const leaderboard = users.map((u, idx) => ({
      rank: idx + 1,
      ...u
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Get Leaderboard Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get coding activity heatmap data (date -> submissionCount)
const getActivityHeatmap = async (req, res) => {
  try {
    const userId = req.user.id;
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    oneYearAgo.setHours(0, 0, 0, 0);

    const submissions = await prisma.submission.findMany({
      where: {
        userId,
        submittedAt: { gte: oneYearAgo }
      },
      select: { submittedAt: true }
    });

    // Group submissions by YYYY-MM-DD
    const countsByDate = {};
    submissions.forEach(s => {
      const dateStr = new Date(s.submittedAt).toISOString().split('T')[0];
      countsByDate[dateStr] = (countsByDate[dateStr] || 0) + 1;
    });

    // Format as list of objects suitable for front-end rendering
    const heatmapData = Object.keys(countsByDate).map(date => ({
      date,
      count: countsByDate[date]
    }));

    res.json(heatmapData);
  } catch (error) {
    console.error('Get Activity Heatmap Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get a single coding problem by ID
const getProblemById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [problem, bookmark, isSolved] = await Promise.all([
      prisma.problem.findUnique({
        where: { id },
      }),
      prisma.bookmark.findUnique({
        where: {
          userId_problemId: { userId, problemId: id }
        }
      }),
      prisma.submission.findFirst({
        where: {
          userId,
          problemId: id,
          verdict: 'ACCEPTED'
        }
      })
    ]);

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json({
      ...problem,
      isBookmarked: !!bookmark,
      isSolved: !!isSolved
    });
  } catch (error) {
    console.error('Get Problem By Id Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getProblems,
  getDailyChallenge,
  toggleBookmark,
  getBookmarkedProblems,
  getLeaderboard,
  getActivityHeatmap,
  getProblemById,
};
