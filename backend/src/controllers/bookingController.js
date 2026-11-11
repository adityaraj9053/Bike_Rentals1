import mongoose from 'mongoose';
import { BookingModel } from '../models/Booking.js';
import { BikeModel } from '../models/Bike.js';
import { PaymentTransactionModel } from '../models/PaymentTransaction.js';
import { UserModel } from '../models/User.js';
import { deleteDocumentFromR2, resolveDocumentSignedUrl } from '../services/r2Service.js';

/**
 * Calculate quotation for rental (Single-owner direct model: zero platform fee/commission)
 */
export async function calculateQuote(req, res) {
  try {
    const { dailyPrice = 1500, deposit = 3000, days = 1, deliveryFee = 0 } = req.body;
    const durationDays = Math.max(1, Number(days));
    const rentalSubtotal = Number(dailyPrice) * durationDays;
    const securityDeposit = Number(deposit);
    const delFee = Number(deliveryFee);
    const totalPayable = rentalSubtotal + securityDeposit + delFee;

    return res.status(200).json({
      success: true,
      quote: {
        dailyRate: Number(dailyPrice),
        durationDays,
        rentalSubtotal,
        deliveryFee: delFee,
        securityDeposit,
        totalAmountPaid: totalPayable,
        totalPayable,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to calculate quotation.' });
  }
}

/**
 * Reserve vehicle atomically (ACID double-booking prevention)
 */
export async function createBooking(req, res) {
  try {
    const data = req.body;
    let userId = req.user?.id || req.user?._id;
    const cleanRiderEmail = (data.riderEmail || req.user?.email || '').trim().toLowerCase();
    const cleanRiderName = (data.riderName || req.user?.fullName || 'Rider').trim();
    const cleanRiderPhone = (data.riderPhone || req.user?.phoneNumber || '').trim();

    // If guest or no token, find or create user by riderEmail
    if (!userId && cleanRiderEmail) {
      let user = await UserModel.findOne({ email: cleanRiderEmail });
      if (!user) {
        user = await UserModel.create({
          email: cleanRiderEmail,
          fullName: cleanRiderName,
          phoneNumber: cleanRiderPhone,
          phoneCountryCode: data.countryCode || '+91',
          role: 'RENTER',
        });
      }
      userId = user._id;
    }

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User must be authenticated to create a booking.' });
    }

    // Find requested bike ID
    let targetBikeId = data.bikeId;
    if (!targetBikeId && data.bikeListingCode) {
      const b = await BikeModel.findOne({ listingCode: data.bikeListingCode });
      if (b) targetBikeId = b._id;
    }
    if (!targetBikeId) {
      const b = await BikeModel.findOne({ isBooked: false });
      if (b) targetBikeId = b._id;
    }

    if (!targetBikeId) {
      return res.status(404).json({ success: false, message: 'No available motorcycle found for booking.' });
    }

    // ⚡ Atomic check & lock: find bike if not booked and set isBooked: true
    const lockedBike = await BikeModel.findOneAndUpdate(
      { _id: targetBikeId, isBooked: false },
      {
        isBooked: true,
        currentBookedByUserId: userId,
        currentBookedByEmail: cleanRiderEmail,
      },
      { new: true }
    );

    if (!lockedBike) {
      return res.status(409).json({
        success: false,
        message: 'This motorcycle has just been booked by another rider or is no longer available.',
      });
    }

    const pickupDatetime = data.pickupDate ? new Date(data.pickupDate) : new Date();
    const returnDatetime = data.returnDate ? new Date(data.returnDate) : new Date(Date.now() + 24 * 3600 * 1000);
    const durationDays = Math.max(1, Math.ceil((returnDatetime - pickupDatetime) / (1000 * 60 * 60 * 24)) || 1);

    const dailyRate = lockedBike.dailyPrice || 1500;
    const rentalTotal = dailyRate * durationDays;
    const securityDeposit = lockedBike.securityDeposit || 3000;
    const deliveryFee = data.isDoorstepDelivery ? 300 : 0;
    const totalPayable = rentalTotal + securityDeposit + deliveryFee;

    const bookingCode = `RDE-${Math.floor(100000 + Math.random() * 900000)}`;

    const newBooking = await BookingModel.create({
      bookingCode,
      bikeId: lockedBike._id,
      renterId: userId,
      pickupDatetime,
      returnDatetime,
      durationDays,
      isDoorstepDelivery: Boolean(data.isDoorstepDelivery),
      deliveryAddress: data.deliveryAddress || '',
      riderDetails: {
        fullName: cleanRiderName,
        email: cleanRiderEmail,
        phoneNumber: cleanRiderPhone,
        dateOfBirth: data.riderDob ? new Date(data.riderDob) : undefined,
        documents: data.riderDocuments || undefined,
      },
      riderDocuments: data.riderDocuments || undefined,
      pricing: {
        dailyRate,
        rentalTotal,
        securityDeposit,
        deliveryFee,
        totalPayable,
      },
      bookingStatus: data.bookingStatus || 'CONFIRMED',
      paymentStatus: data.paymentStatus || 'PAID',
      paymentMethod: data.paymentMethod === 'card' ? 'CREDIT_CARD' : (data.paymentMethod || 'UPI'),
      transactionId: data.transactionId || `TXN_${Date.now()}`,
    });

    // Update bike with currentBookingId & email
    lockedBike.currentBookingId = newBooking._id;
    lockedBike.currentBookedByEmail = cleanRiderEmail;
    lockedBike.currentBookedByUserId = userId;
    await lockedBike.save();

    // Log payment transaction
    await PaymentTransactionModel.create({
      bookingId: newBooking._id,
      userId,
      amountInr: totalPayable,
      currency: 'INR',
      gatewayProvider: 'DIRECT_UPI',
      paymentMethod: data.paymentMethod === 'card' ? 'CREDIT_CARD' : 'UPI',
      status: 'SUCCESSFUL',
    }).catch(() => {});

    // Populate bikeId so the frontend immediately receives full motorcycle data
    const populatedBooking = await BookingModel.findById(newBooking._id)
      .populate('bikeId')
      .populate('renterId', 'fullName email phoneNumber drivingLicense')
      .lean();

    return res.status(201).json({
      success: true,
      message: 'Booking reserved and confirmed successfully.',
      booking: populatedBooking || newBooking,
      refId: bookingCode,
    });
  } catch (error) {
    console.error('[Booking createBooking Error]:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create booking.' });
  }
}

/**
 * Get Booking Voucher / Details by ID
 */
export async function getBookingById(req, res) {
  try {
    const { id } = req.params;
    let query = {};
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = id;
    } else {
      query.bookingCode = id;
    }

    const booking = await BookingModel.findOne(query)
      .populate('bikeId')
      .populate('renterId', 'fullName email phoneNumber drivingLicense')
      .lean();

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    return res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error('[Booking getBookingById Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch booking details.' });
  }
}

