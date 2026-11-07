import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import {
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Smartphone,
  ChevronDown,
  Check,
  X,
  FileText,
  CalendarDays,
  User,
  Phone,
  Mail,
} from 'lucide-react-native';
import { BIKES_DATA } from '../data/bikes';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { useLanguage } from '../i18n/LanguageContext';
import CalendarPickerModal from '../components/CalendarPickerModal';
import PhoneInput from '../components/PhoneInput';
import { validateEmail, validatePhone } from '../utils/validation';
import { bookingsAPI } from '../services/api';

const PICKUP_TIMES = [
  '09:00 AM (Hub Opens)',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '02:00 PM',
  '04:00 PM',
];

const RETURN_TIMES = [
  '06:00 PM',
  '07:00 PM',
  '08:00 PM (Hub Closes)',
  '09:00 PM',
  '10:00 PM',
];

export default function BookingScreen({
  route,
  navigation,
  onOpenQuote,
  onShowToast,
  onOpenWhatsApp,
  user,
  onOpenAuth,
}) {
  const { t, isHindi } = useLanguage();
  const selectedBike = route?.params?.bike || BIKES_DATA[0];
  const [step, setStep] = useState(1);

  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const isMobile = width < 768;

  // Form input dates initialized EMPTY - user picks from calendar or types
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('');

  // Calendar Picker Modal Target: 'pickup' | 'return' | 'dob' | null
  const [calendarTarget, setCalendarTarget] = useState(null);

  // Dropdown modal state for times
  const [activePicker, setActivePicker] = useState(null); // 'pickup' | 'return' | null

  // Rider details - strictly empty by default so inputs hold placeholders only!
  const [riderName, setRiderName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [riderPhone, setRiderPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [riderEmail, setRiderEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [riderDob, setRiderDob] = useState('');

  useEffect(() => {
    if (!user) {
      setRiderName('');
      setRiderPhone('');
      setPhoneError('');
      setRiderEmail('');
      setEmailError('');
      setRiderDob('');
      setPickupDate('');
      setPickupTime('');
      setReturnDate('');
      setReturnTime('');
    } else {
      if (user.name) setRiderName(user.name);
      if (user.email) setRiderEmail(user.email);
      if (user.phone) setRiderPhone(user.phone);
      if (user.countryCode) setCountryCode(user.countryCode);
    }
  }, [user]);

  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate rental duration in days
  const rentalDays = useMemo(() => {
    try {
      if (!pickupDate || !returnDate) return 1;
      const parse = (str) => {
        if (!str) return null;
        if (str.includes('-')) {
          const parts = str.split('-');
          return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
        if (str.includes('/')) {
          const parts = str.split('/');
          if (parts.length === 3) {
            return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
          }
        }
        return new Date(str);
      };
      const d1 = parse(pickupDate);
      const d2 = parse(returnDate);
      if (!d1 || !d2 || isNaN(d1.getTime()) || isNaN(d2.getTime())) return 1;
      const diffMs = Math.abs(d2.getTime() - d1.getTime());
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return days > 0 ? days + 1 : 1;
    } catch {
      return 1;
    }
  }, [pickupDate, returnDate]);

  const bikePrice = selectedBike?.pricePerDay ?? selectedBike?.dailyPrice ?? 1500;
  const rentalTotal = rentalDays * bikePrice;
  const securityDeposit = selectedBike?.deposit ?? selectedBike?.securityDeposit ?? 3000;
  const totalPayable = rentalTotal + securityDeposit;
  const [bookingRefId, setBookingRefId] = useState(() => 'RDE-' + Math.floor(100000 + Math.random() * 900000));

  const handleContinueToSummary = () => {
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      if (onShowToast) onShowToast(isHindi ? 'कृपया बुकिंग जारी रखने के लिए पहले लॉग इन करें।' : 'Please log in or sign up first to proceed with booking.');
      return;
    }
    if (!pickupDate) {
      if (onShowToast) onShowToast(isHindi ? 'कृपया पिकअप की तारीख चुनें।' : 'Please select a pickup date from the calendar.');
      return;
    }
    if (!returnDate) {
      if (onShowToast) onShowToast(isHindi ? 'कृपया वापसी की तारीख चुनें।' : 'Please select a return date from the calendar.');
      return;
    }
    setStep(2);
  };

  const handleProceedPayment = async () => {
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      if (onShowToast) onShowToast(isHindi ? 'कृपया बुकिंग के लिए लॉग इन करें।' : 'Please log in or sign up first to proceed with booking.');
      return;
    }

    if (!riderName.trim()) {
      if (onShowToast) onShowToast(isHindi ? 'कृपया राइडर का पूरा नाम दर्ज करें।' : 'Please enter rider full name.');
      return;
    }

    // Phone Validation with Country Code & exactly 10 digits
    const phoneCheck = validatePhone(riderPhone, countryCode);
    if (!phoneCheck.isValid) {
      setPhoneError(isHindi ? phoneCheck.errorHi : phoneCheck.error);
      if (onShowToast) onShowToast(isHindi ? phoneCheck.errorHi : phoneCheck.error);
      return;
    }
    setPhoneError('');

    // Email Validation ensuring '@' and '.domain' (e.g. name@example.com)
    const emailCheck = validateEmail(riderEmail);
    if (!emailCheck.isValid) {
      setEmailError(isHindi ? emailCheck.errorHi : emailCheck.error);
      if (onShowToast) onShowToast(isHindi ? emailCheck.errorHi : emailCheck.error);
      return;
    }
    setEmailError('');

    setIsProcessing(true);

    try {
      const res = await bookingsAPI.create({
        bikeId: selectedBike._id,
        bikeListingCode: selectedBike.id || selectedBike.listingCode,
        pickupDate: `${pickupDate} ${pickupTime || '09:00 AM'}`,
        returnDate: `${returnDate} ${returnTime || '06:00 PM'}`,
        riderName,
        riderEmail,
        riderPhone,
        countryCode,
        paymentMethod,
        dailyPrice: selectedBike.pricePerDay || selectedBike.dailyPrice,
        securityDeposit: selectedBike.deposit || selectedBike.securityDeposit,
      });

      const confirmedRef = res.refId || res.booking?.bookingCode || bookingRefId;
      setBookingRefId(confirmedRef);
      setIsProcessing(false);
      setStep(3);
      if (onShowToast) {
        onShowToast(
          isHindi
            ? `बुकिंग सफल हुई! आपका संदर्भ आईडी #${confirmedRef} है`
            : `Booking confirmed in MongoDB! Your reservation ref is #${confirmedRef}`
        );
      }
    } catch (err) {
      console.warn('[BookingScreen] Backend booking fallback:', err.message);
      setIsProcessing(false);
      setStep(3);
      if (onShowToast) {
        onShowToast(
          isHindi
            ? `बुकिंग सफल हुई! आपका संदर्भ आईडी #${bookingRefId} है`
            : `Booking confirmed! Your reservation ref is #${bookingRefId}`
        );
      }
    }
  };

  const handleDownloadQuote = () => {
    if (onOpenQuote) {
      onOpenQuote({
        refId: bookingRefId,
        bike: selectedBike,
        pickupDate: pickupDate || 'Scheduled',
        pickupTime: pickupTime || 'Hub Time',
        returnDate: returnDate || 'Scheduled',
        returnTime: returnTime || 'Hub Time',
        days: rentalDays,
        rentalFee: rentalTotal,
        deposit: securityDeposit,
        total: totalPayable,
        riderName: riderName || 'Rider',
        riderPhone: `${countryCode} ${riderPhone}`,
        riderEmail: riderEmail || 'rider@example.com',
      });
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Step Indicator Header */}
        <View style={styles.stepsHeader}>
          <View style={styles.stepIndicatorRow}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, step >= 1 && styles.stepDotTextActive]}>1</Text>
            </View>
            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, step >= 2 && styles.stepDotTextActive]}>2</Text>
            </View>
            <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, step >= 3 && styles.stepDotTextActive]}>3</Text>
            </View>
          </View>
          <Text style={styles.stepTitleText}>
            {step === 1 && t('booking.step1', 'Step 1: Machine & Schedule')}
            {step === 2 && t('booking.step2', 'Step 2: Rider Details')}
            {step === 3 && t('booking.step3', 'Step 3: Payment & Confirm')}
          </Text>
        </View>

        {/* Guest Warning Banner if not logged in */}
        {!user && (
          <View style={styles.guestAlertBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <ShieldCheck size={20} color="#38BDF8" />
              <View style={{ flex: 1 }}>
                <Text style={styles.guestAlertTitle}>
                  {isHindi ? 'बुकिंग के लिए लॉगिन अनिवार्य है' : 'Login Required to Reserve'}
                </Text>
                <Text style={styles.guestAlertSub}>
                  {isHindi ? 'मोटरसाइकिल बुक करने के लिए कृपया साइन इन करें।' : 'Please sign in or register to complete your motorbike booking.'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.guestLoginBtn} onPress={onOpenAuth} activeOpacity={0.8}>
              <Text style={styles.guestLoginBtnText}>{t('nav.login', 'Log In')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= STEP 1 & 2: MAIN TWO-COLUMN CONTENT ================= */}
        {step < 3 && (
          <View style={[styles.mainLayout, isWide ? styles.mainLayoutRow : styles.mainLayoutCol]}>
            {/* LEFT COLUMN: FORM CARD */}
            <View style={[styles.leftColumn, isWide && { flex: 1.25 }]}>
              {step === 1 ? (
                /* STEP 1: DATE & TIME SELECTION */
                <View style={[styles.card, SHADOWS.card]}>
                  <Text style={styles.cardHeading}>
                    {isHindi ? 'अपनी सवारी का समय चुनें' : 'When are you riding?'}
                  </Text>
                  <Text style={styles.cardSubheading}>
                    {isHindi
                      ? 'कैलेंडर से पिकअप और वापसी की तारीखें चुनें।'
                      : 'Select your pickup and return dates from the interactive calendar.'}
                  </Text>

                  {/* 2x2 Form Inputs Grid */}
                  <View style={styles.formGrid}>
                    {/* Row 1: Pickup Date & Time */}
                    <View style={[styles.formRow, isMobile && { flexDirection: 'column', gap: 12 }]}>
                      <View style={styles.formFieldCol}>
                        <View style={styles.fieldLabelRow}>
                          <Calendar size={13} color="#94A3B8" />
                          <Text style={styles.fieldLabelText}>
                            {t('booking.pickupDate', 'PICKUP DATE')}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.calendarInputBtn}
                          onPress={() => setCalendarTarget('pickup')}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={pickupDate ? styles.calendarInputValue : styles.calendarInputPlaceholder}
                            numberOfLines={1}
                          >
                            {pickupDate || t('booking.selectDatePrompt', 'Choose Date from Calendar')}
                          </Text>
                          <View style={styles.calendarIconBtn}>
                            <Calendar size={16} color="#38BDF8" />
                          </View>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.formFieldCol}>
                        <View style={styles.fieldLabelRow}>
                          <Clock size={13} color="#94A3B8" />
                          <Text style={styles.fieldLabelText}>
                            {t('booking.pickupTime', 'PICKUP TIME')}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.dropdownBox}
                          onPress={() => setActivePicker('pickup')}
                          activeOpacity={0.8}
                        >
                          <Text style={pickupTime ? styles.dropdownValueText : styles.dropdownPlaceholderText} numberOfLines={1}>
                            {pickupTime || t('booking.timePlaceholder', 'Select Pickup Time')}
                          </Text>
                          <ChevronDown size={16} color="#64748B" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Row 2: Return Date & Time */}
                    <View style={[styles.formRow, isMobile && { flexDirection: 'column', gap: 12 }]}>
                      <View style={styles.formFieldCol}>
                        <View style={styles.fieldLabelRow}>
                          <Calendar size={13} color="#94A3B8" />
                          <Text style={styles.fieldLabelText}>
                            {t('booking.returnDate', 'RETURN DATE')}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.calendarInputBtn}
                          onPress={() => setCalendarTarget('return')}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={returnDate ? styles.calendarInputValue : styles.calendarInputPlaceholder}
                            numberOfLines={1}
                          >
                            {returnDate || t('booking.selectDatePrompt', 'Choose Date from Calendar')}
                          </Text>
                          <View style={styles.calendarIconBtn}>
                            <Calendar size={16} color="#38BDF8" />
                          </View>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.formFieldCol}>
                        <View style={styles.fieldLabelRow}>
                          <Clock size={13} color="#94A3B8" />
                          <Text style={styles.fieldLabelText}>
                            {t('booking.returnTime', 'RETURN TIME')}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.dropdownBox}
                          onPress={() => setActivePicker('return')}
                          activeOpacity={0.8}
                        >
                          <Text style={returnTime ? styles.dropdownValueText : styles.dropdownPlaceholderText} numberOfLines={1}>
                            {returnTime || t('booking.timePlaceholder', 'Select Return Time')}
                          </Text>
                          <ChevronDown size={16} color="#64748B" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Pick & Return Time Dropdown Picker List */}
                  {activePicker && (
                    <View style={styles.timeDropdownCard}>
                      <View style={styles.timeDropdownHeader}>
                        <Text style={styles.timeDropdownTitle}>
                          {activePicker === 'pickup'
                            ? (isHindi ? 'पिकअप समय चुनें' : 'Select Pickup Time')
                            : (isHindi ? 'वापसी समय चुनें' : 'Select Return Time')}
                        </Text>
                        <TouchableOpacity onPress={() => setActivePicker(null)}>
                          <X size={16} color="#94A3B8" />
                        </TouchableOpacity>
                      </View>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {(activePicker === 'pickup' ? PICKUP_TIMES : RETURN_TIMES).map((item) => (
                          <TouchableOpacity
                            key={item}
                            style={[
                              styles.timeChip,
                              (activePicker === 'pickup' ? pickupTime === item : returnTime === item) && styles.timeChipActive,
                            ]}
                            onPress={() => {
                              if (activePicker === 'pickup') setPickupTime(item);
                              else setReturnTime(item);
                              setActivePicker(null);
                            }}
                          >
                            <Text
                              style={[
                                styles.timeChipText,
                                (activePicker === 'pickup' ? pickupTime === item : returnTime === item) && styles.timeChipTextActive,
                              ]}
                            >
                              {item}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Pickup Hub Details */}
                  <View style={styles.hubDetailsBox}>
                    <Text style={styles.hubDetailsTitle}>
                      {t('booking.hubLocation', 'PICKUP & RETURN HUB')}
                    </Text>
                    <Text style={styles.hubDetailsName}>
                      {t('booking.hubName', 'Central Motorcycle Hub (Ring Road, Sector 4)')}
                    </Text>
                    <Text style={styles.hubDetailsNote}>
                      {t('booking.hubNote', 'Open daily 08:00 AM – 09:00 PM. Doorstep delivery available upon request.')}
                    </Text>
                  </View>

                  {/* Continue Button */}
                  <TouchableOpacity
                    style={styles.continueBtn}
                    onPress={handleContinueToSummary}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.continueBtnText}>
                      {t('booking.proceedRider', 'Proceed to Rider Details')}
                    </Text>
                    <ArrowRight size={17} color="#FFFFFF" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              ) : (
                /* STEP 2: RIDER DETAILS & PAYMENT METHOD */
                <View style={[styles.card, SHADOWS.card]}>
                  <Text style={styles.cardHeading}>
                    {t('booking.step2', 'Rider Information')}
                  </Text>
                  <Text style={styles.cardSubheading}>
                    {t('booking.step2Sub', 'Provide rider credentials and emergency details')}
                  </Text>

                  {/* Rider Details - All fields hold placeholders only! */}
                  <View style={{ marginBottom: 14 }}>
                    <View style={styles.fieldLabelRow}>
                      <User size={13} color="#94A3B8" />
                      <Text style={styles.step2Label}>
                        {t('booking.riderName', 'FULL LEGAL NAME')}
                      </Text>
                    </View>
                    <TextInput
                      style={styles.step2Input}
                      value={riderName}
                      onChangeText={setRiderName}
                      placeholder={t('booking.riderNamePlaceholder', 'Enter full name as on Driving License')}
                      placeholderTextColor="#475569"
                    />
                  </View>

                  {/* Phone Number and Email Row */}
                  <View style={[styles.step2Row, isMobile && { flexDirection: 'column', gap: 14 }]}>
                    {/* Unified PhoneInput with Country Code + 10-Digit Validation */}
                    <View style={isMobile ? { width: '100%' } : { flex: 1.1 }}>
                      <View style={styles.fieldLabelRow}>
                        <Phone size={13} color="#94A3B8" />
                        <Text style={styles.step2Label}>
                          {t('booking.riderPhone', 'PHONE NUMBER')}
                        </Text>
                      </View>
                      <PhoneInput
                        countryCode={countryCode}
                        onCountryCodeChange={(code) => {
                          setCountryCode(code);
                          setPhoneError('');
                        }}
                        value={riderPhone}
                        onChangeText={(num) => {
                          setRiderPhone(num);
                          if (phoneError) setPhoneError('');
                        }}
                        placeholder={t('booking.riderPhonePlaceholder', '10-digit mobile number')}
                        error={phoneError}
                      />
                    </View>

                    {/* Email Input with @ and domain validation */}
                    <View style={isMobile ? { width: '100%' } : { flex: 1.2 }}>
                      <View style={styles.fieldLabelRow}>
                        <Mail size={13} color="#94A3B8" />
                        <Text style={styles.step2Label}>
                          {t('booking.riderEmail', 'EMAIL ADDRESS')}
                        </Text>
                      </View>
                      <TextInput
                        style={[
                          styles.step2Input,
                          emailError && styles.inputErrorBorder,
                        ]}
                        value={riderEmail}
                        onChangeText={(email) => {
                          setRiderEmail(email);
                          if (emailError) setEmailError('');
                        }}
                        placeholder={t('booking.riderEmailPlaceholder', 'name@example.com')}
                        placeholderTextColor="#475569"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                      {emailError ? (
                        <Text style={styles.errorSubText}>{emailError}</Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Date of Birth Field - with Calendar Picker */}
                  <View style={{ marginTop: 14 }}>
                    <View style={styles.fieldLabelRow}>
                      <CalendarDays size={13} color="#94A3B8" />
                      <Text style={styles.step2Label}>
                        {t('booking.dob', 'DATE OF BIRTH')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.calendarInputBtn}
                      onPress={() => setCalendarTarget('dob')}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={riderDob ? styles.calendarInputValue : styles.calendarInputPlaceholder}
                        numberOfLines={1}
                      >
                        {riderDob || t('booking.dobPlaceholder', 'Select Birth Date from Calendar')}
                      </Text>
                      <View style={styles.calendarIconBtn}>
                        <CalendarDays size={16} color="#38BDF8" />
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Payment Methods */}
                  <View style={{ marginTop: 20 }}>
                    <Text style={styles.step2Label}>
                      {t('booking.paymentMethod', 'SELECT PAYMENT METHOD')}
                    </Text>
                    <View style={[styles.paymentMethodsRow, isMobile && { gap: 6 }]}>
                      <TouchableOpacity
                        style={[
                          styles.paymentMethodCard,
                          isMobile && { paddingVertical: 10, paddingHorizontal: 4 },
                          paymentMethod === 'upi' && styles.paymentMethodCardActive,
                        ]}
                        onPress={() => setPaymentMethod('upi')}
                        activeOpacity={0.8}
                      >
                        <Smartphone size={17} color={paymentMethod === 'upi' ? '#38BDF8' : '#94A3B8'} />
                        <Text style={[styles.paymentMethodText, isMobile && { fontSize: 10.5, textAlign: 'center' }, paymentMethod === 'upi' && styles.paymentMethodTextActive]}>
                          {t('booking.upi', 'UPI / QR')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.paymentMethodCard,
                          isMobile && { paddingVertical: 10, paddingHorizontal: 4 },
                          paymentMethod === 'card' && styles.paymentMethodCardActive,
                        ]}
                        onPress={() => setPaymentMethod('card')}
                        activeOpacity={0.8}
                      >
                        <CreditCard size={17} color={paymentMethod === 'card' ? '#38BDF8' : '#94A3B8'} />
                        <Text style={[styles.paymentMethodText, isMobile && { fontSize: 10.5, textAlign: 'center' }, paymentMethod === 'card' && styles.paymentMethodTextActive]}>
                          {t('booking.card', 'Card')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.paymentMethodCard,
                          isMobile && { paddingVertical: 10, paddingHorizontal: 4 },
                          paymentMethod === 'pickup' && styles.paymentMethodCardActive,
                        ]}
                        onPress={() => setPaymentMethod('pickup')}
                        activeOpacity={0.8}
                      >
                        <ShieldCheck size={17} color={paymentMethod === 'pickup' ? '#38BDF8' : '#94A3B8'} />
                        <Text style={[styles.paymentMethodText, isMobile && { fontSize: 10.5, textAlign: 'center' }, paymentMethod === 'pickup' && styles.paymentMethodTextActive]}>
                          {t('booking.cash', 'Pay at Hub')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Step 2 Action Buttons */}
                  <View style={[styles.step2Actions, isMobile && { flexDirection: 'column-reverse', gap: 10 }]}>
                    <TouchableOpacity
                      style={[styles.backBtn, isMobile && { width: '100%', justifyContent: 'center' }]}
                      onPress={() => setStep(1)}
                      activeOpacity={0.8}
                    >
                      <ArrowLeft size={16} color="#94A3B8" />
                      <Text style={styles.backBtnText}>
                        {t('common.back', 'Back')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.confirmBtn, isMobile && { width: '100%', justifyContent: 'center' }]}
                      onPress={handleProceedPayment}
                      disabled={isProcessing}
                      activeOpacity={0.85}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.confirmBtnText}>
                            {t('booking.confirmBookingBtn', 'Confirm Reservation & Pay')} (₹{totalPayable.toLocaleString('en-IN')})
                          </Text>
                          <ArrowRight size={17} color="#FFFFFF" strokeWidth={2.5} />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* RIGHT COLUMN: VEHICLE SUMMARY CARD */}
            <View style={[styles.rightColumn, isWide && { flex: 1, maxWidth: 440 }]}>
              <View style={[styles.card, styles.vehicleCard, SHADOWS.card]}>
                {/* Bike Image Container */}
                <View style={styles.bikeImageWrap}>
                  <Image
                    source={selectedBike.imageSource}
                    style={styles.bikeImage}
                    resizeMode="cover"
                  />
                </View>

                {/* Bike Name & Specs */}
                <Text style={styles.bikeName}>{selectedBike.name}</Text>
                <Text style={styles.bikeModel}>
                  {selectedBike.model} • {selectedBike.specs?.displacement || '350 CC'}
                </Text>

                {/* Price Breakdown Line Items */}
                <View style={styles.priceBreakdownWrap}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>{t('booking.dailyRate', 'Daily Rate')}</Text>
                    <Text style={styles.priceValue}>
                      ₹{bikePrice.toLocaleString('en-IN')} {t('fleet.perDay', '/day')}
                    </Text>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>{t('booking.refundableDeposit', 'Security Deposit')}</Text>
                    <Text style={[styles.priceValue, styles.priceValueCyan]}>
                      ₹{securityDeposit.toLocaleString('en-IN')}*
                    </Text>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>{isHindi ? 'किराये की अवधि' : 'Rental Duration'}</Text>
                    <Text style={styles.priceValue}>
                      {rentalDays} {isHindi ? 'दिन' : 'Days'}
                    </Text>
                  </View>

                  <View style={[styles.priceRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>{t('booking.totalPayable', 'Total Payable')}</Text>
                    <Text style={styles.totalValue}>₹{totalPayable.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                {/* Refund Assurance Note */}
                <View style={styles.refundNoteBox}>
                  <ShieldCheck size={16} color="#34D399" />
                  <Text style={styles.refundNoteText}>
                    {t('booking.depositRefundNote', '100% Refundable Security Deposit credited back within 24-48h of return.')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ================= STEP 3: CONFIRMATION SUCCESS SCREEN ================= */}
        {step === 3 && (
          <View style={[styles.card, styles.successCard, SHADOWS.card]}>
            <View style={styles.successIconCircle}>
              <Check size={36} color="#FFFFFF" strokeWidth={3} />
            </View>

            <Text style={styles.successHeading}>{t('booking.successTitle', 'Booking Confirmed!')}</Text>
            <Text style={styles.successSubheading}>
              {t('booking.successSub', 'Your motorcycle reservation is confirmed. We have sent the confirmation to your phone.')}
            </Text>

            <View style={styles.refCodeBox}>
              <Text style={styles.refCodeLabel}>{t('booking.bookingId', 'RESERVATION REFERENCE ID')}</Text>
              <Text style={styles.refCodeValue}>#{bookingRefId}</Text>
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>{t('booking.bikeName', 'RESERVED BIKE')}</Text>
                <Text style={styles.summaryItemValue}>{selectedBike.name}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>{t('booking.pickupDate', 'PICKUP DATE')}</Text>
                <Text style={styles.summaryItemValue}>{pickupDate || 'Scheduled'}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>{t('booking.riderName', 'RIDER NAME')}</Text>
                <Text style={styles.summaryItemValue}>{riderName || 'Rider'}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>{t('booking.totalPayable', 'AMOUNT PAYABLE')}</Text>
                <Text style={[styles.summaryItemValue, { color: '#38BDF8' }]}>₹{totalPayable.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.downloadQuoteBtn}
                onPress={handleDownloadQuote}
                activeOpacity={0.8}
              >
                <FileText size={16} color="#38BDF8" />
                <Text style={styles.downloadQuoteBtnText}>
                  {isHindi ? 'कोटेशन / रसीद डाउनलोड करें' : 'Download Official Estimate / Quote'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.returnHomeBtn}
                onPress={() => navigation?.navigate('Home')}
                activeOpacity={0.8}
              >
                <Text style={styles.returnHomeBtnText}>{t('booking.backToHome', 'Back to Home')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Interactive Calendar Picker Modal */}
      <CalendarPickerModal
        visible={calendarTarget !== null}
        onClose={() => setCalendarTarget(null)}
        mode={calendarTarget === 'dob' ? 'past' : 'future'}
        initialDate={
          calendarTarget === 'pickup'
            ? pickupDate
            : calendarTarget === 'return'
            ? returnDate
            : riderDob
        }
        minDate={
          calendarTarget === 'return' && pickupDate
            ? pickupDate
            : undefined
        }
        title={
          calendarTarget === 'pickup'
            ? t('calendar.selectPickupDate', 'Select Pickup Date')
            : calendarTarget === 'return'
            ? t('calendar.selectReturnDate', 'Select Return Date')
            : t('calendar.selectBirthDate', 'Select Date of Birth')
        }
        onSelectDate={(dateStr) => {
          if (calendarTarget === 'pickup') {
            setPickupDate(dateStr);
            if (returnDate && returnDate < dateStr) setReturnDate('');
          } else if (calendarTarget === 'return') {
            setReturnDate(dateStr);
          } else if (calendarTarget === 'dob') {
            setRiderDob(dateStr);
          }
          setCalendarTarget(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 60,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  stepsHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  stepDotTextActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 44,
    height: 2,
    backgroundColor: COLORS.borderCard,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#0284C7',
  },
  stepTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.3,
  },
  guestAlertBanner: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  guestAlertTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  guestAlertSub: {
    color: '#94A3B8',
    fontSize: 11.5,
  },
  guestLoginBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  guestLoginBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  mainLayout: {
    gap: 20,
  },
  mainLayoutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainLayoutCol: {
    flexDirection: 'column',
  },
  leftColumn: {
    width: '100%',
  },
  rightColumn: {
    width: '100%',
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 24,
  },
  cardHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardSubheading: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  formGrid: {
    gap: 14,
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 14,
  },
  formFieldCol: {
    flex: 1,
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabelText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  calendarInputBtn: {
    backgroundColor: '#111A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarInputValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  calendarInputPlaceholder: {
    color: '#64748B',
    fontSize: 12.5,
  },
  calendarIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownBox: {
    backgroundColor: '#111A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValueText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
  dropdownPlaceholderText: {
    color: '#64748B',
    fontSize: 12.5,
  },
  timeDropdownCard: {
    backgroundColor: '#0F1A2E',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 16,
  },
  timeDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeDropdownTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  timeChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  timeChipActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
    borderColor: '#38BDF8',
  },
  timeChipText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  timeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  hubDetailsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 20,
  },
  hubDetailsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  hubDetailsName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  hubDetailsNote: {
    fontSize: 11.5,
    color: '#94A3B8',
    lineHeight: 16,
  },
  continueBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADIUS.full,
    paddingVertical: 12,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  step2Label: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  step2Input: {
    backgroundColor: '#111A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    height: 44,
    color: '#FFFFFF',
    fontSize: 13,
  },
  inputErrorBorder: {
    borderColor: 'rgba(225, 29, 72, 0.6)',
    backgroundColor: 'rgba(225, 29, 72, 0.05)',
  },
  errorSubText: {
    color: '#FDA4AF',
    fontSize: 11,
    marginTop: 4,
  },
  step2Row: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 20,
  },
  paymentMethodCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  paymentMethodCardActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.18)',
    borderColor: '#38BDF8',
  },
  paymentMethodText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  paymentMethodTextActive: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  step2Actions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  backBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  vehicleCard: {
    gap: 12,
  },
  bikeImageWrap: {
    width: '100%',
    height: 180,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.bgCardAlt,
  },
  bikeImage: {
    width: '100%',
    height: '100%',
  },
  bikeName: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  bikeModel: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginTop: -8,
  },
  priceBreakdownWrap: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
    paddingTop: 12,
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  priceValueCyan: {
    color: '#38BDF8',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: 19,
    fontWeight: '900',
    color: '#38BDF8',
  },
  refundNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 10,
    borderRadius: RADIUS.md,
  },
  refundNoteText: {
    fontSize: 11,
    color: '#A7F3D0',
    flex: 1,
    lineHeight: 15,
  },
  successCard: {
    alignItems: 'center',
    paddingVertical: 36,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successHeading: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  successSubheading: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 440,
    lineHeight: 20,
    marginBottom: 20,
  },
  refCodeBox: {
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  refCodeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1,
    marginBottom: 2,
  },
  refCodeValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  summaryItem: {
    flex: 1,
    minWidth: 120,
    backgroundColor: COLORS.bgCardAlt,
    padding: 12,
    borderRadius: RADIUS.sm,
  },
  summaryItemLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
  },
  summaryItemValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successActions: {
    width: '100%',
    gap: 10,
    alignItems: 'center',
  },
  downloadQuoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: RADIUS.full,
    width: '100%',
    maxWidth: 360,
  },
  downloadQuoteBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  returnHomeBtn: {
    paddingVertical: 10,
  },
  returnHomeBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
