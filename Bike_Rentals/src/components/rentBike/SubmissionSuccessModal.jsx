import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {
  CheckCircle2,
  Bike,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react-native';
import { COLORS, RADIUS } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

export default function SubmissionSuccessModal({
  visible,
  submissionData,
  onGoToListings,
  onSubmitAnother,
  onClose,
  isEditMode = false,
}) {
  const { t, isHindi } = useLanguage();
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Animated Success Badge */}
          <View style={styles.successIconWrapper}>
            <CheckCircle2 size={44} color="#10B981" />
          </View>

          <Text style={styles.title}>
            {isEditMode
              ? (isHindi ? 'मोटरसाइकिल विवरण सफलतापूर्वक अपडेट किया गया!' : 'Motorcycle Details Updated Successfully!')
              : (isHindi ? 'मोटरसाइकिल सफलतापूर्वक फ्लीट में जोड़ी गई!' : 'Motorcycle Added to Fleet Successfully!')}
          </Text>

          <Text style={styles.message}>
            {isEditMode
              ? (isHindi
                  ? 'परिवर्तन सहेज लिए गए हैं और लाइव फ्लीट इन्वेंट्री में अपडेट हो गए हैं।'
                  : 'Your changes have been saved and are now live in your fleet inventory.')
              : (isHindi
                  ? 'यह वाहन अब आपके सक्रिय फ्लीट इन्वेंट्री में उपलब्ध है और ग्राहकों द्वारा तत्काल बुकिंग के लिए तैयार है।'
                  : 'This vehicle is now active in your fleet inventory and ready for immediate reservation by riders.')}
          </Text>

          {/* Submission Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fleet Unit Code</Text>
              <Text style={[styles.detailValue, styles.monoId]}>
                {submissionData?.id || submissionData?.submissionId || 'RDE-981240'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {isHindi ? 'पंजीकृत वाहन' : 'Vehicle Model'}
              </Text>
              <Text style={styles.detailValue}>
                {submissionData?.brand} {submissionData?.model} ({submissionData?.registrationNumber})
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Daily Rate</Text>
              <Text style={[styles.detailValue, { color: '#38BDF8', fontWeight: '800' }]}>
                ₹{Number(submissionData?.dailyPrice || submissionData?.pricePerDay || 1500).toLocaleString('en-IN')}/day
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fleet Status</Text>
              <View style={styles.statusBadge}>
                <CheckCircle2 size={12} color="#10B981" />
                <Text style={styles.statusText}>
                  LIVE & AVAILABLE
                </Text>
              </View>
            </View>
          </View>

          {/* Trust Guarantee Note */}
          <View style={styles.reviewNoteBox}>
            <ShieldCheck size={16} color="#38BDF8" style={{ marginTop: 2 }} />
            <Text style={styles.reviewNoteText}>
              Direct Fleet Guarantee: 100% rental revenue goes directly to your account with zero platform commission split.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsGroup}>
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={() => {
                if (typeof onGoToListings === 'function') {
                  onGoToListings();
                }
              }}
              activeOpacity={0.8}
            >
              <Bike size={18} color="#FFFFFF" />
              <Text style={styles.primaryActionText}>
                {isHindi ? 'फ्लीट कैटलॉग देखें' : 'View Fleet Catalog'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={onSubmitAnother}
              activeOpacity={0.8}
            >
              <PlusCircle size={16} color="#94A3B8" />
              <Text style={styles.secondaryActionText}>
                {isEditMode
                  ? (isHindi ? 'एक नई बाइक जोड़ें' : 'Add a New Bike')
                  : (isHindi ? 'एक और बाइक जोड़ें' : 'Add Another Motorcycle')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 20, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 24,
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
  },
  successIconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  detailsCard: {
    backgroundColor: COLORS.bgCardAlt,
    borderRadius: RADIUS.md,
    padding: 14,
    width: '100%',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  detailValue: {
    fontSize: 12.5,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  monoId: {
    fontFamily: 'monospace',
    color: '#38BDF8',
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: '#10B981',
    fontSize: 10.5,
    fontWeight: '800',
  },
  reviewNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    borderRadius: RADIUS.sm,
    padding: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    width: '100%',
  },
  reviewNoteText: {
    fontSize: 11,
    color: '#94A3B8',
    flex: 1,
    lineHeight: 16,
  },
  actionsGroup: {
    width: '100%',
    gap: 10,
  },
  primaryActionBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  secondaryActionText: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    fontWeight: '600',
  },
});
