import mongoose, { Schema } from 'mongoose';

const HubSchema = new Schema({
  city: {
    type: String,
    required: true,
    index: true,
  },
  hubName: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
  },
  pincode: {
    type: String,
    trim: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  openingTime: {
    type: String,
    default: '07:00',
  },
  closingTime: {
    type: String,
    default: '22:00',
  },
  contactPhone: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  versionKey: false,
});

HubSchema.index({ location: '2dsphere' });

export const HubModel = mongoose.models.Hub || mongoose.model('Hub', HubSchema);
export default HubModel;

