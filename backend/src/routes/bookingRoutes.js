import { Router } from 'express';
import {
  calculateQuote,
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getOwnerDashboardBookings,
  getUserBookings,
  markBookingReturned,
  triggerCleanup,
} from '../controllers/bookingController.js';
import { optionalAuth, verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/quote', calculateQuote);
router.post('/reserve', optionalAuth, createBooking);
router.post('/cleanup', triggerCleanup);
router.get('/owner-dashboard', optionalAuth, getOwnerDashboardBookings);
router.get('/my-bookings', optionalAuth, getUserBookings);
router.post('/:id/return', optionalAuth, markBookingReturned);
router.post('/', optionalAuth, createBooking);
router.get('/', optionalAuth, getAllBookings);
router.get('/:id', optionalAuth, getBookingById);
router.post('/:id/cancel', optionalAuth, cancelBooking);
router.patch('/:id/status', optionalAuth, updateBookingStatus);

export default router;
