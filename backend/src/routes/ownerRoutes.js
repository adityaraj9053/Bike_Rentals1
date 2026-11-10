import { Router } from 'express';
import {
  getBusinessSettings,
  updateBusinessSettings,
  createOwnerBike,
  updateOwnerBike,
  deleteOwnerBike,
} from '../controllers/ownerController.js';
import { optionalAuth, verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Fleet Management (Owner Only)
router.get('/settings', optionalAuth, getBusinessSettings);
router.put('/settings', optionalAuth, updateBusinessSettings);
router.post('/bikes', optionalAuth, createOwnerBike);
router.put('/bikes/:id', optionalAuth, updateOwnerBike);
router.patch('/bikes/:id', optionalAuth, updateOwnerBike);
router.delete('/bikes/:id', optionalAuth, deleteOwnerBike);

export default router;
