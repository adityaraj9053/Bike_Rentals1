# The Road Eagle (Bike_Rentals) — Backend Implementation Specification (MongoDB Edition)

**Document Version:** 2.0.0 (MongoDB Architecture)  
**Database Engine:** MongoDB 7.0+ (Enterprise / MongoDB Atlas Replica Set)  
**ODM / Driver:** Mongoose v8+ / MongoDB Node.js Driver  
**Target Environment:** High-Concurrency Cloud Architecture  
**Companion App:** React Native / Expo Web & Mobile Platform  

---

## 1. Executive Summary & System Architecture

### 1.1 Platform Overview
**The Road Eagle** is a peer-to-peer and managed fleet motorcycle rental marketplace. The backend system serves three primary actors:
1. **Renters (Riders):** Search and filter fleet inventory, verify driving credentials (`MCWG` vs `MCWOG` class checks, international permits, 18+ age verification), book vehicles with custom date/time ranges, digitally sign rental agreements, complete pre/post-rental vehicle inspections, and manage security deposits held in escrow.
2. **Bike Owners (Hosts & Fleet Partners):** Multi-step listing wizard (Owner KYC, vehicle technical specs, RC/Insurance/PUC document uploads with OCR verification, 4-angle photo uploads), availability scheduling, pricing management, and automated payout settlements.
3. **Platform Administrators & Operations Personnel:** Moderation queues (Owner KYC, Vehicle transport compliance, Renter driving licenses), fleet inventory management, dispute and damage claims arbitration, financial escrow accounting, hub location management, and platform analytics.

```
                      ┌────────────────────────────────────────┐
                      │    Client Layer (React Native/Web)     │
                      │  Renter App | Owner Portal | Admin Hub │
                      └───────────────────┬────────────────────┘
                                          │ HTTPS / WSS
                                          ▼
                      ┌────────────────────────────────────────┐
                      │    API Gateway & Rate Limiting (Kong)  │
                      │   - JWT Auth & RBAC Guard              │
                      │   - Rate Limit: 100 req/min/IP         │
                      └───────────────────┬────────────────────┘
                                          │
    ┌───────────────────┬─────────────────┼─────────────────┬──────────────────┐
    ▼                   ▼                 ▼                 ▼                  ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Auth & Users  │ │ Fleet & Bikes │ │ Bookings &    │ │ Payments &    │ │ Verification  │
│ Microservice  │ │ Service       │ │ Inspection    │ │ Escrow Ledger │ │ & Disputes    │
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └───────┬───────┘
        │                 │                 │                 │                 │
        └─────────────────┴────────┬────────┴─────────────────┴─────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
       ┌────────────────────────┐    ┌────────────────────────┐
       │ MongoDB 7.0 ReplicaSet │    │ Redis 7 (Cluster)      │
       │ - Document Storage     │    │ - Session Caching      │
       │ - ACID Transactions    │    │ - Redlock Concurrency  │
       │ - GeoJSON 2dsphere     │    │ - Rate Limiting & OTP  │
       │ - Change Streams       │    │                        │
       └────────────────────────┘    └────────────────────────┘
                    │                             │
                    ▼                             ▼
       ┌────────────────────────┐    ┌────────────────────────┐
       │ AWS S3 / Cloudflare R2 │    │ BullMQ Background Jobs │
       │ - Encrypted KYC Docs   │    │ - Escrow Release Worker│
       │ - Vehicle 4-Angle PICS │    │ - Expiry Alert Cron    │
       │ - Pre-signed URLs      │    │ - WhatsApp / SMS Dispatch
       └────────────────────────┘    └────────────────────────┘
```

### 1.2 Recommended Tech Stack
- **Runtime:** Node.js (v20+ LTS) with NestJS (TypeScript) or Express.js
- **Database:** MongoDB 7.0+ Replica Set (Required for Multi-Document ACID Transactions & Change Streams)
- **ODM:** Mongoose v8.x with strict schema validation
- **In-Memory Cache & Message Broker:** Redis 7.2 (Idempotency keys, Redlock distributed locking for bookings, OTP storage)
- **Object Storage:** AWS S3 or Cloudflare R2 with Private Buckets and 15-minute time-bound Pre-Signed URLs
- **Background Worker Queue:** BullMQ / Redis Streams for async jobs (document OCR extraction, invoice PDF generation, escrow settlement releases)
- **Payment & Payout Gateways:** Razorpay / Stripe (Card & UPI Autopay) + Cashfree / RazorpayX Payouts for direct Owner NEFT/IMPS disbursement
- **Communication Gateways:** Twilio / MSG91 (Transactional SMS/OTP) + WhatsApp Cloud API (Automated voucher & booking confirmation concierge)
- **Identity & Transport Verification:** Surepass / Karza / Sandbox API (Automated Aadhaar OTP, PAN verification, and VAHAN/Sarathi DL & RC database cross-checking)

