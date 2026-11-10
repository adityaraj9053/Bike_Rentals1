import mongoose, { Schema } from 'mongoose';

const BookingSchema = new Schema({
  bookingCode: {
    type: String,
    required: true,
    unique: true, // e.g. "RDE-891024"
    index: true,
  },
  bikeId: {
    type: Schema.Types.ObjectId,
    ref: 'Bike',
    required: true,
    index: true,
  },
  renterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Schedule
  pickupDatetime: { type: Date, required: true },
  returnDatetime: { type: Date, required: true },
  durationDays: { type: Number, required: true },
  isDoorstepDelivery: { type: Boolean, default: false },
  deliveryAddress: String,

  // Rider Details at time of booking
  riderDetails: {
    fullName: String,
    email: String,
    phoneNumber: String,
    dateOfBirth: Date,
    documents: {
      aadhaar: Schema.Types.Mixed,
      drivingLicence: Schema.Types.Mixed,
    },
  },
  riderDocuments: {
    aadhaar: Schema.Types.Mixed,
    drivingLicence: Schema.Types.Mixed,
  },

  // Financial Breakdown (All goes directly to Fleet Owner)
  pricing: {
    dailyRate: Number,
    rentalTotal: Number,
    securityDeposit: Number,
    deliveryFee: { type: Number, default: 0 },
    totalPayable: Number,
  },

  bookingStatus: {
    type: String,
    enum: ['CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
    default: 'CONFIRMED',
    index: true,
  },
  paymentStatus: {
    type: String,
    enum: ['PAID', 'PENDING', 'REFUNDED'],
    default: 'PAID',
    index: true,
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'PAY_AT_HUB'],
    default: 'UPI',
  },
  transactionId: String,

  actualPickupAt: Date,
  actualReturnedAt: Date,
}, {
  timestamps: true,
  versionKey: false,
});

BookingSchema.index({ bikeId: 1, bookingStatus: 1, pickupDatetime: 1, returnDatetime: 1 });

export const BookingModel = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
export default BookingModel;
