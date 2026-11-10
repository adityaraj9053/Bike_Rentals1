import mongoose, { Schema } from 'mongoose';

const PlatformSettingSchema = new Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  value: {
    type: Schema.Types.Mixed,
    required: true,
  },
  description: {
    type: String,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  versionKey: false,
});

export const PlatformSettingModel = mongoose.models.PlatformSetting || mongoose.model('PlatformSetting', PlatformSettingSchema);
export default PlatformSettingModel;

