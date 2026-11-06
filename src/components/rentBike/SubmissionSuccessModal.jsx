import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import {
  CheckCircle2,
  Clock,
  Bike,
  ShieldCheck,
  ArrowRight,
  Eye,
  PlusCircle,
  Home,
} from 'lucide-react-native';
import { COLORS, RADIUS } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

export default function SubmissionSuccessModal({
  visible,
  submissionData,
  onGoToListings,
  onOpenAdminQueue,
  onSubmitAnother,
  onClose,
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
            {t('rentBike.successTitle', 'Your Bike Has Been Submitted Successfully!')}
          </Text>

          <Text style={styles.message}>
            {t('rentBike.successMsg', 'Our verification team will review your information and documents. Your bike will become visible on the marketplace only after approval.')}
          </Text>

          {/* Submission Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('rentBike.submissionId', 'Submission ID')}</Text>
              <Text style={[styles.detailValue, styles.monoId]}>
                {submissionData?.submissionId || 'SUB-2026-8942'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {isHindi ? 'पंजीकृत वाहन' : 'Vehicle Registered'}
              </Text>
              <Text style={styles.detailValue}>
                {submissionData?.brand} {submissionData?.model} ({submissionData?.registrationNumber})
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('rentBike.submissionDate', 'Submission Date')}</Text>
              <Text style={styles.detailValue}>
                {submissionData?.submissionDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('rentBike.verificationStatus', 'Verification Status')}</Text>
              <View style={styles.statusBadge}>
                <Clock size={12} color="#F59E0B" />
                <Text style={styles.statusText}>
                  {t('rentBike.pendingReview', 'Pending Admin Review')}
                </Text>
              </View>
            </View>
          </View>

          {/* Trust Guarantee Note */}
          <View style={styles.reviewNoteBox}>
            <ShieldCheck size={16} color="#38BDF8" style={{ marginTop: 2 }} />
            <Text style={styles.reviewNoteText}>
              {isHindi
                ? 'समीक्षा समय: प्रारंभिक आरटीओ और दस्तावेज़ जांच आमतौर पर 4 से 24 घंटों के भीतर पूरी की जाती है। अनुमोदन पर आपको एसएमएस और ईमेल सूचना प्राप्त होगी।'
                : 'Turnaround Time: Initial RTO and document screening is usually processed within 4 to 24 hours. You will receive an SMS and email notification upon approval.'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsGroup}>
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={onGoToListings}
              activeOpacity={0.8}
            >
              <Bike size={18} color="#FFFFFF" />
              <Text style={styles.primaryActionText}>
                {t('rentBike.goListingsBtn', 'Go to My Listings')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.adminQueueBtn}
              onPress={onOpenAdminQueue}
              activeOpacity={0.8}
            >
              <Eye size={16} color="#38BDF8" />
              <Text style={styles.adminQueueText}>
                {isHindi ? 'एडमिन सत्यापन कतार में देखें' : 'View in Admin Verification Queue'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={onSubmitAnother}
              activeOpacity={0.8}
            >
              <PlusCircle size={16} color="#94A3B8" />
              <Text style={styles.secondaryActionText}>
                {isHindi ? 'एक और बाइक सबमिट करें' : 'Submit Another Bike'}
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
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: RADIUS.xl,
    padding: 28,
    width: '100%',
    maxWidth: 540,
    alignItems: 'center',
    shadowColor: '#00A3FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  successIconWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.md,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12.5,
    color: COLORS.textMuted,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  monoId: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusText: {
    color: '#F59E0B',
    fontSize: 11.5,
    fontWeight: '700',
  },
  reviewNoteBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    borderRadius: RADIUS.sm,
    padding: 12,
    marginBottom: 22,
    width: '100%',
  },
  reviewNoteText: {
    fontSize: 11.5,
    color: '#CBD5E1',
    lineHeight: 17,
    flex: 1,
  },
  actionsGroup: {
    width: '100%',
    gap: 10,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: RADIUS.full,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  adminQueueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingVertical: 12,
    borderRadius: RADIUS.full,
  },
  adminQueueText: {
    color: '#38BDF8',
    fontSize: 13,
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
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});

