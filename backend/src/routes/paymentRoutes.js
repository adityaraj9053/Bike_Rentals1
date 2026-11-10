import { Router } from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/payment/create-order
router.post('/create-order', optionalAuth, createOrder);

// POST /api/payment/verify
router.post('/verify', optionalAuth, verifyPayment);

export default router;

