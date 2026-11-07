# The Road Eagle (Bike_Rentals) — Backend Implementation Specification

**Document Version:** 3.0.0 (Pure Express + MongoDB Architecture)  
**Database Engine:** MongoDB 7.0+ (Replica Set / MongoDB Atlas)  
**ODM / Driver:** Mongoose v8.x / v9.x  
**Runtime & Backend:** Node.js (v20+ LTS) with Express.js (`d:\BikeTS\backend`)  
**Frontend Client:** React Native / Expo Web & Mobile Platform (`d:\BikeTS\Bike_Rentals`)  
**Cache Dependency:** NONE (100% Redis-free; all OTPs, sessions & locks managed natively via MongoDB)  
**Authentication Standard:** Email OTP & Google OAuth  

---

## 1. System Architecture & Pure MongoDB Design

### 1.1 Architectural Overview
The backend is an Express.js REST API backed directly by MongoDB. The system eliminates Redis completely by leveraging:
1. **MongoDB TTL (Time-To-Live) Indexes** for automatic 5-minute Email OTP expiration.
2. **MongoDB Multi-Document ACID Transactions** (`session.startTransaction()`) for double-booking concurrency control and atomic financial ledger writes.
3. **Stateless JWT Access Tokens + MongoDB Refresh Tokens** for session management.
4. **Dedicated Collections** for Payment Attempts, Refunds, Notifications, Maintenance, Availability Blocks, Reviews, Audit Logs, and Support Tickets.

```
                      ┌────────────────────────────────────────┐
                      │    Client Layer (React Native/Web)     │
                      │  Renter App | Owner Portal | Admin Hub │
                      └───────────────────┬────────────────────┘
                                          │ HTTPS / REST
                                          ▼
                      ┌────────────────────────────────────────┐
                      │     Express.js API Server (Node.js)    │
                      │   - JWT Auth & Role-Based Middleware   │
                      │   - express-validator & CORS           │
                      │   - In-Memory Route Throttling         │
                      └───────────────────┬────────────────────┘
                                          │
    ┌───────────────────┬─────────────────┼─────────────────┬──────────────────┐
    ▼                   ▼                 ▼                 ▼                  ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Auth & Users  │ │ Fleet & Bikes │ │ Bookings &    │ │ Payments,     │ │ Verification, │
│ Engine        │ │ Inventory     │ │ Inspections   │ │ Ledger &      │ │ Maintenance & │
│ (Email OTP)   │ │ & Blocks      │ │ Engine        │ │ Refunds       │ │ Audit Logs    │
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └───────┬───────┘
        │                 │                 │                 │                 │
        └─────────────────┴────────┬────────┴─────────────────┴─────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
       ┌────────────────────────┐    ┌────────────────────────┐
       │ MongoDB 7.0 ReplicaSet │    │ AWS S3 / Cloudflare R2 │
       │ - Document Collections │    │ - Private Bucket       │
       │ - ACID Transactions    │    │ - Encrypted KYC Docs   │
       │ - TTL Indexes (OTPs)   │    │ - 15-Min Pre-signed    │
       │ - GeoJSON 2dsphere     │    │   Download URLs        │
       └────────────────────────┘    └────────────────────────┘
```

### 1.2 Tech Stack Alignment
- **Backend:** Express.js 5.x, Mongoose 9.x, `bcryptjs`, `jsonwebtoken`, `express-validator`, `dotenv`, `cors`.
- **Database:** MongoDB Atlas / MongoDB 7.0 Community Replica Set (Replica set required for ACID multi-document transactions).
- **Client App:** React Native with Expo SDK (Android, iOS, Web).
- **Communication & Mailing:** Nodemailer / AWS SES / SendGrid (Transactional HTML Email OTPs & Booking Vouchers) + WhatsApp Cloud API.
- **Payment & Payouts:** Razorpay / Stripe (Card, UPI) + Cashfree / RazorpayX Payouts for direct bank transfers to hosts.

---

## 2. Review of the 8 New Collections (Uploaded Specification Analysis)

The table below provides a detailed review of each collection from the uploaded architecture sheet, explaining why **none of them are useless** and how each is integrated into the production architecture:

| Collection | Purpose in System | Architecture Verdict | Placement & Integration Strategy |
|---|---|---|---|
| **`payment_transactions`** | Store payment attempts, gateway IDs, payment status and webhook details | **Critical (Must Have)** | Separates raw payment attempts from the business `Booking` record. When a user tries to pay twice or a card fails, every attempt is logged with gateway Order ID, Payment ID, signature, error logs, and raw webhook payloads for financial reconciliation. |
| **`refunds`** | Track full/partial refunds and their status | **High (Must Have)** | Dedicated tracking of security deposit returns, booking cancellation refunds, and damage settlement credits. Banking settlement can take 5–7 days; this collection manages refund lifecycle (`INITIATED`, `PENDING`, `PROCESSED`, `FAILED`). |
| **`notifications`** | Store in-app notification history | **High (Must Have)** | Powers the Notification Bell in the Admin Topbar and rider/owner mobile apps. Stores message, type, deep-link target, and read status (`isRead: false/true`). |
| **`maintenance_records`** | Track servicing, repairs, damage and maintenance schedules | **Critical (Must Have)** | Fleet safety and host operations. Tracks regular oil changes, brake overhaul, tire replacements, repair invoices, workshop bills, and next service due dates. |
| **`bike_availability_blocks`** | Block bikes during maintenance or other unavailable periods | **High (Must Have)** | Allows owners/admins to block out calendar ranges (for servicing, personal use, seasonal breaks) without creating dummy bookings. Indexed for fast conflict checking. |
| **`reviews`** | Customer ratings and reviews for bikes and owners | **Medium (Must Have)** | Core marketplace social proof. Powers the 4.9★ rating badges, rider comments, owner review replies, and post-trip feedback. |
| **`audit_logs`** | Track important admin and owner actions | **High (Must Have)** | Security & legal compliance. Records who verified an owner's Aadhaar, who approved/rejected an RC, who overrode a booking status, and who resolved a damage dispute. |
| **`support_tickets`** | Customer complaints and support requests | **Medium (Must Have)** | Separates everyday inquiries (app feedback, billing question, general support) from high-stake vehicle damage arbitration cases (`disputes`). |

