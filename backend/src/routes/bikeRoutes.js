import { Router } from 'express';
import { getAllBikes, getBikeById, createBikeListing, updateBike, deleteBike } from '../controllers/bikeController.js';
import { optionalAuth, verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, getAllBikes);
router.get('/:id', optionalAuth, getBikeById);
router.post('/', optionalAuth, createBikeListing);
router.put('/:id', optionalAuth, updateBike);
router.patch('/:id', optionalAuth, updateBike);
router.delete('/:id', optionalAuth, deleteBike);

export default router;

