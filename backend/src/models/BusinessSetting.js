import mongoose, { Schema } from 'mongoose';

const BusinessSettingSchema = new Schema({
  ownerUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  businessName: { type: String, default: 'The Road Eagle' },
  ownerFullName: { type: String, default: 'Fleet Operations Manager' },
  contactPhone: { type: String, default: '+91 98765 43210' },
  contactEmail: { type: String, default: 'rentals@theroadeagle.com' },
  emergencyPhone: String,
  hubName: { type: String, default: 'Central Rental Hub' },
  hubAddress: { type: String, default: 'Plot 42, Metro Ring Road, South City, Bangalore, 560034' },
  mapUrl: { type: String, default: 'https://maps.google.com/?q=Plot+42+Metro+Ring+Road+South+City+Bangalore' },
  whatsappNumber: { type: String, default: '+91 98765 43210' },
  operatingHoursText: { type: String, default: 'Monday – Sunday: 08:00 AM – 09:30 PM' },
  operatingHoursSubtext: { type: String, default: '24/7 emergency roadside support active' },
  emailResponseTime: { type: String, default: 'Within 2 business hours' },
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

