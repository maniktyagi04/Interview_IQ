const prisma = require('../prisma/client');

/**
 * Log an administrative action to the database.
 * 
 * @param {string} adminId - The ID of the admin performing the action.
 * @param {string} action - The action identifier (e.g. QUESTION_CREATED, USER_BLOCKED).
 * @param {string} entityType - The database model name / entity type (e.g. User, Question, InterviewReport).
 * @param {string|null} entityId - The specific record ID affected.
 * @param {string} description - Human-readable detail of what occurred.
 */
async function logAction(adminId, action, entityType, entityId, description) {
  try {
    if (!adminId) {
      console.warn('Audit Log warning: No adminId provided to logAction.');
      return null;
    }

    const log = await prisma.adminAuditLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId: entityId || null,
        description,
      },
    });

    console.log(`[AUDIT LOG] ${action} by Admin ${adminId} on ${entityType} ${entityId || ''}: ${description}`);
    return log;
  } catch (error) {
    console.error('Failed to write AdminAuditLog:', error.message);
    return null;
  }
}

module.exports = {
  logAction,
};