---

## 3. Complete MongoDB Collections & Mongoose Schemas

All schemas are engineered with strict typing, default values, timestamps, and optimized indexes.

---

### Collection 1: `users` (Identity & Account Registry)
```javascript
import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  phoneCountryCode: {
    type: String,
    default: '+91',
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    select: false,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  avatarUrl: String,
  role: {
    type: String,
    enum: ['RENTER', 'OWNER', 'ADMIN', 'SUPPORT', 'SUPERADMIN'],
    default: 'RENTER',
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFlagged: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  versionKey: false,
});

export const UserModel = mongoose.model('User', UserSchema);
```

---

### Collection 2: `email_otps` (Native MongoDB OTP with Auto-TTL Expiry)
*Replaces Redis completely. MongoDB's background thread automatically removes documents 300 seconds after `createdAt`.*

```javascript
const EmailOtpSchema = new Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['LOGIN', 'SIGNUP', 'PASSWORD_RESET', 'EMAIL_VERIFICATION'],
    default: 'LOGIN',
  },
  attemptsCount: {
    type: Number,
    default: 0,
    max: 3, // Brute-force lockout
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // 👈 5-Minute Auto Expiry TTL Index (Zero Redis needed)
  },
});

export const EmailOtpModel = mongoose.model('EmailOtp', EmailOtpSchema);
```

---

### Collection 3: `renter_profiles` (Rider Driving Credentials & 18+ Verification)
```javascript
const RenterProfileSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
    validate: {
      validator: (dob) => {
        const cutoff = new Date();
        cutoff.setFullYear(cutoff.getFullYear() - 18);
        return dob <= cutoff;
      },
      message: 'Riders must be at least 18 years of age.'
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  dlNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    index: true,
  },
  dlExpiryDate: {
    type: Date,
    required: true,
  },
  dlClass: {
    type: String,
    enum: ['MCWOG', 'MCWG', 'LMV', 'INTERNATIONAL_PERMIT'],
    required: true,
  },
  eligibleForGearBikes: {
    type: Boolean,
    default: function() {
      return ['MCWG', 'INTERNATIONAL_PERMIT'].includes(this.dlClass);
    }
  },
  isInternationalRider: {
    type: Boolean,
    default: false,
  },
  passportNumber: String,
  visaExpiryDate: Date,
  kycStatus: {
    type: String,
    enum: ['NOT_SUBMITTED', 'PENDING_REVIEW', 'VERIFIED', 'NEEDS_CORRECTION', 'REJECTED'],
    default: 'PENDING_REVIEW',
    index: true,
  },
  kycRejectionReason: String,
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,
  totalTripsCount: { type: Number, default: 0 },
  renterRating: { type: Number, default: 5.0 },
}, {
  timestamps: true,
  versionKey: false,
});

export const RenterProfileModel = mongoose.model('RenterProfile', RenterProfileSchema);
```

---

### Collection 4: `owner_profiles` (Host Profiles & Payout Bank Details)
```javascript
const OwnerProfileSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  businessName: String,
  isFleetOperator: { type: Boolean, default: false },
  panNumber: { type: String, uppercase: true, trim: true },
  aadhaarLastFour: { type: String, minlength: 4, maxlength: 4 },
  bankAccountEncrypted: {
    accountNumber: String,
    ifsc: String,
    accountHolderName: String,
    vpaUpi: String,
  },
  kycStatus: {
    type: String,
    enum: ['NOT_SUBMITTED', 'PENDING_REVIEW', 'VERIFIED', 'NEEDS_CORRECTION', 'REJECTED'],
    default: 'PENDING_REVIEW',
    index: true,
  },
  kycRejectionReason: String,
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,
  totalEarningsPaisa: { type: Number, default: 0 },
  ownerRating: { type: Number, default: 5.0 },
}, {
  timestamps: true,
  versionKey: false,
});

export const OwnerProfileModel = mongoose.model('OwnerProfile', OwnerProfileSchema);
```

---

### Collection 5: `hubs` (Operational Hubs with GeoJSON Coordinates)
```javascript
const HubSchema = new Schema({
  city: { type: String, required: true, index: true },
  hubName: { type: String, required: true },
  address: { type: String, required: true },
  pincode: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    }
  },
  openingTime: { type: String, default: '07:00' },
  closingTime: { type: String, default: '22:00' },
  contactPhone: String,
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
  versionKey: false,
});

HubSchema.index({ location: '2dsphere' });
export const HubModel = mongoose.model('Hub', HubSchema);
```

---

