const express = require('express');
const router = express.Router();
const problemController = require('../controllers/problemController');
const { protect } = require('../middleware/authMiddleware');

// Specific resource endpoints (Must precede /:id parameter)
router.get('/daily', protect, problemController.getDailyChallenge);
router.get('/bookmarks', protect, problemController.getBookmarkedProblems);
router.get('/leaderboard', protect, problemController.getLeaderboard);
router.get('/heatmap', protect, problemController.getActivityHeatmap);

// General problem endpoints
router.get('/', protect, problemController.getProblems);
router.get('/:id', protect, problemController.getProblemById);
router.post('/:id/bookmark', protect, problemController.toggleBookmark);

module.exports = router;
