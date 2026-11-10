import mongoose, { Schema } from 'mongoose';

const BikeAvailabilityBlockSchema = new Schema({
  bikeId: {
    type: Schema.Types.ObjectId,
    ref: 'Bike',
    required: true,
    index: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'OwnerProfile',
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
    index: true,
  },
  endDate: {
    type: Date,
    required: true,
    index: true,
  },
  reason: {
    type: String,
    enum: ['SCHEDULED_MAINTENANCE', 'PERSONAL_USE', 'RTO_INSPECTION', 'ACCIDENT_REPAIR', 'SEASONAL_BREAK'],
    default: 'SCHEDULED_MAINTENANCE',
  },
  notes: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
}, {
  timestamps: true,
  versionKey: false,
});

BikeAvailabilityBlockSchema.index({ bikeId: 1, isActive: 1, startDate: 1, endDate: 1 });

export const BikeAvailabilityBlockModel = mongoose.models.BikeAvailabilityBlock || mongoose.model('BikeAvailabilityBlock', BikeAvailabilityBlockSchema);
export default BikeAvailabilityBlockModel;

