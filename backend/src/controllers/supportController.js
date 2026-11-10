import { SupportTicketModel } from '../models/SupportTicket.js';
import { DisputeModel } from '../models/Dispute.js';
import { UserModel } from '../models/User.js';

/**
 * Submit Enquiry or Help Request (EnquiryModal / ContactScreen)
 */
export async function submitEnquiry(req, res) {
  try {
    const { fullName, phone, email, bikeId, startDate, endDate, message, category = 'BOOKING_INQUIRY' } = req.body;
    let userId = req.user?.id;

    if (!userId && (email || phone)) {
      const targetEmail = email ? email.toLowerCase() : `guest_${Date.now()}@theroadeagle.com`;
      let user = await UserModel.findOne({ email: targetEmail });
      if (!user) {
        user = await UserModel.create({
          email: targetEmail,
          fullName: fullName || 'Guest Inquirer',
          phoneNumber: phone || '',
        });
      }
      userId = user._id;
    }

    if (!userId) {
      const guest = await UserModel.findOne({ role: 'ADMIN' }) || await UserModel.findOne();
      userId = guest?._id;
    }

    const ticketNumber = `ENQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullMessage = `${message || 'General Rental Inquiry'}\nDates: ${startDate || 'N/A'} to ${endDate || 'N/A'}\nPhone: ${phone || 'N/A'}`;

    const ticket = await SupportTicketModel.create({
      ticketNumber,
      userId,
      category,
      priority: 'MEDIUM',
      subject: `Rental Enquiry: ${fullName || 'Rider'}`,
      message: fullMessage,
      status: 'OPEN',
    });

    return res.status(201).json({
      success: true,
      message: 'Enquiry received. Our fleet specialist will contact you shortly.',
      data: ticket,
    });
  } catch (error) {
    console.error('[Support submitEnquiry Error]:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to submit enquiry.' });
  }
}

/**
 * Get all support tickets
 */
export async function getAllTickets(req, res) {
  try {
    const tickets = await SupportTicketModel.find().populate('userId', 'fullName email phoneNumber').sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch tickets.' });
  }
}

/**
 * Get all complaints / disputes (Admin Complaints Tab)
 */
export async function getAllDisputes(req, res) {
  try {
    const disputes = await DisputeModel.find()
      .populate('reporterId', 'fullName email phoneNumber')
      .populate('bookingId')
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, count: disputes.length, data: disputes });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch disputes.' });
  }
}

/**
 * Create a Dispute / Damage Claim
 */
export async function createDispute(req, res) {
  try {
    const data = req.body;
    const ticketNumber = `DISP-${Math.floor(1000 + Math.random() * 9000)}`;

    const dispute = await DisputeModel.create({
      ticketNumber,
      bookingId: data.bookingId,
      reporterId: req.user?.id || data.reporterId,
      reporterRole: data.reporterRole || 'RENTER',
      category: data.category || 'BIKE_DAMAGE',
      priority: data.priority || 'HIGH',
      description: data.description || 'Customer reported dispute',
      repairEstimateAmount: Number(data.repairEstimateAmount || 0),
      status: 'OPEN',
    });

    return res.status(201).json({ success: true, message: 'Dispute recorded.', data: dispute });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to record dispute.' });
  }
}

/**
 * Update Dispute Status / Arbitration
 */
export async function updateDisputeStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, finalResolutionSummary, deductedFromDepositAmount } = req.body;

    const dispute = await DisputeModel.findByIdAndUpdate(
      id,
      {
        status,
        finalResolutionSummary,
        deductedFromDepositAmount,
        resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
      },
      { new: true }
    );

    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found.' });
    }

    return res.status(200).json({ success: true, message: 'Dispute updated.', data: dispute });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update dispute.' });
  }
}

