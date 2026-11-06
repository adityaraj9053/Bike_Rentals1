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
}) {
  const { t, isHindi } = useLanguage();
  const [agreedAccurate, setAgreedAccurate] = useState(false);
  const [agreedAuthorization, setAgreedAuthorization] = useState(false);
  const [agreedPolicies, setAgreedPolicies] = useState(false);
  const [agreedConsent, setAgreedConsent] = useState(false);
  const [agreementError, setAgreementError] = useState('');

  const allAgreed = agreedAccurate && agreedAuthorization && agreedPolicies && agreedConsent;

  const handleSubmit = () => {
    if (!allAgreed) {
      setAgreementError(
        isHindi
          ? 'सबमिट करने से पहले कृपया सभी अनिवार्य घोषणा बॉक्स देखें और टिक करें।'
          : 'Please review and check all mandatory declaration boxes before submitting.'
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
          <Text style={styles.badgeText}>{t('rentBike.reviewStepBadge', 'STEP 5 OF 5')}</Text>
        </View>
        <Text style={styles.sectionTitle}>{t('rentBike.reviewTitle', 'Review & Final Submission')}</Text>
        <Text style={styles.sectionSub}>
          {t('rentBike.reviewSub', 'Please verify that all submitted vehicle specifications and legal declarations are accurate before submitting for platform compliance review.')}
        </Text>
      </View>

      {/* Review Section 1: Owner Details */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryCardHeader}>
          <View style={styles.cardHeaderLeft}>
            <User size={18} color="#38BDF8" />
            <Text style={styles.cardHeaderTitle}>1. Owner Information</Text>
          </View>
          <TouchableOpacity onPress={() => onGoToStep(0)} activeOpacity={0.7}>
            <Text style={styles.editStepLink}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reviewGrid}>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Full Name</Text>
            <Text style={styles.reviewItemVal}>{data.fullName || '—'}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Mobile Number</Text>
            <Text style={styles.reviewItemVal}>
              {data.countryCode || '+91'} {data.phone || '—'} {data.mobileVerified ? '✓ Verified' : '(Pending)'}
            </Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Email</Text>
            <Text style={styles.reviewItemVal}>
              {data.email || '—'} {data.emailVerified ? '✓ Verified' : '(Pending)'}
            </Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Residential Address</Text>
            <Text style={styles.reviewItemVal}>
              {data.address ? `${data.address}, ${data.city || ''}, ${data.state || ''} - ${data.pincode || ''}` : '—'}
            </Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Identity Document</Text>
            <Text style={[styles.reviewItemVal, { color: '#F59E0B' }]}>
              {data.idDocument ? `${data.idDocument.type} (Pending Administrative KYC)` : 'Pending Upload'}
            </Text>
          </View>
        </View>
      </View>

      {/* Review Section 2: Bike Details & Photos */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryCardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Bike size={18} color="#38BDF8" />
            <Text style={styles.cardHeaderTitle}>2. Bike Information</Text>
          </View>
          <TouchableOpacity onPress={() => onGoToStep(1)} activeOpacity={0.7}>
            <Text style={styles.editStepLink}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reviewGrid}>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Brand & Model</Text>
            <Text style={[styles.reviewItemVal, styles.boldVal]}>
              {data.brand} {data.model} ({data.manufacturingYear})
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
            <Text style={styles.reviewItemLabel}>Engine & Fuel</Text>
            <Text style={styles.reviewItemVal}>
              {data.engineCapacity} CC • {data.fuelType} • {data.transmission}
            </Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Colour</Text>
            <Text style={styles.reviewItemVal}>{data.colour || '—'}</Text>
          </View>
        </View>

        {/* Thumbnail Preview Row */}
        {data.images && (
          <View style={styles.photoThumbnailsRow}>
            {Object.entries(data.images).map(([angle, url]) => (
              <View key={angle} style={styles.thumbWrapper}>
                <Image source={{ uri: url }} style={styles.thumbImg} />
                <Text style={styles.thumbLabel}>{angle.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Review Section 3: Documents & Compliance */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryCardHeader}>
          <View style={styles.cardHeaderLeft}>
            <FileText size={18} color="#38BDF8" />
            <Text style={styles.cardHeaderTitle}>3. Submitted Documents</Text>
          </View>
          <TouchableOpacity onPress={() => onGoToStep(2)} activeOpacity={0.7}>
            <Text style={styles.editStepLink}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.docMiniList}>
          <View style={styles.docMiniRow}>
            <Text style={styles.docMiniName}>Registration Certificate (RC):</Text>
            <Text style={styles.docMiniStatus}>
              {data.documents?.rc ? `Uploaded (${data.documents.rc.fileName})` : 'Missing'}
            </Text>
          </View>
          <View style={styles.docMiniRow}>
            <Text style={styles.docMiniName}>Insurance Policy ({data.insurancePolicyNumber || 'N/A'}):</Text>
            <Text style={styles.docMiniStatus}>
              {data.documents?.insurance ? `Valid till ${data.insuranceExpiryDate || 'Date'}` : 'Missing'}
            </Text>
          </View>
          <View style={styles.docMiniRow}>
            <Text style={styles.docMiniName}>PUC Certificate:</Text>
            <Text style={styles.docMiniStatus}>
              {data.documents?.puc ? `Valid till ${data.pucExpiryDate || 'Date'}` : 'Missing'}
            </Text>
          </View>
          <View style={styles.docMiniRow}>
            <Text style={styles.docMiniName}>Ownership Status:</Text>
            <Text style={styles.docMiniStatus}>
              {data.ownershipType === 'registered_owner' ? 'Registered Vehicle Owner' : 'Authorized Representative'}
            </Text>
          </View>
        </View>

        <View style={styles.privacyAssuranceBox}>
          <Lock size={14} color="#38BDF8" />
          <Text style={styles.privacyAssuranceText}>
            Documents are encrypted and kept confidential. Never displayed to renters or public.
          </Text>
        </View>
      </View>

      {/* Review Section 4: Rental Information & Pricing */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryCardHeader}>
          <View style={styles.cardHeaderLeft}>
            <IndianRupee size={18} color="#38BDF8" />
            <Text style={styles.cardHeaderTitle}>4. Rental Pricing & Hub</Text>
          </View>
          <TouchableOpacity onPress={() => onGoToStep(3)} activeOpacity={0.7}>
            <Text style={styles.editStepLink}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.reviewGrid}>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Daily Rental Price</Text>
            <Text style={[styles.reviewItemVal, styles.priceHighlight]}>
              ₹{data.dailyPrice || '0'} <Text style={styles.subDay}>/ day</Text>
            </Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Refundable Deposit</Text>
            <Text style={[styles.reviewItemVal, styles.boldVal]}>
              ₹{data.securityDeposit || '0'} (Held in Escrow)
            </Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Duration Limits</Text>
            <Text style={styles.reviewItemVal}>
              Min: {data.minDuration || 1} Day(s) • Max: {data.maxDuration || 14} Day(s)
            </Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Pickup Location</Text>
            <Text style={styles.reviewItemVal}>
              {data.pickupLocation || '—'} ({data.pickupTimings || 'Standard hours'})
            </Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewItemLabel}>Doorstep Delivery</Text>
            <Text style={styles.reviewItemVal}>
              {data.deliveryAvailable ? 'Yes, Available within radius' : 'No (Pickup Hub only)'}
            </Text>
          </View>
        </View>
      </View>

      {/* Mandatory Checkboxes & Declarations */}
      <View style={styles.declarationsSection}>
        <Text style={styles.declarationsHeading}>
          {t('rentBike.termsTitle', 'Mandatory Legal Declarations & Consent')}
        </Text>
        <Text style={styles.declarationsSub}>
          {isHindi
            ? 'वाहन लिस्टिंग के साथ आगे बढ़ने के लिए कृपया प्रत्येक घोषणा की जांच करें:'
            : 'Please check each declaration to proceed with vehicle listing:'}
        </Text>

        {/* Checkbox 1 */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreedAccurate(!agreedAccurate)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkboxBox, agreedAccurate && styles.checkboxBoxChecked]}>
            {agreedAccurate && <Check size={14} color="#FFFFFF" />}
          </View>
          <Text style={styles.checkboxText}>
            {t('rentBike.term1', 'I confirm that the information submitted is accurate.')}
          </Text>
        </TouchableOpacity>

        {/* Checkbox 2 */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreedAuthorization(!agreedAuthorization)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkboxBox, agreedAuthorization && styles.checkboxBoxChecked]}>
            {agreedAuthorization && <Check size={14} color="#FFFFFF" />}
          </View>
          <Text style={styles.checkboxText}>
            {t('rentBike.term2', 'I confirm that I am the registered owner or have appropriate authorization.')}
          </Text>
        </TouchableOpacity>

        {/* Checkbox 3 */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreedPolicies(!agreedPolicies)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkboxBox, agreedPolicies && styles.checkboxBoxChecked]}>
            {agreedPolicies && <Check size={14} color="#FFFFFF" />}
          </View>
          <Text style={styles.checkboxText}>
            {t('rentBike.term3', "I agree to the platform's verification and rental policies.")}
          </Text>
        </TouchableOpacity>

        {/* Checkbox 4 */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreedConsent(!agreedConsent)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkboxBox, agreedConsent && styles.checkboxBoxChecked]}>
            {agreedConsent && <Check size={14} color="#FFFFFF" />}
          </View>
          <Text style={styles.checkboxText}>
            {t('rentBike.term4', 'I consent to the processing of my information for the stated verification purposes.')}
          </Text>
        </TouchableOpacity>

        {agreementError ? (
          <View style={styles.errorBanner}>
            <AlertTriangle size={15} color="#EF4444" />
            <Text style={styles.errorBannerText}>{agreementError}</Text>
          </View>
        ) : null}
      </View>

      {/* Final Submit Button */}
      <View style={styles.submitArea}>
        <TouchableOpacity
          style={[styles.finalSubmitBtn, (!allAgreed || isSubmitting) && styles.finalSubmitBtnDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <ShieldCheck size={20} color="#FFFFFF" />
              <Text style={styles.finalSubmitBtnText}>
                {t('rentBike.submitBtn', 'Submit for Verification')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.submitDisclaimer}>
          {isHindi
            ? 'हमारी संचालन सत्यापन टीम द्वारा मैन्युअल दस्तावेज़ समीक्षा के बाद ही लिस्टिंग मार्केटप्लेस पर सक्रिय होगी।'
            : 'Listing will become active on the marketplace only after manual document review by our operations verification team.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sectionHeader: {
    marginBottom: 24,
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: 8,
  },
  badgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  sectionSub: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 18,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontWeight: '800',
    color: '#FFFFFF',
  },
  editStepLink: {
    color: '#38BDF8',
    fontSize: 12.5,
    fontWeight: '700',
  },
  reviewGrid: {
    gap: 10,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 6,
  },
  reviewItemLabel: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    minWidth: 130,
  },
  reviewItemVal: {
    fontSize: 13,
    color: COLORS.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  boldVal: {
    fontWeight: '700',
  },
  priceHighlight: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },
  subDay: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '400',
  },
  photoThumbnailsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
  },
  thumbWrapper: {
    flex: 1,
    height: 70,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.bgCardAlt,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbLabel: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  docMiniList: {
    gap: 8,
  },
  docMiniRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    gap: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    padding: 10,
    borderRadius: RADIUS.sm,
    marginTop: 12,
  },
  privacyAssuranceText: {
    fontSize: 11.5,
    color: '#94A3B8',
    flex: 1,
  },
  declarationsSection: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 20,
    gap: 12,
  },
  declarationsHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  declarationsSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    backgroundColor: COLORS.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxBoxChecked: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  checkboxText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 20,
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: RADIUS.sm,
    padding: 10,
    marginTop: 4,
  },
  errorBannerText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  submitArea: {
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  finalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#0284C7',
    width: '100%',
    paddingVertical: 16,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  finalSubmitBtnDisabled: {
    opacity: 0.6,
  },
  finalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  submitDisclaimer: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 520,
    lineHeight: 18,
  },
});

