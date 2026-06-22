const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.post('/profile/avatar', protect, upload.single('profileImage'), userController.uploadAvatar);
router.get('/stats', protect, userController.getUserStats);

module.exports = router;