### Collection 6: `bikes` (Motorcycle Catalog & Compliance Documents)
```javascript
const VehicleDocumentSubSchema = new Schema({
  docType: { type: String, enum: ['RC', 'INSURANCE', 'PUC'], required: true },
  fileUrl: { type: String, required: true },
  policyOrRegNumber: String,
  validUntil: Date,
  extractedData: { type: Schema.Types.Mixed, default: {} },
  verificationStatus: {
    type: String,
    enum: ['PENDING_REVIEW', 'VERIFIED', 'NEEDS_CORRECTION', 'REJECTED'],
    default: 'PENDING_REVIEW'
  },
  rejectionNotes: String,
}, { _id: false });

const BikeSchema = new Schema({
  listingCode: { type: String, required: true, unique: true, index: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'OwnerProfile', required: true, index: true },
  assignedHubId: { type: Schema.Types.ObjectId, ref: 'Hub', index: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  manufacturingYear: { type: Number, required: true },
  category: {
    type: String,
    enum: ['Cruiser Bikes', 'Sports & Track', 'Adventure Tourer', 'Scooters & Commuters'],
    required: true,
    index: true,
  },
  registrationNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  chassisNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  engineNumber: { type: String, required: true, uppercase: true },
  engineCapacityCc: { type: Number, required: true },
  fuelType: { type: String, default: 'Petrol' },
  transmission: { type: String, enum: ['Manual', 'Automatic'], default: 'Manual' },
  color: String,
  specs: {
    displacement: String,
    power: String,
    transmission: String,
    fuelSystem: String,
    tankCapacity: String,
    mileage: String,
    seating: String,
    weight: String,
    braking: String,
    fuelType: String,
  },
  features: [String],
  guidelines: {
    duration: String,
    documents: String,
    deposit: String,
    rules: String,
  },
  dailyPrice: { type: Number, required: true, min: 1 },
  securityDeposit: { type: Number, required: true, default: 3000 },
  minDurationDays: { type: Number, default: 1 },
  maxDurationDays: { type: Number, default: 30 },
  pickupAddress: { type: String, required: true },
  pickupTimings: { type: String, default: '07:00 AM - 09:00 PM' },
  doorstepDeliveryAvailable: { type: Boolean, default: false },
  doorstepDeliveryFee: { type: Number, default: 0 },
  customRidingRules: String,
  photos: {
    front: { type: String, required: true },
    rear: { type: String, required: true },
    left: { type: String, required: true },
    right: { type: String, required: true },
    thumbnail: String,
  },
  documents: [VehicleDocumentSubSchema],
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING_VERIFICATION', 'NEEDS_CORRECTION', 'APPROVED', 'REJECTED', 'SUSPENDED', 'UNDER_MAINTENANCE'],
    default: 'PENDING_VERIFICATION',
    index: true,
  },
  adminRemarks: String,
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,
  isAvailable: { type: Boolean, default: true, index: true },
  currentOdometerKm: { type: Number, default: 0 },
}, {
  timestamps: true,
  versionKey: false,
});

BikeSchema.index({ brand: 'text', model: 'text', category: 'text', pickupAddress: 'text' });
BikeSchema.index({ status: 1, isAvailable: 1, category: 1, dailyPrice: 1 });

export const BikeModel = mongoose.model('Bike', BikeSchema);
```

---

### Collection 7: `bike_availability_blocks` (New Collection from Specification)
*Manages blackout dates for scheduled servicing, private usage, or repairs without dummy bookings.*

```javascript
const BikeAvailabilityBlockSchema = new Schema({
  bikeId: {
    type: Schema.Types.ObjectId,
    ref: 'Bike',
    required: true,
    index: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'OwnerProfile',
    required: true,
  },
  startDate: { type: Date, required: true, index: true },
  endDate: { type: Date, required: true, index: true },
  reason: {
    type: String,
    enum: ['SCHEDULED_MAINTENANCE', 'PERSONAL_USE', 'RTO_INSPECTION', 'ACCIDENT_REPAIR', 'SEASONAL_BREAK'],
    default: 'SCHEDULED_MAINTENANCE',
  },
  notes: String,
  isActive: { type: Boolean, default: true, index: true },
}, {
  timestamps: true,
  versionKey: false,
});

BikeAvailabilityBlockSchema.index({ bikeId: 1, isActive: 1, startDate: 1, endDate: 1 });
export const BikeAvailabilityBlockModel = mongoose.model('BikeAvailabilityBlock', BikeAvailabilityBlockSchema);
```

---

### Collection 8: `maintenance_records` (New Collection from Specification)
*Complete operational and service history for individual motorcycles.*

```javascript
const MaintenanceRecordSchema = new Schema({
  bikeId: {
    type: Schema.Types.ObjectId,
    ref: 'Bike',
    required: true,
    index: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'OwnerProfile',
    required: true,
    index: true,
  },
  serviceType: {
    type: String,
    enum: [
      'ROUTINE_SERVICE',
      'OIL_AND_FILTER_CHANGE',
      'BRAKE_PAD_REPLACEMENT',
      'TIRE_REPLACEMENT',
      'CHAIN_LUBRICATION_TENSION',
      'ACCIDENTAL_DAMAGE_REPAIR',
      'BATTERY_REPLACEMENT',
      'PUC_EMISSION_TEST'
    ],
    required: true,
  },
  odometerReadingKm: { type: Number, required: true },
  serviceDate: { type: Date, required: true, default: Date.now },
  costInr: { type: Number, required: true, default: 0 },
  workshopName: String,
  workshopContact: String,
  invoiceBillUrl: String, // PDF / JPG upload in private S3
  partsReplaced: [String],
  mechanicNotes: String,
  nextServiceDueKm: Number,
  nextServiceDueDate: Date,
}, {
  timestamps: true,
  versionKey: false,
});

MaintenanceRecordSchema.index({ bikeId: 1, serviceDate: -1 });
export const MaintenanceRecordModel = mongoose.model('MaintenanceRecord', MaintenanceRecordSchema);
```

