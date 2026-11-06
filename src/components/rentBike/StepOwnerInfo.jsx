import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  User,
  Mail,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  FileText,
  Upload,
  Info,
  X,
} from 'lucide-react-native';
import { COLORS, RADIUS } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';
import PhoneInput from '../PhoneInput';

export default function StepOwnerInfo({
  data,
  onChange,
  errors,
  onShowToast,
  user,
  onOpenAuth,
}) {
  const { t, isHindi } = useLanguage();

  // Mobile OTP simulation state
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  // Email verification simulation state
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [enteredEmailCode, setEnteredEmailCode] = useState('');
  const [emailCodeError, setEmailCodeError] = useState('');

  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleSendMobileOtp = () => {
    if (!data.phone || data.phone.length < 10) {
      if (onShowToast) onShowToast('Please enter a valid 10-digit mobile number first.');
      return;
    }
    setOtpSent(true);
    setOtpTimer(30);
    setOtpError('');
    if (onShowToast) onShowToast(`OTP sent to ${data.countryCode || '+91'} ${data.phone}. Use demo OTP: 4521`);
  };

  const handleVerifyMobileOtp = () => {
    if (enteredOtp.trim() === '4521' || enteredOtp.trim().length === 4) {
      onChange('mobileVerified', true);
      setOtpError('');
      if (onShowToast) onShowToast('Mobile number verified successfully!');
    } else {
      setOtpError('Invalid OTP. For testing, please enter "4521".');
    }
  };

  const handleSendEmailCode = () => {
    if (!data.email || !data.email.includes('@')) {
      if (onShowToast) onShowToast('Please enter a valid email address first.');
      return;
    }
    setEmailVerificationSent(true);
    setEmailCodeError('');
    if (onShowToast) onShowToast(`Verification code sent to ${data.email}. Use demo code: 7788`);
  };

  const handleVerifyEmailCode = () => {
    if (enteredEmailCode.trim() === '7788' || enteredEmailCode.trim().length === 4) {
      onChange('emailVerified', true);
      setEmailCodeError('');
      if (onShowToast) onShowToast('Email address verified successfully!');
    } else {
      setEmailCodeError('Invalid code. For testing, please enter "7788".');
    }
  };

  const handleSimulateIdUpload = (type) => {
    onChange('idDocument', {
      type,
      fileName: `${type.replace(/\s+/g, '_')}_Document.pdf`,
      uploadedAt: new Date().toISOString(),
      fileSize: '1.4 MB',
      // Explicit requirement: Clearly distinguish mock verification from actual verification
      verificationState: 'Uploaded - Awaiting Manual Admin Review',
    });
    if (onShowToast) {
      onShowToast(`${type} uploaded. Document is securely saved for administrative review.`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>{t('rentBike.ownerStepBadge', 'STEP 1 OF 5')}</Text>
        </View>
        <Text style={styles.sectionTitle}>{t('rentBike.ownerTitle', 'Owner Information')}</Text>
        <Text style={styles.sectionSub}>
          {t('rentBike.ownerSub', 'Provide your legal personal information as appearing on your government-issued identity documents.')}
        </Text>
      </View>

      {/* Account Authentication Banner */}
      {user ? (
        <View style={styles.authBanner}>
          <View style={styles.authAvatarCircle}>
            <User size={18} color="#38BDF8" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={styles.authNameText}>{t('rentBike.signedInAs', 'Signed in as')} {user.name || 'Registered User'}</Text>
              <View style={styles.authVerifiedPill}>
                <ShieldCheck size={12} color="#10B981" />
                <Text style={styles.authVerifiedPillText}>{t('rentBike.authenticatedBadge', 'Authenticated')}</Text>
              </View>
            </View>
            <Text style={styles.authSubText}>
              {user.email || 'Account connected'} {user.phone ? `• ${user.countryCode || '+91'} ${user.phone}` : ''}
            </Text>
          </View>
          {onOpenAuth && (
            <TouchableOpacity
              style={styles.switchAccountBtn}
              onPress={onOpenAuth}
              activeOpacity={0.7}
            >
              <Text style={styles.switchAccountBtnText}>{t('rentBike.switchAccount', 'Switch')}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.guestAlertBanner}>
          <AlertCircle size={20} color="#F59E0B" />
          <View style={{ flex: 1 }}>
            <Text style={styles.guestAlertTitle}>{t('rentBike.notLoggedIn', 'Not Logged In')}</Text>
            <Text style={styles.guestAlertSub}>
              {t('rentBike.notLoggedInSub', 'Please sign in to link this bike submission directly to your verified account.')}
            </Text>
          </View>
          {onOpenAuth && (
            <TouchableOpacity
              style={styles.guestLoginBtn}
              onPress={onOpenAuth}
              activeOpacity={0.8}
            >
              <Text style={styles.guestLoginBtnText}>{t('rentBike.logInBtn', 'Log In')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Full Name */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          {t('rentBike.fullNameLabel', 'Full Legal Name')} <Text style={styles.req}>*</Text>
        </Text>
        <View style={[styles.inputBox, errors.fullName && styles.inputError]}>
          <User size={18} color={COLORS.accentCyanLight} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            value={data.fullName}
            onChangeText={(val) => onChange('fullName', val)}
            placeholder={t('rentBike.fullNamePlaceholder', 'e.g. Vikram Malhotra')}
            placeholderTextColor="#64748B"
            selectTextOnFocus={true}
          />
          {!!data.fullName && (
            <TouchableOpacity
              onPress={() => onChange('fullName', '')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.clearFieldBtn}
            >
              <X size={14} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
      </View>

      {/* Mobile Number & Country Code */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            {t('rentBike.mobileLabel', 'Mobile Number')} <Text style={styles.req}>*</Text>
          </Text>
          {data.mobileVerified ? (
            <View style={styles.verifiedTag}>
              <CheckCircle2 size={13} color="#10B981" />
              <Text style={styles.verifiedTagText}>{t('rentBike.mobileVerified', 'Mobile Verified')}</Text>
            </View>
          ) : (
            <Text style={styles.pendingTag}>{t('rentBike.otpReq', 'OTP Verification Required')}</Text>
          )}
        </View>

        <PhoneInput
          countryCode={data.countryCode || '+91'}
          onCountryCodeChange={(code) => onChange('countryCode', code)}
          value={data.phone}
          onChangeText={(val) => {
            onChange('phone', val);
            if (data.mobileVerified) onChange('mobileVerified', false);
          }}
          placeholder={t('rentBike.phonePlaceholder', 'e.g. 9820144521')}
          error={!!errors.phone}
        />
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

        {/* Mobile OTP UI */}
        {!data.mobileVerified && (
          <View style={styles.otpCard}>
            <View style={styles.otpCardHeader}>
              <Clock size={15} color="#38BDF8" />
              <Text style={styles.otpCardTitle}>{t('rentBike.mobileOtpTitle', 'Two-Step Mobile Verification')}</Text>
            </View>

            {!otpSent ? (
              <TouchableOpacity
                style={styles.sendOtpBtn}
                onPress={handleSendMobileOtp}
                activeOpacity={0.8}
              >
                <Send size={14} color="#FFFFFF" />
                <Text style={styles.sendOtpBtnText}>{t('rentBike.sendOtpBtn', 'Send Mobile Verification OTP')}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.otpInputArea}>
                <Text style={styles.otpHint}>
                  Enter the 4-digit OTP sent via SMS (Demo code: <Text style={styles.boldWhite}>4521</Text>):
                </Text>
                <View style={styles.otpInlineRow}>
                  <TextInput
                    style={styles.otpInput}
                    value={enteredOtp}
                    onChangeText={setEnteredOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="4521"
                    placeholderTextColor="#64748B"
                    selectTextOnFocus={true}
                  />
                  <TouchableOpacity
                    style={styles.verifyOtpBtn}
                    onPress={handleVerifyMobileOtp}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.verifyOtpBtnText}>{t('rentBike.verifyOtpBtn', 'Verify OTP')}</Text>
                  </TouchableOpacity>
                </View>

                {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

                <View style={styles.resendRow}>
                  {otpTimer > 0 ? (
                    <Text style={styles.resendTimerText}>Resend OTP in {otpTimer}s</Text>
                  ) : (
                    <TouchableOpacity onPress={handleSendMobileOtp}>
                      <Text style={styles.resendLink}>{t('rentBike.resendOtp', 'Resend OTP')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Email Address & Verification UI */}
      <View style={styles.fieldGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            {t('rentBike.emailLabel', 'Email Address')} <Text style={styles.req}>*</Text>
          </Text>
          {data.emailVerified ? (
            <View style={styles.verifiedTag}>
              <CheckCircle2 size={13} color="#10B981" />
              <Text style={styles.verifiedTagText}>{t('rentBike.emailVerified', 'Email Verified')}</Text>
            </View>
          ) : (
            <Text style={styles.pendingTag}>{t('rentBike.verifyReq', 'Verification Required')}</Text>
          )}
        </View>

        <View style={[styles.inputBox, errors.email && styles.inputError]}>
          <Mail size={18} color={COLORS.accentCyanLight} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            value={data.email}
            onChangeText={(val) => {
              onChange('email', val);
              if (data.emailVerified) onChange('emailVerified', false);
            }}
            placeholder={t('rentBike.emailPlaceholder', 'e.g. name@example.com')}
            placeholderTextColor="#64748B"
            keyboardType="email-address"
            autoCapitalize="none"
            selectTextOnFocus={true}
          />
          {!!data.email && (
            <TouchableOpacity
              onPress={() => {
                onChange('email', '');
                if (data.emailVerified) onChange('emailVerified', false);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.clearFieldBtn}
            >
              <X size={14} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        {/* Email Verification Box */}
        {!data.emailVerified && (
          <View style={styles.otpCard}>
            <View style={styles.otpCardHeader}>
              <Mail size={15} color="#38BDF8" />
              <Text style={styles.otpCardTitle}>{t('rentBike.emailConfirmTitle', 'Email Address Confirmation')}</Text>
            </View>

            {!emailVerificationSent ? (
              <TouchableOpacity
                style={styles.sendOtpBtn}
                onPress={handleSendEmailCode}
                activeOpacity={0.8}
              >
                <Send size={14} color="#FFFFFF" />
                <Text style={styles.sendOtpBtnText}>{t('rentBike.sendEmailCodeBtn', 'Send Email Verification Code')}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.otpInputArea}>
                <Text style={styles.otpHint}>
                  Enter the 4-digit code sent to your email (Demo code: <Text style={styles.boldWhite}>7788</Text>):
                </Text>
                <View style={styles.otpInlineRow}>
                  <TextInput
                    style={styles.otpInput}
                    value={enteredEmailCode}
                    onChangeText={setEnteredEmailCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="7788"
                    placeholderTextColor="#64748B"
                    selectTextOnFocus={true}
                  />
                  <TouchableOpacity
                    style={styles.verifyOtpBtn}
                    onPress={handleVerifyEmailCode}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.verifyOtpBtnText}>{t('rentBike.confirmEmailBtn', 'Confirm Email')}</Text>
                  </TouchableOpacity>
                </View>
                {emailCodeError ? <Text style={styles.errorText}>{emailCodeError}</Text> : null}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Residential Address */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          {t('rentBike.addressLabel', 'Residential Address')} <Text style={styles.req}>*</Text>
        </Text>
        <View style={[styles.inputBox, styles.textAreaBox, errors.address && styles.inputError]}>
          <MapPin size={18} color={COLORS.accentCyanLight} style={[styles.inputIcon, { marginTop: 12 }]} />
          <TextInput
            style={[styles.textInput, styles.textAreaInput]}
            value={data.address}
            onChangeText={(val) => onChange('address', val)}
            placeholder={t('rentBike.addressPlaceholder', 'Flat/House No., Building Name, Street/Locality')}
            placeholderTextColor="#64748B"
            multiline
            numberOfLines={2}
            selectTextOnFocus={true}
          />
          {!!data.address && (
            <TouchableOpacity
              onPress={() => onChange('address', '')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.clearFieldBtn, { marginTop: 10 }]}
            >
              <X size={14} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
        {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
      </View>

      {/* City, State, PIN Code Row */}
      <View style={styles.gridThree}>
        <View style={styles.gridItem}>
          <Text style={styles.label}>
            {t('rentBike.cityLabel', 'City')} <Text style={styles.req}>*</Text>
          </Text>
          <View style={[styles.inputBox, errors.city && styles.inputError]}>
            <TextInput
              style={styles.textInput}
              value={data.city}
              onChangeText={(val) => onChange('city', val)}
              placeholder={t('rentBike.cityPlaceholder', 'e.g. Mumbai')}
              placeholderTextColor="#64748B"
              selectTextOnFocus={true}
            />
            {!!data.city && (
              <TouchableOpacity
                onPress={() => onChange('city', '')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.clearFieldBtn}
              >
                <X size={14} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>
          {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.label}>
            {t('rentBike.stateLabel', 'State')} <Text style={styles.req}>*</Text>
          </Text>
          <View style={[styles.inputBox, errors.state && styles.inputError]}>
            <TextInput
              style={styles.textInput}
              value={data.state}
              onChangeText={(val) => onChange('state', val)}
              placeholder={t('rentBike.statePlaceholder', 'e.g. Maharashtra')}
              placeholderTextColor="#64748B"
              selectTextOnFocus={true}
            />
            {!!data.state && (
              <TouchableOpacity
                onPress={() => onChange('state', '')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.clearFieldBtn}
              >
                <X size={14} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>
          {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.label}>
            {t('rentBike.pincodeLabel', 'PIN Code')} <Text style={styles.req}>*</Text>
          </Text>
          <View style={[styles.inputBox, errors.pincode && styles.inputError]}>
            <TextInput
              style={styles.textInput}
              value={data.pincode}
              onChangeText={(val) => onChange('pincode', val.replace(/\D/g, '').slice(0, 6))}
              placeholder={t('rentBike.pincodePlaceholder', 'e.g. 400050')}
              placeholderTextColor="#64748B"
              keyboardType="number-pad"
              maxLength={6}
              selectTextOnFocus={true}
            />
            {!!data.pincode && (
              <TouchableOpacity
                onPress={() => onChange('pincode', '')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.clearFieldBtn}
              >
                <X size={14} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>
          {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
        </View>
      </View>

      {/* Identity Verification Status Card */}
      <View style={styles.idVerificationSection}>
        <View style={styles.idCardHeader}>
          <View style={styles.idIconWrap}>
            <ShieldCheck size={20} color="#38BDF8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.idCardTitle}>{t('rentBike.kycTitle', 'Owner Identity Document (KYC)')}</Text>
            <Text style={styles.idCardSub}>
              {t('rentBike.kycSub', 'Required to prevent fraudulent listings and protect community assets.')}
            </Text>
          </View>
        </View>

        <View style={styles.idNoticeBanner}>
          <Info size={16} color="#38BDF8" style={{ marginTop: 2 }} />
          <Text style={styles.idNoticeText}>
            {t('rentBike.kycNotice', 'Important Notice: Uploading an ID file submits your application into our queue. An uploaded document is NOT marked as verified until an authorized admin reviews and confirms it.')}
          </Text>
        </View>

        <View style={styles.idSelectorRow}>
          {['Aadhaar Card', 'Passport', 'Voter ID', 'Driving Licence'].map((docType) => {
            const isSelected = data.idDocument?.type === docType;
            return (
              <TouchableOpacity
                key={docType}
                style={[styles.docTypePill, isSelected && styles.docTypePillSelected]}
                onPress={() => handleSimulateIdUpload(docType)}
                activeOpacity={0.8}
              >
                <FileText size={14} color={isSelected ? '#38BDF8' : COLORS.textMuted} />
                <Text style={[styles.docTypePillText, isSelected && styles.docTypePillTextSelected]}>
                  {docType}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {data.idDocument ? (
          <View style={styles.uploadedIdCard}>
            <View style={styles.uploadedIdLeft}>
              <FileText size={22} color="#38BDF8" />
              <View>
                <Text style={styles.uploadedFileName}>{data.idDocument.fileName}</Text>
                <Text style={styles.uploadedFileSize}>{data.idDocument.fileSize} • Uploaded just now</Text>
              </View>
            </View>

            <View style={styles.statusPillPending}>
              <Clock size={12} color="#F59E0B" />
              <Text style={styles.statusPillPendingText}>
                {data.idDocument.verificationState}
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadTriggerBtn}
            onPress={() => handleSimulateIdUpload('Aadhaar Card')}
            activeOpacity={0.8}
          >
            <Upload size={16} color="#38BDF8" />
            <Text style={styles.uploadTriggerText}>{t('rentBike.uploadIdPrompt', 'Upload Identity Document (PDF / JPG max 5MB)')}</Text>
          </TouchableOpacity>
        )}
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
  fieldGroup: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  req: {
    color: '#F43F5E',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  pendingTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 48,
  },
  textAreaBox: {
    height: 78,
    alignItems: 'flex-start',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    height: '100%',
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  textAreaInput: {
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '500',
  },
  gridThree: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  gridItem: {
    flex: 1,
    minWidth: 140,
  },
  otpCard: {
    marginTop: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: RADIUS.md,
    padding: 14,
  },
  otpCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  otpCardTitle: {
    color: '#38BDF8',
    fontSize: 12.5,
    fontWeight: '700',
  },
  sendOtpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
  },
  sendOtpBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  otpInputArea: {
    gap: 8,
  },
  otpHint: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  boldWhite: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  otpInlineRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  otpInput: {
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderRadius: RADIUS.sm,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 3,
    paddingHorizontal: 16,
    height: 42,
    minWidth: 120,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  verifyOtpBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
  },
  verifyOtpBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  resendRow: {
    marginTop: 4,
  },
  resendTimerText: {
    color: COLORS.textMuted,
    fontSize: 11.5,
  },
  resendLink: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  idVerificationSection: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 18,
    marginTop: 10,
  },
  idCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  idIconWrap: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  idCardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  idCardSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  idNoticeBanner: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 14,
  },
  idNoticeText: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
    flex: 1,
  },
  idSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  docTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  docTypePillSelected: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  docTypePillText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  docTypePillTextSelected: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  uploadedIdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: RADIUS.md,
    padding: 12,
    flexWrap: 'wrap',
    gap: 10,
  },
  uploadedIdLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadedFileName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  uploadedFileSize: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  statusPillPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  statusPillPendingText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  uploadTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
  },
  uploadTriggerText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  authBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 18,
  },
  authAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authNameText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  authVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  authVerifiedPillText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  authSubText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  switchAccountBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  switchAccountBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  guestAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 18,
  },
  guestAlertTitle: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '700',
  },
  guestAlertSub: {
    color: '#E2E8F0',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  guestLoginBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: '#F59E0B',
  },
  guestLoginBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  clearFieldBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
});