---

## 2. Optimized MongoDB Collections & Mongoose Schemas

In MongoDB, data modeling balances **embedding** (for documents read together that have bounded growth, e.g., vehicle specs, photos, document verification logs) with **referencing** (for unbounded growth or shared entities, e.g., bookings, users, ledger transactions).

### 2.1 Collection Summary & Design Strategy

| Collection | Model Type | Design Pattern | Primary Indexes |
|---|---|---|---|
| `users` | Referenced | Core Account Identity | `phone`, `email`, `googleId` |
| `renter_profiles` | Referenced (1:1 with User) | Driving Credentials & KYC | `userId` (Unique), `dlNumber` |
| `owner_profiles` | Referenced (1:1 with User) | Payout Details & Reputation | `userId` (Unique), `kycStatus` |
| `hubs` | Referenced | GeoJSON Locations | `location` (`2dsphere`), `city` |
| `bikes` | Hybrid (Embedded Specs, Photos & Docs) | Vehicle Catalog & Moderation | Text index on search fields, `status`, `category`, `pricePerDay` |
| `bookings` | Hybrid (Embedded Pricing Snapshot & Inspections) | Reservation & Escrow State | Compound index `(bikeId, pickupDate, returnDate, bookingStatus)` |
| `vehicle_inspections` | Referenced | Handover & Return Checklists | `bookingId` (Unique compound with `type`) |
| `rental_agreements` | Referenced | Legal Contract & Signature Audit | `bookingId` (Unique), `agreementNumber` |
| `financial_ledger` | Referenced | Double-Entry Financial Records | `idempotencyKey` (Unique Sparse), `bookingId`, `transactionType` |
| `disputes` | Referenced | Incident & Claims Arbitration | `bookingId`, `status`, `priority` |
| `platform_settings` | Referenced | Dynamic System Configs | `key` (Unique) |
| `otp_verifications` | Ephemeral (TTL) | Temporary OTP Verification | `expiresAt` (`TTL Index`) |

---

### 2.2 Mongoose Schema Definitions

#### Collection 1: `users`
```javascript
import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  phoneCountryCode: {
    type: String,
    default: '+91',
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  passwordHash: {
    type: String,
    select: false, // Do not return by default in queries
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  avatarUrl: {
    type: String,
  },
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

#### Collection 2: `renter_profiles`
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
      validator: function(dob) {
        const cutoff = new Date();
        cutoff.setFullYear(cutoff.getFullYear() - 18);
        return dob <= cutoff;
      },
      message: 'Rider must be at least 18 years of age.'
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  
  // Driving Credentials
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

  // International Tourists
  isInternationalRider: {
    type: Boolean,
    default: false,
  },
  passportNumber: String,
  visaExpiryDate: Date,

  // Verification Audit
  kycStatus: {
    type: String,
    enum: ['NOT_SUBMITTED', 'PENDING_REVIEW', 'VERIFIED', 'NEEDS_CORRECTION', 'REJECTED'],
    default: 'PENDING_REVIEW',
    index: true,
  },
  kycRejectionReason: String,
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  verifiedAt: Date,

  totalTripsCount: {
    type: Number,
    default: 0,
  },
  renterRating: {
    type: Number,
    default: 5.0,
  }
}, {
  timestamps: true,
  versionKey: false,
});

export const RenterProfileModel = mongoose.model('RenterProfile', RenterProfileSchema);
```

---

#### Collection 3: `owner_profiles`
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
  isFleetOperator: {
    type: Boolean,
    default: false,
  },
  panNumber: {
    type: String,
    uppercase: true,
    trim: true,
  },
  aadhaarLastFour: {
    type: String,
    minlength: 4,
    maxlength: 4,
  },

  // Bank Account for Payouts (Encrypted at rest)
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
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  verifiedAt: Date,

  totalEarningsPaisa: {
    type: Number,
    default: 0,
  },
  ownerRating: {
    type: Number,
    default: 5.0,
  }
}, {
  timestamps: true,
  versionKey: false,
});