---

### Collection 9: `bookings` (Reservations & Escrow State)
```javascript
const BookingSchema = new Schema({
  bookingCode: {
    type: String,
    required: true,
    unique: true, // e.g. 'RDE-942810'
    index: true,
  },
  bikeId: { type: Schema.Types.ObjectId, ref: 'Bike', required: true, index: true },
  renterId: { type: Schema.Types.ObjectId, ref: 'RenterProfile', required: true, index: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'OwnerProfile', required: true, index: true },
  pickupDatetime: { type: Date, required: true, index: true },
  returnDatetime: { type: Date, required: true, index: true },
  actualPickupAt: Date,
  actualReturnedAt: Date,
  durationDays: { type: Number, required: true },
  isDoorstepDelivery: { type: Boolean, default: false },
  deliveryAddress: String,
  financials: {
    dailyRate: { type: Number, required: true },
    rentalSubtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    platformCommissionFee: { type: Number, required: true }, // e.g. 10%
    ownerPayoutAmount: { type: Number, required: true },
    securityDeposit: { type: Number, required: true },
    totalAmountPaid: { type: Number, required: true },
  },
  bookingStatus: {
    type: String,
    enum: [
      'REQUESTED',
      'CONFIRMED',
      'AWAITING_HANDOVER',
      'ACTIVE',
      'RETURNED_PENDING_INSPECTION',
      'COMPLETED',
      'CANCELLED_BY_RENTER',
      'CANCELLED_BY_OWNER',
      'DISPUTED'
    ],
    default: 'REQUESTED',
    index: true,
  },
  paymentStatus: {
    type: String,
    enum: ['INITIATED', 'PENDING', 'PAID_ESCROW', 'FAILED', 'REFUNDED'],
    default: 'INITIATED',
    index: true,
  },
  escrowStatus: {
    type: String,
    enum: ['HELD_IN_ESCROW', 'PARTIAL_REFUNDED', 'FULLY_REFUNDED', 'FORFEITED_DAMAGE'],
    default: 'HELD_IN_ESCROW',
    index: true,
  },
  agreementSigned: { type: Boolean, default: false },
  cancellation: {
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    cancelledAt: Date,
    refundAmount: Number,
  }
}, {
  timestamps: true,
  versionKey: false,
});

BookingSchema.index({ bikeId: 1, bookingStatus: 1, pickupDatetime: 1, returnDatetime: 1 });
export const BookingModel = mongoose.model('Booking', BookingSchema);
```

---

### Collection 10: `payment_transactions` (New Collection from Specification)
*Logs every payment attempt, raw gateway IDs, signatures, and webhook responses for audit.*

```javascript
const PaymentTransactionSchema = new Schema({
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  amountInr: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  gatewayProvider: {
    type: String,
    enum: ['RAZORPAY', 'STRIPE', 'CASHFREE', 'PAY_AT_HUB'],
    default: 'RAZORPAY',
  },
  gatewayOrderId: { type: String, index: true },
  gatewayPaymentId: { type: String, index: true },
  gatewaySignature: String,
  paymentMethod: {
    type: String,
    enum: ['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NETBANKING', 'CASH'],
  },
  status: {
    type: String,
    enum: ['INITIATED', 'PENDING', 'SUCCESSFUL', 'FAILED', 'USER_DROPPED'],
    default: 'INITIATED',
    index: true,
  },
  webhookReceived: { type: Boolean, default: false },
  webhookEvent: String,
  rawWebhookPayload: { type: Schema.Types.Mixed },
  errorCode: String,
  errorDescription: String,
  idempotencyKey: { type: String, unique: true, sparse: true },
}, {
  timestamps: true,
  versionKey: false,
});

export const PaymentTransactionModel = mongoose.model('PaymentTransaction', PaymentTransactionSchema);
```

---

### Collection 11: `refunds` (New Collection from Specification)
*Tracks security deposit returns, booking cancellations, and dispute deductions.*

```javascript
const RefundSchema = new Schema({
  refundCode: {
    type: String,
    required: true,
    unique: true, // e.g. 'REF-8012'
    index: true,
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true,
  },
  paymentTransactionId: {
    type: Schema.Types.ObjectId,
    ref: 'PaymentTransaction',
  },
  recipientUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  amountInr: { type: Number, required: true },
  reason: {
    type: String,
    enum: [
      'SECURITY_DEPOSIT_RETURN',
      'BOOKING_CANCELLATION',
      'DISPUTE_ARBITRATION_REMAINDER',
      'OVERTIME_FEE_ADJUSTMENT',
      'ADMIN_COURTESY_CREDIT'
    ],
    required: true,
  },
  gatewayRefundId: { type: String, index: true },
  status: {
    type: String,
    enum: ['INITIATED', 'PENDING', 'PROCESSED', 'FAILED'],
    default: 'INITIATED',
    index: true,
  },
  failureReason: String,
  processedAt: Date,
  processedByAdminId: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  versionKey: false,
});

export const RefundModel = mongoose.model('Refund', RefundSchema);
```

