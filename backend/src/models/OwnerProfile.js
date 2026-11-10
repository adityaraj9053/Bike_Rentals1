import mongoose, { Schema } from 'mongoose';

const OwnerProfileSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  businessName: {
    type: String,
    trim: true,
  },
  isFleetOperator: {
    type: Boolean,
    default: false,
  },
  panNumber: {
    type: String,
    uppercase: true,
    trim: true,
  },
  aadhaarLastFour: {
    type: String,
    minlength: 4,
    maxlength: 4,
  },
  bankAccountEncrypted: {
    accountNumber: String,
    ifsc: String,
    accountHolderName: String,
    vpaUpi: String,
  },
  kycStatus: {
    type: String,
    enum: ['NOT_SUBMITTED', 'PENDING_REVIEW', 'VERIFIED', 'NEEDS_CORRECTION', 'REJECTED'],
    default: 'PENDING_REVIEW',
    index: true,
  },
  kycRejectionReason: String,
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  verifiedAt: Date,
  totalEarningsPaisa: {
    type: Number,
    default: 0,
  },
  ownerRating: {
    type: Number,
    default: 5.0,
  },
}, {
  timestamps: true,
  versionKey: false,
});

export const OwnerProfileModel = mongoose.models.OwnerProfile || mongoose.model('OwnerProfile', OwnerProfileSchema);
export default OwnerProfileModel;

