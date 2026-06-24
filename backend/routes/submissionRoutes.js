const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, submissionController.createSubmission);
router.get('/user', protect, submissionController.getUserSubmissions);

module.exports = router;
