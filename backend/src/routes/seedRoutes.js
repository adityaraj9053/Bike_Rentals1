import { Router } from 'express';
import { seedInitialData } from '../controllers/seedController.js';

const router = Router();

router.post('/', seedInitialData);
router.get('/', seedInitialData);

export default router;

