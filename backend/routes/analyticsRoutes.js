const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/progress', protect, analyticsController.getProgressAnalytics);
router.get('/coding', protect, analyticsController.getCodingAnalytics);

module.exports = router;
