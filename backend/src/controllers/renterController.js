import { RenterProfileModel } from '../models/RenterProfile.js';
import { UserModel } from '../models/User.js';

/**
 * Get all renters (Admin Dashboard)
 */
export async function getAllRenters(req, res) {
  try {
    const renters = await RenterProfileModel.find().populate('userId').sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, count: renters.length, data: renters });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch renters.' });
  }
}

/**
 * Submit or update Renter Driving Licence & KYC
 */
export async function submitRenterKYC(req, res) {
  try {
    const { userId, dlNumber, dlExpiryDate, dlClass = 'MCWG', dateOfBirth, address } = req.body;
    const targetUserId = req.user?.id || userId;

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    let profile = await RenterProfileModel.findOne({ userId: targetUserId });
    if (!profile) {
      profile = await RenterProfileModel.create({
        userId: targetUserId,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(Date.now() - 20 * 365 * 24 * 3600 * 1000),
        dlNumber: (dlNumber || 'PENDING').toUpperCase(),
        dlExpiryDate: dlExpiryDate ? new Date(dlExpiryDate) : new Date(Date.now() + 5 * 365 * 24 * 3600 * 1000),
        dlClass,
        address,
        kycStatus: 'PENDING_REVIEW',
      });
    } else {
      if (dlNumber) profile.dlNumber = dlNumber.toUpperCase();
      if (dlExpiryDate) profile.dlExpiryDate = new Date(dlExpiryDate);
      if (dlClass) profile.dlClass = dlClass;
      if (dateOfBirth) profile.dateOfBirth = new Date(dateOfBirth);
      if (address) profile.address = address;
      profile.kycStatus = 'PENDING_REVIEW';
      await profile.save();
    }

    return res.status(200).json({ success: true, message: 'Renter KYC submitted for review.', data: profile });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to submit renter KYC.' });
  }
}

/**
 * Admin: Update Renter Verification Status
 */
export async function updateRenterStatus(req, res) {
  try {
    const { id } = req.params;
    const { kycStatus, rejectionReason } = req.body;

    const renter = await RenterProfileModel.findByIdAndUpdate(
      id,
      {
        kycStatus,
        kycRejectionReason: rejectionReason,
        verifiedAt: kycStatus === 'VERIFIED' ? new Date() : undefined,
      },
      { new: true }
    );

    if (!renter) {
      return res.status(404).json({ success: false, message: 'Renter profile not found.' });
    }

    return res.status(200).json({ success: true, message: 'Renter status updated successfully.', data: renter });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update renter status.' });
  }
}