/**
 * Cancel Booking and release bike
 */
export async function cancelBooking(req, res) {
  try {
    const { id } = req.params;
    let query = {};
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = id;
    } else {
      query.bookingCode = id;
    }

    const booking = await BookingModel.findOne(query);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    booking.bookingStatus = 'CANCELLED';
    await booking.save();

    // Atomically release the vehicle
    await BikeModel.findOneAndUpdate(
      { _id: booking.bikeId, currentBookingId: booking._id },
      {
        isBooked: false,
        currentBookingId: null,
        currentBookedByUserId: null,
        currentBookedByEmail: null,
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled and vehicle restored to available fleet.',
      data: booking,
    });
  } catch (error) {
    console.error('[Booking cancelBooking Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel booking.' });
  }
}

/**
 * Get all Bookings
 */
export async function getAllBookings(req, res) {
  try {
    const filter = {};
    const isOwner = req.user?.role === 'OWNER';
    const currentUserId = req.user?._id || req.user?.id;

    if (!isOwner && currentUserId) {
      filter.renterId = currentUserId;
    }

    const bookings = await BookingModel.find(filter)
      .populate('bikeId')
      .populate('renterId', 'fullName email phoneNumber drivingLicense')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    console.error('[Booking getAllBookings Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch bookings.' });
  }
}

/**
 * Update Booking Status
 */
