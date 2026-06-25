const prisma = require('../prisma/client');
const codeRunner = require('../services/codeRunner');
const openaiService = require('../services/openaiService');

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
      include: {
        testCases: true
      }
    });

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Save submission to database (initial state)
    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId,
        code,
        language,
      },
    });

    // Run the code against all test cases
    let testCasesToRun = problem.testCases;
    if (!testCasesToRun || testCasesToRun.length === 0) {
      // Fallback to sample input/output as a single test case if none are present in DB
      testCasesToRun = [{
        id: 'sample',
        input: problem.sampleInput,
        expectedOutput: problem.sampleOutput,
        isHidden: false
      }];
    }

    const runResult = await codeRunner.runCode(language, code, testCasesToRun);

    // Update submission record with run details
    const updatedSubmission = await prisma.submission.update({
      where: { id: submission.id },
      data: {
        passedTests: runResult.passedTests,
        totalTests: runResult.totalTests,
        verdict: runResult.verdict,
        executionTime: runResult.executionTime
      }
    });

    // Generate AI code review feedback and save to DB
    try {
      const aiFeedback = await openaiService.analyzeSubmissionCode(
        code,
        language,
        problem.title,
        problem.description,
        runResult.verdict,
        runResult.passedTests,
        runResult.totalTests
      );

      await prisma.submissionReport.create({
        data: {
          submissionId: updatedSubmission.id,
          codeQualityScore: aiFeedback.codeQualityScore,
          timeComplexity: aiFeedback.timeComplexity,
          spaceComplexity: aiFeedback.spaceComplexity,
          optimizationSuggestions: JSON.stringify(aiFeedback.optimizationSuggestions),
          readabilityFeedback: aiFeedback.readabilityFeedback,
          interviewReadinessFeedback: aiFeedback.interviewReadinessFeedback
        }
      });
    } catch (aiError) {
      console.error('Failed to generate/save AI report:', aiError);
    }

    // Map verdicts to legacy display values for frontend console compatibility
    const statusMap = {
      'ACCEPTED': 'Accepted',
      'WRONG_ANSWER': 'Wrong Answer',
      'COMPILE_ERROR': 'Compilation Error',
      'RUNTIME_ERROR': 'Runtime Error',
      'TIME_LIMIT_EXCEEDED': 'Runtime Error',
      'UNSUPPORTED_LANGUAGE': 'Compilation Error'
    };

    const firstTestCaseResult = runResult.testCaseResults.length > 0 ? runResult.testCaseResults[0] : null;

    // Return the response, with details on all test cases
    // We filter hidden test cases so their input, expected output, actual output, and errors are redacted
    const testCaseResults = runResult.testCaseResults.map(tc => {
      if (tc.isHidden) {
        return {
          id: tc.id,
          isHidden: true,
          status: statusMap[tc.status] || tc.status,
          executionTime: tc.executionTime
        };
      } else {
        return {
          id: tc.id,
          isHidden: false,
          status: statusMap[tc.status] || tc.status,
          executionTime: tc.executionTime,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: tc.actualOutput,
          error: tc.error
        };
      }
    });

    // Legacy result format for console output on the frontend
    const legacyResult = {
      success: runResult.success,
      status: statusMap[runResult.verdict] || 'Runtime Error',
      expectedOutput: firstTestCaseResult ? firstTestCaseResult.expectedOutput : problem.sampleOutput,
      actualOutput: firstTestCaseResult ? firstTestCaseResult.actualOutput : null,
      message: runResult.message || (firstTestCaseResult ? firstTestCaseResult.error : null)
    };

    res.status(201).json({
      message: 'Submission created successfully',
      submission: updatedSubmission,
      result: legacyResult,
      results: testCaseResults
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

// Get AI report for a specific submission
const getSubmissionReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        report: true,
        problem: {
          select: {
            title: true,
            difficulty: true
          }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Security check: Only the submission owner (or an admin) can access this report
    if (submission.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (!submission.report) {
      return res.status(404).json({ message: 'AI report not found for this submission' });
    }

    let optimizationSuggestions = [];
    try {
      optimizationSuggestions = JSON.parse(submission.report.optimizationSuggestions);
    } catch (e) {
      optimizationSuggestions = [submission.report.optimizationSuggestions];
    }

    res.json({
      submissionId: submission.id,
      problemTitle: submission.problem.title,
      difficulty: submission.problem.difficulty,
      verdict: submission.verdict,
      passedTests: submission.passedTests,
      totalTests: submission.totalTests,
      code: submission.code,
      language: submission.language,
      submittedAt: submission.submittedAt,
      report: {
        id: submission.report.id,
        codeQualityScore: submission.report.codeQualityScore,
        timeComplexity: submission.report.timeComplexity,
        spaceComplexity: submission.report.spaceComplexity,
        optimizationSuggestions,
        readabilityFeedback: submission.report.readabilityFeedback,
        interviewReadinessFeedback: submission.report.interviewReadinessFeedback,
        createdAt: submission.report.createdAt
      }
    });
  } catch (error) {
    console.error('Get Submission Report Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  createSubmission,
  getUserSubmissions,
  getSubmissionReport,
};
