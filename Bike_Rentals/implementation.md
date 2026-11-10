# The Road Eagle (Bike_Rentals) — Single-Owner Fleet Architecture Specification

**Document Version:** 4.0.0 (Single-Owner Direct Fleet Edition)  
**Business Model:** Single-Owner / Direct Motorcycle Rental Business (Zero P2P Marketplace)  
**Database Engine:** MongoDB 7.0+ (MongoDB Atlas / Community Replica Set)  
**Backend Framework:** Node.js (v20+ LTS) with Express.js (`d:\BikeTS\backend`)  
**Frontend Client:** React Native / Expo Web & Mobile Platform (`d:\BikeTS\Bike_Rentals`)  
**Caching & Queue Dependencies:** **NONE** (100% BullMQ and Redis Free)  
**Authentication Standard:** Email OTP & Google OAuth  

---

## 1. Executive Summary & New Business Requirements

### 1.1 Business Model Transition
The platform has transitioned from a P2P marketplace to a **Direct Single-Owner Motorcycle Fleet Rental Service**:
1. **Single Fleet Owner:** Only the business owner has permission to upload, manage, edit, and price motorcycles. Regular users cannot list their personal motorcycles.
2. **Owner Info Entered Once:** The owner's personal, business, and contact details are stored **once** in a single business profile. When adding a new bike to the fleet, the owner only inputs the motorcycle specifications, documents, and pricing — without re-entering owner info every time.
3. **No P2P Admin Overhead:** Multi-owner KYC queues, platform commission splits, host payouts, and marketplace arbitration workflows are completely obsolete. The owner is the sole platform operator.
4. **Conditional Booking Visibility Rules:**
   - **User who booked the bike:** The bike card appears **darkened (dimmed/grayed)** with a distinct **"BOOKED"** badge. Clicking this card opens their full booking confirmation voucher with dates, pricing breakdown, and pickup checklist.
   - **Other users (who did not book):** The booked bike is **completely hidden** from their catalog view so they cannot see or book an unavailable vehicle.
   - **Fleet Owner:** Sees all bikes, including booked bikes marked with a "BOOKED" badge, and can view the renter's identity, contact information, and booking timeline.

---

## 2. Definitive Answers to Your Architectural Questions

### 2.1 Is there any need for BullMQ and Redis?
**NO, ABSOLUTELY NOT. Zero need for BullMQ and Redis.**
- **Email OTP Expiry:** MongoDB natively handles this using a **TTL (Time-To-Live) index** (`expires: 300`). Expired OTPs self-delete automatically after 5 minutes without Redis.
- **Booking Concurrency:** In a direct fleet model, double-booking is prevented using MongoDB's atomic `findOneAndUpdate({ _id: bikeId, isBooked: false }, { isBooked: true, currentBookingId: ... })`. It executes in a single atomic database tick.
- **Background Jobs:** In a single-owner fleet, sending an email confirmation or generating an invoice doesn't require distributed Redis workers; standard asynchronous Node.js promises or lightweight event emitters handle this with zero infrastructure cost.
- **Result:** You can completely uninstall and avoid `bullmq`, `ioredis`, and `redis`.

---

## 3. Comprehensive Removal Checklist (Frontend & Backend)

### 3.1 What to Remove from Frontend (`d:\BikeTS\Bike_Rentals`)

| Component / File | Action | Reason |
|---|---|---|
| `src/screens/AdminDashboardScreen.jsx` | **Remove** | No multi-owner marketplace moderation or verification queues exist. |
| `src/components/admin/*` (All 8 Modals & Sidebars) | **Remove** | `AdminSidebar.jsx`, `AdminTopbar.jsx`, `BikeVerificationModal.jsx`, `BookingDetailsModal.jsx`, `ComplaintDetailsModal.jsx`, `EditBikeListingModal.jsx`, `OwnerDetailsModal.jsx`, `RenterDetailsModal.jsx` are obsolete. |
| `src/components/CustomHeader.jsx` ("Admin" button) | **Remove** | Remove the admin crown/shield button that navigated to `AdminDashboard`. |
| `src/screens/HomeScreen.jsx` ("Admin Portal" button) | **Remove** | Remove the bottom shortcut to the Admin Dashboard. |
| `src/components/rentBike/StepOwnerInfo.jsx` | **Remove from Wizard** | Owner information must not be asked every time a bike is listed. Replace the 5-step wizard with a streamlined 3-step Bike Addition wizard for the Owner (1. Bike Info, 2. Documents, 3. Rental Rates). |
| `src/data/marketplaceData.js` | **Purge / Simplify** | Remove `INITIAL_OWNERS`, `INITIAL_COMPLAINTS`, multi-owner mock arrays. |
| Commission & Payout Displays | **Remove** | Remove "10% platform fee" and "Owner Payout" calculations in `BookingScreen.jsx` and `QuoteModal.jsx`. Total rental fee goes 100% to the fleet owner. |

