import { BikeModel } from '../models/Bike.js';
import { BookingModel } from '../models/Booking.js';
import { OwnerProfileModel } from '../models/OwnerProfile.js';
import { RenterProfileModel } from '../models/RenterProfile.js';
import { PaymentTransactionModel } from '../models/PaymentTransaction.js';
import { AuditLogModel } from '../models/AuditLog.js';
import { PlatformSettingModel } from '../models/PlatformSetting.js';
import { NotificationModel } from '../models/Notification.js';

/**
 * Real-time Admin KPIs across MongoDB collections
 */
export async function getAdminKPIs(req, res) {
  try {
    const [
      totalBikes,
      pendingBikes,
      approvedBikes,
      totalBookings,
      activeBookings,
      totalOwners,
      pendingOwners,
      totalRenters,
      transactions,
    ] = await Promise.all([
      BikeModel.countDocuments(),
      BikeModel.countDocuments({ status: 'PENDING_VERIFICATION' }),
      BikeModel.countDocuments({ status: 'APPROVED' }),
      BookingModel.countDocuments(),
      BookingModel.countDocuments({ bookingStatus: { $in: ['CONFIRMED', 'ACTIVE', 'AWAITING_HANDOVER'] } }),
      OwnerProfileModel.countDocuments(),
      OwnerProfileModel.countDocuments({ kycStatus: 'PENDING_REVIEW' }),
      RenterProfileModel.countDocuments(),
      PaymentTransactionModel.find({ status: 'SUCCESSFUL' }).select('amountInr').lean(),
    ]);

    const totalRevenue = transactions.reduce((acc, curr) => acc + (curr.amountInr || 0), 0);

    return res.status(200).json({
      success: true,
      kpis: {
        totalBikes,
        pendingBikes,
        approvedBikes,
        totalBookings,
        activeBookings,
        totalOwners,
        pendingOwners,
        totalRenters,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error('[Admin getAdminKPIs Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to aggregate KPIs.' });
  }
}

/**
 * Get Audit Logs
 */
export async function getAuditLogs(req, res) {
  try {
    const logs = await AuditLogModel.find().populate('actorId', 'fullName email role').sort({ timestamp: -1 }).limit(100).lean();
    return res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
  }
}

/**
 * Record an Audit Log
 */
export async function recordAuditLog(req, res) {
  try {
    const { action, targetEntityType, targetEntityId, adminNotes, beforeSnapshot, afterSnapshot } = req.body;
    const actorId = req.user?.id;

    if (!actorId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const log = await AuditLogModel.create({
      actorId,
      actorRole: req.user?.role || 'ADMIN',
      action,
      targetEntityType,
      targetEntityId,
      adminNotes,
      beforeSnapshot,
      afterSnapshot,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({ success: true, data: log });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to record audit log.' });
  }
}

/**
 * Platform Settings
 */
export async function getSettings(req, res) {
  try {
    const settings = await PlatformSettingModel.find().lean();
    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
    return res.status(200).json({ success: true, data: settingsMap });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch settings.' });
  }
}

export async function updateSetting(req, res) {
  try {
    const { key, value, description } = req.body;
    if (!key) return res.status(400).json({ success: false, message: 'Setting key is required.' });

    const setting = await PlatformSettingModel.findOneAndUpdate(
      { key },
      { value, description, updatedBy: req.user?.id },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, data: setting });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update setting.' });
  }
}

/**
 * Notifications
 */
export async function getNotifications(req, res) {
  try {
    const filter = {};
    if (req.user?.id) {
      filter.$or = [{ recipientUserId: req.user.id }, { recipientRole: req.user.role }];
    }
    const notifications = await NotificationModel.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    return res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
}

export async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    const notification = await NotificationModel.findByIdAndUpdate(
      id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    return res.status(200).json({ success: true, data: notification });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
}

/**
 * Get Transactions
 */
export async function getTransactions(req, res) {
  try {
    const transactions = await PaymentTransactionModel.find()
      .populate('userId', 'fullName email phoneNumber')
      .populate('bookingId')
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch transactions.' });
  }
}

