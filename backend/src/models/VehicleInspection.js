import mongoose, { Schema } from 'mongoose';

const ScratchMarkerSubSchema = new Schema({
  panel: {
    type: String,
    trim: true,
  },
  severity: {
    type: String,
    enum: ['MINOR', 'MODERATE', 'SEVERE'],
    default: 'MINOR',
  },
  xRatio: {
    type: Number,
  },
  yRatio: {
    type: Number,
  },
}, { _id: false });

const VehicleInspectionSchema = new Schema({
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true,
  },
  inspectionType: {
    type: String,
    enum: ['PICKUP', 'RETURN'],
    required: true,
  },
  odometerReadingKm: {
    type: Number,
    required: true,
  },
  fuelPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  bodyScratchesDescription: {
    type: String,
  },
  scratchMarkers: [ScratchMarkerSubSchema],
  photos: [{
    type: String,
  }],
  signedByRenter: {
    type: Boolean,
    default: false,
  },
  signedByExecutiveOrOwner: {
    type: Boolean,
    default: false,
  },
  inspectionTimestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  versionKey: false,
});

VehicleInspectionSchema.index({ bookingId: 1, inspectionType: 1 }, { unique: true });

export const VehicleInspectionModel = mongoose.models.VehicleInspection || mongoose.model('VehicleInspection', VehicleInspectionSchema);
export default VehicleInspectionModel;

