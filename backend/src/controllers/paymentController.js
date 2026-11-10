import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { BookingModel } from '../models/Booking.js';
import { BikeModel } from '../models/Bike.js';
import { PaymentTransactionModel } from '../models/PaymentTransaction.js';
import { UserModel } from '../models/User.js';

/**
 * Helper to initialize Razorpay SDK with environment variables
 */
const getRazorpayInstance = () => {
  const key_id = (process.env.RAZORPAY_KEY_ID || '').trim();
  const key_secret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials (RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET) are missing in environment variables.');
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
};

/**
 * POST /api/payment/create-order
 * Creates a Razorpay order from reservation amount in INR (converts to paise).
 */
export async function createOrder(req, res) {
  try {
    const { amount, currency = 'INR', bookingId, receipt, notes = {} } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid reservation amount in INR is required.',
      });
    }

    const razorpay = getRazorpayInstance();

    // Convert INR to Paise (1 INR = 100 paise)
    const amountInPaise = Math.round(Number(amount) * 100);

    const options = {
      amount: amountInPaise,
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: {
        ...notes,
        ...(bookingId ? { bookingId: String(bookingId) } : {}),
      },
    };

    const order = await razorpay.orders.create(options);

    // If an existing bookingId was supplied, record initial payment transaction
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected && bookingId && mongoose.Types.ObjectId.isValid(bookingId)) {
      await PaymentTransactionModel.create({
        bookingId,
        userId: req.user?.id || req.user?._id || new mongoose.Types.ObjectId(),
        amountInr: Number(amount),
        currency: currency || 'INR',
        gatewayProvider: 'RAZORPAY',
        gatewayOrderId: order.id,
        status: 'INITIATED',
      }).catch((err) => {
        console.warn('[Payment] Could not create initial transaction log:', err.message);
      });
    }

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: (process.env.RAZORPAY_KEY_ID || '').trim(),
      order,
    });
  } catch (error) {
    console.error('[Razorpay createOrder Error]:', error);
    return res.status(500).json({
      success: false,
      message: error?.error?.description || error?.description || error?.message || 'Failed to create Razorpay order.',
    });
  }
}

/**
 * POST /api/payment/verify
 * Verifies Razorpay payment signature using HMAC SHA256 and marks reservation as confirmed/paid.
 */
