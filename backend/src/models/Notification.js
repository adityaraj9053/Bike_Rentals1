import mongoose, { Schema } from 'mongoose';

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
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
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
  targetEntityId: {
    type: String,
  },
  deepLinkScreen: {
    type: String,
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  readAt: {
    type: Date,
  },
}, {
  timestamps: true,
  versionKey: false,
});

NotificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });

export const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
export default NotificationModel;

