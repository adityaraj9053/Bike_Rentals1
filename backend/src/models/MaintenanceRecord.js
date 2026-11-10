import mongoose, { Schema } from 'mongoose';

const MaintenanceRecordSchema = new Schema({
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
    index: true,
  },
  serviceType: {
    type: String,
    enum: [
      'ROUTINE_SERVICE',
      'OIL_AND_FILTER_CHANGE',
      'BRAKE_PAD_REPLACEMENT',
      'TIRE_REPLACEMENT',
      'CHAIN_LUBRICATION_TENSION',
      'ACCIDENTAL_DAMAGE_REPAIR',
      'BATTERY_REPLACEMENT',
      'PUC_EMISSION_TEST'
    ],
    required: true,
  },
  odometerReadingKm: {
    type: Number,
    required: true,
  },
  serviceDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  costInr: {
    type: Number,
    required: true,
    default: 0,
  },
  workshopName: {
    type: String,
    trim: true,
  },
  workshopContact: {
    type: String,
    trim: true,
  },
  invoiceBillUrl: {
    type: String,
  },
  partsReplaced: [{
    type: String,
    trim: true,
  }],
  mechanicNotes: {
    type: String,
  },
  nextServiceDueKm: {
    type: Number,
  },
  nextServiceDueDate: {
    type: Date,
  },
}, {
  timestamps: true,
  versionKey: false,
});

MaintenanceRecordSchema.index({ bikeId: 1, serviceDate: -1 });

export const MaintenanceRecordModel = mongoose.models.MaintenanceRecord || mongoose.model('MaintenanceRecord', MaintenanceRecordSchema);
export default MaintenanceRecordModel;

