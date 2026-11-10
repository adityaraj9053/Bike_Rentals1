import mongoose, { Schema } from 'mongoose';

const SupportTicketSchema = new Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
  },
  category: {
    type: String,
    enum: [
      'BOOKING_INQUIRY',
      'PAYMENT_FAILED_DEDUCTED',
      'DOCUMENT_UPLOAD_HELP',
      'HUB_PICKUP_LOCATION_ASSISTANCE',
      'ACCOUNT_ACCESS',
      'GENERAL_FEEDBACK'
    ],
    required: true,
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM',
    index: true,
  },
  status: {
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'],
    default: 'OPEN',
    index: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
  },
  attachments: [{
    type: String,
  }],
  assignedAdminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  resolutionNotes: {
    type: String,
  },
  resolvedAt: {
    type: Date,
  },
}, {
  timestamps: true,
  versionKey: false,
});

export const SupportTicketModel = mongoose.models.SupportTicket || mongoose.model('SupportTicket', SupportTicketSchema);
export default SupportTicketModel;

