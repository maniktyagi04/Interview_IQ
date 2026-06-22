const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

router.get('/', protect, questionController.getQuestions);
router.get('/:id', protect, questionController.getQuestionById);

// Admin-only question modifications
router.post('/', protect, requireRole('ADMIN'), questionController.createQuestion);
router.put('/:id', protect, requireRole('ADMIN'), questionController.updateQuestion);
router.delete('/:id', protect, requireRole('ADMIN'), questionController.deleteQuestion);

module.exports = router;
