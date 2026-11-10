import mongoose, { Schema } from 'mongoose';

const RentalAgreementSchema = new Schema({
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true,
  },
  agreementNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  pdfDocumentUrl: {
    type: String,
    required: true,
  },
  contentSha256: {
    type: String,
    required: true,
  },
  renterIpAddress: {
    type: String,
    required: true,
  },
  renterUserAgent: {
    type: String,
  },
  termsVersion: {
    type: String,
    default: 'v2026.1',
  },
  signedTimestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  versionKey: false,
});

export const RentalAgreementModel = mongoose.models.RentalAgreement || mongoose.model('RentalAgreement', RentalAgreementSchema);
export default RentalAgreementModel;

