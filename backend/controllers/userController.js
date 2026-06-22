const prisma = require('../prisma/client');
const path = require('path');

// Get Profile
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update Profile
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    // Check if email already taken by someone else
    if (email) {
      const emailTaken = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId },
        },
      });

      if (emailTaken) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
      },
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Upload Avatar
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    // Save profileImage path (e.g. /uploads/profiles/filename)
    const filePath = `/uploads/profiles/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { profileImage: filePath },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
      },
    });

    res.json({
      message: 'Profile photo uploaded successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Upload Avatar Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get User Statistics & Analytics
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get analytics summary
    let analytics = await prisma.analytics.findUnique({
      where: { userId },
    });

    if (!analytics) {
      // Create if missing
      analytics = await prisma.analytics.create({
        data: {
          userId,
          averageScore: 0,
          interviewsCompleted: 0,
        },
      });
    }

    // Fetch all approved interview reports to compute fresh statistics
    const interviews = await prisma.interview.findMany({
      where: {
        userId,
        status: 'APPROVED',
      },
      include: {
        report: true,
      },
      orderBy: {
        submittedAt: 'asc',
      },
    });

    // Compute progress breakdown and monthly distributions
    const progressHistory = interviews.map((iv) => ({
      interviewId: iv.id,
      domain: iv.domain,
      difficulty: iv.difficulty,
      submittedAt: iv.submittedAt,
      score: iv.report?.aiScore || 0,
    }));

    // Domain breakdown calculations
    const domainsCount = {};
    const domainsSum = {};
    interviews.forEach((iv) => {
      const dom = iv.domain;
      const score = iv.report?.aiScore || 0;
      domainsCount[dom] = (domainsCount[dom] || 0) + 1;
      domainsSum[dom] = (domainsSum[dom] || 0) + score;
    });

    const domainBreakdown = {};
    const strongAreas = [];
    const weakAreas = [];

    Object.keys(domainsCount).forEach((dom) => {
      const avg = Number((domainsSum[dom] / domainsCount[dom]).toFixed(2));
      domainBreakdown[dom] = {
        averageScore: avg,
        completed: domainsCount[dom],
      };

      if (avg >= 7.0) {
        strongAreas.push(dom);
      } else {
        weakAreas.push(dom);
      }
    });

    // If no interviews yet, push placeholders
    const finalStrongAreas = strongAreas.length > 0 ? strongAreas : ['None Yet'];
    const finalWeakAreas = weakAreas.length > 0 ? weakAreas : ['None Yet'];

    res.json({
      totalInterviews: analytics.interviewsCompleted,
      averageScore: analytics.averageScore,
      strongAreas: finalStrongAreas,
      weakAreas: finalWeakAreas,
      domainBreakdown,
      progressHistory,
    });
  } catch (error) {
    console.error('Get User Stats Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  getUserStats,
};
