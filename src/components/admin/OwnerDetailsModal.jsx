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
  MapPin,
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

export default function OwnerDetailsModal({
  visible,
  owner,
  onClose,
  onUpdateStatus,
  onShowToast,
}) {
  if (!visible || !owner) return null;

  const [actionType, setActionType] = useState(null);
  const [remark, setRemark] = useState('');
  const [remarkError, setRemarkError] = useState('');

  const handleAction = (status) => {
    setActionType(status);
    setRemark('');
    setRemarkError('');
  };

  const handleConfirmAction = () => {
    if ((actionType === 'Rejected' || actionType === 'Needs Correction' || actionType === 'Suspended') && !remark.trim()) {
      setRemarkError('Admin remarks are required for this action.');
      return;
    }
    if (onUpdateStatus) {
      onUpdateStatus(owner.id, actionType, remark);
    }
    if (onShowToast) {
      onShowToast(`Owner ${owner.name} status updated to "${actionType}".`);
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
                  <Text style={styles.ownerName}>{owner.name}</Text>
                  <View style={[styles.statusBadge, styles[`badge_${(owner.status || '').replace(/\s+/g, '')}`]]}>
                    <Text style={styles.statusBadgeText}>{owner.status}</Text>
                  </View>
                </View>
                <Text style={styles.headerMeta}>
                  Owner ID: <Text style={styles.mono}>{owner.id}</Text> • Registered: {owner.registeredDate}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Personal Info Grid */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Personal & Contact Details</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoRow}>
                  <Phone size={14} color="#38BDF8" />
                  <Text style={styles.infoLabel}>Mobile Number:</Text>
                  <Text style={styles.infoVal}>{owner.phone}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Mail size={14} color="#38BDF8" />
                  <Text style={styles.infoLabel}>Email Address:</Text>
                  <Text style={styles.infoVal}>{owner.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MapPin size={14} color="#38BDF8" />
                  <Text style={styles.infoLabel}>Residential Address:</Text>
                  <Text style={styles.infoVal}>{owner.address}, {owner.city}, {owner.state} - {owner.pincode}</Text>
                </View>
              </View>
            </View>

            {/* Identity Verification Details */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Identity Verification Details</Text>
              <View style={styles.kycRow}>
                <View style={styles.kycBox}>
                  <Text style={styles.kycLabel}>Document Type</Text>
                  <Text style={styles.kycValue}>{owner.idType || 'Aadhaar Card'}</Text>
                </View>
                <View style={styles.kycBox}>
                  <Text style={styles.kycLabel}>ID Number</Text>
                  <Text style={[styles.kycValue, styles.mono]}>{owner.idNumber || '•••• •••• 8912'}</Text>
                </View>
                <View style={styles.kycBox}>
                  <Text style={styles.kycLabel}>Verification Status</Text>
                  <Text style={[styles.kycValue, { color: owner.idStatus === 'Verified' ? '#10B981' : '#F59E0B' }]}>
                    {owner.idStatus}
                  </Text>
                </View>
              </View>
            </View>

            {/* Submitted Documents */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Submitted Documents ({owner.documents?.length || 0})</Text>
              <View style={styles.docsList}>
                {(owner.documents || []).map((doc, idx) => (
                  <View key={idx} style={styles.docItem}>
                    <FileText size={18} color="#38BDF8" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docName}>{doc.name}</Text>
                      <Text style={styles.docMeta}>{doc.type} • {doc.size} • Uploaded {doc.date}</Text>
                    </View>
                    <View style={[styles.docBadge, doc.status === 'Verified' ? styles.docBadgeVer : styles.docBadgePen]}>
                      <Text style={styles.docBadgeText}>{doc.status}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Verification History */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Verification History & Audit Log</Text>
              <View style={styles.historyList}>
                {(owner.verificationHistory || []).map((h, idx) => (
                  <View key={idx} style={styles.historyItem}>
                    <Clock size={13} color="#94A3B8" />
                    <Text style={styles.historyDate}>{h.date}:</Text>
                    <Text style={styles.historyAction}>{h.action}</Text>
                    <Text style={styles.historyBy}>({h.by})</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Action Bar */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={[styles.actBtn, styles.btnApprove]}
              onPress={() => handleAction('Approved')}
            >
              <CheckCircle2 size={15} color="#FFFFFF" />
              <Text style={styles.actBtnText}>Approve Owner</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actBtn, styles.btnDocs]}
              onPress={() => handleAction('Needs Correction')}
            >
              <RotateCcw size={14} color="#FFFFFF" />
              <Text style={styles.actBtnText}>Request Documents</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actBtn, styles.btnSuspend]}
              onPress={() => handleAction('Suspended')}
            >
              <Ban size={14} color="#FFFFFF" />
              <Text style={styles.actBtnText}>Suspend Owner</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actBtn, styles.btnReject]}
              onPress={() => handleAction('Rejected')}
            >
              <XCircle size={15} color="#FFFFFF" />
              <Text style={styles.actBtnText}>Reject Owner</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Confirmation Dialog */}
      {actionType && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmBox}>
              <Text style={styles.confirmTitle}>Confirm Owner Action: {actionType}</Text>
              <Text style={styles.confirmSub}>
                Are you sure you want to mark {owner.name} as "{actionType}"?
              </Text>

              <View style={styles.remarkWrap}>
                <Text style={styles.remarkLabel}>Admin Notes / Reason:</Text>
                <TextInput
                  style={styles.remarkInput}
                  value={remark}
                  onChangeText={setRemark}
                  placeholder="Enter remarks recorded in owner audit trail..."
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={2}
                />
                {remarkError ? <Text style={styles.errorText}>{remarkError}</Text> : null}
              </View>

              <View style={styles.confirmBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setActionType(null)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleConfirmAction}>
                  <Text style={styles.saveBtnText}>Confirm</Text>
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
    maxWidth: 780,
    maxHeight: '90%',
    backgroundColor: '#0D1526',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ownerName: {
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
  infoGrid: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    minWidth: 120,
  },
  infoVal: {
    fontSize: 12.5,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },
  kycRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  kycBox: {
    flex: 1,
    minWidth: 140,
    backgroundColor: COLORS.bgDark,
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  kycLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  kycValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  docsList: {
    gap: 8,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bgDark,
    padding: 10,
    borderRadius: RADIUS.sm,
  },
  docName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  docMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  docBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  docBadgeVer: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  docBadgePen: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  docBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#38BDF8',
  },
  historyList: {
    gap: 6,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  historyDate: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  historyAction: {
    fontSize: 12,
    color: '#E2E8F0',
  },
  historyBy: {
    fontSize: 11,
    color: '#38BDF8',
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
  btnApprove: {
    backgroundColor: '#10B981',
  },
  btnDocs: {
    backgroundColor: '#D97706',
  },
  btnSuspend: {
    backgroundColor: '#475569',
  },
  btnReject: {
    backgroundColor: '#E11D48',
  },
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
    maxWidth: 420,
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
    marginBottom: 14,
  },
  remarkWrap: {
    marginBottom: 16,
  },
  remarkLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 4,
  },
  remarkInput: {
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.sm,
    padding: 8,
    color: '#FFFFFF',
    fontSize: 12.5,
    minHeight: 56,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    marginTop: 4,
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

