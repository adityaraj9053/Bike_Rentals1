import mongoose, { Schema } from 'mongoose';

const ReviewSchema = new Schema({
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true,
    index: true,
  },
  bikeId: {
    type: Schema.Types.ObjectId,
    ref: 'Bike',
    required: true,
    index: true,
  },
  renterId: {
    type: Schema.Types.ObjectId,
    ref: 'RenterProfile',
    required: true,
    index: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'OwnerProfile',
    required: true,
    index: true,
  },
  reviewType: {
    type: String,
    enum: ['RENTER_TO_BIKE', 'RENTER_TO_OWNER', 'OWNER_TO_RENTER'],
    default: 'RENTER_TO_BIKE',
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  cleanlinessScore: {
    type: Number,
    min: 1,
    max: 5,
  },
  enginePerformanceScore: {
    type: Number,
    min: 1,
    max: 5,
  },
  communicationScore: {
    type: Number,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
  },
  reviewPhotos: [{
    type: String,
  }],
  ownerReply: {
    comment: String,
    repliedAt: Date,
  },
  isApproved: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  versionKey: false,
});

ReviewSchema.index({ bikeId: 1, isApproved: 1, createdAt: -1 });

export const ReviewModel = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
export default ReviewModel;

