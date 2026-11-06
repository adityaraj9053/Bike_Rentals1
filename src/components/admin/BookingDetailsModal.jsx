import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  X,
  Calendar,
  Bike,
  User,
  CreditCard,
  FileText,
  CheckCircle2,
  Clock,
  Shield,
  Gauge,
  Fuel,
  Camera,
  AlertTriangle,
} from 'lucide-react-native';
import { COLORS, RADIUS } from '../../theme/colors';

export default function BookingDetailsModal({
  visible,
  booking,
  onClose,
  onUpdateStatus,
  onShowToast,
}) {
  if (!visible || !booking) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Booking #{booking.id}</Text>
                <View style={[styles.statusBadge, styles[`status_${(booking.bookingStatus || '').replace(/\s+/g, '')}`]]}>
                  <Text style={styles.statusText}>{booking.bookingStatus}</Text>
                </View>
              </View>
              <Text style={styles.subTitle}>
                {booking.bikeName} • {booking.pickupDate} to {booking.returnDate}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Booking Summary Grid */}
            <View style={styles.gridTwo}>
              {/* Bike & Owner Card */}
              <View style={styles.card}>
                <Text style={styles.cardHeading}>Vehicle & Owner</Text>
                <View style={styles.detailsList}>
                  <View style={styles.row}>
                    <Text style={styles.label}>Bike:</Text>
                    <Text style={[styles.val, { fontWeight: '700' }]}>{booking.bikeName}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Reg No:</Text>
                    <Text style={[styles.val, styles.mono]}>{booking.bikeRegNo}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Owner:</Text>
                    <Text style={styles.val}>{booking.ownerName} ({booking.ownerId})</Text>
                  </View>
                </View>
              </View>

              {/* Renter Details */}
              <View style={styles.card}>
                <Text style={styles.cardHeading}>Renter & Dates</Text>
                <View style={styles.detailsList}>
                  <View style={styles.row}>
                    <Text style={styles.label}>Renter:</Text>
                    <Text style={[styles.val, { fontWeight: '700' }]}>{booking.renterName}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Pickup:</Text>
                    <Text style={styles.val}>{booking.pickupDate} at {booking.pickupTime}</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Return:</Text>
                    <Text style={styles.val}>{booking.returnDate} at {booking.returnTime}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Financial Breakdown Card */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Payment & Deposit Escrow</Text>
              <View style={styles.financeTable}>
                <View style={styles.fRow}>
                  <Text style={styles.fLabel}>Rental Total ({booking.durationDays || 3} days @ ₹{booking.dailyRate}/day):</Text>
                  <Text style={styles.fVal}>₹{booking.rentalTotal}</Text>
                </View>
                <View style={styles.fRow}>
                  <Text style={styles.fLabel}>Platform Service Fee (10%):</Text>
                  <Text style={[styles.fVal, { color: '#38BDF8' }]}>₹{booking.platformFee}</Text>
                </View>
                <View style={styles.fRow}>
                  <Text style={styles.fLabel}>Owner Net Payout:</Text>
                  <Text style={[styles.fVal, { fontWeight: '700' }]}>₹{booking.ownerPayout}</Text>
                </View>
                <View style={[styles.fRow, styles.fTotalRow]}>
                  <Text style={styles.fTotalLabel}>Refundable Security Deposit:</Text>
                  <Text style={styles.depositVal}>
                    ₹{booking.securityDeposit} ({booking.depositStatus || 'Held in Escrow'})
                  </Text>
                </View>
              </View>
            </View>

            {/* Inspection Checklist */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Vehicle Inspection Reports</Text>
              <View style={styles.inspectionRow}>
                <View style={styles.inspectionBox}>
                  <Text style={styles.inspectTitle}>Pickup Handover</Text>
                  {booking.pickupInspection?.completed ? (
                    <View style={styles.inspectDetails}>
                      <Text style={styles.inspectText}>• Odo: {booking.pickupInspection.odometer}</Text>
                      <Text style={styles.inspectText}>• Fuel: {booking.pickupInspection.fuelLevel}</Text>
                      <Text style={styles.inspectText}>• Photos: 4 recorded</Text>
                      <Text style={[styles.inspectText, { color: '#10B981' }]}>✓ Signed by Renter</Text>
                    </View>
                  ) : (
                    <Text style={styles.inspectPending}>Pending handover check</Text>
                  )}
                </View>

                <View style={styles.inspectionBox}>
                  <Text style={styles.inspectTitle}>Return Check & Settlement</Text>
                  {booking.returnInspection?.completed ? (
                    <View style={styles.inspectDetails}>
                      <Text style={styles.inspectText}>• Odo: {booking.returnInspection.odometer}</Text>
                      <Text style={styles.inspectText}>• Fuel: {booking.returnInspection.fuelLevel}</Text>
                      <Text style={styles.inspectText}>• Damages: {booking.returnInspection.damageFound || 'None'}</Text>
                    </View>
                  ) : (
                    <Text style={styles.inspectPending}>Pending return inspection</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Timeline */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Trip Audit Timeline</Text>
              <View style={styles.timelineList}>
                {(booking.timeline || []).map((t, idx) => (
                  <View key={idx} style={styles.timelineItem}>
                    <Clock size={13} color="#38BDF8" style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.timelineEvent}>{t.event}</Text>
                      <Text style={styles.timelineTime}>{t.time}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footBtn, { backgroundColor: '#10B981' }]}
              onPress={() => {
                if (onUpdateStatus) onUpdateStatus(booking.id, 'Completed');
                if (onShowToast) onShowToast(`Booking ${booking.id} marked as Completed.`);
                onClose();
              }}
            >
              <CheckCircle2 size={15} color="#FFFFFF" />
              <Text style={styles.footBtnText}>Mark Completed & Release Deposit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.footBtn, { backgroundColor: '#E11D48' }]}
              onPress={() => {
                if (onUpdateStatus) onUpdateStatus(booking.id, 'Cancelled');
                if (onShowToast) onShowToast(`Booking ${booking.id} marked as Cancelled.`);
                onClose();
              }}
            >
              <Text style={styles.footBtnText}>Cancel Booking</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 20, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 780,
    maxHeight: '90%',
    backgroundColor: '#0D1526',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#0A1222',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCard,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 18,
    flex: 1,
  },
  gridTwo: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#070E1B',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 12,
    flex: 1,
    minWidth: 280,
  },
  cardHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  detailsList: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  val: {
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#38BDF8',
  },
  financeTable: {
    gap: 6,
  },
  fRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  fVal: {
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  fTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
    paddingTop: 8,
    marginTop: 4,
  },
  fTotalLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  depositVal: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#F59E0B',
  },
  inspectionRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  inspectionBox: {
    flex: 1,
    minWidth: 180,
    backgroundColor: COLORS.bgDark,
    borderRadius: RADIUS.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  inspectTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 6,
  },
  inspectDetails: {
    gap: 3,
  },
  inspectText: {
    fontSize: 11.5,
    color: '#E2E8F0',
  },
  inspectPending: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  timelineList: {
    gap: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  timelineEvent: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  timelineTime: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  footer: {
    backgroundColor: '#0A1222',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  footBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
  },
  footBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  status_Active: { backgroundColor: 'rgba(56, 189, 248, 0.2)' },
  status_Completed: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  status_Upcoming: { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  status_Disputed: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  status_Cancelled: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  statusText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
});

