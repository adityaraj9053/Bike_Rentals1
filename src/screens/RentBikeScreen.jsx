import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import {
  User,
  Bike,
  FileText,
  IndianRupee,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  X,
  HelpCircle,
  Sparkles,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { useLanguage } from '../i18n/LanguageContext';
import StepOwnerInfo from '../components/rentBike/StepOwnerInfo';
import StepBikeInfo from '../components/rentBike/StepBikeInfo';
import StepDocSubmission from '../components/rentBike/StepDocSubmission';
import StepRentalInfo from '../components/rentBike/StepRentalInfo';
import StepReviewSubmit from '../components/rentBike/StepReviewSubmit';
import SubmissionSuccessModal from '../components/rentBike/SubmissionSuccessModal';

const { width } = Dimensions.get('window');

const STEPS = [
  { id: 0, title: 'Owner Info', icon: User, short: 'Owner' },
  { id: 1, title: 'Bike Info', icon: Bike, short: 'Bike' },
  { id: 2, title: 'Documents', icon: FileText, short: 'Docs' },
  { id: 3, title: 'Rental Info', icon: IndianRupee, short: 'Rental' },
  { id: 4, title: 'Review & Submit', icon: CheckCircle2, short: 'Review' },
];

const INITIAL_FORM_DATA = {
  // Step 1: Owner
  fullName: '',
  phone: '',
  countryCode: '+91',
  mobileVerified: false,
  email: '',
  emailVerified: false,
  address: '',
  city: '',
  state: '',
  pincode: '',
  idDocument: null,

  // Step 2: Bike
  brand: '',
  model: '',
  manufacturingYear: '',
  registrationNumber: '',
  category: '',
  engineCapacity: '',
  fuelType: 'Petrol',
  transmission: 'Manual',
  colour: '',
  description: '',
  images: {
    front: null,
    rear: null,
    left: null,
    right: null,
  },

  // Step 3: Documents
  documents: {
    rc: null,
    insurance: null,
    puc: null,
  },
  insurancePolicyNumber: '',
  insuranceExpiryDate: '',
  pucExpiryDate: '',
  chassisNumber: '',
  engineNumber: '',
  registeredOwnerName: '',
  ownershipType: 'registered_owner', // 'registered_owner' | 'authorized_representative'

  // Step 4: Rental
  dailyPrice: '',
  securityDeposit: '',
  minDuration: 1,
  maxDuration: 14,
  availabilityPreset: 'Next 30 Days',
  availableFrom: 'Immediate',
  availableTo: '+30 Days',
  pickupLocation: '',
  pickupAddress: '',
  pickupTimings: '07:00 AM - 09:00 PM',
  deliveryAvailable: false,
  rulesList: [],
};

const SAMPLE_DEMO_DATA = {
  fullName: 'Vikram Malhotra',
  phone: '9820144521',
  countryCode: '+91',
  mobileVerified: true,
  email: 'vikram.malhotra@gmail.com',
  emailVerified: true,
  address: 'B-402, Sea Breeze Apts, Bandra West',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400050',
  idDocument: {
    type: 'Aadhaar Card',
    fileName: 'Aadhaar_Card_Copy.pdf',
    fileSize: '1.4 MB',
    uploadedAt: '2026-11-06',
    verificationState: 'Uploaded - Awaiting Manual Admin Review',
  },
  brand: 'Royal Enfield',
  model: 'Himalayan 450',
  manufacturingYear: '2024',
  registrationNumber: 'MH 02 FJ 9042',
  category: 'Adventure Tourer',
  engineCapacity: '450',
  fuelType: 'Petrol',
  transmission: 'Manual',
  colour: 'Kamet White',
  description: 'Fully serviced Himalayan 450 with touring screen, engine guards, and hard pannier stays.',
  images: {
    front: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
    rear: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
    left: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
    right: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80',
  },
  documents: {
    rc: { fileName: 'MH02FJ9042_RC_SmartCard.pdf', fileSize: '1.8 MB', uploadedAt: '06 Nov 2026', status: 'Simulated Upload - Pending Verifier Check' },
    insurance: { fileName: 'ICICI_Lombard_Comprehensive_Policy.pdf', fileSize: '2.4 MB', uploadedAt: '06 Nov 2026', status: 'Simulated Upload - Pending Verifier Check' },
    puc: { fileName: 'PUCC_Valid_Certificate.pdf', fileSize: '650 KB', uploadedAt: '06 Nov 2026', status: 'Simulated Upload - Pending Verifier Check' },
  },
  insurancePolicyNumber: '3005/2024/9812401',
  insuranceExpiryDate: '2027-05-18',
  pucExpiryDate: '2027-04-10',
  chassisNumber: 'ME3H450XXXX88291',
  engineNumber: 'H450E882910',
  registeredOwnerName: 'Vikram Malhotra',
  ownershipType: 'registered_owner',
  dailyPrice: 1600,
  securityDeposit: 3500,
  minDuration: 1,
  maxDuration: 14,
  availabilityPreset: 'Next 30 Days',
  availableFrom: 'Immediate',
  availableTo: '+30 Days',
  pickupLocation: 'Bandra West, Mumbai',
  pickupAddress: 'Plot 12, Hill Road, Near Bandra Station West',
  pickupTimings: '07:00 AM - 09:00 PM',
  deliveryAvailable: true,
  rulesList: [
    'Complimentary helmet included with bike',
    'Return vehicle with full tank of fuel',
    'Original driving licence MCWG inspection at pickup',
    'Speed monitoring above 100 km/h via platform telematics',
  ],
};

export default function RentBikeScreen({
  navigation,
  user,
  onOpenAuth,
  onShowToast,
  onBikeSubmitted,
}) {
  const { t, isHindi, toggleLanguage } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  const STEPS = [
    { id: 0, title: t('rentBike.step0', 'Owner Info'), icon: User, short: 'Owner' },
    { id: 1, title: t('rentBike.step1', 'Bike Info'), icon: Bike, short: 'Bike' },
    { id: 2, title: t('rentBike.step2', 'Documents'), icon: FileText, short: 'Docs' },
    { id: 3, title: t('rentBike.step3', 'Rental Info'), icon: IndianRupee, short: 'Rental' },
    { id: 4, title: t('rentBike.step4', 'Review & Submit'), icon: CheckCircle2, short: 'Review' },
  ];
  const [formData, setFormData] = useState(() => ({
    ...INITIAL_FORM_DATA,
    fullName: user?.name || INITIAL_FORM_DATA.fullName,
    email: user?.email || INITIAL_FORM_DATA.email,
    emailVerified: user?.email ? true : INITIAL_FORM_DATA.emailVerified,
    phone: user?.phone || INITIAL_FORM_DATA.phone,
    countryCode: user?.countryCode || INITIAL_FORM_DATA.countryCode || '+91',
    mobileVerified: user?.phone ? true : INITIAL_FORM_DATA.mobileVerified,
    registeredOwnerName: user?.name || INITIAL_FORM_DATA.registeredOwnerName,
  }));
  const [stepErrors, setStepErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModalData, setSuccessModalData] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Synchronize when authenticated user changes or logs in
  React.useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
        emailVerified: user.email ? true : prev.emailVerified,
        phone: user.phone || prev.phone,
        countryCode: user.countryCode || prev.countryCode || '+91',
        mobileVerified: user.phone ? true : prev.mobileVerified,
        registeredOwnerName: user.name || prev.registeredOwnerName,
      }));
    }
  }, [user]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (stepErrors[field]) {
      setStepErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleFillSampleData = () => {
    setFormData((prev) => ({
      ...SAMPLE_DEMO_DATA,
      fullName: user?.name || SAMPLE_DEMO_DATA.fullName,
      email: user?.email || SAMPLE_DEMO_DATA.email,
      phone: user?.phone || SAMPLE_DEMO_DATA.phone,
      countryCode: user?.countryCode || SAMPLE_DEMO_DATA.countryCode,
      registeredOwnerName: user?.name || SAMPLE_DEMO_DATA.registeredOwnerName,
    }));
    setStepErrors({});
    if (onShowToast) {
      onShowToast('Sample bike & owner data loaded for quick testing!');
    }
  };

  const validateStep = (stepIndex) => {
    const errors = {};

    if (stepIndex === 0) {
      if (!formData.fullName?.trim()) errors.fullName = 'Full legal name is required.';
      if (!formData.phone || formData.phone.length < 10) errors.phone = 'Valid 10-digit phone number is required.';
      if (!formData.email || !formData.email.includes('@')) errors.email = 'Valid email address is required.';
      if (!formData.address?.trim()) errors.address = 'Residential address is required.';
      if (!formData.city?.trim()) errors.city = 'City is required.';
      if (!formData.state?.trim()) errors.state = 'State is required.';
      if (!formData.pincode || formData.pincode.length < 6) errors.pincode = 'Valid 6-digit PIN code is required.';
    }

    if (stepIndex === 1) {
      if (!formData.brand?.trim()) errors.brand = 'Bike brand is required.';
      if (!formData.model?.trim()) errors.model = 'Bike model is required.';
      if (!formData.manufacturingYear) errors.manufacturingYear = 'Manufacturing year is required.';
      if (!formData.registrationNumber?.trim()) errors.registrationNumber = 'Registration number is required.';
      if (!formData.category) errors.category = 'Category is required.';
      if (!formData.engineCapacity) errors.engineCapacity = 'Engine CC is required.';
      if (!formData.colour?.trim()) errors.colour = 'Bike colour is required.';
      if (!formData.description?.trim()) errors.description = 'Brief vehicle description is required.';

      const imgs = formData.images || {};
      if (!imgs.front || !imgs.rear || !imgs.left || !imgs.right) {
        errors.images = 'All 4 required exterior photographs (Front, Rear, Left, Right) must be uploaded.';
      }
    }

    if (stepIndex === 2) {
      if (!formData.documents?.rc) errors['documents.rc'] = 'Registration Certificate (RC) upload is mandatory.';
      if (!formData.documents?.insurance) errors['documents.insurance'] = 'Insurance document upload is mandatory.';
      if (!formData.insurancePolicyNumber?.trim()) errors.insurancePolicyNumber = 'Insurance policy number is required.';
      if (!formData.insuranceExpiryDate?.trim()) errors.insuranceExpiryDate = 'Insurance expiry date is required.';
      if (!formData.documents?.puc) errors['documents.puc'] = 'PUC certificate is mandatory.';
      if (!formData.pucExpiryDate?.trim()) errors.pucExpiryDate = 'PUC expiry date is required.';
      if (!formData.chassisNumber?.trim()) errors.chassisNumber = 'Chassis number is required.';
      if (!formData.engineNumber?.trim()) errors.engineNumber = 'Engine number is required.';
      if (!formData.registeredOwnerName?.trim()) errors.registeredOwnerName = 'Registered owner name is required.';
    }

    if (stepIndex === 3) {
      if (!formData.dailyPrice || Number(formData.dailyPrice) <= 0) {
        errors.dailyPrice = 'Valid daily rental price is required.';
      }
      if (!formData.securityDeposit || Number(formData.securityDeposit) <= 0) {
        errors.securityDeposit = 'Security deposit is required.';
      }
      if (!formData.pickupLocation?.trim()) errors.pickupLocation = 'Pickup locality is required.';
      if (!formData.pickupAddress?.trim()) errors.pickupAddress = 'Detailed pickup address is required.';
      if (!formData.pickupTimings?.trim()) errors.pickupTimings = 'Pickup operating hours are required.';
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    } else {
      if (onShowToast) onShowToast('Please complete all required fields highlighted in red.');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleGoToStep = (stepIdx) => {
    // Can jump back to any already-visited step
    if (stepIdx <= currentStep) {
      setCurrentStep(stepIdx);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleFinalSubmit = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const submissionId = `SUB-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const submissionDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const submissionRecord = {
        ...formData,
        id: `BIKE-${Math.floor(8800 + Math.random() * 1000)}`,
        submissionId,
        submissionDate,
        status: 'Pending Verification',
        rcStatus: 'Pending Review',
        insuranceStatus: 'Pending Review',
        pucStatus: 'Pending Review',
        ownerName: formData.fullName,
        ownerPhone: `${formData.countryCode} ${formData.phone}`,
        ownerEmail: formData.email,
        verificationOutcome: 'Pending',
        comparison: [
          { field: 'Owner Name', submitted: formData.fullName, extracted: formData.registeredOwnerName, match: true },
          { field: 'Registration Number', submitted: formData.registrationNumber, extracted: formData.registrationNumber, match: true },
          { field: 'Bike Model', submitted: `${formData.brand} ${formData.model}`, extracted: `${formData.brand} ${formData.model}`, match: true },
          { field: 'Chassis Number', submitted: formData.chassisNumber, extracted: formData.chassisNumber, match: true },
        ],
      };

      if (onBikeSubmitted) {
        onBikeSubmitted(submissionRecord);
      }

      setSuccessModalData(submissionRecord);
      if (onShowToast) {
        onShowToast('Bike submitted successfully for verification!');
      }
    }, 1200);
  };

  const handleCloseOrExit = () => {
    if (currentStep > 0 && !successModalData) {
      setShowExitConfirm(true);
    } else {
      navigation?.goBack();
    }
  };

  return (
    <View style={styles.screenWrapper}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleCloseOrExit}
          activeOpacity={0.7}
          accessibilityLabel="Back"
        >
          <ChevronLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>{t('rentBike.portalTitle', 'Rent Your Bike')}</Text>
          <Text style={styles.topBarSubtitle}>{t('rentBike.portalSubtitle', 'Owner Listing Portal')}</Text>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.langToggleBtn}
            onPress={toggleLanguage}
            activeOpacity={0.8}
            accessibilityLabel="Switch Language"
          >
            <Text style={styles.langToggleBtnText}>{isHindi ? 'English' : 'हिन्दी'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleCloseOrExit}
            activeOpacity={0.7}
            accessibilityLabel="Exit form"
          >
            <X size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageContainer}>
          {/* Hero Banner Section */}
          <View style={styles.pageHero}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <Bike size={14} color="#38BDF8" />
                <Text style={styles.heroBadgeText}>{t('rentBike.badge', 'OWNER ONBOARDING')}</Text>
              </View>
              <TouchableOpacity
                style={styles.demoFillBtn}
                onPress={handleFillSampleData}
                activeOpacity={0.7}
              >
                <Sparkles size={13} color="#38BDF8" />
                <Text style={styles.demoFillBtnText}>{t('rentBike.demoDataBtn', 'Load Sample Demo Data')}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.heroHeading}>
              {t('rentBike.heroHeading', 'Rent Your Bike – Turn Your Bike into an Earning Opportunity')}
            </Text>
            <Text style={styles.heroSubheading}>
              {t('rentBike.heroSubheading', 'List your bike, connect with potential renters, and earn by sharing your vehicle with verified riders.')}
            </Text>
          </View>

          {/* Authentication Alert if user not logged in */}
          {!user && (
            <View style={styles.unauthBanner}>
              <View style={styles.unauthBannerLeft}>
                <AlertTriangle size={18} color="#F59E0B" />
                <Text style={styles.unauthBannerText}>
                  {t('rentBike.unauthAlert', 'You are not logged in. Sign in to link this bike directly to your owner dashboard.')}
                </Text>
              </View>
              {onOpenAuth && (
                <TouchableOpacity
                  style={styles.unauthBannerBtn}
                  onPress={onOpenAuth}
                  activeOpacity={0.8}
                >
                  <Text style={styles.unauthBannerBtnText}>{t('rentBike.loginRegister', 'Log In / Register')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Stepper Progress Bar */}
          <View style={styles.stepperContainer}>
            <View style={styles.stepperTrack}>
              <View
                style={[
                  styles.stepperFill,
                  { width: `${(currentStep / (STEPS.length - 1)) * 100}%` },
                ]}
              />
            </View>

            <View style={styles.stepsRow}>
              {STEPS.map((s, idx) => {
                const IconComp = s.icon;
                const isCompleted = idx < currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.stepItem}
                    onPress={() => handleGoToStep(idx)}
                    disabled={idx > currentStep}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.stepCircle,
                        isCurrent && styles.stepCircleCurrent,
                        isCompleted && styles.stepCircleCompleted,
                      ]}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={16} color="#FFFFFF" />
                      ) : (
                        <IconComp
                          size={15}
                          color={isCurrent ? '#FFFFFF' : COLORS.textMuted}
                        />
                      )}
                    </View>

                    <Text
                      style={[
                        styles.stepTitleText,
                        isCurrent && styles.stepTitleTextCurrent,
                        isCompleted && styles.stepTitleTextCompleted,
                      ]}
                      numberOfLines={1}
                    >
                      {width < 640 ? s.short : s.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Form Step Body */}
          <View style={styles.formCard}>
            {currentStep === 0 && (
              <StepOwnerInfo
                data={formData}
                user={user}
                onOpenAuth={onOpenAuth}
                onChange={handleFieldChange}
                errors={stepErrors}
                onShowToast={onShowToast}
              />
            )}

            {currentStep === 1 && (
              <StepBikeInfo
                data={formData}
                onChange={handleFieldChange}
                errors={stepErrors}
                onShowToast={onShowToast}
              />
            )}

            {currentStep === 2 && (
              <StepDocSubmission
                data={formData}
                onChange={handleFieldChange}
                errors={stepErrors}
                onShowToast={onShowToast}
              />
            )}

            {currentStep === 3 && (
              <StepRentalInfo
                data={formData}
                onChange={handleFieldChange}
                errors={stepErrors}
                onShowToast={onShowToast}
              />
            )}

            {currentStep === 4 && (
              <StepReviewSubmit
                data={formData}
                onGoToStep={handleGoToStep}
                onSubmit={handleFinalSubmit}
                isSubmitting={isSubmitting}
                errors={stepErrors}
              />
            )}

            {/* Stepper Navigation Buttons (for Steps 0 - 3) */}
            {currentStep < 4 && (
              <View style={styles.navigationButtonsRow}>
                {currentStep > 0 ? (
                  <TouchableOpacity
                    style={styles.navPrevBtn}
                    onPress={handlePrevious}
                    activeOpacity={0.8}
                  >
                    <ChevronLeft size={16} color="#FFFFFF" />
                    <Text style={styles.navPrevBtnText}>{t('rentBike.prevBtn', 'Previous')}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ width: 10 }} />
                )}

                <TouchableOpacity
                  style={styles.navNextBtn}
                  onPress={handleContinue}
                  activeOpacity={0.8}
                >
                  <Text style={styles.navNextBtnText}>
                    {t('rentBike.continueTo', 'Continue to')} {STEPS[currentStep + 1]?.title || 'Next'}
                  </Text>
                  <ChevronRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Discard Confirmation Modal */}
      <Modal
        visible={showExitConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitConfirm(false)}
      >
        <View style={styles.exitModalOverlay}>
          <View style={styles.exitModalCard}>
            <View style={styles.exitIconWrap}>
              <AlertTriangle size={28} color="#F59E0B" />
            </View>
            <Text style={styles.exitModalTitle}>{t('rentBike.exitTitle', 'Discard Incomplete Listing?')}</Text>
            <Text style={styles.exitModalSub}>
              {t('rentBike.exitSub', 'You have unsaved vehicle specifications and uploaded documents. Leaving now will reset your progress.')}
            </Text>

            <View style={styles.exitModalActions}>
              <TouchableOpacity
                style={styles.exitCancelBtn}
                onPress={() => setShowExitConfirm(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.exitCancelText}>{t('rentBike.keepEditing', 'Keep Editing')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exitDiscardBtn}
                onPress={() => {
                  setShowExitConfirm(false);
                  navigation?.goBack();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.exitDiscardText}>{t('rentBike.discardExit', 'Discard & Exit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Submission Success Modal */}
      <SubmissionSuccessModal
        visible={!!successModalData}
        submissionData={successModalData}
        onGoToListings={() => {
          setSuccessModalData(null);
          navigation?.navigate('Motorbikes');
        }}
        onOpenAdminQueue={() => {
          setSuccessModalData(null);
          navigation?.navigate('AdminDashboard', { initialTab: 'bike-verification' });
        }}
        onSubmitAnother={() => {
          setSuccessModalData(null);
          setFormData(INITIAL_FORM_DATA);
          setCurrentStep(0);
        }}
        onClose={() => setSuccessModalData(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  topBar: {
    height: 60,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarCenter: {
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  topBarSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  langToggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  pageContainer: {
    width: '100%',
    maxWidth: 880,
  },
  pageHero: {
    alignItems: 'center',
    marginBottom: 26,
    textAlign: 'center',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  demoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  demoFillBtnText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  heroBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroHeading: {
    fontSize: width < 640 ? 22 : 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: width < 640 ? 28 : 36,
    marginBottom: 10,
  },
  heroSubheading: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 640,
    lineHeight: 22,
  },
  stepperContainer: {
    marginBottom: 24,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 16,
    position: 'relative',
  },
  stepperTrack: {
    position: 'absolute',
    top: 32,
    left: 36,
    right: 36,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    zIndex: 0,
  },
  stepperFill: {
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 2,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1.5,
    borderColor: COLORS.borderCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleCurrent: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#34D399',
  },
  stepTitleText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  stepTitleTextCurrent: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  stepTitleTextCompleted: {
    color: '#E2E8F0',
  },
  formCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.xl,
    padding: width < 640 ? 18 : 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },
  navigationButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
  },
  navPrevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
  },
  navPrevBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  navNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  navNextBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  exitModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  exitModalCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 24,
    maxWidth: 420,
    width: '100%',
    alignItems: 'center',
  },
  exitIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  exitModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  exitModalSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  exitModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  exitCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    alignItems: 'center',
  },
  exitCancelText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  exitDiscardBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    backgroundColor: '#E11D48',
    alignItems: 'center',
  },
  exitDiscardText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  unauthBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 12,
    flexWrap: 'wrap',
  },
  unauthBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 240,
  },
  unauthBannerText: {
    color: '#FEF3C7',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  unauthBannerBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  unauthBannerBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
});