---

### 3.2 What to Remove from Backend (`d:\BikeTS\backend`)

| Backend Module | Action | Reason |
|---|---|---|
| `bullmq`, `redis`, `ioredis` | **Remove** | Unneeded dependencies. Native MongoDB handles TTLs and atomic locks. |
| `owner_profiles` collection | **Remove** | Replaced with a single `business_settings` document. |
| Verification Queues (`/api/v1/admin/verifications/*`) | **Remove** | No external owners need KYC, Aadhaar, or RC verification. |
| Platform Commission & Split Logic | **Remove** | Direct merchant model: Revenue = Rental Fee. |
| Multi-owner Payout & Withdrawal APIs | **Remove** | No host settlements, escrow split disbursements, or payout balances. |

---

## 4. Pure MongoDB Schema Design (Optimized Single-Owner Fleet)

The database schema is streamlined to 8 essential collections:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MONGODB 7.0 COLLECTIONS                         │
├─────────────────────┬────────────────────┬─────────────────────────────┤
│ 1. users            │ 4. bookings        │ 7. reviews                  │
│ 2. email_otps (TTL) │ 5. payments        │ 8. business_settings        │
│ 3. bikes            │ 6. inspections     │                             │
└─────────────────────┴────────────────────┴─────────────────────────────┘
```

---

### Collection 1: `users` (Renters & Sole Owner)
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
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  phoneCountryCode: {
    type: String,
    default: '+91',
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
  role: {
    type: String,
    enum: ['RENTER', 'OWNER'],
    default: 'RENTER',
    index: true,
  },
  // Rider driving details (filled during booking or profile)
  drivingLicense: {
    dlNumber: String,
    dlExpiryDate: Date,
    dlClass: { type: String, enum: ['MCWOG', 'MCWG', 'LMV', 'INTERNATIONAL_PERMIT'] },
    isVerified: { type: Boolean, default: false },
  },
  dateOfBirth: Date,
  avatarUrl: String,
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
  versionKey: false,
});

export const UserModel = mongoose.model('User', UserSchema);
```

---

### Collection 2: `email_otps` (Native MongoDB Auto-Expiring OTP)
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
  attemptsCount: {
    type: Number,
    default: 0,
    max: 3,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // 👈 5-Minute Auto-Expiry via MongoDB TTL Index
  },
});

export const EmailOtpModel = mongoose.model('EmailOtp', EmailOtpSchema);
```

---

### Collection 3: `bikes` (Owner Fleet Inventory)
*Tracks availability, specs, images, documents, and current booking state.*

```javascript
const BikeSchema = new Schema({
  name: { type: String, required: true }, // e.g. "Night Hawk Cruiser"
  brand: { type: String, required: true }, // e.g. "Royal Enfield"
  model: { type: String, required: true }, // e.g. "Meteor 350"
  manufacturingYear: { type: Number, required: true },
  category: {
    type: String,
    enum: ['Cruiser Bikes', 'Sports & Track', 'Adventure Tourer', 'Scooters & Commuters'],
    required: true,
    index: true,
  },
  registrationNumber: { type: String, required: true, unique: true, uppercase: true },
  engineCapacityCc: { type: Number, required: true },
  transmission: { type: String, enum: ['Manual', 'Automatic'], default: 'Manual' },
  fuelType: { type: String, default: 'Petrol' },
  color: String,
  tagline: String,
  
  // Pricing
  dailyPrice: { type: Number, required: true },
  securityDeposit: { type: Number, required: true, default: 3000 },
  
  // 8-Point Specs
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
  },
  features: [String],
  
  // Media & Compliance Documents
  images: {
    front: String,
    rear: String,
    left: String,
    right: String,
    thumbnail: String,
  },
  documents: {
    rcSmartCardUrl: String,
    insurancePolicyUrl: String,
    insuranceExpiryDate: Date,
    pucCertificateUrl: String,
    pucExpiryDate: Date,
  },

  // Booking Status & Visibility Controls
  isBooked: {
    type: Boolean,
    default: false,
    index: true,
  },
  currentBookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    default: null,
  },
  currentBookedByUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  
  pickupAddress: { type: String, required: true },
  isFeatured: { type: Boolean, default: false },
  rating: { type: Number, default: 5.0 },
  reviewsCount: { type: Number, default: 0 },
}, {
  timestamps: true,
  versionKey: false,
});

