import { Router } from 'express';
import { submitEnquiry, getAllTickets, getAllDisputes, createDispute, updateDisputeStatus } from '../controllers/supportController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/enquiries', optionalAuth, submitEnquiry);
router.get('/tickets', optionalAuth, getAllTickets);
router.get('/disputes', optionalAuth, getAllDisputes);
router.post('/disputes', optionalAuth, createDispute);
router.patch('/disputes/:id', optionalAuth, updateDisputeStatus);

export default router;

