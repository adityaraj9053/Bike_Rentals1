import mongoose, { Schema } from 'mongoose';

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
        if (!dob) return false;
        const cutoff = new Date();
        cutoff.setFullYear(cutoff.getFullYear() - 18);
        return new Date(dob) <= cutoff;
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

export const RenterProfileModel = mongoose.models.RenterProfile || mongoose.model('RenterProfile', RenterProfileSchema);
export default RenterProfileModel;