// Full-text search index
BikeSchema.index({ name: 'text', brand: 'text', model: 'text', category: 'text' });

export const BikeModel = mongoose.model('Bike', BikeSchema);
```

---

### Collection 4: `bookings` (Rental Transactions & Confirmation Records)
```javascript
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
  },

  // Financial Breakdown (All goes directly to Fleet Owner)
  pricing: {
    dailyRate: Number,
    rentalTotal: Number,
    securityDeposit: Number,
    deliveryFee: Number,
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

export const BookingModel = mongoose.model('Booking', BookingSchema);
```

---

### Collection 5: `business_settings` (Owner Information Stored Once)
*Eliminates the requirement to enter owner details on every bike listing.*

```javascript
const BusinessSettingSchema = new Schema({
  ownerUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  businessName: { type: String, default: 'The Road Eagle' },
  ownerFullName: { type: String, required: true },
  contactPhone: { type: String, required: true },
  contactEmail: { type: String, required: true },
  emergencyPhone: String,
  defaultPickupHub: {
    name: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
  },
  operatingHours: {
    openTime: { type: String, default: '07:00 AM' },
    closeTime: { type: String, default: '09:00 PM' },
  },
  upiId: String,
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
  },
  rentalTerms: [String],
}, {
  timestamps: true,
  versionKey: false,
});

