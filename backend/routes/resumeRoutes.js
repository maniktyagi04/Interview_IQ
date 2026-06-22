const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/upload', protect, upload.single('resume'), resumeController.uploadResume);
router.get('/', protect, resumeController.getResumes);
router.delete('/:id', protect, resumeController.deleteResume);

module.exports = router;
