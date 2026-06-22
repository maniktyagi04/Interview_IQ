const prisma = require('../prisma/client');

// Get Platform Statistics
const getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count({
      where: { role: 'USER' },
    });

    const totalInterviews = await prisma.interview.count();

    const pendingReviews = await prisma.interview.count({
      where: { status: 'PENDING_REVIEW' },
    });

    const approvedReports = await prisma.interview.count({
      where: { status: 'APPROVED' },
    });

    // Domain breakdown of all attempts
    const interviews = await prisma.interview.findMany({
      select: { domain: true },
    });

    const domainCounts = {};
    interviews.forEach((iv) => {
      domainCounts[iv.domain] = (domainCounts[iv.domain] || 0) + 1;
    });

    res.json({
      totalUsers,
      totalInterviews,
      pendingReviews,
      approvedReports,
      domainCounts,
    });
  } catch (error) {
    console.error('Get Platform Stats Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get All Users (Admin only)
const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        profileImage: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Block User
const blockUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'ADMIN') {
      return res.status(400).json({ message: 'Cannot block administrative accounts' });
    }

    await prisma.user.update({
      where: { id },
      data: { status: 'BLOCKED' },
    });

    res.json({ message: `User ${user.name} has been blocked successfully` });
  } catch (error) {
    console.error('Block User Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Unblock User
const unblockUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    res.json({ message: `User ${user.name} has been unblocked successfully` });
  } catch (error) {
    console.error('Unblock User Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Delete User
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'ADMIN') {
      return res.status(400).json({ message: 'Cannot delete administrative accounts' });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: `User ${user.name} has been deleted successfully` });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// View Specific User Activity Summary
const getUserActivity = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        interviews: {
          select: {
            id: true,
            domain: true,
            difficulty: true,
            status: true,
            submittedAt: true,
          },
        },
        resumes: {
          select: {
            id: true,
            createdAt: true,
          },
        },
        notes: {
          select: {
            id: true,
          },
        },
        analytics: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      userId: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      interviewsCount: user.interviews.length,
      resumesCount: user.resumes.length,
      notesCount: user.notes.length,
      analytics: user.analytics,
      activityLog: user.interviews,
    });
  } catch (error) {
    console.error('Get User Activity Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getPlatformStats,
  getUsers,
  blockUser,
  unblockUser,
  deleteUser,
  getUserActivity,
};
