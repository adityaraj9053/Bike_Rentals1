import mongoose, { Schema } from 'mongoose';

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
  targetEntityId: {
    type: String,
    required: true,
    index: true,
  },
  beforeSnapshot: {
    type: Schema.Types.Mixed,
  },
  afterSnapshot: {
    type: Schema.Types.Mixed,
  },
  adminNotes: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  versionKey: false,
});

AuditLogSchema.index({ targetEntityType: 1, targetEntityId: 1, timestamp: -1 });

export const AuditLogModel = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
export default AuditLogModel;

