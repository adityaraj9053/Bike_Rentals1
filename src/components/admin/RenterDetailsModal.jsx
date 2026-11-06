import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import {
  X,
  User,
  ShieldCheck,
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Ban,
  Clock,
  Bike,
} from 'lucide-react-native';
import { COLORS, RADIUS } from '../../theme/colors';

export default function RenterDetailsModal({
  visible,
  renter,
  onClose,
  onUpdateStatus,
  onShowToast,
}) {
  if (!visible || !renter) return null;

  const [actionType, setActionType] = useState(null);
  const [remark, setRemark] = useState('');

  const handleAction = (status) => {
    setActionType(status);
    setRemark('');
  };

  const handleConfirm = () => {
    if (onUpdateStatus) {
      onUpdateStatus(renter.id, actionType, remark);
    }
    if (onShowToast) {
      onShowToast(`Renter ${renter.name} status updated to "${actionType}".`);
    }
    setActionType(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                <User size={22} color="#FFFFFF" />
              </View>
              <View>
                <View style={styles.nameRow}>
                  <Text style={styles.titleName}>{renter.name}</Text>
                  <View style={[styles.statusBadge, styles[`badge_${(renter.verificationStatus || '').replace(/\s+/g, '')}`]]}>
                    <Text style={styles.statusBadgeText}>{renter.verificationStatus}</Text>
                  </View>
                </View>
                <Text style={styles.headerMeta}>
                  Renter ID: <Text style={styles.mono}>{renter.id}</Text> • City: {renter.city}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Driving Licence & Vehicle Class Eligibility */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Driving Licence & Vehicle Class Eligibility</Text>
              <View style={styles.dlDetailsGrid}>
                <View style={styles.dlRow}>
                  <Text style={styles.dlLabel}>DL Number:</Text>
                  <Text style={[styles.dlVal, styles.mono]}>{renter.dlNumber || 'MH-03-2021-0091823'}</Text>
                </View>
                <View style={styles.dlRow}>
                  <Text style={styles.dlLabel}>Licence Status:</Text>
                  <Text style={[styles.dlVal, { color: renter.dlStatus === 'Verified' ? '#10B981' : '#F59E0B', fontWeight: '700' }]}>
                    {renter.dlStatus}
                  </Text>
                </View>
                <View style={styles.dlRow}>
                  <Text style={styles.dlLabel}>Validity Expiry:</Text>
                  <Text style={styles.dlVal}>{renter.dlExpiry || '2036-04-18'}</Text>
                </View>
                <View style={styles.dlRow}>
                  <Text style={styles.dlLabel}>Permitted Class:</Text>
                  <Text style={[styles.dlVal, { fontWeight: '700', color: '#38BDF8' }]}>
                    {renter.vehicleClass || 'MCWG'}
                  </Text>
                </View>
                <View style={styles.dlRow}>
                  <Text style={styles.dlLabel}>Gear Bike Eligible:</Text>
                  <Text style={[styles.dlVal, { color: renter.eligibleForGearBikes ? '#10B981' : '#EF4444', fontWeight: '700' }]}>
                    {renter.eligibleForGearBikes ? '✓ Eligible for All Motorcycles' : '✗ Scooters Only (No Manual Bikes)'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Contact Details */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Contact Details</Text>
              <View style={styles.infoRow}>
                <Phone size={14} color="#38BDF8" />
                <Text style={styles.infoLabel}>Mobile Number:</Text>
                <Text style={styles.infoVal}>{renter.phone}</Text>
              </View>
              <View style={[styles.infoRow, { marginTop: 6 }]}>
                <Mail size={14} color="#38BDF8" />
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoVal}>{renter.email}</Text>
              </View>
            </View>

            {/* Trip & Booking History */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Previous Bookings ({renter.bookingHistory?.length || 0})</Text>
              {renter.bookingHistory && renter.bookingHistory.length > 0 ? (
                <View style={styles.bookingList}>
                  {renter.bookingHistory.map((b, idx) => (
                    <View key={idx} style={styles.bookingItem}>
                      <Bike size={16} color="#38BDF8" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bookingBike}>{b.bike}</Text>
                        <Text style={styles.bookingMeta}>ID: {b.bookingId} • Date: {b.date}</Text>
                      </View>
                      <Text style={styles.bookingAmount}>₹{b.amount}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>New user. No completed trips on record.</Text>
              )}
            </View>
          </ScrollView>

          {/* Action Bar */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={[styles.actBtn, styles.btnApprove]}
              onPress={() => handleAction('Approved')}
            >
              <CheckCircle2 size={15} color="#FFFFFF" />
              <Text style={styles.actBtnText}>Approve Renter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actBtn, styles.btnDocs]}
              onPress={() => handleAction('Needs Correction')}
            >
              <RotateCcw size={14} color="#FFFFFF" />
              <Text style={styles.actBtnText}>Request Info</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actBtn, styles.btnSuspend]}
              onPress={() => handleAction('Suspended')}
            >
              <Ban size={14} color="#FFFFFF" />
              <Text style={styles.actBtnText}>Suspend Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actBtn, styles.btnReject]}
              onPress={() => handleAction('Rejected')}
            >
              <XCircle size={15} color="#FFFFFF" />
              <Text style={styles.actBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Confirmation Dialog */}
      {actionType && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmBox}>
              <Text style={styles.confirmTitle}>Confirm Renter Action: {actionType}</Text>
              <Text style={styles.confirmSub}>
                Update verification status of {renter.name} to "{actionType}"?
              </Text>
              <TextInput
                style={styles.remarkInput}
                value={remark}
                onChangeText={setRemark}
                placeholder="Optional remark for internal records..."
                placeholderTextColor={COLORS.textMuted}
              />
              <View style={styles.confirmBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setActionType(null)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleConfirm}>
                  <Text style={styles.saveBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
    maxWidth: 720,
    maxHeight: '88%',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerMeta: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#38BDF8',
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 18,
    flex: 1,
  },
  card: {
    backgroundColor: '#070E1B',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  dlDetailsGrid: {
    gap: 6,
  },
  dlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dlLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  dlVal: {
    fontSize: 12.5,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    minWidth: 110,
  },
  infoVal: {
    fontSize: 12.5,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bookingList: {
    gap: 8,
  },
  bookingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bgDark,
    padding: 10,
    borderRadius: RADIUS.sm,
  },
  bookingBike: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bookingMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  bookingAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  actionBar: {
    backgroundColor: '#0A1222',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
    padding: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
  },
  actBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  btnApprove: { backgroundColor: '#10B981' },
  btnDocs: { backgroundColor: '#D97706' },
  btnSuspend: { backgroundColor: '#475569' },
  btnReject: { backgroundColor: '#E11D48' },
  actBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  badge_Approved: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  badge_Pending: { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  badge_NeedsCorrection: { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  badge_Suspended: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  statusBadgeText: {
    color: '#38BDF8',
    fontSize: 10.5,
    fontWeight: '800',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmBox: {
    backgroundColor: '#0D1526',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  confirmTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  confirmSub: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  remarkInput: {
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.sm,
    padding: 8,
    color: '#FFFFFF',
    fontSize: 12.5,
    marginBottom: 14,
  },
  confirmBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCardAlt,
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: '#0284C7',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});