---

### Collection 12: `notifications` (New Collection from Specification)
*Stores persistent in-app notifications for Renters, Owners, and Administrators.*

```javascript
const NotificationSchema = new Schema({
  recipientUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  recipientRole: {
    type: String,
    enum: ['RENTER', 'OWNER', 'ADMIN'],
    required: true,
    index: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'BOOKING_CONFIRMED',
      'BOOKING_CANCELLED',
      'KYC_APPROVED',
      'KYC_NEEDS_CORRECTION',
      'DOCUMENT_EXPIRING_SOON',
      'PAYOUT_CREDITED',
      'NEW_DISPUTE_RAISED',
      'SECURITY_DEPOSIT_REFUNDED',
      'SYSTEM_ALERT'
    ],
    required: true,
  },
  targetEntityId: String, // e.g. bookingId or bikeId
  deepLinkScreen: String,  // e.g. 'BookingDetails', 'AdminDashboard'
  isRead: { type: Boolean, default: false, index: true },
  readAt: Date,
}, {
  timestamps: true,
  versionKey: false,
});

NotificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });
export const NotificationModel = mongoose.model('Notification', NotificationSchema);
```

---

### Collection 13: `reviews` (New Collection from Specification)
*Two-way customer ratings and verified feedback for bikes, hosts, and riders.*

```javascript
const ReviewSchema = new Schema({
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true,
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
    ref: 'RenterProfile',
    required: true,
    index: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'OwnerProfile',
    required: true,
    index: true,
  },
  reviewType: {
    type: String,
    enum: ['RENTER_TO_BIKE', 'RENTER_TO_OWNER', 'OWNER_TO_RENTER'],
    default: 'RENTER_TO_BIKE',
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  cleanlinessScore: { type: Number, min: 1, max: 5 },
  enginePerformanceScore: { type: Number, min: 1, max: 5 },
  communicationScore: { type: Number, min: 1, max: 5 },
  comment: { type: String, trim: true },
  reviewPhotos: [String],
  ownerReply: {
    comment: String,
    repliedAt: Date,
  },
  isApproved: { type: Boolean, default: true },
}, {
  timestamps: true,
  versionKey: false,
});

ReviewSchema.index({ bikeId: 1, isApproved: 1, createdAt: -1 });
export const ReviewModel = mongoose.model('Review', ReviewSchema);
```

---

### Collection 14: `audit_logs` (New Collection from Specification)
*Tamper-proof compliance log of all critical administrative, moderation, and payout events.*

```javascript
const AuditLogSchema = new Schema({
  actorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  actorRole: {
    type: String,
    enum: ['ADMIN', 'SUPERADMIN', 'SUPPORT', 'SYSTEM_CRON'],
    required: true,
  },
  action: {
    type: String,
    enum: [
      'OWNER_KYC_APPROVED',
      'OWNER_KYC_REJECTED',
      'BIKE_LISTING_APPROVED',
      'BIKE_LISTING_SUSPENDED',
      'RENTER_DL_VERIFIED',
      'BOOKING_STATUS_OVERRIDDEN',
      'SECURITY_DEPOSIT_FORFEITED',
      'MANUAL_REFUND_ISSUED',
      'USER_ACCOUNT_FROZEN',
      'PLATFORM_SETTINGS_CHANGED'
    ],
    required: true,
    index: true,
  },
  targetEntityType: {
    type: String,
    enum: ['USER', 'BIKE', 'BOOKING', 'REFUND', 'DISPUTE', 'SETTINGS'],
    required: true,
  },
  targetEntityId: { type: String, required: true, index: true },
  beforeSnapshot: { type: Schema.Types.Mixed },
  afterSnapshot: { type: Schema.Types.Mixed },
  adminNotes: String,
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now, index: true },
}, {
  versionKey: false,
});

AuditLogSchema.index({ targetEntityType: 1, targetEntityId: 1, timestamp: -1 });
export const AuditLogModel = mongoose.model('AuditLog', AuditLogSchema);
```

---

### Collection 15: `support_tickets` (New Collection from Specification)
*Customer support desk for rider questions, app bugs, and payment queries.*

```javascript
const SupportTicketSchema = new Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true, // e.g. 'SUP-1042'
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
  },
  category: {
    type: String,
    enum: [
      'BOOKING_INQUIRY',
      'PAYMENT_FAILED_DEDUCTED',
      'DOCUMENT_UPLOAD_HELP',
      'HUB_PICKUP_LOCATION_ASSISTANCE',
      'ACCOUNT_ACCESS',
      'GENERAL_FEEDBACK'
    ],
    required: true,
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM',
    index: true,
  },
  status: {
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'],
    default: 'OPEN',
    index: true,
  },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  attachments: [String],
  assignedAdminId: { type: Schema.Types.ObjectId, ref: 'User' },
  resolutionNotes: String,
  resolvedAt: Date,
}, {
  timestamps: true,
  versionKey: false,
});

export const SupportTicketModel = mongoose.model('SupportTicket', SupportTicketSchema);
```

---

