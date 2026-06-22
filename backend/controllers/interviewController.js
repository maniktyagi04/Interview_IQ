const prisma = require('../prisma/client');
const openaiService = require('../services/openaiService');
const auditLogService = require('../services/auditLogService');
const emailService = require('../services/emailService');

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
    const updatedReport = await prisma.interviewReport.update({
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

    // Log admin action to audit logs
    const user = await prisma.user.findUnique({ where: { id: interview.userId } });
    await auditLogService.logAction(
      req.user.id,
      'REPORT_APPROVED',
      'InterviewReport',
      interview.report.id,
      `Approved interview report for user ${user ? user.name : 'Unknown'} with score ${interview.report.aiScore.toFixed(1)}/10`
    );

    // Send email notification to user
    if (user) {
      emailService.sendReportApprovedEmail(
        user,
        interview.domain,
        interview.report.aiScore,
        interview.report.summary
      ).catch(err => {
        console.error('Error sending report approval email:', err.message);
      });
    }

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

    // Log admin action to audit logs
    const user = await prisma.user.findUnique({ where: { id: interview.userId } });
    await auditLogService.logAction(
      req.user.id,
      'REPORT_REJECTED',
      'InterviewReport',
      interview.report.id,
      `Rejected interview report for user ${user ? user.name : 'Unknown'}`
    );

    res.json({ message: 'Interview report rejected successfully' });
  } catch (error) {
    console.error('Reject Report Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Submit main question answer and generate contextual follow-up question
const submitAnswerQuestion = async (req, res) => {
  try {
    const { interviewId, questionId } = req.params;
    const { answer } = req.body;

    if (!answer || answer.trim().length === 0) {
      return res.status(400).json({ message: 'Answer text is required' });
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

    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Evaluate original answer via AI
    const evaluation = await openaiService.evaluateAnswer(
      question.title,
      question.description,
      answer
    );

    // Generate follow-up question via AI
    const followUpObj = await openaiService.generateFollowUpQuestion(
      question.title,
      question.description,
      answer
    );

    // Check if answer already exists to prevent duplicate rows
    const existing = await prisma.interviewAnswer.findFirst({
      where: { interviewId, questionId },
    });

    let ansRecord;
    const data = {
      interviewId,
      questionId,
      answer,
      score: evaluation.score,
      feedback: JSON.stringify({
        technicalAccuracy: evaluation.technicalAccuracy,
        communicationQuality: evaluation.communicationQuality,
        completeness: evaluation.completeness,
        suggestedImprovements: evaluation.suggestedImprovements,
      }),
      followUpQuestion: followUpObj.followUpQuestion,
    };

    if (existing) {
      ansRecord = await prisma.interviewAnswer.update({
        where: { id: existing.id },
        data,
      });
    } else {
      ansRecord = await prisma.interviewAnswer.create({
        data,
      });
    }

    res.json({
      answerId: ansRecord.id,
      followUpQuestion: ansRecord.followUpQuestion,
    });
  } catch (error) {
    console.error('Submit Answer Question Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Submit follow-up answer and evaluate details
const submitAnswerFollowUp = async (req, res) => {
  try {
    const { interviewId, answerId } = req.params;
    const { followUpAnswer } = req.body;

    if (!followUpAnswer || followUpAnswer.trim().length === 0) {
      return res.status(400).json({ message: 'Follow-up answer text is required' });
    }

    const answerRecord = await prisma.interviewAnswer.findUnique({
      where: { id: answerId },
      include: { question: true, interview: true },
    });

    if (!answerRecord || answerRecord.interviewId !== interviewId) {
      return res.status(404).json({ message: 'Interview answer record not found' });
    }

    if (answerRecord.interview.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Evaluate follow-up answer via AI
    const evaluation = await openaiService.evaluateFollowUpAnswer(
      answerRecord.question.title,
      answerRecord.answer,
      answerRecord.followUpQuestion,
      followUpAnswer
    );

    const updated = await prisma.interviewAnswer.update({
      where: { id: answerId },
      data: {
        followUpAnswer,
        followUpScore: evaluation.score,
        followUpFeedback: JSON.stringify({
          technicalScore: evaluation.technicalScore,
          depthScore: evaluation.depthScore,
          communicationScore: evaluation.communicationScore,
          confidenceScore: evaluation.confidenceScore,
          feedback: evaluation.feedback,
        }),
      },
    });

    res.json({
      message: 'Follow-up evaluated and saved successfully',
      evaluation: {
        score: evaluation.score,
        technicalScore: evaluation.technicalScore,
        depthScore: evaluation.depthScore,
        communicationScore: evaluation.communicationScore,
        confidenceScore: evaluation.confidenceScore,
        feedback: evaluation.feedback,
      },
    });
  } catch (error) {
    console.error('Submit Answer Follow-up Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Submit the entire interactive interview to compile the final aggregate report
const submitInteractiveInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        answers: {
          include: { question: true },
        },
      },
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const answers = interview.answers;
    if (answers.length === 0) {
      return res.status(400).json({ message: 'No answers found for this interview yet' });
    }

    // Compute detailed averages
    let totalScore = 0;
    let totalTech = 0;
    let totalComm = 0;
    let totalConf = 0;
    const count = answers.length;

    answers.forEach((ans) => {
      const originalScore = ans.score || 0;
      const followUpScore = ans.followUpScore || originalScore;
      totalScore += (originalScore + followUpScore) / 2;

      let tech = originalScore;
      let comm = originalScore;
      let conf = originalScore;

      if (ans.followUpFeedback) {
        try {
          const fb = JSON.parse(ans.followUpFeedback);
          tech = fb.technicalScore || tech;
          comm = fb.communicationScore || comm;
          conf = fb.confidenceScore || conf;
        } catch (e) {}
      }
      totalTech += tech;
      totalComm += comm;
      totalConf += conf;
    });

    const avgScore = count > 0 ? Number((totalScore / count).toFixed(2)) : 0.0;
    const avgTech = count > 0 ? Number((totalTech / count).toFixed(2)) : 0.0;
    const avgComm = count > 0 ? Number((totalComm / count).toFixed(2)) : 0.0;
    const avgConf = count > 0 ? Number((totalConf / count).toFixed(2)) : 0.0;

    // Call OpenAI to generate overall aggregated report
    const overallReport = await openaiService.generateOverallReport(
      interview.domain,
      interview.difficulty,
      answers.map((sa) => ({
        score: (sa.score + (sa.followUpScore || sa.score)) / 2,
        feedback: sa.feedback,
      }))
    );

    // Save report in PENDING state
    const existingReport = await prisma.interviewReport.findUnique({
      where: { interviewId },
    });

    const reportData = {
      interviewId,
      aiScore: avgScore,
      strengths: JSON.stringify(overallReport.strengths),
      weaknesses: JSON.stringify(overallReport.weaknesses),
      suggestions: JSON.stringify(overallReport.suggestions),
      summary: overallReport.summary,
      approvalStatus: 'PENDING',
      technicalScore: avgTech,
      communicationScore: avgComm,
      confidenceScore: avgConf,
    };

    let report;
    if (existingReport) {
      report = await prisma.interviewReport.update({
        where: { interviewId },
        data: reportData,
      });
    } else {
      report = await prisma.interviewReport.create({
        data: reportData,
      });
    }

    // Update Interview status to PENDING_REVIEW
    await prisma.interview.update({
      where: { id: interviewId },
      data: { status: 'PENDING_REVIEW' },
    });

    res.status(200).json({
      message: 'Interactive interview submitted successfully. Report is pending admin review.',
      reportId: report.id,
      interviewId,
    });
  } catch (error) {
    console.error('Submit Interactive Interview Error:', error);
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
  submitAnswerQuestion,
  submitAnswerFollowUp,
  submitInteractiveInterview,
};
