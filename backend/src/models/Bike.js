import mongoose, { Schema } from 'mongoose';

const BikeSchema = new Schema({
  name: { type: String }, // e.g. "Night Hawk Cruiser"
  brand: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
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
  chassisNumber: { type: String, uppercase: true, trim: true },
  engineNumber: { type: String, uppercase: true, trim: true },
  engineCapacityCc: { type: Number, required: true },
  transmission: { type: String, enum: ['Manual', 'Automatic'], default: 'Manual' },
  fuelType: { type: String, default: 'Petrol' },
  color: { type: String, trim: true },
  tagline: { type: String },

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
    fuelType: String,
  },
  features: [{ type: String, trim: true }],

  // Media & Compliance Documents
  images: {
    front: String,
    rear: String,
    left: String,
    right: String,
    thumbnail: String,
  },
  photos: {
    front: String,
    rear: String,
    left: String,
    right: String,
    thumbnail: String,
  },
  gallery: [{ type: String }],
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
  currentBookedByEmail: {
    type: String,
    default: null,
    trim: true,
    lowercase: true,
    index: true,
  },

  pickupAddress: { type: String, required: true },
  pickupTimings: { type: String, default: '07:00 AM - 09:00 PM' },
  doorstepDeliveryAvailable: { type: Boolean, default: false },
  doorstepDeliveryFee: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  rating: { type: Number, default: 5.0 },
  reviewsCount: { type: Number, default: 0 },
  status: { type: String, default: 'APPROVED', index: true },
  listingCode: { type: String, unique: true },
}, {
  timestamps: true,
  versionKey: false,
});

// Full-text search index
BikeSchema.index({ brand: 'text', model: 'text', category: 'text', pickupAddress: 'text' });
BikeSchema.index({ isBooked: 1, category: 1, dailyPrice: 1 });

export const BikeModel = mongoose.models.Bike || mongoose.model('Bike', BikeSchema);
export default BikeModel;
