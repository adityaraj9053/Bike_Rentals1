import mongoose, { Schema } from 'mongoose';

const BusinessSettingSchema = new Schema({
  ownerUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  businessName: { type: String, default: 'The Road Eagle' },
  ownerFullName: { type: String, required: true },
  contactPhone: { type: String, required: true },
  contactEmail: { type: String, required: true },
  emergencyPhone: String,
  defaultPickupHub: {
    name: { type: String, default: 'The Road Eagle Flagship Hub' },
    address: { type: String, default: '123 Rider Avenue, Sector 5' },
    city: { type: String, default: 'Mumbai' },
    state: { type: String, default: 'Maharashtra' },
    pincode: { type: String, default: '400050' },
  },
  operatingHours: {
    openTime: { type: String, default: '07:00 AM' },
    closeTime: { type: String, default: '09:00 PM' },
  },
  upiId: { type: String, default: 'roadeagle@upi' },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
  },
  rentalTerms: [{ type: String }],
}, {
  timestamps: true,
  versionKey: false,
});

export const BusinessSettingModel = mongoose.models.BusinessSetting || mongoose.model('BusinessSetting', BusinessSettingSchema);
export default BusinessSettingModel;

