import mongoose, { Schema } from 'mongoose';

const EmailOtpSchema = new Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['LOGIN', 'SIGNUP', 'PASSWORD_RESET', 'EMAIL_VERIFICATION'],
    default: 'LOGIN',
  },
  attemptsCount: {
    type: Number,
    default: 0,
    max: 3,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // 5-minute auto expiry TTL index
  },
}, {
  versionKey: false,
});

export const EmailOtpModel = mongoose.models.EmailOtp || mongoose.model('EmailOtp', EmailOtpSchema);
export default EmailOtpModel;

