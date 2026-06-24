const prisma = require('../prisma/client');

// Get all coding problems
const getProblems = async (req, res) => {
  try {
    const problems = await prisma.problem.findMany({
      orderBy: { createdAt: 'asc' },
    });
    res.json(problems);
  } catch (error) {
    console.error('Get Problems Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get a single coding problem by ID
const getProblemById = async (req, res) => {
  try {
    const { id } = req.params;
    const problem = await prisma.problem.findUnique({
      where: { id },
    });

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json(problem);
  } catch (error) {
    console.error('Get Problem By Id Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getProblems,
  getProblemById,
};
