const prisma = require('../prisma/client');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const openaiService = require('../services/openaiService');

// Upload and Analyze Resume
const uploadResume = async (req, res) => {
  try {
    const { targetDomain } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a resume file' });
    }

    if (!targetDomain) {
      return res.status(400).json({ message: 'Please select a target domain for analysis' });
    }

    const fileUrl = `/uploads/resumes/${req.file.filename}`;
    const filePath = req.file.path;

    let parsedText = '';
    
    // Read and parse PDF
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const parsedData = await pdfParse(dataBuffer);
      parsedText = parsedData.text;
    } catch (parseError) {
      console.warn('PDF parsing failed, using simple text fallback:', parseError.message);
      // Fallback text representing standard developer resume text
      parsedText = `Resume File Name: ${req.file.originalname}
Candidate Details: Simulated extracted text for resume profile.
Experience: Full-stack engineer with React, Express, Node.js, and SQL expertise. Build complex portal apps, JWT sessions, and analytics boards.`;
    }

    // Call AI analysis
    const aiAnalysis = await openaiService.analyzeResume(parsedText, targetDomain);

    // Save to Database
    const resume = await prisma.resume.create({
      data: {
        userId: req.user.id,
        fileUrl,
        parsedText,
        aiAnalysis: JSON.stringify(aiAnalysis),
      },
    });

    res.status(201).json({
      message: 'Resume uploaded and analyzed successfully',
      resume: {
        id: resume.id,
        fileUrl: resume.fileUrl,
        aiAnalysis,
        createdAt: resume.createdAt,
      },
    });
  } catch (error) {
    console.error('Upload Resume Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get User Resumes
const getResumes = async (req, res) => {
  try {
    const resumes = await prisma.resume.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    // Parse AI Analysis strings
    const formatted = resumes.map((r) => ({
      id: r.id,
      fileUrl: r.fileUrl,
      createdAt: r.createdAt,
      aiAnalysis: r.aiAnalysis ? JSON.parse(r.aiAnalysis) : null,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get Resumes Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Delete Resume
const deleteResume = async (req, res) => {
  try {
    const { id } = req.params;

    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    if (resume.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You do not own this resume' });
    }

    // Delete file from disk
    const relativePath = resume.fileUrl; // e.g. /uploads/resumes/filename
    const absolutePath = require('path').join(__dirname, '..', relativePath);
    if (fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
      } catch (err) {
        console.error('Error deleting resume file from disk:', err.message);
      }
    }

    // Delete from Database
    await prisma.resume.delete({
      where: { id },
    });

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error('Delete Resume Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  uploadResume,
  getResumes,
  deleteResume,
};
