import { Router } from 'express';
import { sendOtp, verifyOtp, googleAuth, getMe, checkUser, getUserById } from '../controllers/authController.js';
import { verifyToken, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/email-otp/send', sendOtp);
router.post('/email-otp/verify', verifyOtp);
router.post('/google', googleAuth);
router.get('/check-user', checkUser);
router.get('/user/:id', optionalAuth, getUserById);
router.get('/me', verifyToken, getMe);

export default router;

