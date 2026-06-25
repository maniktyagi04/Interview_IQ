const express = require('express');
const router = express.Router();
const contestController = require('../controllers/contestController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, contestController.getContests);
router.get('/:id', protect, contestController.getContestById);
router.post('/:id/register', protect, contestController.registerForContest);
router.get('/:id/leaderboard', protect, contestController.getContestLeaderboard);

module.exports = router;
