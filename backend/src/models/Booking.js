import mongoose, { Schema } from 'mongoose';

const BookingSchema = new Schema({
  bookingCode: {
    type: String,
    required: true,
    unique: true, // e.g. "RDE-891024"
    index: true,
  },
  booking_code: {
    type: String,
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

  // Phone numbers column support
  phoneNumber: { type: String, trim: true },
  phone: { type: String, trim: true },
  phone_number: { type: String, trim: true },

  // Schedule
  pickupDatetime: { type: Date, required: true },
  returnDatetime: { type: Date, required: true },
  durationDays: { type: Number, required: true },
  isDoorstepDelivery: { type: Boolean, default: false },
  deliveryAddress: String,

  // Rider Details at time of booking
  riderDetails: {
    fullName: String,
    name: String,
    email: String,
    phoneNumber: String,
    phone: String,
    phone_number: String,
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
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

BookingSchema.pre('save', function () {
  if (this.bookingCode && !this.booking_code) {
    this.booking_code = this.bookingCode;
  } else if (this.booking_code && !this.bookingCode) {
    this.bookingCode = this.booking_code;
  }

  const p =
    this.phoneNumber ||
    this.phone ||
    this.phone_number ||
    this.riderDetails?.phoneNumber ||
    this.riderDetails?.phone ||
    this.riderDetails?.phone_number;

  if (p) {
    this.phoneNumber = p;
    this.phone = p;
    this.phone_number = p;
    if (this.riderDetails) {
      this.riderDetails.phoneNumber = p;
      this.riderDetails.phone = p;
      this.riderDetails.phone_number = p;
    }
  }

  if (this.riderDetails) {
    if (this.riderDetails.fullName && !this.riderDetails.name) {
      this.riderDetails.name = this.riderDetails.fullName;
    } else if (this.riderDetails.name && !this.riderDetails.fullName) {
      this.riderDetails.fullName = this.riderDetails.name;
    }
  }
});

BookingSchema.index({ bikeId: 1, bookingStatus: 1, pickupDatetime: 1, returnDatetime: 1 });

export const BookingModel = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
export default BookingModel;
