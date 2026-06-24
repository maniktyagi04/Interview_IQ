const express = require('express');
const router = express.Router();
const problemController = require('../controllers/problemController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, problemController.getProblems);
router.get('/:id', protect, problemController.getProblemById);

module.exports = router;
