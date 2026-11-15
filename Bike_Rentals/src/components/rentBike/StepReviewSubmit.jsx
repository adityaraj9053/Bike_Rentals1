import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  ShieldCheck,
  Check,
  AlertTriangle,
  User,
  Bike,
  FileText,
  IndianRupee,
  MapPin,
  Clock,
  Lock,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  Send,
} from 'lucide-react-native';
import { COLORS, RADIUS } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

export default function StepReviewSubmit({
  data,
  onGoToStep,
  onSubmit,
  isSubmitting = false,
  errors = {},
  isEditMode = false,
  navigation,
  onGoToFleet,
}) {
  const { t, isHindi } = useLanguage();
  const [agreedAccurate, setAgreedAccurate] = useState(isEditMode);
  const [agreedAuthorization, setAgreedAuthorization] = useState(isEditMode);
  const [agreedPolicies, setAgreedPolicies] = useState(isEditMode);
  const [agreedConsent, setAgreedConsent] = useState(isEditMode);
  const [agreementError, setAgreementError] = useState('');

  // If in edit mode, ensure agreements are considered valid
  React.useEffect(() => {
    if (isEditMode) {
      setAgreedAccurate(true);
      setAgreedAuthorization(true);
      setAgreedPolicies(true);
      setAgreedConsent(true);
    }
  }, [isEditMode]);

  const allAgreed = agreedAccurate && agreedAuthorization && agreedPolicies && agreedConsent;

  const handleNavigateToFleet = () => {
    if (typeof onGoToFleet === 'function') {
      onGoToFleet();
      return;
    }
    if (navigation?.navigate) {
      try {
        navigation.navigate('MainTabs', {
          screen: 'Motorbikes',
          params: { initialCategory: 'all', timestamp: Date.now() },
        });
      } catch (e) {}
      try {
        navigation.navigate('Motorbikes', { initialCategory: 'all', timestamp: Date.now() });
      } catch (e) {}
      try {
        const parent = navigation.getParent?.();
        if (parent?.navigate) {
          parent.navigate('MainTabs', {
            screen: 'Motorbikes',
            params: { initialCategory: 'all', timestamp: Date.now() },
          });
          parent.navigate('Motorbikes', { initialCategory: 'all', timestamp: Date.now() });
        }
      } catch (e) {}
    }
  };

  const handleSubmit = () => {
    if (!allAgreed) {
      setAgreementError(
        isHindi
          ? 'सबमिट करने से पहले कृपया सभी अनिवार्य घोषणा बॉक्स देखें और टिक करें।'
          : 'Please review and check all mandatory declaration boxes before adding to fleet.'
      );
      return;
    }
    setAgreementError('');
    onSubmit();
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>
            {isEditMode ? 'FLEET UPDATE • REVIEW' : 'FLEET ADDITION • REVIEW'}
          </Text>
        </View>
        <Text style={styles.sectionTitle}>
          {isEditMode
            ? (isHindi ? 'विवरण की समीक्षा करें और अपडेट करें' : 'Review & Update Bike Details')
            : t('rentBike.reviewTitle', 'Review & Add to Fleet')}
        </Text>
        <Text style={styles.sectionSub}>
          {isEditMode
            ? (isHindi
                ? 'कृपया लाइव फ्लीट में परिवर्तन सहेजने से पहले विनिर्देशों, दस्तावेजों और दरों की पुष्टि करें।'
                : 'Please verify the updated motorcycle specifications, documents, and rental rates before saving changes.')
            : t('rentBike.reviewSub', 'Please verify the motorcycle specifications, documents, and rental rates before publishing to the live fleet.')}
        </Text>
      </View>

      {/* Review Section 1: Pre-Saved Fleet Business Profile */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryCardHeader}>
          <View style={styles.cardHeaderLeft}>
            <User size={18} color="#38BDF8" />
            <Text style={styles.cardHeaderTitle}>Fleet Business Profile (Stored Once)</Text>
          </View>
          <View style={styles.verifiedTag}>
            <Text style={styles.verifiedTagText}>✓ Stored Profile</Text>
          </View>
        </View>

        <View style={styles.reviewGrid}>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Fleet Operator</Text>
            <Text style={styles.reviewItemVal}>The Road Eagle Direct Fleet</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Fleet Manager</Text>
            <Text style={styles.reviewItemVal}>{data.fullName || 'The Road Eagle Operations'}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Default Pickup Hub</Text>
            <Text style={styles.reviewItemVal}>{data.pickupAddress || '123 Rider Avenue, Sector 5, Bandra West'}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Revenue Model</Text>
            <Text style={[styles.reviewItemVal, { color: '#38BDF8', fontWeight: '800' }]}>
              100% Direct to Fleet (0% Platform Deductions)
            </Text>
          </View>
        </View>
      </View>

      {/* Review Section 2: Bike Details & Photos */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryCardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Bike size={18} color="#38BDF8" />
            <Text style={styles.cardHeaderTitle}>1. Motorcycle Specifications & Photos</Text>
          </View>
          <TouchableOpacity onPress={() => onGoToStep(0)} activeOpacity={0.7}>
            <Text style={styles.editStepLink}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reviewGrid}>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Make & Model</Text>
            <Text style={[styles.reviewItemVal, styles.boldVal]}>
              {data.brand || '—'} {data.model || '—'} ({data.manufacturingYear || '—'})
            </Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Registration Number</Text>
            <Text style={[styles.reviewItemVal, styles.boldVal, { color: '#38BDF8' }]}>
              {data.registrationNumber || '—'}
            </Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Category</Text>
            <Text style={styles.reviewItemVal}>{data.category || '—'}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Engine CC / Transmission</Text>
            <Text style={styles.reviewItemVal}>
              {data.engineCapacity || '—'} CC • {data.transmission || 'Manual'}
            </Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Colour</Text>
            <Text style={styles.reviewItemVal}>{data.colour || '—'}</Text>
          </View>
        </View>

        {/* 4 Angle Photos Preview */}
        <View style={styles.photoThumbGrid}>
          {['front', 'rear', 'left', 'right'].map((angle) => {
            const uri = data.images?.[angle];
            return (
              <View key={angle} style={styles.thumbWrapper}>
                {uri ? (
                  <Image source={{ uri }} style={styles.thumbImg} resizeMode="cover" />
                ) : (
                  <View style={styles.thumbEmpty}>
                    <Text style={styles.thumbEmptyText}>No {angle}</Text>
                  </View>
                )}
                <Text style={styles.thumbLabel}>{angle.toUpperCase()}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Review Section 3: Documents & Compliance */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryCardHeader}>
          <View style={styles.cardHeaderLeft}>
            <FileText size={18} color="#38BDF8" />
            <Text style={styles.cardHeaderTitle}>2. Compliance Documents</Text>
          </View>
          <TouchableOpacity onPress={() => onGoToStep(1)} activeOpacity={0.7}>
            <Text style={styles.editStepLink}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.docMiniList}>
          <View style={styles.docMiniRow}>
            <Text style={styles.docMiniName}>RC Smart Card:</Text>
            <Text style={styles.docMiniStatus}>
              {data.documents?.rc ? `Uploaded (${data.documents.rc.fileName || 'Verified'})` : 'Missing'}
            </Text>
          </View>
          <View style={styles.docMiniRow}>
            <Text style={styles.docMiniName}>Insurance Policy ({data.insurancePolicyNumber || 'N/A'}):</Text>
            <Text style={styles.docMiniStatus}>
              {data.documents?.insurance ? `Valid till ${data.insuranceExpiryDate || 'Active'}` : 'Missing'}
            </Text>
          </View>
          <View style={styles.docMiniRow}>
            <Text style={styles.docMiniName}>PUC Certificate:</Text>
            <Text style={styles.docMiniStatus}>
              {data.documents?.puc ? `Valid till ${data.pucExpiryDate || 'Active'}` : 'Missing'}
            </Text>
          </View>
        </View>

        <View style={styles.privacyAssuranceBox}>
          <Lock size={14} color="#38BDF8" />
          <Text style={styles.privacyAssuranceText}>
            Compliance documents are stored securely and verified before vehicle dispatch.
          </Text>
        </View>
      </View>

      {/* Review Section 4: Rental Information & Pricing */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryCardHeader}>
          <View style={styles.cardHeaderLeft}>
            <IndianRupee size={18} color="#38BDF8" />
            <Text style={styles.cardHeaderTitle}>3. Rental Pricing & Hub</Text>
          </View>
          <TouchableOpacity onPress={() => onGoToStep(2)} activeOpacity={0.7}>
            <Text style={styles.editStepLink}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reviewGrid}>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Daily Rental Rate</Text>
            <Text style={[styles.reviewItemVal, styles.priceHighlight]}>
              ₹{data.dailyPrice || '0'} <Text style={styles.subDay}>/ day</Text>
            </Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Security Deposit</Text>
            <Text style={[styles.reviewItemVal, styles.boldVal]}>
              ₹{data.securityDeposit || '0'} (Refundable)
            </Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Pickup Hub Address</Text>
            <Text style={styles.reviewItemVal}>{data.pickupAddress || 'Flagship Hub'}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Operating Hours</Text>
            <Text style={styles.reviewItemVal}>{data.pickupTimings || '07:00 AM - 09:00 PM'}</Text>
          </View>
        </View>
      </View>

      {/* Mandatory Declarations & Checkboxes */}
      <View style={styles.declarationSection}>
        <Text style={styles.declarationTitle}>Fleet Owner Declarations & Authorizations</Text>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreedAccurate(!agreedAccurate)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, agreedAccurate && styles.checkboxActive]}>
            {agreedAccurate && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
          </View>
          <Text style={styles.checkboxLabel}>
            I certify that the vehicle specifications, registration details, and documents are 100% genuine and legally compliant.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreedAuthorization(!agreedAuthorization)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, agreedAuthorization && styles.checkboxActive]}>
            {agreedAuthorization && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
          </View>
          <Text style={styles.checkboxLabel}>
            The vehicle has undergone mandatory mechanical and safety inspection and is roadworthy for immediate rental dispatch.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreedPolicies(!agreedPolicies)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, agreedPolicies && styles.checkboxActive]}>
            {agreedPolicies && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
          </View>
          <Text style={styles.checkboxLabel}>
            I agree to The Road Eagle fleet operational standards, fair pricing policies, and rider safety charter.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreedConsent(!agreedConsent)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, agreedConsent && styles.checkboxActive]}>
            {agreedConsent && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
          </View>
          <Text style={styles.checkboxLabel}>
            I authorize publishing this motorcycle directly to the live catalog for public reservation.
          </Text>
        </TouchableOpacity>

        {agreementError ? (
          <View style={styles.errorNotice}>
            <AlertTriangle size={15} color="#EF4444" />
            <Text style={styles.errorNoticeText}>{agreementError}</Text>
          </View>
        ) : null}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.finalSubmitBtn, (!allAgreed || isSubmitting) && styles.finalSubmitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!allAgreed || isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Send size={16} color="#FFFFFF" />
              <Text style={styles.finalSubmitBtnText}>
                {isEditMode
                  ? (isHindi ? 'मोटरसाइकिल विवरण अपडेट करें' : 'Update Motorcycle Details')
                  : 'Publish Motorcycle to Fleet'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.viewFleetCatalogBtn}
          onPress={handleNavigateToFleet}
          activeOpacity={0.8}
        >
          <Bike size={16} color="#38BDF8" />
          <Text style={styles.viewFleetCatalogBtnText}>
            {isHindi ? 'फ्लीट कैटलॉग देखें' : 'View Fleet Catalog'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 2,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  badgeText: {
    color: '#38BDF8',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  sectionSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: COLORS.bgCardAlt,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCard,
    paddingBottom: 10,
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  verifiedTag: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedTagText: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: '700',
  },
  editStepLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#38BDF8',
  },
  reviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  reviewItem: {
    minWidth: '46%',
    flex: 1,
    marginBottom: 4,
  },
  reviewItemLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  reviewItemVal: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  boldVal: {
    fontWeight: '700',
  },
  priceHighlight: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: '800',
  },
  subDay: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '400',
  },
  photoThumbGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
  },
  thumbWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  thumbImg: {
    width: '100%',
    height: 60,
    borderRadius: RADIUS.sm,
    backgroundColor: '#0F172A',
  },
  thumbEmpty: {
    width: '100%',
    height: 60,
    borderRadius: RADIUS.sm,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmptyText: {
    fontSize: 9,
    color: COLORS.textMuted,
  },
  thumbLabel: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: '700',
  },
  docMiniList: {
    gap: 6,
  },
  docMiniRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  docMiniName: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
  },
  docMiniStatus: {
    fontSize: 12.5,
    color: '#38BDF8',
    fontWeight: '600',
  },
  privacyAssuranceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
    borderRadius: RADIUS.sm,
    padding: 8,
    marginTop: 10,
  },
  privacyAssuranceText: {
    fontSize: 11,
    color: '#94A3B8',
    flex: 1,
  },
  declarationSection: {
    backgroundColor: COLORS.bgCardAlt,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  declarationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  checkboxLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 17,
  },
  errorNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: RADIUS.sm,
    padding: 8,
    marginTop: 8,
  },
  errorNoticeText: {
    fontSize: 12,
    color: '#EF4444',
    flex: 1,
  },
  actionRow: {
    marginTop: 4,
    marginBottom: 20,
  },
  finalSubmitBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  finalSubmitBtnDisabled: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    opacity: 0.6,
  },
  finalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  viewFleetCatalogBtn: {
    marginTop: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  viewFleetCatalogBtnText: {
    color: '#38BDF8',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