export const OwnerProfileModel = mongoose.model('OwnerProfile', OwnerProfileSchema);
```

---

#### Collection 4: `hubs` (GeoJSON Locations)
```javascript
const HubSchema = new Schema({
  city: {
    type: String,
    required: true,
    index: true,
  },
  hubName: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  pincode: String,
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude] - GeoJSON format
      required: true,
    }
  },
  openingTime: { type: String, default: '07:00' },
  closingTime: { type: String, default: '22:00' },
  contactPhone: String,
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
  versionKey: false,
});

// 2dsphere index for geospatial proximity search
HubSchema.index({ location: '2dsphere' });

export const HubModel = mongoose.model('Hub', HubSchema);
```

---

#### Collection 5: `bikes` (Consolidated Listing, Specs, Photos & Docs)
```javascript
const VehicleDocumentSubSchema = new Schema({
  docType: {
    type: String,
    enum: ['RC', 'INSURANCE', 'PUC'],
    required: true,
  },
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
  listingCode: {
    type: String,
    required: true,
    unique: true, // e.g. 'BIKE-8801'
    index: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'OwnerProfile',
    required: true,
    index: true,
  },
  assignedHubId: {
    type: Schema.Types.ObjectId,
    ref: 'Hub',
    index: true,
  },

  // Vehicle Identity
  brand: { type: String, required: true },
  model: { type: String, required: true },
  manufacturingYear: { type: Number, required: true },
  category: {
    type: String,
    enum: ['Cruiser Bikes', 'Sports & Track', 'Adventure Tourer', 'Scooters & Commuters'],
    required: true,
    index: true,
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  chassisNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  engineNumber: { type: String, required: true, uppercase: true },
  engineCapacityCc: { type: Number, required: true },
  fuelType: { type: String, default: 'Petrol' },
  transmission: {
    type: String,
    enum: ['Manual', 'Automatic'],
    default: 'Manual',
  },
  color: String,

  // Technical Specs & Features
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

  // Pricing & Security Deposit (in INR)
  dailyPrice: { type: Number, required: true, min: 1 },
  securityDeposit: { type: Number, required: true, default: 3000 },
  minDurationDays: { type: Number, default: 1 },
  maxDurationDays: { type: Number, default: 30 },

  // Location & Handover
  pickupAddress: { type: String, required: true },
  pickupTimings: { type: String, default: '07:00 AM - 09:00 PM' },
  doorstepDeliveryAvailable: { type: Boolean, default: false },
  doorstepDeliveryFee: { type: Number, default: 0 },
  customRidingRules: String,

  // 4-Angle Photos
  photos: {
    front: { type: String, required: true },
    rear: { type: String, required: true },
    left: { type: String, required: true },
    right: { type: String, required: true },
    thumbnail: { type: String },
  },

  // Compliance Documents (RC, Insurance, PUC)
  documents: [VehicleDocumentSubSchema],

  // Moderation Status
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING_VERIFICATION', 'NEEDS_CORRECTION', 'APPROVED', 'REJECTED', 'SUSPENDED', 'UNDER_MAINTENANCE'],
    default: 'PENDING_VERIFICATION',
    index: true,
  },
  adminRemarks: String,
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,

  // Availability & Odometer
  isAvailable: { type: Boolean, default: true, index: true },
  currentOdometerKm: { type: Number, default: 0 },
  blackoutDates: [{
    startDate: Date,
    endDate: Date,
    reason: String,
  }],
}, {
  timestamps: true,
  versionKey: false,
});

// Full-text search index for catalog browsing
BikeSchema.index({
  brand: 'text',
  model: 'text',
  category: 'text',
  pickupAddress: 'text',
});

// Compound index for filtering
BikeSchema.index({ status: 1, isAvailable: 1, category: 1, dailyPrice: 1 });

