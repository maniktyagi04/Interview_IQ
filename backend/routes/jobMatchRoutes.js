const express = require('express');
const router = express.Router();
const jobMatchController = require('../controllers/jobMatchController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, upload.single('resume'), jobMatchController.analyzeMatch);
router.get('/', protect, jobMatchController.getMyAnalyses);
router.delete('/:id', protect, jobMatchController.deleteAnalysis);

module.exports = router;
