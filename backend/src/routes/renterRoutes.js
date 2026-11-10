import { Router } from 'express';
import { getAllRenters, submitRenterKYC, updateRenterStatus } from '../controllers/renterController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, getAllRenters);
router.post('/kyc', optionalAuth, submitRenterKYC);
router.patch('/:id/status', optionalAuth, updateRenterStatus);

export default router;

