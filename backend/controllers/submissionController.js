const prisma = require('../prisma/client');
const codeRunner = require('../services/codeRunner');

// Create a new submission and run the tests
const createSubmission = async (req, res) => {
  try {
    const { problemId, code, language } = req.body;
    const userId = req.user.id;

    if (!problemId || !code || !language) {
      return res.status(400).json({ message: 'Problem ID, code, and language are required' });
    }

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Save submission to database (as required by requirement 8 & 9)
    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId,
        code,
        language,
      },
    });

    // Run the code against test cases
    let runResult = { 
      success: false, 
      status: 'Unsupported Language', 
      message: 'Only JavaScript is supported currently.' 
    };

    if (language.toLowerCase() === 'javascript') {
      runResult = codeRunner.runJS(code, problem.sampleInput, problem.sampleOutput);
    }

    res.status(201).json({
      message: 'Submission created successfully',
      submission,
      result: runResult,
    });
  } catch (error) {
    console.error('Create Submission Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get all submissions for the logged-in user (optionally filtered by problemId)
const getUserSubmissions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { problemId } = req.query;

    const where = { userId };
    if (problemId) {
      where.problemId = problemId;
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        problem: {
          select: {
            title: true,
            difficulty: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.json(submissions);
  } catch (error) {
    console.error('Get User Submissions Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  createSubmission,
  getUserSubmissions,
};
