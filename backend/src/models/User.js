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
    enum: ['RENTER', 'OWNER', 'ADMIN'],
    default: 'RENTER',
    index: true,
  },
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

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export default UserModel;
