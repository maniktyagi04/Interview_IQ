const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, submissionController.createSubmission);
router.get('/user', protect, submissionController.getUserSubmissions);
router.get('/:id/report', protect, submissionController.getSubmissionReport);

module.exports = router;