### Collection 16: `vehicle_inspections` (Handover & Return Checklists)
```javascript
const VehicleInspectionSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  inspectionType: { type: String, enum: ['PICKUP', 'RETURN'], required: true },
  odometerReadingKm: { type: Number, required: true },
  fuelPercentage: { type: Number, required: true, min: 0, max: 100 },
  bodyScratchesDescription: String,
  scratchMarkers: [{
    panel: String,
    severity: String,
    xRatio: Number,
    yRatio: Number,
  }],
  photos: [String],
  signedByRenter: { type: Boolean, default: false },
  signedByExecutiveOrOwner: { type: Boolean, default: false },
  inspectionTimestamp: { type: Date, default: Date.now },
}, {
  timestamps: true,
  versionKey: false,
});

VehicleInspectionSchema.index({ bookingId: 1, inspectionType: 1 }, { unique: true });
export const VehicleInspectionModel = mongoose.model('VehicleInspection', VehicleInspectionSchema);
```

---

### Collection 17: `rental_agreements` (Digital Contract & Tamper-Proof Audit)
```javascript
const RentalAgreementSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  agreementNumber: { type: String, required: true, unique: true },
  pdfDocumentUrl: { type: String, required: true },
  contentSha256: { type: String, required: true },
  renterIpAddress: { type: String, required: true },
  renterUserAgent: String,
  termsVersion: { type: String, default: 'v2026.1' },
  signedTimestamp: { type: Date, default: Date.now },
}, {
  timestamps: true,
  versionKey: false,
});

export const RentalAgreementModel = mongoose.model('RentalAgreement', RentalAgreementSchema);
```

---

### Collection 18: `disputes` (Damage Claims & Arbitration)
```javascript
const DisputeSchema = new Schema({
  ticketNumber: { type: String, required: true, unique: true, index: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', index: true },
  reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reporterRole: { type: String, enum: ['RENTER', 'OWNER', 'SYSTEM_BOT'], required: true },
  category: {
    type: String,
    enum: ['BIKE_DAMAGE', 'LATE_RETURN', 'DOCUMENT_FRAUD', 'MECHANICAL_BREAKDOWN', 'COMMUNICATION_ISSUE'],
    required: true,
  },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM', index: true },
  status: { type: String, enum: ['OPEN', 'IN_INVESTIGATION', 'RESOLVED', 'CLOSED'], default: 'OPEN', index: true },
  description: { type: String, required: true },
  evidenceUrls: [String],
  repairEstimateAmount: { type: Number, default: 0 },
  deductedFromDepositAmount: { type: Number, default: 0 },
  assignedAdminId: { type: Schema.Types.ObjectId, ref: 'User' },
  adminInternalNotes: String,
  finalResolutionSummary: String,
  penalties: {
    userPenalized: { type: Boolean, default: false },
    listingSuspended: { type: Boolean, default: false },
  },
  resolvedAt: Date,
}, {
  timestamps: true,
  versionKey: false,
});

export const DisputeModel = mongoose.model('Dispute', DisputeSchema);
```

---

### Collection 19: `platform_settings` (Dynamic Governance Rules)
```javascript
const PlatformSettingSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  description: String,
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  versionKey: false,
});

export const PlatformSettingModel = mongoose.model('PlatformSetting', PlatformSettingSchema);
```

---

## 4. Concurrency & Overlap Prevention (Pure MongoDB)

Without SQL exclusion constraints or Redis distributed locks, MongoDB provides 100% guarantee against overlapping bookings using **Multi-Document ACID Transactions** and atomic range verification:

```javascript
import mongoose from 'mongoose';
import { BookingModel } from './models/Booking.js';
import { BikeAvailabilityBlockModel } from './models/BikeAvailabilityBlock.js';

export async function createReservationAtomic(bookingPayload) {
  const session = await mongoose.startSession();
  session.startTransaction({
    readConcern: { level: 'snapshot' },
    writeConcern: { level: 'majority' },
  });

  try {
    const { bikeId, pickupDatetime, returnDatetime } = bookingPayload;
    const requestedStart = new Date(pickupDatetime);
    const requestedEnd = new Date(returnDatetime);

    // 1. Check for overlapping ACTIVE bookings
    const activeBookingConflict = await BookingModel.findOne({
      bikeId: bikeId,
      bookingStatus: { 
        $nin: ['CANCELLED_BY_RENTER', 'CANCELLED_BY_OWNER', 'COMPLETED'] 
      },
      pickupDatetime: { $lt: requestedEnd },
      returnDatetime: { $gt: requestedStart },
    }).session(session);

    if (activeBookingConflict) {
      throw new Error('VEHICLE_UNAVAILABLE: Motorcycle already booked for these dates.');
    }

    // 2. Check for host/admin availability blocks
    const blockConflict = await BikeAvailabilityBlockModel.findOne({
      bikeId: bikeId,
      isActive: true,
      startDate: { $lt: requestedEnd },
      endDate: { $gt: requestedStart },
    }).session(session);

    if (blockConflict) {
      throw new Error(`VEHICLE_BLOCKED: Motorcycle is blocked for ${blockConflict.reason}.`);
    }

    // 3. Atomically persist booking
    const booking = new BookingModel(bookingPayload);
    await booking.save({ session });

    await session.commitTransaction();
    return booking;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

---

## 5. Comprehensive RESTful API Endpoints

All endpoints require `Content-Type: application/json`. Protected endpoints require `Authorization: Bearer <jwt_access_token>`.

### 5.1 Authentication (Pure Email OTP & Google OAuth)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/email-otp/send` | Public | Generate 6-digit OTP, hash, save in `email_otps` (auto-expires in 5m), dispatch email |
| `POST` | `/api/v1/auth/email-otp/verify` | Public | Verify OTP code against hash, check attempts, return JWT session |
| `POST` | `/api/v1/auth/register` | Public | Complete rider profile (Name, DOB with 18+ enforcement) |
| `POST` | `/api/v1/auth/login` | Public | Email and password authentication fallback |
| `POST` | `/api/v1/auth/google` | Public | Google Identity OAuth (GSI Token / Mobile AuthSession exchange) |
| `POST` | `/api/v1/auth/refresh-token` | Public | Rotate expired access token using HTTP-only Refresh Token |
| `POST` | `/api/v1/auth/logout` | Auth | Revoke refresh token and invalidate user session |
| `GET` | `/api/v1/auth/me` | Auth | Retrieve current user profile, role, and verification status |