export async function verifyPayment(req, res) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
      bookingData,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification details: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.',
      });
    }

    const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
    if (!keySecret) {
      return res.status(500).json({
        success: false,
        message: 'RAZORPAY_KEY_SECRET is not configured on the server.',
      });
    }

    // Verify HMAC SHA256 signature: hmac_sha256(order_id + "|" + payment_id, secret)
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isAuthentic = generatedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.warn(`[Payment Verification Failed] Expected: ${generatedSignature}, Received: ${razorpay_signature}`);
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Signature mismatch. Transaction cannot be validated.',
      });
    }

    // Once verified, mark reservation as confirmed and paid
    let updatedBooking = null;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      // 1. Check by bookingId / bookingCode
      if (bookingId) {
        if (mongoose.Types.ObjectId.isValid(bookingId)) {
          updatedBooking = await BookingModel.findById(bookingId);
        }
        if (!updatedBooking) {
          updatedBooking = await BookingModel.findOne({ bookingCode: bookingId });
        }
      }

      // 2. Check by gatewayOrderId from previous transaction log
      if (!updatedBooking) {
        const existingTxn = await PaymentTransactionModel.findOne({ gatewayOrderId: razorpay_order_id });
        if (existingTxn?.bookingId) {
          updatedBooking = await BookingModel.findById(existingTxn.bookingId);
        }
      }

      // 3. Update existing reservation
      if (updatedBooking) {
        updatedBooking.bookingStatus = 'CONFIRMED';
        updatedBooking.paymentStatus = 'PAID';
        updatedBooking.transactionId = razorpay_payment_id;
        updatedBooking.paymentMethod = 'UPI';
        if (bookingData?.riderDocuments) {
          updatedBooking.riderDocuments = bookingData.riderDocuments;
          if (updatedBooking.riderDetails) {
            updatedBooking.riderDetails.documents = bookingData.riderDocuments;
          }
        }
        await updatedBooking.save();

        // Ensure bike is marked booked
        if (updatedBooking.bikeId) {
          await BikeModel.findByIdAndUpdate(updatedBooking.bikeId, {
            isBooked: true,
            currentBookedByUserId: updatedBooking.renterId,
            currentBookingId: updatedBooking._id,
          });
        }
      } else if (bookingData) {
        // 4. If booking didn't exist prior to payment, create and confirm it now
        let userId = req.user?.id || req.user?._id;
        if (!userId && bookingData.riderEmail) {
          let user = await UserModel.findOne({ email: bookingData.riderEmail.toLowerCase() });
          if (!user) {
            user = await UserModel.create({
              email: bookingData.riderEmail.toLowerCase(),
              fullName: bookingData.riderName || 'Rider',
              phoneNumber: bookingData.riderPhone || '',
              phoneCountryCode: bookingData.countryCode || '+91',
              role: 'RENTER',
            });
          }
          userId = user._id;
        }

        let bike = null;
        if (bookingData.bikeId && mongoose.Types.ObjectId.isValid(bookingData.bikeId)) {
          bike = await BikeModel.findById(bookingData.bikeId);
        }
        if (!bike && bookingData.bikeListingCode) {
          bike = await BikeModel.findOne({ listingCode: bookingData.bikeListingCode });
        }

        const bookingCode = `RDE-${Math.floor(100000 + Math.random() * 900000)}`;
        updatedBooking = await BookingModel.create({
          bookingCode,
          bikeId: bike?._id || bookingData.bikeId,
          renterId: userId || bookingData.renterId,
          pickupDatetime: bookingData.pickupDate ? new Date(bookingData.pickupDate) : new Date(),
          returnDatetime: bookingData.returnDate ? new Date(bookingData.returnDate) : new Date(Date.now() + 86400000),
          durationDays: bookingData.durationDays || 1,
          riderDetails: {
            fullName: bookingData.riderName || req.user?.fullName || 'Rider',
            email: bookingData.riderEmail || req.user?.email || '',
            phoneNumber: bookingData.riderPhone || '',
            documents: bookingData.riderDocuments,
          },
          riderDocuments: bookingData.riderDocuments,
          pricing: {
            dailyRate: bookingData.dailyPrice || bike?.dailyPrice || 1500,
            rentalTotal: bookingData.rentalTotal || 1500,
            securityDeposit: bookingData.securityDeposit || bike?.securityDeposit || 3000,
            deliveryFee: bookingData.deliveryFee || 0,
            totalPayable: bookingData.totalPayable || 4500,
          },
          bookingStatus: 'CONFIRMED',
          paymentStatus: 'PAID',
          paymentMethod: 'UPI',
          transactionId: razorpay_payment_id,
        });

        if (bike) {
          bike.isBooked = true;
          bike.currentBookedByUserId = userId;
          bike.currentBookingId = updatedBooking._id;
          await bike.save();
        }
      }

      // Record / Update PaymentTransaction
      if (updatedBooking) {
        await PaymentTransactionModel.findOneAndUpdate(
          { gatewayOrderId: razorpay_order_id },
          {
            bookingId: updatedBooking._id,
            userId: updatedBooking.renterId || req.user?.id || req.user?._id,
            amountInr: updatedBooking.pricing?.totalPayable,
            currency: 'INR',
            gatewayProvider: 'RAZORPAY',
            gatewayOrderId: razorpay_order_id,
            gatewayPaymentId: razorpay_payment_id,
            gatewaySignature: razorpay_signature,
            status: 'SUCCESSFUL',
          },
          { upsert: true, new: true }
        ).catch((err) => {
          console.warn('[Payment] Could not update transaction log:', err.message);
        });
      }
    }


    return res.status(200).json({
      success: true,
      message: 'Payment verified and reservation marked as confirmed/paid.',
      booking: updatedBooking,
      refId: updatedBooking?.bookingCode,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
  } catch (error) {
    console.error('[Razorpay verifyPayment Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed.',
    });
  }
}
