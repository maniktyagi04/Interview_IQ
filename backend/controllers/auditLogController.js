const prisma = require('../prisma/client');

// Retrieve all administrative action logs
const getAuditLogs = async (req, res) => {
  try {
    const { search, action, startDate, endDate, page = 1, limit = 30 } = req.query;

    const where = {};

    // Filter by specific admin action category
    if (action && action.trim() !== '') {
      where.action = action;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of day to cover all entries within that day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Search query on description or administrator name/email
    if (search && search.trim() !== '') {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        {
          admin: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          admin: {
            email: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);

    const total = await prisma.adminAuditLog.count({ where });
    const logs = await prisma.adminAuditLog.findMany({
      where,
      include: {
        admin: {
          select: {
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
    });

    res.json({
      logs,
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    });
  } catch (error) {
    console.error('Get Audit Logs Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getAuditLogs,
};
