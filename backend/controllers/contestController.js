const prisma = require('../prisma/client');

// Get active, upcoming, and past contests
const getContests = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const contests = await prisma.contest.findMany({
      include: {
        _count: {
          select: { participations: true }
        },
        participations: {
          where: { userId },
          select: { id: true }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    const categorizedContests = contests.map(c => {
      const isRegistered = c.participations.length > 0;
      // Strip participations array for cleaner response
      const { participations, ...contestInfo } = c;
      
      let status = 'upcoming';
      if (now >= new Date(c.startTime) && now <= new Date(c.endTime)) {
        status = 'active';
      } else if (now > new Date(c.endTime)) {
        status = 'past';
      }

      return {
        ...contestInfo,
        status,
        participantsCount: c._count.participations,
        isRegistered
      };
    });

    res.json(categorizedContests);
  } catch (error) {
    console.error('Get Contests Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get a contest by ID (with problems if registered or past/active)
const getContestById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const now = new Date();

    const contest = await prisma.contest.findUnique({
      where: { id },
      include: {
        problems: {
          include: {
            problem: {
              select: {
                id: true,
                title: true,
                difficulty: true,
                tags: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        participations: {
          where: { userId },
          select: { id: true, score: true }
        }
      }
    });

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    const isRegistered = contest.participations.length > 0;
    const isUpcoming = now < new Date(contest.startTime);

    // If it's upcoming, hide the problems to prevent cheating
    let problems = [];
    if (!isUpcoming) {
      problems = contest.problems.map(cp => ({
        id: cp.problem.id,
        title: cp.problem.title,
        difficulty: cp.problem.difficulty,
        tags: cp.problem.tags,
        points: cp.points,
        order: cp.order
      }));
    }

    res.json({
      id: contest.id,
      title: contest.title,
      description: contest.description,
      startTime: contest.startTime,
      endTime: contest.endTime,
      isRegistered,
      problems,
      score: isRegistered ? contest.participations[0].score : 0
    });
  } catch (error) {
    console.error('Get Contest By ID Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Register for a contest
const registerForContest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const now = new Date();

    const contest = await prisma.contest.findUnique({
      where: { id }
    });

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    if (now > new Date(contest.endTime)) {
      return res.status(400).json({ message: 'Cannot register for a past contest' });
    }

    // Register user if not already registered
    const existing = await prisma.contestParticipation.findUnique({
      where: {
        contestId_userId: {
          contestId: id,
          userId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'Already registered for this contest' });
    }

    const registration = await prisma.contestParticipation.create({
      data: {
        contestId: id,
        userId
      }
    });

    res.status(201).json({
      message: 'Successfully registered for contest',
      registration
    });
  } catch (error) {
    console.error('Register Contest Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get contest leaderboard
const getContestLeaderboard = async (req, res) => {
  try {
    const { id } = req.params;

    const contest = await prisma.contest.findUnique({
      where: { id }
    });

    if (!contest) {
      return res.status(404).json({ message: 'Contest not found' });
    }

    const participations = await prisma.contestParticipation.findMany({
      where: { contestId: id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { score: 'desc' },
        { finishTime: 'asc' }
      ]
    });

    const leaderboard = participations.map((p, idx) => ({
      rank: idx + 1,
      name: p.user.name,
      userId: p.userId,
      score: p.score,
      finishTime: p.finishTime,
      registeredAt: p.registeredAt
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Get Contest Leaderboard Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getContests,
  getContestById,
  registerForContest,
  getContestLeaderboard
};