export async function updateBookingStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const booking = await BookingModel.findByIdAndUpdate(
      id,
      { bookingStatus: status, ...(remarks ? { remarks } : {}) },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (status === 'COMPLETED' || status === 'CANCELLED') {
      await BikeModel.findOneAndUpdate(
        { _id: booking.bikeId, currentBookingId: booking._id },
        { isBooked: false, currentBookingId: null, currentBookedByUserId: null, currentBookedByEmail: null }
      );
    }

    return res.status(200).json({ success: true, message: 'Booking status updated.', data: booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update booking status.' });
  }
}

/**
 * Automated Data Cleanup:
 * 1. Checks all bookings where returnDatetime <= now or bookingStatus is COMPLETED.
 * 2. If returnDatetime has passed:
 *    - Updates bookingStatus to COMPLETED
 *    - Releases bike (isBooked: false, currentBookingId: null, currentBookedByUserId: null)
 *    - Automatically deletes user's submitted documents from storage (R2) and marks documentsCleanedUp: true
 * 3. Keeps bike in user's booking history, while stripping access to sensitive documents.
 */
export async function cleanupExpiredBookings() {
  try {
    const now = new Date();
    const expiredActiveBookings = await BookingModel.find({
      returnDatetime: { $lte: now },
      bookingStatus: { $in: ['CONFIRMED', 'ACTIVE', 'PENDING'] },
    });

    for (const booking of expiredActiveBookings) {
      booking.bookingStatus = 'COMPLETED';
      booking.actualReturnedAt = booking.actualReturnedAt || now;

      // Release bike atomically
      if (booking.bikeId) {
        await BikeModel.findOneAndUpdate(
          { _id: booking.bikeId, currentBookingId: booking._id },
          { isBooked: false, currentBookingId: null, currentBookedByUserId: null, currentBookedByEmail: null }
        ).catch(() => {});
      }

      // Auto-Deletion of submitted documents from Cloudflare R2 storage
      const docsToClean = [
        booking.riderDocuments?.aadhaar?.key,
        booking.riderDocuments?.drivingLicence?.key,
        booking.riderDetails?.documents?.aadhaar?.key,
        booking.riderDetails?.documents?.drivingLicence?.key,
      ].filter(Boolean);

      for (const docKey of docsToClean) {
        try {
          await deleteDocumentFromR2(docKey);
        } catch (e) {
          // ignore error if already removed or test key
        }
      }

      // Clear submitted documents from booking record
      booking.riderDocuments = null;
      if (booking.riderDetails) {
        booking.riderDetails.documents = null;
      }
      booking.documentsCleanedUp = true;
      booking.documentsCleanedUpAt = now;

      await booking.save();
    }

    return expiredActiveBookings.length;
  } catch (err) {
    console.error('[cleanupExpiredBookings Error]:', err.message);
    return 0;
  }
}

/**
 * Owner Dashboard - Buyer's Detail & Rental Timelines:
 * - Only active/unreturned bookings whose return date and time has NOT passed.
 * - Auto-Removal: Once bike is returned or return date/time has passed, it is automatically removed from this dashboard!
 */
export async function getOwnerDashboardBookings(req, res) {
  try {
    await cleanupExpiredBookings();

    const now = new Date();
    // Owner only sees active bookings whose return date has not passed
    const activeBookings = await BookingModel.find({
      returnDatetime: { $gt: now },
      bookingStatus: { $in: ['CONFIRMED', 'ACTIVE'] },
    })
      .populate('bikeId')
      .populate('renterId', 'fullName email phoneNumber avatarUrl')
      .sort({ returnDatetime: 1 })
      .lean();

    // Resolve live Cloudflare R2 signed URLs for user documents for Owner verification
    const resolvedBookings = await Promise.all(
      activeBookings.map(async (b) => {
        const rawUserDocs = b.riderDocuments || b.riderDetails?.documents || {};
        const aadhaarDoc = rawUserDocs.aadhaar;
        const dlDoc = rawUserDocs.drivingLicence;
        const renterId = b.renterId?._id || b.renterId;

        const resolvedAadhaar = aadhaarDoc ? {
          ...aadhaarDoc,
          signedUrl: (await resolveDocumentSignedUrl(aadhaarDoc.signedUrl || aadhaarDoc.key || aadhaarDoc.fileUrl || aadhaarDoc.fileName, renterId, 'aadhaar')) || aadhaarDoc.signedUrl || aadhaarDoc.fileUrl,
        } : null;

        const resolvedDl = dlDoc ? {
          ...dlDoc,
          signedUrl: (await resolveDocumentSignedUrl(dlDoc.signedUrl || dlDoc.key || dlDoc.fileUrl || dlDoc.fileName, renterId, 'driving-licence')) || dlDoc.signedUrl || dlDoc.fileUrl,
        } : null;

        return {
          ...b,
          riderDocuments: {
            aadhaar: resolvedAadhaar,
            drivingLicence: resolvedDl,
          },
          riderDetails: {
            ...(b.riderDetails || {}),
            documents: {
              aadhaar: resolvedAadhaar,
              drivingLicence: resolvedDl,
            },
          },
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: resolvedBookings.length,
      data: resolvedBookings,
      serverTime: now.toISOString(),
    });
  } catch (error) {
    console.error('[getOwnerDashboardBookings Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch owner dashboard data.' });
  }
}

/**
 * User's "My Bookings" View:
 * - Shows all bikes user has rented/booked.
 * - Auto-Deletion: Automatically deletes/removes the bike's official documents (RC, PUC)
 *   from user's view and storage after the return date and time has passed.
 * - The bikes themselves continue to show there!
 */
export async function getUserBookings(req, res) {
  try {
    await cleanupExpiredBookings();

    const now = new Date();
    const currentUserId = req.user?.id || req.user?._id || req.query.userId;
    const currentUserEmail = (
      req.user?.email ||
      req.query.email ||
      req.headers['x-user-email'] ||
      ''
    ).trim().toLowerCase();

    const conditions = [];

    // 1. Match by renterId
    if (currentUserId) {
      conditions.push({ renterId: currentUserId });
      if (mongoose.Types.ObjectId.isValid(currentUserId)) {
        conditions.push({ renterId: new mongoose.Types.ObjectId(currentUserId) });
      }
    }

    // 2. Match by riderDetails.email (case-insensitive regex)
    if (currentUserEmail) {
      const emailRegex = new RegExp(`^${currentUserEmail.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i');
      conditions.push({ 'riderDetails.email': emailRegex });

      // Find any UserModel IDs associated with this email and match renterId
      try {
        const matchingUsers = await UserModel.find({ email: emailRegex }).select('_id').lean();
        if (matchingUsers && matchingUsers.length > 0) {
          const userIds = matchingUsers.map((u) => u._id);
          conditions.push({ renterId: { $in: userIds } });
        }
      } catch (err) {}

      // Find any bikes currently marked with this booked email or userId
      try {
        const bikeConditions = [{ currentBookedByEmail: emailRegex }];
        if (currentUserId) {
          bikeConditions.push({ currentBookedByUserId: currentUserId });
          if (mongoose.Types.ObjectId.isValid(currentUserId)) {
            bikeConditions.push({ currentBookedByUserId: new mongoose.Types.ObjectId(currentUserId) });
          }
        }

        const bookedBikes = await BikeModel.find({
          $or: bikeConditions,
          isBooked: true,
          currentBookingId: { $ne: null },
        })
          .select('currentBookingId')
          .lean();

        const bikeBookingIds = bookedBikes
          .map((b) => b.currentBookingId)
          .filter((id) => id && mongoose.Types.ObjectId.isValid(id));

        if (bikeBookingIds.length > 0) {
          conditions.push({ _id: { $in: bikeBookingIds } });
        }
      } catch (err) {}
    }

    if (conditions.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [], serverTime: now.toISOString() });
    }

    const bookings = await BookingModel.find({ $or: conditions })
      .populate('bikeId')
      .populate('renterId', 'fullName email phoneNumber drivingLicense')
      .sort({ createdAt: -1 })
      .lean();

    // Map each booking to enforce Auto-Deletion of bike documents after returnDatetime
    const processedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const returnTime = new Date(booking.returnDatetime).getTime();
        const hasPassed = isNaN(returnTime) ? false : now.getTime() >= returnTime;
        const isCompletedOrCancelled = booking.bookingStatus === 'COMPLETED' || booking.bookingStatus === 'CANCELLED';
        const isExpired = hasPassed || isCompletedOrCancelled;

        const bike = booking.bikeId || {};

        if (isExpired) {
          // AUTO-DELETION APPLIED:
          // Bike continues to show, but official documents (RC, PUC, Insurance) are removed from user's view!
          return {
            ...booking,
            isExpired: true,
            documentsDeleted: true,
            documentsPurgedAt: booking.documentsCleanedUpAt || booking.returnDatetime,
            bikeDocuments: null, // Removed from user's view!
            bike: {
              ...bike,
              documents: null, // Sanitized
            },
          };
        }

        // Active rental: User can view the bike's official compliance documents (RC, PUC, Insurance)
        const rawDocs = bike.documents || {};
        const reg = bike.registrationNumber || bike._id;
        const resolvedDocs = {
          ...rawDocs,
          rcSmartCardUrl: (await resolveDocumentSignedUrl(rawDocs.rcSmartCardUrl, reg, 'rc')) || rawDocs.rcSmartCardUrl,
          insurancePolicyUrl: (await resolveDocumentSignedUrl(rawDocs.insurancePolicyUrl, reg, 'insurance')) || rawDocs.insurancePolicyUrl,
          pucCertificateUrl: (await resolveDocumentSignedUrl(rawDocs.pucCertificateUrl, reg, 'puc')) || rawDocs.pucCertificateUrl,
          rcDirectUrl: `/api/documents/file/${encodeURIComponent(reg)}/rc`,
          insuranceDirectUrl: `/api/documents/file/${encodeURIComponent(reg)}/insurance`,
          pucDirectUrl: `/api/documents/file/${encodeURIComponent(reg)}/puc`,
        };

        return {
          ...booking,
          isExpired: false,
          documentsDeleted: false,
          bikeDocuments: resolvedDocs,
          bike: {
            ...bike,
            documents: resolvedDocs,
          },
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: processedBookings.length,
      data: processedBookings,
      serverTime: now.toISOString(),
    });
  } catch (error) {
    console.error('[getUserBookings Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user bookings.' });
  }
}

/**
 * Mark Bike as Returned (Early Return or Checkout by Owner)
 */
export async function markBookingReturned(req, res) {
  try {
    const { id } = req.params;
    let query = {};
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = id;
    } else {
      query.bookingCode = id;
    }

    const booking = await BookingModel.findOne(query);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const now = new Date();
    booking.bookingStatus = 'COMPLETED';
    booking.actualReturnedAt = now;

    // Release vehicle
    await BikeModel.findOneAndUpdate(
      { _id: booking.bikeId, currentBookingId: booking._id },
      { isBooked: false, currentBookingId: null, currentBookedByUserId: null, currentBookedByEmail: null }
    );

    // Delete user submitted documents from R2 storage
    const docsToClean = [
      booking.riderDocuments?.aadhaar?.key,
      booking.riderDocuments?.drivingLicence?.key,
      booking.riderDetails?.documents?.aadhaar?.key,
      booking.riderDetails?.documents?.drivingLicence?.key,
    ].filter(Boolean);

    for (const key of docsToClean) {
      try {
        await deleteDocumentFromR2(key);
      } catch (e) {}
    }

    booking.riderDocuments = null;
    if (booking.riderDetails) {
      booking.riderDetails.documents = null;
    }
    booking.documentsCleanedUp = true;
    booking.documentsCleanedUpAt = now;

    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Bike marked as returned successfully. User booking details and documents automatically cleaned up and removed from active owner dashboard.',
      data: booking,
    });
  } catch (error) {
    console.error('[markBookingReturned Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark bike as returned.' });
  }
}

/**
 * Explicit trigger for automated data cleanup
 */
export async function triggerCleanup(req, res) {
  try {
    const count = await cleanupExpiredBookings();
    return res.status(200).json({
      success: true,
      message: `Automated cleanup completed. Processed and cleaned ${count} expired bookings.`,
      cleanedCount: count,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Cleanup failed.' });
  }
}
