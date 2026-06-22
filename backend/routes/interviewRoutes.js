const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

// Mock attempt routes
router.post('/generate', protect, interviewController.generateMockInterview);
router.post('/submit', protect, interviewController.submitAnswers);
router.get('/reports', protect, interviewController.getUserReports);
router.get('/reports/detail/:id', protect, interviewController.getReportById);

// Admin-only queues and controls
router.get('/pending-reviews', protect, requireRole('ADMIN'), interviewController.getPendingReviews);
router.post('/reports/:interviewId/approve', protect, requireRole('ADMIN'), interviewController.approveReport);
router.post('/reports/:interviewId/reject', protect, requireRole('ADMIN'), interviewController.rejectReport);

module.exports = router;
