import { Router } from 'express';
import {
  getAdminKPIs,
  getAuditLogs,
  recordAuditLog,
  getSettings,
  updateSetting,
  getNotifications,
  markNotificationRead,
  getTransactions,
} from '../controllers/adminController.js';
import { optionalAuth, verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/kpis', optionalAuth, getAdminKPIs);
router.get('/audit-logs', optionalAuth, getAuditLogs);
router.post('/audit-logs', optionalAuth, recordAuditLog);
router.get('/settings', optionalAuth, getSettings);
router.put('/settings', optionalAuth, updateSetting);
router.get('/notifications', optionalAuth, getNotifications);
router.patch('/notifications/:id/read', optionalAuth, markNotificationRead);
router.get('/transactions', optionalAuth, getTransactions);

export default router;

