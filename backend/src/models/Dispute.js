import mongoose, { Schema } from 'mongoose';

const DisputeSchema = new Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
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
    enum: [
      'BIKE_DAMAGE',
      'LATE_RETURN',
      'DOCUMENT_FRAUD',
      'MECHANICAL_BREAKDOWN',
      'COMMUNICATION_ISSUE'
    ],
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
  description: {
    type: String,
    required: true,
  },
  evidenceUrls: [{
    type: String,
  }],
  repairEstimateAmount: {
    type: Number,
    default: 0,
  },
  deductedFromDepositAmount: {
    type: Number,
    default: 0,
  },
  assignedAdminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  adminInternalNotes: {
    type: String,
  },
  finalResolutionSummary: {
    type: String,
  },
  penalties: {
    userPenalized: {
      type: Boolean,
      default: false,
    },
    listingSuspended: {
      type: Boolean,
      default: false,
    },
  },
  resolvedAt: {
    type: Date,
  },
}, {
  timestamps: true,
  versionKey: false,
});

export const DisputeModel = mongoose.models.Dispute || mongoose.model('Dispute', DisputeSchema);
export default DisputeModel;

