import mongoose, { Schema } from 'mongoose';

const RefundSchema = new Schema({
  refundCode: {
    type: String,
    required: true,
    unique: true,
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
  amountInr: {
    type: Number,
    required: true,
  },
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
  gatewayRefundId: {
    type: String,
    index: true,
  },
  status: {
    type: String,
    enum: ['INITIATED', 'PENDING', 'PROCESSED', 'FAILED'],
    default: 'INITIATED',
    index: true,
  },
  failureReason: {
    type: String,
  },
  processedAt: {
    type: Date,
  },
  processedByAdminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  versionKey: false,
});

export const RefundModel = mongoose.models.Refund || mongoose.model('Refund', RefundSchema);
export default RefundModel;

