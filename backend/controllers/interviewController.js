const prisma = require('../prisma/client');
const openaiService = require('../services/openaiService');

// Generate Mock Interview (select 3-5 random questions matching domain/difficulty)
const generateMockInterview = async (req, res) => {
  try {
    const { domain, difficulty } = req.body;

    if (!domain || !difficulty) {
      return res.status(400).json({ message: 'Domain and difficulty are required' });
    }

    // Fetch questions matching criteria
    const questions = await prisma.question.findMany({
      where: { domain, difficulty },
    });

    if (questions.length === 0) {
      return res.status(404).json({ message: 'No questions found for the selected criteria' });
    }

    // Pick up to 5 questions randomly
    const shuffled = questions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, Math.min(5, shuffled.length));

    // Create Interview record
    const interview = await prisma.interview.create({
      data: {
        userId: req.user.id,
        domain,
        difficulty,
        status: 'PENDING_EVALUATION',
      },
    });

    res.status(201).json({
      interviewId: interview.id,
      domain: interview.domain,
      difficulty: interview.difficulty,
      questions: selectedQuestions.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
      })),
    });
  } catch (error) {
    console.error('Generate Mock Interview Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Submit Answers
const submitAnswers = async (req, res) => {
  try {
    const { interviewId, answers } = req.body; // answers = [{ questionId, answer }]

    if (!interviewId || !answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: 'Interview ID and answers are required' });
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You do not own this interview' });
    }

    // Store answers and run AI evaluations
    const evaluationPromises = answers.map(async (ans) => {
      const question = await prisma.question.findUnique({
        where: { id: ans.questionId },
      });

      // Call OpenAI service to evaluate this specific answer
      const evaluation = await openaiService.evaluateAnswer(
        question.title,
        question.description,
        ans.answer
      );

      // Save answer details
      return prisma.interviewAnswer.create({
        data: {
          interviewId,
          questionId: ans.questionId,
          answer: ans.answer,
          score: evaluation.score,
          feedback: JSON.stringify({
            technicalAccuracy: evaluation.technicalAccuracy,
            communicationQuality: evaluation.communicationQuality,
            completeness: evaluation.completeness,
            suggestedImprovements: evaluation.suggestedImprovements,
          }),
        },
      });
    });

    const savedAnswers = await Promise.all(evaluationPromises);

    // Call OpenAI to generate overall aggregated report
    const overallReport = await openaiService.generateOverallReport(
      interview.domain,
      interview.difficulty,
      savedAnswers.map((sa) => ({
        score: sa.score,
        feedback: sa.feedback,
      }))
    );

    // Save report in PENDING state
    const report = await prisma.interviewReport.create({
      data: {
        interviewId,
        aiScore: overallReport.overallScore,
        strengths: JSON.stringify(overallReport.strengths),
        weaknesses: JSON.stringify(overallReport.weaknesses),
        suggestions: JSON.stringify(overallReport.suggestions),
        summary: overallReport.summary,
        approvalStatus: 'PENDING',
      },
    });

    // Update Interview status
    await prisma.interview.update({
      where: { id: interviewId },
      data: { status: 'PENDING_REVIEW' },
    });

    res.status(200).json({
      message: 'Answers submitted successfully. Report is pending admin review.',
      reportId: report.id,
      interviewId,
    });
  } catch (error) {
    console.error('Submit Answers Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// View User Approved Reports
const getUserReports = async (req, res) => {
  try {
    const userId = req.user.id;

    const interviews = await prisma.interview.findMany({
      where: {
        userId,
        status: 'APPROVED',
      },
      include: {
        report: {
          include: {
            approver: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.json(interviews);
  } catch (error) {
    console.error('Get User Reports Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get Single Report details
const getReportById = async (req, res) => {
  try {
    const { id } = req.params; // interviewId or reportId, let's treat it as interviewId

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
        report: {
          include: {
            approver: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview attempt not found' });
    }

    // Role safety check
    if (req.user.role !== 'ADMIN' && interview.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // User can only view report if approved, unless they are admin
    if (req.user.role !== 'ADMIN' && interview.status !== 'APPROVED') {
      return res.status(403).json({ message: 'Report is pending approval and is currently unavailable.' });
    }

    res.json(interview);
  } catch (error) {
    console.error('Get Report Details Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Admin Review: List pending reviews
const getPendingReviews = async (req, res) => {
  try {
    const pendingInterviews = await prisma.interview.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: {
        user: {
          select: { name: true, email: true },
        },
        report: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    res.json(pendingInterviews);
  } catch (error) {
    console.error('Get Pending Reviews Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Admin Review: Approve report
const approveReport = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { manualFeedback } = req.body;

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { report: true },
    });

    if (!interview || !interview.report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Update Report status
    await prisma.interviewReport.update({
      where: { interviewId },
      data: {
        approvalStatus: 'APPROVED',
        approvedBy: req.user.id,
        manualFeedback: manualFeedback || null,
      },
    });

    // Update Interview status
    await prisma.interview.update({
      where: { id: interviewId },
      data: { status: 'APPROVED' },
    });

    // Recalculate User Analytics
    const approvedInterviews = await prisma.interview.findMany({
      where: {
        userId: interview.userId,
        status: 'APPROVED',
      },
      include: { report: true },
    });

    const completed = approvedInterviews.length;
    const sumScore = approvedInterviews.reduce((sum, iv) => sum + (iv.report?.aiScore || 0), 0);
    const averageScore = completed > 0 ? Number((sumScore / completed).toFixed(2)) : 0.0;

    // Recalculate Domain breakdown JSON
    const domainStats = {};
    approvedInterviews.forEach((iv) => {
      const d = iv.domain;
      const s = iv.report?.aiScore || 0;
      if (!domainStats[d]) domainStats[d] = { sum: 0, count: 0 };
      domainStats[d].sum += s;
      domainStats[d].count += 1;
    });

    const breakdown = {};
    Object.keys(domainStats).forEach((d) => {
      breakdown[d] = {
        averageScore: Number((domainStats[d].sum / domainStats[d].count).toFixed(2)),
        completed: domainStats[d].count,
      };
    });

    await prisma.analytics.upsert({
      where: { userId: interview.userId },
      update: {
        averageScore,
        interviewsCompleted: completed,
        domainBreakdown: JSON.stringify(breakdown),
      },
      create: {
        userId: interview.userId,
        averageScore,
        interviewsCompleted: completed,
        domainBreakdown: JSON.stringify(breakdown),
      },
    });

    res.json({ message: 'Interview report approved successfully' });
  } catch (error) {
    console.error('Approve Report Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Admin Review: Reject report
const rejectReport = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { manualFeedback } = req.body;

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { report: true },
    });

    if (!interview || !interview.report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Update Report status
    await prisma.interviewReport.update({
      where: { interviewId },
      data: {
        approvalStatus: 'REJECTED',
        approvedBy: req.user.id,
        manualFeedback: manualFeedback || 'Rejected by admin.',
      },
    });

    // Update Interview status
    await prisma.interview.update({
      where: { id: interviewId },
      data: { status: 'REJECTED' },
    });

    res.json({ message: 'Interview report rejected successfully' });
  } catch (error) {
    console.error('Reject Report Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  generateMockInterview,
  submitAnswers,
  getUserReports,
  getReportById,
  getPendingReviews,
  approveReport,
  rejectReport,
};
