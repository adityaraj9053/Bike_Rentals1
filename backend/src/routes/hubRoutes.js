import { Router } from 'express';
import { getAllHubs, createHub } from '../controllers/hubController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllHubs);
router.post('/', optionalAuth, createHub);

export default router;