export const BikeModel = mongoose.model('Bike', BikeSchema);
```

---

#### Collection 6: `bookings` (Reservations & Escrow State)
```javascript
const BookingSchema = new Schema({
  bookingCode: {
    type: String,
    required: true,
    unique: true, // e.g. 'RDE-942810'
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

  // Booking Window
  pickupDatetime: { type: Date, required: true, index: true },
  returnDatetime: { type: Date, required: true, index: true },
  actualPickupAt: Date,
  actualReturnedAt: Date,
  durationDays: { type: Number, required: true },

  // Delivery Choice
  isDoorstepDelivery: { type: Boolean, default: false },
  deliveryAddress: String,

  // Financial Computations Snapshot
  financials: {
    dailyRate: { type: Number, required: true },
    rentalSubtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    platformCommissionFee: { type: Number, required: true }, // 10% Platform fee
    ownerPayoutAmount: { type: Number, required: true },     // Rental Subtotal - Commission
    securityDeposit: { type: Number, required: true },
    totalAmountPaid: { type: Number, required: true },
  },

  // State Management
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

// Critical Compound Index: Fast lookup for overlapping bookings
BookingSchema.index({
  bikeId: 1,
  bookingStatus: 1,
  pickupDatetime: 1,
  returnDatetime: 1,
});

export const BookingModel = mongoose.model('Booking', BookingSchema);
```

---

#### Collection 7: `vehicle_inspections` (Handover & Return Checklists)
```javascript
const VehicleInspectionSchema = new Schema({
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true,
  },
  inspectionType: {
    type: String,
    enum: ['PICKUP', 'RETURN'],
    required: true,
  },
  odometerReadingKm: {
    type: Number,
    required: true,
  },
  fuelPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  bodyScratchesDescription: String,
  scratchMarkers: [{
    panel: String, // 'front_mudguard', 'tank_left', 'exhaust', etc.
    severity: String, // 'minor', 'deep', 'dent'
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

#### Collection 8: `rental_agreements` (Digital Contract & Tamper-Proof Audit)
```javascript
const RentalAgreementSchema = new Schema({
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true,
  },
  agreementNumber: {
    type: String,
    required: true,
    unique: true,
  },
  pdfDocumentUrl: {
    type: String,
    required: true,
  },
  contentSha256: {
    type: String,
    required: true,
  },
  renterIpAddress: {
    type: String,
    required: true,
  },
  renterUserAgent: String,
  termsVersion: {
    type: String,
    default: 'v2026.1',
  },
  signedTimestamp: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
  versionKey: false,
});

export const RentalAgreementModel = mongoose.model('RentalAgreement', RentalAgreementSchema);
```

---

#### Collection 9: `financial_ledger` (Double-Entry Escrow & Transactions)
```javascript
const FinancialLedgerSchema = new Schema({
  transactionCode: {
    type: String,
    required: true,
    unique: true, // e.g. 'TXN-90812'
    index: true,
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    index: true,
  },
  sourceUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  destinationUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  amount: {
    type: Number,
    required: true,
  },
  transactionType: {
    type: String,
    enum: [
      'BOOKING_PAYMENT',
      'SECURITY_DEPOSIT_HOLD',
      'SECURITY_DEPOSIT_REFUND',
      'PLATFORM_COMMISSION',
      'OWNER_PAYOUT',
      'DAMAGE_COMPENSATION',
      'LATE_FEE_PENALTY',
      'CANCELLATION_REFUND'
    ],
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESSFUL', 'FAILED', 'REVERSED'],
    default: 'SUCCESSFUL',
    index: true,
  },
  gateway: {
    provider: { type: String, default: 'RAZORPAY' }, // 'RAZORPAY', 'STRIPE', 'CASHFREE', 'UPI'
    orderId: String,
    paymentId: String,
    signature: String,
  },
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true, // Allows nulls while enforcing uniqueness when present
  },
  notes: String,
}, {
  timestamps: true,
  versionKey: false,
});

export const FinancialLedgerModel = mongoose.model('FinancialLedger', FinancialLedgerSchema);
```

---

#### Collection 10: `disputes` (Damage Claims & Arbitration)
```javascript
const DisputeSchema = new Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true, // e.g. 'REP-701'
    index: true,
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    index: true,
  },
  reporterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reporterRole: {
    type: String,
    enum: ['RENTER', 'OWNER', 'SYSTEM_BOT'],
    required: true,
  },
  category: {
    type: String,
    enum: ['BIKE_DAMAGE', 'LATE_RETURN', 'DOCUMENT_FRAUD', 'MECHANICAL_BREAKDOWN', 'COMMUNICATION_ISSUE'],
    required: true,
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
    index: true,
  },
  status: {
    type: String,
    enum: ['OPEN', 'IN_INVESTIGATION', 'RESOLVED', 'CLOSED'],
    default: 'OPEN',
    index: true,
  },
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

#### Collection 11: `otp_verifications` (Ephemeral with TTL Auto-Expiry)
```javascript
const OtpVerificationSchema = new Schema({
  phoneNumber: {
    type: String,
    required: true,
    index: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  referenceId: {
    type: String,
    required: true,
    unique: true,
  },
  attemptsCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // MongoDB TTL Index: Document automatically deleted after 5 minutes (300 seconds)!
  }
});

export const OtpVerificationModel = mongoose.model('OtpVerification', OtpVerificationSchema);
```

---

#### Collection 12: `platform_settings`
```javascript
const PlatformSettingSchema = new Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  value: {
    type: Schema.Types.Mixed,
    required: true,
  },
  description: String,
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  }
}, {
  timestamps: true,
  versionKey: false,
});

export const PlatformSettingModel = mongoose.model('PlatformSetting', PlatformSettingSchema);
```

---

## 3. Concurrency & Double-Booking Prevention in MongoDB

In MongoDB, preventing overlapping bookings without SQL exclusion constraints is achieved using **Multi-Document ACID Transactions**, **Redlock Distributed Mutex**, and **Compound Overlap Query Assertions**.

### 3.1 MongoDB Multi-Document ACID Transaction Implementation

When creating a booking, wrap the conflict check and booking insertion inside a MongoDB Transaction session:

```typescript
import mongoose from 'mongoose';
import { BookingModel } from './models/Booking';
import { ConflictException } from '@nestjs/common';

export async function createReservationWithTransaction(bookingData: CreateBookingDto) {
  const session = await mongoose.startSession();
  session.startTransaction({
    readConcern: { level: 'snapshot' },
    writeConcern: { level: 'majority' },
  });

  try {
    const { bikeId, pickupDatetime, returnDatetime } = bookingData;

    // 1. Check for ANY active booking on this bike overlapping requested dates
    const existingBooking = await BookingModel.findOne({
      bikeId: bikeId,
      bookingStatus: { 
        $nin: ['CANCELLED_BY_RENTER', 'CANCELLED_BY_OWNER', 'COMPLETED'] 
      },
      // Range overlap formula: (StartA < EndB) and (EndA > StartB)
      pickupDatetime: { $lt: new Date(returnDatetime) },
      returnDatetime: { $gt: new Date(pickupDatetime) },
    }).session(session);

    if (existingBooking) {
      throw new ConflictException(
        'This motorbike is already reserved by another rider for the selected dates.'
      );
    }

    // 2. Insert new reservation atomically
    const newBooking = new BookingModel(bookingData);
    await newBooking.save({ session });

    await session.commitTransaction();
    return newBooking;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

### 3.2 Redis Redlock Checkout Guard

During the 10-minute checkout window before payment gateway processing, a Redis distributed lock is held to prevent simultaneous payment creation:
- **Lock Key:** `redlock:bike:${bikeId}`
- **TTL:** 600,000 ms (10 minutes)
- If another renter selects the bike during this window, the backend immediately returns:
  `HTTP 409 Conflict: Vehicle temporarily held by another rider completing checkout.`

---

## 4. Comprehensive RESTful API Endpoints

All endpoints use standard JSON requests and responses. Authenticated endpoints require `Authorization: Bearer <jwt_access_token>`.

### 4.1 Authentication & Authorization (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/otp/send` | Public | Send 6-digit OTP to mobile phone (saved in TTL collection) |
| `POST` | `/api/v1/auth/otp/verify` | Public | Verify OTP against hash, return JWT session or prompt signup |
| `POST` | `/api/v1/auth/register` | Public | Complete profile with name, email, DOB (18+ verified) |
| `POST` | `/api/v1/auth/login` | Public | Email and password authentication fallback |
| `POST` | `/api/v1/auth/google` | Public | Google Identity OAuth (GSI Token / Mobile AuthSession exchange) |
| `POST` | `/api/v1/auth/refresh-token` | Public | Rotate expired access token using HTTP-only Refresh Token |
| `POST` | `/api/v1/auth/logout` | Auth | Revoke refresh token and invalidate Redis session |
| `GET` | `/api/v1/auth/me` | Auth | Retrieve current user profile, role, and verification status |

---

### 4.2 User & Profile Management (`/api/v1/users`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/users/profile` | Auth | Any | Get user profile details & KYC status |
| `PATCH` | `/api/v1/users/profile` | Auth | Any | Update avatar, display name, contact preferences |
| `POST` | `/api/v1/users/renter/kyc` | Auth | RENTER | Submit Driving License, class (MCWG/MCWOG), DOB |
| `GET` | `/api/v1/users/renter/kyc-status` | Auth | RENTER | Check driving credentials verification state |
| `POST` | `/api/v1/users/owner/kyc` | Auth | OWNER | Submit PAN, Aadhaar (last 4), Bank Account IFSC/UPI |
| `GET` | `/api/v1/users/owner/earnings` | Auth | OWNER | Aggregation overview of gross revenue and net payouts |

---

### 4.3 Public Motorbikes & Fleet Catalog (`/api/v1/bikes`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/bikes` | Public | Filtered catalog with pagination, text search, category, location, and sorting |
| `GET` | `/api/v1/bikes/:idOrCode` | Public | Complete bike details, 8-point technical specifications, gallery, guidelines |
| `GET` | `/api/v1/bikes/:id/availability` | Public | Check if bike is free between `pickupDate` and `returnDate` |
| `GET` | `/api/v1/bikes/categories` | Public | Return all fleet categories (Cruiser, Sports, Adventure, Commuter) with counts |
| `GET` | `/api/v1/bikes/featured` | Public | Curated lineup for homepage banners and premium recommendations |

#### Query Parameters for `GET /api/v1/bikes`:
- `q`: Text search query (matches `brand`, `model`, `category`, `pickupAddress`)
- `category`: `Cruiser Bikes` | `Sports & Track` | `Adventure Tourer` | `Scooters & Commuters`
- `city`: `Mumbai` | `Bengaluru` | `Pune` | `Delhi` | `Goa`
- `minPrice`: integer
- `maxPrice`: integer
- `pickupDate`: `YYYY-MM-DD`
- `returnDate`: `YYYY-MM-DD`
- `sortBy`: `price_asc` | `price_desc` | `rating_desc` | `featured`
- `page`: integer (default: 1)
- `limit`: integer (default: 12)

---

### 4.4 Bike Owner Listing Pipeline (`/api/v1/owner/listings`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/owner/listings` | Auth | OWNER | List all motorcycles owned by the authenticated host |
| `POST` | `/api/v1/owner/listings/draft` | Auth | OWNER | Initialize a new bike listing draft |
| `PUT` | `/api/v1/owner/listings/:id/step-bike-info` | Auth | OWNER | Save Brand, Model, Year, Reg #, Category, Engine CC, Specs |
| `POST` | `/api/v1/owner/listings/:id/upload-photo` | Auth | OWNER | Upload 4-angle vehicle photos (Front, Rear, Left, Right) |
| `POST` | `/api/v1/owner/listings/:id/upload-document` | Auth | OWNER | Upload RC, Insurance policy, and PUC certificates |
| `PUT` | `/api/v1/owner/listings/:id/step-rental-info`| Auth | OWNER | Set Daily Price, Security Deposit, Min/Max duration, Pickup location |
| `POST` | `/api/v1/owner/listings/:id/submit` | Auth | OWNER | Final validation and submission to Admin Verification Queue |
| `PATCH`| `/api/v1/owner/listings/:id/availability` | Auth | OWNER | Toggle active status or block out maintenance dates |

---

### 4.5 Booking & Quotation Engine (`/api/v1/bookings`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/bookings/quote` | Public / Auth | Any | Calculate billing days, daily rate, deposit, platform fee & total payable |
| `POST` | `/api/v1/bookings` | Auth | RENTER | Create reservation intent with MongoDB ACID transaction lock |
| `GET` | `/api/v1/bookings/my-trips` | Auth | RENTER | Retrieve renter's active, upcoming, and past rental vouchers |
| `GET` | `/api/v1/bookings/:id` | Auth | Any Party | Fetch complete booking details, voucher data, and timeline |
| `POST` | `/api/v1/bookings/:id/cancel` | Auth | Any Party | Cancel reservation with refund calculation based on policy |
| `POST` | `/api/v1/bookings/:id/agreement/sign` | Auth | RENTER | Digitally sign rental contract with IP stamp and identity hash |

---

### 4.6 Vehicle Inspection & Telematics (`/api/v1/inspections`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/inspections/pickup` | Auth | Owner/Executive | Record pickup odometer, fuel %, scratch map, and photos |
| `POST` | `/api/v1/inspections/pickup/sign` | Auth | RENTER | Renter confirms physical condition during handover |
| `POST` | `/api/v1/inspections/return` | Auth | Owner/Executive | Record return odometer, fuel %, damages, and overtime fees |
| `POST` | `/api/v1/inspections/return/sign` | Auth | RENTER | Renter confirms return condition and dispute release |
| `GET` | `/api/v1/inspections/booking/:bookingId`| Auth | Any Party | Fetch side-by-side pickup vs return inspection sheets |

---

### 4.7 Payments, Escrow & Settlements (`/api/v1/payments`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/payments/create-order` | Auth | RENTER | Create Razorpay/Stripe Order for rental fee + security deposit |
| `POST` | `/api/v1/payments/verify` | Auth | RENTER | Verify gateway payment signature and set status to `PAID_ESCROW` |
| `POST` | `/api/v1/payments/webhook` | Public (Signed) | Gateway | Asynchronous webhook listener for payment confirmations/refunds |
| `POST` | `/api/v1/payments/deposit/refund` | Auth | ADMIN | Manually trigger security deposit refund from escrow |
| `POST` | `/api/v1/payments/payout/settle` | Auth | ADMIN | Disburse net rental earnings to owner bank account |

---

### 4.8 Admin Verification Queues & Operations (`/api/v1/admin`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/admin/kpis` | Auth | ADMIN | Real-time counts using MongoDB aggregation pipelines |
| `GET` | `/api/v1/admin/verifications/owners` | Auth | ADMIN | Owner KYC queue with Aadhaar/PAN status & submitted files |
| `PUT` | `/api/v1/admin/verifications/owners/:id`| Auth | ADMIN | Approve, Reject, or Request Correction on owner KYC |
| `GET` | `/api/v1/admin/verifications/bikes` | Auth | ADMIN | Vehicle queue with RC, Insurance validity & chassis cross-checks |
| `PUT` | `/api/v1/admin/verifications/bikes/:id` | Auth | ADMIN | Approve, Reject, or mark physical inspection required |
| `GET` | `/api/v1/admin/verifications/renters`| Auth | ADMIN | Rider driving licenses queue with MCWG class validation |
| `PUT` | `/api/v1/admin/verifications/renters/:id`| Auth | ADMIN | Validate or reject driver license credentials |
| `GET` | `/api/v1/admin/bookings` | Auth | ADMIN | Global booking registry with search, status filters & date range |
| `PATCH`| `/api/v1/admin/bookings/:id/status` | Auth | ADMIN | Override booking status (e.g. mark Active, Overdue, Cancelled) |
| `GET` | `/api/v1/admin/ledger` | Auth | ADMIN | Complete audit log of all financial transactions & escrow holds |

---

### 4.9 Disputes, Damage & Claims Arbitration (`/api/v1/complaints`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/complaints` | Auth | Renter/Owner | Open incident ticket (bike damage, late return, misconduct) |
| `GET` | `/api/v1/complaints` | Auth | ADMIN | Filter incident tickets by priority (`CRITICAL`, `HIGH`, etc.) |
| `GET` | `/api/v1/complaints/:id` | Auth | ADMIN | Fetch case evidence, inspection photos, and timeline |
| `PUT` | `/api/v1/complaints/:id/resolve` | Auth | ADMIN | Settle dispute: deduct damage amount from escrow deposit, refund remainder |
| `POST` | `/api/v1/complaints/:id/penalize` | Auth | ADMIN | Freeze/flag account or suspend bike listing |

---

### 4.10 Hubs, Locations & Settings (`/api/v1/locations` & `/api/v1/settings`)

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/locations` | Public | Any | List operational cities, pickup hubs, coordinates, and hours |
| `GET` | `/api/v1/locations/nearby` | Public | Any | Find nearest pickup hubs using `$near` GeoJSON query |
| `POST` | `/api/v1/admin/locations` | Auth | ADMIN | Add new pickup/drop hub location |
| `GET` | `/api/v1/admin/settings` | Auth | ADMIN | Fetch platform settings (commissions, buffers, contact info) |
| `PUT` | `/api/v1/admin/settings` | Auth | ADMIN | Update platform commission or buffer thresholds |

---

## 5. Critical Backend Architecture & Implementation Essentials

### 5.1 Real-Time Analytics with MongoDB Aggregation Pipeline

KPIs for the Admin Dashboard (`GET /api/v1/admin/kpis`) are calculated using a high-performance aggregation pipeline with `$facet`:

```javascript
export async function getAdminPlatformKpis() {
  const result = await BookingModel.aggregate([
    {
      $facet: {
        totalRevenue: [
          { $match: { bookingStatus: { $in: ['ACTIVE', 'COMPLETED'] } } },
          { $group: { _id: null, total: { $sum: '$financials.rentalSubtotal' } } }
        ],
        activeBookingsCount: [
          { $match: { bookingStatus: 'ACTIVE' } },
          { $count: 'count' }
        ],
        completedBookingsCount: [
          { $match: { bookingStatus: 'COMPLETED' } },
          { $count: 'count' }
        ]
      }
    }
  ]);
  return result[0];
}
```

---

### 5.2 Driving License Class & Age Verification Rules

Under transport regulations, not all two-wheeler licenses permit operating high-displacement motorcycles:
- **MCWOG (Motorcycle Without Gear):** Valid only for automatic scooters (e.g. Honda Activa, TVS Jupiter). The system must reject booking requests for geared motorcycles (`Royal Enfield`, `KTM Duke`, `Kawasaki Ninja`, `Yamaha MT-15`) if the renter's profile is classified as `MCWOG`.
- **MCWG (Motorcycle With Gear):** Valid for all two-wheelers.
- **Minimum Age Rule:** Verified via DOB against government ID: Minimum age is strictly 18 years.

**Backend Validation Guard (Mongoose Hook / Service):**
```typescript
export function validateRiderEligibility(bike: BikeDocument, renter: RenterProfileDocument) {
  if (renter.kycStatus !== 'VERIFIED') {
    throw new ForbiddenException('Your driving credentials must be verified before booking.');
  }

  if (bike.transmission === 'Manual' && renter.dlClass === 'MCWOG') {
    throw new BadRequestException(
      'Your Driving License (MCWOG - Scooters Only) is not valid to rent manual geared motorcycles.'
    );
  }

  return true;
}
```

---

### 5.3 Data Protection & PII Security (DPDP Act Compliance)

- **Aadhaar Protection:** Never store 12-digit Aadhaar numbers in plaintext. Only store the last 4 digits (`•••• •••• 8912`) and the SHA-256 hash for fraud detection against duplicate accounts.
- **Private S3 Documents:** All RC, Driving License, and Insurance PDFs must be stored in a **Private S3 Bucket**. Public read permissions must be strictly disabled.
- **Pre-signed URLs:** When an Admin or Owner needs to view a document, generate an AWS S3 pre-signed URL with a lifetime of **15 minutes**:
  ```typescript
  const signedUrl = await s3.getSignedUrlPromise('getObject', {
    Bucket: process.env.S3_PRIVATE_BUCKET,
    Key: documentKey,
    Expires: 900 // 15 minutes
  });
  ```
- **Bank Details:** Bank account numbers stored in `owner_profiles` must be encrypted using AES-256-GCM at the application layer before insertion.

---

### 5.4 Scheduled Cron Jobs & Worker Architecture

| Worker / Cron Job | Schedule | MongoDB Query / Responsibility |
|---|---|---|
| `InsuranceExpiryScanner` | Daily at 02:00 AM | Queries `bikes` where `documents.docType = 'INSURANCE'` and `validUntil < (NOW() + 15 days)`. Sends alerts to owners and flags bike listing. |
| `EscrowRefundWorker` | Every 15 mins | Queries `bookings` where `bookingStatus = 'COMPLETED'`, `escrowStatus = 'HELD_IN_ESCROW'`, and `actualReturnedAt <= (NOW() - 48 hours)`. Verifies no active dispute in `disputes` collection and triggers instant bank refund. |
| `LateReturnNotifier` | Hourly | Queries active bookings where `returnDatetime < NOW()` and no return inspection document exists. Alerts Hub Manager and Owner. |
| `AgreementPdfGenerator` | On Booking Confirmation | Renders official rental agreement with IP address and digital signature hash, uploads PDF to S3, and emails copy to renter. |

---

## 6. Implementation Roadmap & Execution Checklist

- [x] **Phase 1: MongoDB Setup & Schemas**
  - Configure MongoDB 7.0 Replica Set (Atlas or self-hosted).
  - Implement Mongoose schemas with 2dsphere indexes, TTL index for OTP, and compound indexes for booking conflict resolution.
  - Seed initial platform settings, admin credentials, and hub locations.
- [ ] **Phase 2: Authentication & KYC Engine**
  - Implement Phone OTP service with Twilio/MSG91 + MongoDB TTL collection (`otp_verifications`).
  - Integrate Google OAuth ID Token verifier.
  - Implement Renter Driving License validation and MCWG classification checks.
- [ ] **Phase 3: Fleet Management & Listing Pipeline**
  - Implement 5-step bike listing API with draft persistence.
  - Setup AWS S3 / Cloudflare R2 private bucket with pre-signed upload URLs.
  - Integrate Admin review queues for Bike RC and Insurance verification.
- [ ] **Phase 4: Booking Engine & Escrow Transactions**
  - Implement dynamic price and deposit quote calculator.
  - Configure MongoDB Multi-Document ACID Transactions (`session.startTransaction()`) and Redis Redlock to prevent overlapping reservations.
  - Integrate Razorpay / Stripe Order creation and webhook verification.
- [ ] **Phase 5: Inspection & Dispute Management**
  - Build pickup and return inspection checklist APIs with multi-photo uploads.
  - Build dispute arbitration system with deposit deduction and settlement disbursements.
- [ ] **Phase 6: Notifications & Production Hardening**
  - Implement WhatsApp Cloud API notification triggers for booking vouchers.
  - Configure Prometheus & Grafana telemetry for API latency and transaction monitoring.
