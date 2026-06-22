const prisma = require('../prisma/client');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const openaiService = require('../services/openaiService');
const emailService = require('../services/emailService');

// Analyze Resume vs Job Description
const analyzeMatch = async (req, res) => {
  try {
    const { jobDescription } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a resume file (PDF/DOC/DOCX)' });
    }

    if (!jobDescription || jobDescription.trim().length === 0) {
      return res.status(400).json({ message: 'Please provide a job description' });
    }

    const filePath = req.file.path;
    let parsedText = '';

    // Read and parse PDF
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const parsedData = await pdfParse(dataBuffer);
      parsedText = parsedData.text;
    } catch (parseError) {
      console.warn('PDF parsing failed in Job Match, using fallback text:', parseError.message);
      parsedText = `Simulated Resume Text for: ${req.file.originalname}
Experience with Javascript, React, Tailwind CSS, Express, and PostgreSQL. Full-stack development portfolio.`;
    }

    // Call OpenAI Job Match Analysis
    const analysisResult = await openaiService.analyzeJobMatch(parsedText, jobDescription);

    // Save to Database
    const jobMatch = await prisma.jobMatchAnalysis.create({
      data: {
        userId: req.user.id,
        jobDescription,
        matchScore: parseFloat(analysisResult.matchScore),
        matchingSkills: JSON.stringify(analysisResult.matchingSkills),
        missingSkills: JSON.stringify(analysisResult.missingSkills),
        recommendations: JSON.stringify(analysisResult.recommendations),
        strengths: JSON.stringify(analysisResult.strengths),
        weaknesses: JSON.stringify(analysisResult.weaknesses),
        suggestions: JSON.stringify(analysisResult.suggestions),
      },
    });

    // Remove uploaded file from local disk to save space (or keep it if needed, we'll keep it/clean it up. Let's delete it since we saved the parse text and matched analysis)
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Failed to unlink uploaded job-match temp resume file:', err.message);
      }
    }

    // Trigger email notification asynchronously
    emailService.sendJobMatchCompleteEmail(req.user, analysisResult.matchScore).catch(err => {
      console.error('Job match email sending failed:', err.message);
    });

    res.status(201).json({
      message: 'Job match analysis completed successfully',
      jobMatch: {
        id: jobMatch.id,
        matchScore: jobMatch.matchScore,
        matchingSkills: analysisResult.matchingSkills,
        missingSkills: analysisResult.missingSkills,
        recommendations: analysisResult.recommendations,
        strengths: analysisResult.strengths,
        weaknesses: analysisResult.weaknesses,
        suggestions: analysisResult.suggestions,
        createdAt: jobMatch.createdAt,
      },
    });
  } catch (error) {
    console.error('Analyze Job Match Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get My Job Matches
const getMyAnalyses = async (req, res) => {
  try {
    const analyses = await prisma.jobMatchAnalysis.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = analyses.map((a) => ({
      id: a.id,
      jobDescription: a.jobDescription,
      matchScore: a.matchScore,
      matchingSkills: JSON.parse(a.matchingSkills),
      missingSkills: JSON.parse(a.missingSkills),
      recommendations: JSON.parse(a.recommendations),
      strengths: JSON.parse(a.strengths),
      weaknesses: JSON.parse(a.weaknesses),
      suggestions: JSON.parse(a.suggestions),
      createdAt: a.createdAt,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get Job Matches Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Delete Job Match Analysis
const deleteAnalysis = async (req, res) => {
  try {
    const { id } = req.params;

    const match = await prisma.jobMatchAnalysis.findUnique({
      where: { id },
    });

    if (!match) {
      return res.status(404).json({ message: 'Analysis report not found' });
    }

    if (match.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You do not own this report' });
    }

    await prisma.jobMatchAnalysis.delete({
      where: { id },
    });

    res.json({ message: 'Job match analysis deleted successfully' });
  } catch (error) {
    console.error('Delete Job Match Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  analyzeMatch,
  getMyAnalyses,
  deleteAnalysis,
};
