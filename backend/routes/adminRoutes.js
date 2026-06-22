const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

// Lock down all admin routes under ADMIN role
router.use(protect, requireRole('ADMIN'));

router.get('/stats', adminController.getPlatformStats);
router.get('/users', adminController.getUsers);
router.get('/users/:id/activity', adminController.getUserActivity);
router.post('/users/:id/block', adminController.blockUser);
router.post('/users/:id/unblock', adminController.unblockUser);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