---

### 5.2 User & Profile Management

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/users/profile` | Auth | Any | Get user profile details & KYC status |
| `PATCH` | `/api/v1/users/profile` | Auth | Any | Update avatar, display name, contact preferences |
| `POST` | `/api/v1/users/renter/kyc` | Auth | RENTER | Submit Driving License, class (`MCWG`/`MCWOG`), DOB |
| `GET` | `/api/v1/users/renter/kyc-status` | Auth | RENTER | Check driving credentials verification state |
| `POST` | `/api/v1/users/owner/kyc` | Auth | OWNER | Submit PAN, Aadhaar (last 4), Bank Account IFSC/UPI |
| `GET` | `/api/v1/users/owner/earnings` | Auth | OWNER | Payout summary, gross revenue, and pending settlements |

---

### 5.3 Public Motorbikes & Fleet Catalog

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/bikes` | Public | Filtered catalog with text search (`q`), category, price range, city, sorting |
| `GET` | `/api/v1/bikes/:idOrCode` | Public | Complete bike specs, gallery, guidelines, and reviews summary |
| `GET` | `/api/v1/bikes/:id/availability` | Public | Check if bike is free between `pickupDate` and `returnDate` |
| `GET` | `/api/v1/bikes/categories` | Public | Return all fleet categories (Cruiser, Sports, Adventure, Commuter) with counts |
| `GET` | `/api/v1/bikes/featured` | Public | Curated lineup for homepage banners and premium recommendations |

---

### 5.4 Owner Listing, Availability Blocks & Maintenance

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/owner/listings` | Auth | OWNER | List all motorcycles owned by the authenticated host |
| `POST` | `/api/v1/owner/listings/draft` | Auth | OWNER | Initialize a new bike listing draft |
| `PUT` | `/api/v1/owner/listings/:id/step-bike-info` | Auth | OWNER | Save Brand, Model, Year, Reg #, Category, Engine CC, Specs |
| `POST` | `/api/v1/owner/listings/:id/upload-photo` | Auth | OWNER | Upload 4-angle vehicle photos (Front, Rear, Left, Right) |
| `POST` | `/api/v1/owner/listings/:id/upload-document` | Auth | OWNER | Upload RC, Insurance policy, and PUC certificates |
| `PUT` | `/api/v1/owner/listings/:id/step-rental-info`| Auth | OWNER | Set Daily Price, Security Deposit, Min/Max duration, Pickup location |
| `POST` | `/api/v1/owner/listings/:id/submit` | Auth | OWNER | Final validation and submission to Admin Verification Queue |
| `POST` | `/api/v1/owner/listings/:id/blocks` | Auth | OWNER | Block out dates in `bike_availability_blocks` |
| `GET` | `/api/v1/owner/listings/:id/blocks` | Auth | OWNER | List all active blocks for a motorcycle |
| `DELETE`| `/api/v1/owner/listings/:id/blocks/:blockId`| Auth | OWNER | Remove calendar block |
| `POST` | `/api/v1/owner/listings/:id/maintenance` | Auth | OWNER | Record a new servicing entry in `maintenance_records` |
| `GET` | `/api/v1/owner/listings/:id/maintenance` | Auth | OWNER | View complete maintenance history and bills |

---

### 5.5 Bookings & Quotation Engine

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/bookings/quote` | Public / Auth | Any | Calculate billing days, daily rate, deposit, platform fee & total payable |
| `POST` | `/api/v1/bookings` | Auth | RENTER | Create reservation intent with MongoDB ACID transaction lock |
| `GET` | `/api/v1/bookings/my-trips` | Auth | RENTER | Retrieve renter's active, upcoming, and past rental vouchers |
| `GET` | `/api/v1/bookings/:id` | Auth | Any Party | Fetch complete booking details, voucher data, and timeline |
| `POST` | `/api/v1/bookings/:id/cancel` | Auth | Any Party | Cancel reservation with refund calculation based on policy |
| `POST` | `/api/v1/bookings/:id/agreement/sign` | Auth | RENTER | Digitally sign rental contract with IP stamp and identity hash |

---

