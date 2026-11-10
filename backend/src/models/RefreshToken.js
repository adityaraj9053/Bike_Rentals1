import mongoose, { Schema } from 'mongoose';

const RefreshTokenSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tokenHash: {
    type: String,
    required: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  isRevoked: {
    type: Boolean,
    default: false,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000, // 30 days TTL auto expiration
  },
}, {
  versionKey: false,
});

export const RefreshTokenModel = mongoose.models.RefreshToken || mongoose.model('RefreshToken', RefreshTokenSchema);
export default RefreshTokenModel;

