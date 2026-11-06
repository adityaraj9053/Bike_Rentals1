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
  AlertTriangle,
  FileText,
  ShieldAlert,
  User,
  Clock,
  CheckCircle2,
  Flag,
  Ban,
  Save,
  Info,
} from 'lucide-react-native';
import { COLORS, RADIUS } from '../../theme/colors';

export default function ComplaintDetailsModal({
  visible,
  complaint,
  onClose,
  onSaveResolution,
  onShowToast,
}) {
  if (!visible || !complaint) return null;

  const [status, setStatus] = useState(complaint.status || 'In Investigation');
  const [internalNotes, setInternalNotes] = useState(complaint.adminNotes || '');
  const [resolutionText, setResolutionText] = useState(complaint.resolution || '');
  const [isUserFlagged, setIsUserFlagged] = useState(false);
  const [isListingSuspended, setIsListingSuspended] = useState(false);

  const handleSave = () => {
    if (onSaveResolution) {
      onSaveResolution(complaint.id, {
        status,
        adminNotes: internalNotes,
        resolution: resolutionText,
        userFlagged: isUserFlagged,
        listingSuspended: isListingSuspended,
      });
    }
    if (onShowToast) {
      onShowToast(`Report #${complaint.id} updated successfully.`);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.alertIconBox}>
                <ShieldAlert size={22} color="#FFFFFF" />
              </View>
              <View>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>Incident Report #{complaint.id}</Text>
                  <View style={[styles.priorityBadge, styles[`priority_${complaint.priority}`]]}>
                    <Text style={styles.priorityText}>{complaint.priority} Priority</Text>
                  </View>
                </View>
                <Text style={styles.subTitle}>
                  Category: {complaint.category} • Reported on {complaint.dateReported}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Legal disclaimer */}
          <View style={styles.disclaimerBanner}>
            <Info size={15} color="#38BDF8" style={{ marginTop: 2 }} />
            <Text style={styles.disclaimerText}>
              Platform Operational Log: Reports document owner-renter disputes and internal investigations. Do not take automated legal action or state that reported incidents are confirmed without verified police FIR or surveyor signoff.
            </Text>
          </View>

          {/* Body */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Meta Information Grid */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Incident Details</Text>
              <View style={styles.grid}>
                <View style={styles.row}>
                  <Text style={styles.label}>Associated Booking:</Text>
                  <Text style={[styles.val, styles.mono]}>{complaint.bookingId || 'N/A'}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Reported By:</Text>
                  <Text style={styles.val}>{complaint.reporter}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Assigned Admin:</Text>
                  <Text style={styles.val}>{complaint.assignedAdmin || 'Operations Team'}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Current Status:</Text>
                  <Text style={[styles.val, { color: status === 'Resolved' ? '#10B981' : '#F59E0B', fontWeight: '700' }]}>
                    {status}
                  </Text>
                </View>
              </View>

              <View style={styles.descBox}>
                <Text style={styles.descLabel}>Incident Description:</Text>
                <Text style={styles.descContent}>{complaint.description}</Text>
              </View>

              {complaint.supportingEvidence && complaint.supportingEvidence.length > 0 && (
                <View style={styles.evidenceBox}>
                  <Text style={styles.evidenceLabel}>Supporting Evidence Files:</Text>
                  {complaint.supportingEvidence.map((file, i) => (
                    <View key={i} style={styles.evidenceItem}>
                      <FileText size={14} color="#38BDF8" />
                      <Text style={styles.evidenceName}>{file}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Quick Actions (Flag User / Suspend Listing) */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Security Escalation Controls</Text>
              <View style={styles.quickEscalationRow}>
                <TouchableOpacity
                  style={[styles.escBtn, isUserFlagged && styles.escBtnActive]}
                  onPress={() => setIsUserFlagged(!isUserFlagged)}
                >
                  <Flag size={14} color={isUserFlagged ? '#FFFFFF' : '#F59E0B'} />
                  <Text style={[styles.escBtnText, isUserFlagged && styles.escBtnTextActive]}>
                    {isUserFlagged ? 'User Flagged for Caution' : 'Flag Involved User'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.escBtn, isListingSuspended && styles.escBtnDanger]}
                  onPress={() => setIsListingSuspended(!isListingSuspended)}
                >
                  <Ban size={14} color={isListingSuspended ? '#FFFFFF' : '#EF4444'} />
                  <Text style={[styles.escBtnText, isListingSuspended && styles.escBtnTextActive]}>
                    {isListingSuspended ? 'Listing Temporarily Suspended' : 'Suspend Vehicle Listing'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Internal Admin Remarks */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Internal Operations Notes</Text>
              <TextInput
                style={styles.textArea}
                value={internalNotes}
                onChangeText={setInternalNotes}
                placeholder="Log customer communications, telematics telemetry, workshop repair estimates, insurance surveyor notes..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Resolution Recording */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Record Resolution & Settlement Details</Text>
              <View style={styles.statusPickerRow}>
                {['In Investigation', 'Resolved', 'Dismissed'].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusOptionPill, status === st && styles.statusOptionPillActive]}
                    onPress={() => setStatus(st)}
                  >
                    <Text style={[styles.statusOptionText, status === st && styles.statusOptionTextActive]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[styles.textArea, { marginTop: 10 }]}
                value={resolutionText}
                onChangeText={setResolutionText}
                placeholder="Record final resolution (e.g. ₹800 deducted from deposit for mirror repair and credited to owner; case closed)..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Footer Save */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Save size={16} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Incident Updates</Text>
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
    borderColor: 'rgba(239, 68, 68, 0.3)',
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
  alertIconBox: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: '#E11D48',
    justifyContent: 'center',
    alignItems: 'center',
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
  disclaimerBanner: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.2)',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 15,
    flex: 1,
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
    marginBottom: 12,
  },
  cardHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  grid: {
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
  descBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: COLORS.bgDark,
    borderRadius: RADIUS.sm,
  },
  descLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  descContent: {
    fontSize: 12.5,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  evidenceBox: {
    marginTop: 10,
    gap: 4,
  },
  evidenceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  evidenceName: {
    fontSize: 11.5,
    color: '#38BDF8',
  },
  quickEscalationRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  escBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  escBtnActive: {
    backgroundColor: '#D97706',
    borderColor: '#F59E0B',
  },
  escBtnDanger: {
    backgroundColor: '#E11D48',
    borderColor: '#F43F5E',
  },
  escBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  escBtnTextActive: {
    color: '#FFFFFF',
  },
  textArea: {
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.md,
    padding: 10,
    color: '#FFFFFF',
    fontSize: 12.5,
    minHeight: 70,
    textAlignVertical: 'top',
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  statusPickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOptionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  statusOptionPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  statusOptionText: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  statusOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCardAlt,
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: '#0284C7',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  priority_Critical: { backgroundColor: 'rgba(239, 68, 68, 0.25)' },
  priority_High: { backgroundColor: 'rgba(245, 158, 11, 0.25)' },
  priority_Medium: { backgroundColor: 'rgba(56, 189, 248, 0.2)' },
  priority_Low: { backgroundColor: 'rgba(148, 163, 184, 0.2)' },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