### 5.6 Vehicle Inspection & Telematics

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/inspections/pickup` | Auth | Owner/Executive | Record pickup odometer, fuel %, scratch map, and photos |
| `POST` | `/api/v1/inspections/pickup/sign` | Auth | RENTER | Renter confirms physical condition during handover |
| `POST` | `/api/v1/inspections/return` | Auth | Owner/Executive | Record return odometer, fuel %, damages, and overtime fees |
| `POST` | `/api/v1/inspections/return/sign` | Auth | RENTER | Renter confirms return condition and dispute release |
| `GET` | `/api/v1/inspections/booking/:bookingId`| Auth | Any Party | Fetch side-by-side pickup vs return inspection sheets |

---

### 5.7 Payments, Webhooks & Refunds

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/payments/create-order` | Auth | RENTER | Create gateway order and log attempt in `payment_transactions` |
| `POST` | `/api/v1/payments/verify` | Auth | RENTER | Verify gateway signature, mark transaction `SUCCESSFUL`, set booking `PAID_ESCROW` |
| `POST` | `/api/v1/payments/webhook` | Public (Signed) | Gateway | Asynchronous webhook listener logging into `payment_transactions` |
| `POST` | `/api/v1/payments/refunds` | Auth | ADMIN | Create entry in `refunds` collection and trigger gateway refund |
| `GET` | `/api/v1/payments/refunds/booking/:bookingId`| Auth | Any Party | Track refund status and settlement timeline |
| `POST` | `/api/v1/payments/payout/settle` | Auth | ADMIN | Disburse net rental earnings to owner bank account |

---

### 5.8 Reviews & Ratings

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/reviews` | Auth | RENTER | Post bike and owner review with ratings (1-5★) and photos |
| `POST` | `/api/v1/reviews/owner-to-renter` | Auth | OWNER | Host reviews renter behavior and vehicle return punctuality |
| `GET` | `/api/v1/reviews/bike/:bikeId` | Public | Any | List approved reviews for a motorcycle with average scores |
| `POST` | `/api/v1/reviews/:id/reply` | Auth | OWNER | Host posts reply to a customer review |

---

### 5.9 Notifications & Support Tickets

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/notifications` | Auth | Any | Get user's notifications sorted by latest with unread count |
| `PATCH`| `/api/v1/notifications/:id/read` | Auth | Any | Mark single notification as read |
| `PATCH`| `/api/v1/notifications/read-all` | Auth | Any | Mark all notifications as read |
| `POST` | `/api/v1/support/tickets` | Auth | Any | Submit customer inquiry or issue ticket |
| `GET` | `/api/v1/support/tickets/my-tickets` | Auth | Any | View status and messages of user's support tickets |
| `PATCH`| `/api/v1/admin/support/tickets/:id` | Auth | ADMIN | Update ticket status, assign admin, and post resolution notes |

---

### 5.10 Admin Verification Queues & Audit Logs

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/admin/kpis` | Auth | ADMIN | Real-time counts using MongoDB aggregation pipelines |
| `GET` | `/api/v1/admin/verifications/owners` | Auth | ADMIN | Owner KYC queue with Aadhaar/PAN status & submitted files |
| `PUT` | `/api/v1/admin/verifications/owners/:id`| Auth | ADMIN | Approve, Reject, or Request Correction on owner KYC (Logs audit) |
| `GET` | `/api/v1/admin/verifications/bikes` | Auth | ADMIN | Vehicle queue with RC, Insurance validity & chassis cross-checks |
| `PUT` | `/api/v1/admin/verifications/bikes/:id` | Auth | ADMIN | Approve, Reject, or mark physical inspection required (Logs audit) |
| `GET` | `/api/v1/admin/verifications/renters`| Auth | ADMIN | Rider driving licenses queue with MCWG class validation |
| `PUT` | `/api/v1/admin/verifications/renters/:id`| Auth | ADMIN | Validate or reject driver license credentials (Logs audit) |
| `GET` | `/api/v1/admin/audit-logs` | Auth | ADMIN | Searchable audit trail filtered by actor, target entity, or action |
| `GET` | `/api/v1/admin/bookings` | Auth | ADMIN | Global booking registry with search, status filters & date range |
| `PATCH`| `/api/v1/admin/bookings/:id/status` | Auth | ADMIN | Override booking status with mandatory audit log reason |

---

## 6. Implementation Execution Checklist

- [x] **Phase 1: Database Setup & Pure MongoDB Schemas**
  - Configure MongoDB Atlas / Local Replica Set.
  - Setup 19 Mongoose schemas with 2dsphere indexes, TTL index for Email OTPs, and compound indexes.
- [ ] **Phase 2: Authentication & Email OTP Engine**
  - Implement `EmailOtpModel` with `expires: 300` TTL auto-expiry.
  - Setup Nodemailer / SendGrid for clean HTML OTP dispatch.
  - Implement JWT access token + refresh token controllers.
- [ ] **Phase 3: Fleet Management, Maintenance & Availability**
  - Implement 5-step bike listing pipeline.
  - Implement `bike_availability_blocks` and `maintenance_records` endpoints.
  - S3 / Cloudflare R2 private bucket integration for RC/Insurance/PUC PDFs.
- [ ] **Phase 4: Bookings, Payments & Refunds**
  - Implement `createReservationAtomic()` with MongoDB multi-document transactions.
  - Implement Razorpay / Stripe checkout with `payment_transactions` logging.
  - Implement automated `refunds` processing for deposit returns.
- [ ] **Phase 5: Reviews, Notifications & Support**
  - Implement post-rental reviews and rating aggregation.
  - Implement user notifications and customer support tickets.
- [ ] **Phase 6: Admin Operations & Audit Logging**
  - Connect Admin topbar notification badge to `NotificationModel`.
  - Instrument all admin actions with `AuditLogModel` capture.