export const BusinessSettingModel = mongoose.model('BusinessSetting', BusinessSettingSchema);
```

---

## 5. Dynamic Fleet Visibility Logic (Query Layer)

To satisfy the visibility requirement:
1. **Unauthenticated / Other Users:** Must only see bikes that are **NOT** booked (`isBooked: false`).
2. **User Who Booked the Bike:** Sees their booked bike with `isBooked: true` and `isMyBooking: true`.
3. **Owner:** Sees all bikes, with complete renter details populated on booked bikes.

### Backend Implementation (`GET /api/v1/bikes`):
```javascript
export async function getBikesCatalog(req, res) {
  try {
    const currentUserId = req.user?._id;
    const isOwner = req.user?.role === 'OWNER';

    let query = {};

    if (isOwner) {
      // 👑 OWNER: Sees every bike in the fleet, populated with booking and renter details
      const bikes = await BikeModel.find()
        .populate({
          path: 'currentBookingId',
          populate: { path: 'renterId', select: 'fullName email phoneNumber drivingLicense' }
        })
        .lean();

      return res.json({ success: true, count: bikes.length, data: bikes });
    }

    if (currentUserId) {
      // 👤 LOGGED-IN RENTER:
      // Sees all unbooked bikes PLUS the bike(s) they personally booked
      query = {
        $or: [
          { isBooked: false },
          { isBooked: true, currentBookedByUserId: currentUserId }
        ]
      };
    } else {
      // 🌐 GUEST / NOT LOGGED IN:
      // Only sees unbooked bikes
      query = { isBooked: false };
    }

    const bikes = await BikeModel.find(query).lean();

    // Mark 'isMyBooking' flag so client can render dark card with 'BOOKED' badge
    const formattedBikes = bikes.map((bike) => ({
      ...bike,
      isMyBooking: currentUserId && String(bike.currentBookedByUserId) === String(currentUserId),
    }));

    return res.json({ success: true, count: formattedBikes.length, data: formattedBikes });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}
```

---

## 6. Frontend Card UI & Navigation Behavior

### 6.1 BikeCard Component Behavior (`src/components/BikeCard.jsx`)

```javascript
export default function BikeCard({ bike, currentUser, onSelect, onOpenBookingDetails }) {
  const isMyBookedBike = bike.isBooked && bike.isMyBooking;
  const isOwnerViewing = currentUser?.role === 'OWNER' && bike.isBooked;

  if (isMyBookedBike) {
    // 🏍️ Renter who booked this bike: Darkened card with "BOOKED" badge
    return (
      <TouchableOpacity
        style={[styles.card, styles.cardBookedDark]}
        onPress={() => onOpenBookingDetails(bike.currentBookingId || bike)}
        activeOpacity={0.8}
      >
        <View style={styles.bookedBadgeOverlay}>
          <Text style={styles.bookedBadgeText}>BOOKED BY YOU</Text>
        </View>
        <Image source={{ uri: bike.images?.thumbnail || bike.image }} style={styles.darkenedImage} />
        <View style={styles.cardContent}>
          <Text style={styles.title}>{bike.name}</Text>
          <Text style={styles.bookedPromptText}>Tap to view your booking receipt & pickup details</Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (isOwnerViewing) {
    // 👑 Owner viewing booked bike: Shows renter details button
    return (
      <View style={[styles.card, styles.ownerBookedCard]}>
        <View style={styles.ownerBadgeRow}>
          <Text style={styles.ownerBookedTag}>BOOKED</Text>
          <Text style={styles.renterNameSnippet}>
            Renter: {bike.currentBookingId?.renterId?.fullName || 'Active Rider'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.viewRenterBtn}
          onPress={() => onOpenBookingDetails(bike.currentBookingId)}
        >
          <Text style={styles.viewRenterBtnText}>View Customer & Booking Details</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Regular available bike card for browsing
  return (
    <TouchableOpacity style={styles.card} onPress={() => onSelect(bike)}>
      {/* Standard bike card layout */}
    </TouchableOpacity>
  );
}
```

---

## 7. Streamlined RESTful API Endpoints

### 7.1 Authentication (Pure Email OTP)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/email-otp/send` | Public | Dispatches 6-digit OTP code to rider's email (stored in TTL collection). |
| `POST` | `/api/v1/auth/email-otp/verify` | Public | Validates OTP and returns JWT token + user role. |
| `POST` | `/api/v1/auth/google` | Public | Google Identity OAuth token exchange. |
| `GET` | `/api/v1/auth/me` | Authenticated | Fetches current user profile and role (`RENTER` or `OWNER`). |

---

### 7.2 Fleet Management (Owner Only)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/owner/bikes` | **Owner Only** | Adds a new bike to fleet (uses pre-saved business info automatically). |
| `PUT` | `/api/v1/owner/bikes/:id` | **Owner Only** | Updates price, images, or specs for a bike. |
| `DELETE`| `/api/v1/owner/bikes/:id` | **Owner Only** | Removes or unpublishes a motorcycle from the fleet. |
| `GET` | `/api/v1/owner/settings` | **Owner Only** | Retrieves stored business/owner profile. |
| `PUT` | `/api/v1/owner/settings` | **Owner Only** | Updates business details (contact, address, UPI) once. |

---

### 7.3 Public Catalog & Reservations (Renters & Public)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/bikes` | Public / Auth | Filtered fleet query obeying conditional visibility rules. |
| `GET` | `/api/v1/bikes/:id` | Public | Detailed specs, 4-angle gallery, and rental terms. |
| `POST` | `/api/v1/bookings/reserve` | Authenticated | Atomically books vehicle, sets `isBooked: true`, logs transaction. |
| `GET` | `/api/v1/bookings/:id` | Authenticated | Retrieves booking voucher (dates, receipt, ref #). |
| `POST` | `/api/v1/bookings/:id/cancel`| Authenticated | Cancels reservation and re-opens bike (`isBooked: false`). |

---

## 8. Summary of Steps to Execute the Transition

1. **Backend (`d:\BikeTS\backend`):**
   - Confirm `package.json` contains no `bullmq` or `redis`.
   - Setup Mongoose models: `User`, `EmailOtp`, `Bike`, `Booking`, `BusinessSetting`.
   - Implement `isBooked` atomic lock in reservation controller.
   - Implement conditional query in `GET /api/v1/bikes`.
2. **Frontend (`d:\BikeTS\Bike_Rentals`):**
   - Delete `src/screens/AdminDashboardScreen.jsx` and `src/components/admin/` folder.
   - Remove "Admin" navigation buttons from `CustomHeader.jsx` and `HomeScreen.jsx`.
   - Refactor `RentBikeScreen.jsx`: Remove Step 1 (Owner Info) for the owner; save business settings once.
   - Update `BikeCard.jsx` to render dark with "BOOKED" badge when `bike.isMyBooking === true`, and render customer info button when viewed by the Owner.
