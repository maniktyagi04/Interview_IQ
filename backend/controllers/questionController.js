const prisma = require('../prisma/client');

// Get all questions (filtered by domain and difficulty)
const getQuestions = async (req, res) => {
  try {
    const { domain, difficulty } = req.query;

    const where = {};
    if (domain) {
      where.domain = domain;
    }
    if (difficulty) {
      where.difficulty = difficulty;
    }

    const questions = await prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(questions);
  } catch (error) {
    console.error('Get Questions Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get single question
const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json(question);
  } catch (error) {
    console.error('Get Question By Id Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Create question (Admin only)
const createQuestion = async (req, res) => {
  try {
    const { title, description, domain, difficulty } = req.body;

    if (!title || !description || !domain || !difficulty) {
      return res.status(400).json({ message: 'Please provide title, description, domain and difficulty' });
    }

    const question = await prisma.question.create({
      data: {
        title,
        description,
        domain,
        difficulty,
        createdBy: req.user.id,
      },
    });

    res.status(201).json({
      message: 'Question created successfully',
      question,
    });
  } catch (error) {
    console.error('Create Question Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update question (Admin only)
const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, domain, difficulty } = req.body;

    const existingQuestion = await prisma.question.findUnique({
      where: { id },
    });

    if (!existingQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const question = await prisma.question.update({
      where: { id },
      data: {
        title: title || existingQuestion.title,
        description: description || existingQuestion.description,
        domain: domain || existingQuestion.domain,
        difficulty: difficulty || existingQuestion.difficulty,
      },
    });

    res.json({
      message: 'Question updated successfully',
      question,
    });
  } catch (error) {
    console.error('Update Question Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Delete question (Admin only)
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const existingQuestion = await prisma.question.findUnique({
      where: { id },
    });

    if (!existingQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }

    await prisma.question.delete({
      where: { id },
    });

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete Question Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};
