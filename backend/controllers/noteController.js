const prisma = require('../prisma/client');

// Get all notes with search filter
const getNotes = async (req, res) => {
  try {
    const { search } = req.query;
    const userId = req.user.id;

    const where = { userId };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    res.json(notes);
  } catch (error) {
    console.error('Get Notes Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get single note
const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await prisma.note.findUnique({
      where: { id },
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You do not own this note' });
    }

    res.json(note);
  } catch (error) {
    console.error('Get Note By Id Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Create note
const createNote = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const note = await prisma.note.create({
      data: {
        title,
        content,
        userId: req.user.id,
      },
    });

    res.status(201).json({
      message: 'Note created successfully',
      note,
    });
  } catch (error) {
    console.error('Create Note Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update note
const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const note = await prisma.note.findUnique({
      where: { id },
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You do not own this note' });
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        title: title || note.title,
        content: content || note.content,
      },
    });

    res.json({
      message: 'Note updated successfully',
      note: updatedNote,
    });
  } catch (error) {
    console.error('Update Note Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Delete note
const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await prisma.note.findUnique({
      where: { id },
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: You do not own this note' });
    }

    await prisma.note.delete({
      where: { id },
    });

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete Note Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
};
