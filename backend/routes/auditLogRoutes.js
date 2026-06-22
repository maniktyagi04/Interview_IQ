const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/rbacMiddleware');

router.get('/', protect, requireRole('ADMIN'), auditLogController.getAuditLogs);

module.exports = router;
