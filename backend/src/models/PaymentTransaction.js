import mongoose, { Schema } from 'mongoose';

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
  amountInr: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  gatewayProvider: {
    type: String,
    enum: ['RAZORPAY', 'STRIPE', 'CASHFREE', 'PAY_AT_HUB'],
    default: 'RAZORPAY',
  },
  gatewayOrderId: {
    type: String,
    index: true,
  },
  gatewayPaymentId: {
    type: String,
    index: true,
  },
  gatewaySignature: {
    type: String,
  },
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
  webhookReceived: {
    type: Boolean,
    default: false,
  },
  webhookEvent: {
    type: String,
  },
  rawWebhookPayload: {
    type: Schema.Types.Mixed,
  },
  errorCode: {
    type: String,
  },
  errorDescription: {
    type: String,
  },
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true,
  },
}, {
  timestamps: true,
  versionKey: false,
});

export const PaymentTransactionModel = mongoose.models.PaymentTransaction || mongoose.model('PaymentTransaction', PaymentTransactionSchema);
export default PaymentTransactionModel;

