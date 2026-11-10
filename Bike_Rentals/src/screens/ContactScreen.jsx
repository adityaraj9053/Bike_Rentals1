import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking,
  useWindowDimensions,
} from 'react-native';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  User,
} from 'lucide-react-native';
import { BIKES_DATA } from '../data/bikes';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { useLanguage } from '../i18n/LanguageContext';
import PhoneInput from '../components/PhoneInput';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { validateEmail, validatePhone } from '../utils/validation';

export default function ContactScreen({ onShowToast, onOpenWhatsApp }) {
  const { isHindi } = useLanguage();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [nameError, setNameError] = useState('');
  const [selectedBikeId, setSelectedBikeId] = useState(BIKES_DATA[0].id);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setNameError('');
    setPhoneError('');
    setEmailError('');

    if (!fullName.trim()) {
      const err = isHindi ? 'कृपया अपना पूरा नाम दर्ज करें।' : 'Please enter your full name.';
      setNameError(err);
      if (onShowToast) onShowToast(err);
      return;
    }

    // Phone Validation with Country Code & exactly 10 digits
    const phoneCheck = validatePhone(phone, countryCode);
    if (!phoneCheck.isValid) {
      const err = isHindi ? phoneCheck.errorHi : phoneCheck.error;
      setPhoneError(err);
      if (onShowToast) onShowToast(err);
      return;
    }

    // Email Validation with @ and domain check
    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      const err = isHindi ? emailCheck.errorHi : emailCheck.error;
      setEmailError(err);
      if (onShowToast) onShowToast(err);
      return;
    }

    setSubmitted(true);
    if (onShowToast) {
      onShowToast(
        isHindi
          ? `धन्यवाद, ${fullName}! आपकी पूछताछ प्राप्त हो गई है।`
          : `Thank you, ${fullName}! Your enquiry has been received.`
      );
    }
    setTimeout(() => {
      setSubmitted(false);
      setFullName('');
      setPhone('');
      setEmail('');
      setMessage('');
    }, 3000);
  };

  const handleOpenMaps = () => {
    Linking.openURL('https://maps.google.com/?q=Plot+42+Metro+Ring+Road+South+City+Bangalore').catch(() => {});
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.centerContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pretitle}>
            {isHindi ? 'हमसे संपर्क करें' : 'GET IN TOUCH'}
          </Text>
          <Text style={styles.title}>
            {isHindi ? 'The Road Eagle सहायता केंद्र' : 'Contact The Road Eagle'}
          </Text>
          <Text style={styles.subtitle}>
            {isHindi
              ? 'बाइक्स, सिक्योरिटी डिपॉजिट, या टूर पैकेज के बारे में कोई भी सवाल पूछें। हमारी टीम 24/7 तैयार है।'
              : 'Have questions about machines, security deposits, or outstation tours? Reach out via WhatsApp or visit our central pickup hub.'}
          </Text>
        </View>

        {/* 2-Column Responsive Layout on Web */}
        <View style={styles.mainLayout}>
          {/* Left Column: Contact Cards */}
          <View style={styles.leftColumn}>
            {/* Direct Call & WhatsApp Action Cards */}
            <View style={styles.actionCardsRow}>
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => Linking.openURL('tel:+919876543210')}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(2, 132, 199, 0.2)' }]}>
                  <Phone size={20} color="#38BDF8" />
                </View>
                <Text style={styles.actionCardTitle}>
                  {isHindi ? 'त्वरित कॉल' : 'Instant Call'}
                </Text>
                <Text style={styles.actionCardSub}>+91 98765 43210</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={onOpenWhatsApp}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(37, 211, 102, 0.15)' }]}>
                  <WhatsAppIcon size={20} color="#FFFFFF" withCircle circleSize={34} />
                </View>
                <Text style={styles.actionCardTitle}>
                  {isHindi ? 'व्हाट्सएप कंसीयर्ज' : 'WhatsApp Concierge'}
                </Text>
                <Text style={styles.actionCardSub}>
                  {isHindi ? '24/7 लाइव सहायता' : 'Live chat 24/7'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Hub Details Card */}
            <View style={[styles.infoCard, SHADOWS.card]}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <MapPin size={20} color={COLORS.accentCyan} />
                </View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoTitle}>
                    {isHindi ? 'सेंट्रल रेंटल हब' : 'Central Rental Hub'}
                  </Text>
                  <Text style={styles.infoText}>
                    Plot 42, Metro Ring Road, South City, Bangalore, 560034
                  </Text>
                  <TouchableOpacity onPress={handleOpenMaps} activeOpacity={0.7}>
                    <Text style={styles.mapLink}>
                      {isHindi ? 'गूगल मैप्स पर देखें →' : 'View on Google Maps →'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Clock size={20} color={COLORS.accentCyan} />
                </View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoTitle}>
                    {isHindi ? 'कार्य समय' : 'Operating Hours'}
                  </Text>
                  <Text style={styles.infoText}>
                    {isHindi ? 'सोमवार - रविवार: सुबह 08:00 - रात 09:30' : 'Monday – Sunday: 08:00 AM – 09:30 PM'}
                  </Text>
                  <Text style={styles.infoSubText}>
                    {isHindi ? 'पूर्व बुकिंग पर 24/7 पिकअप उपलब्ध' : '24/7 emergency roadside support active'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIconBox}>
                  <Mail size={20} color={COLORS.accentCyan} />
                </View>
                <View style={styles.infoTextWrap}>
                  <Text style={styles.infoTitle}>
                    {isHindi ? 'ईमेल पूछताछ' : 'Email Enquiries'}
                  </Text>
                  <Text style={styles.infoText}>rentals@theroadeagle.com</Text>
                  <Text style={styles.infoSubText}>
                    {isHindi ? 'प्रतिक्रिया समय: 2 घंटे के भीतर' : 'Response time: Within 2 business hours'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Right Column: Contact & Callback Form */}
          <View style={styles.rightColumn}>
            <View style={[styles.formCard, isMobile && styles.formCardMobile, SHADOWS.card]}>
              <Text style={styles.formTitle}>
                {isHindi ? 'संदेश या पूछताछ भेजें' : 'Send a Direct Message'}
              </Text>
              <Text style={styles.formSubtitle}>
                {isHindi
                  ? 'नीचे अपना विवरण भरें। हमारे प्रतिनिधि आपको तुरंत कॉल या मैसेज करेंगे।'
                  : 'Fill in your details below. Our reservation desk will connect with you via WhatsApp or phone.'}
              </Text>

              {submitted ? (
                <View style={styles.successBox}>
                  <CheckCircle2 size={36} color={COLORS.statusAvailable} />
                  <Text style={styles.successTitle}>
                    {isHindi ? 'पूछताछ सफलतापूर्वक दर्ज!' : 'Enquiry Submitted!'}
                  </Text>
                  <Text style={styles.successText}>
                    {isHindi
                      ? `हमारी टीम जल्द ही ${countryCode} ${phone} पर आपसे संपर्क करेगी।`
                      : `Our team will call or WhatsApp you on ${countryCode} ${phone} shortly.`}
                  </Text>
                </View>
              ) : (
                <View style={styles.formFields}>
                  {/* Full Name */}
                  <View style={styles.formGroup}>
                    <View style={styles.labelRow}>
                      <User size={13} color="#94A3B8" />
                      <Text style={styles.label}>
                        {isHindi ? 'पूरा नाम' : 'FULL NAME'}
                      </Text>
                    </View>
                    <TextInput
                      style={[styles.input, nameError && styles.inputError]}
                      placeholder={isHindi ? 'उदा. राहुल वर्मा' : 'e.g. Rahul Verma'}
                      placeholderTextColor={COLORS.textMuted}
                      value={fullName}
                      onChangeText={(text) => {
                        setFullName(text);
                        if (nameError) setNameError('');
                      }}
                    />
                    {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
                  </View>

                  {/* Phone Number & Email - 100% full width stacked on mobile */}
                  <View style={[styles.formRow, isMobile && styles.formRowMobile]}>
                    {/* Unified PhoneInput with Country Code + 10-Digit Validation */}
                    <View style={[styles.formGroup, isMobile ? styles.formGroupFull : { flex: 1.1 }]}>
                      <View style={styles.labelRow}>
                        <Phone size={13} color="#94A3B8" />
                        <Text style={styles.label}>
                          {isHindi ? 'मोबाइल नंबर (10 अंक)' : 'MOBILE NUMBER (10 DIGITS)'}
                        </Text>
                      </View>
                      <PhoneInput
                        countryCode={countryCode}
                        onCountryCodeChange={(code) => {
                          setCountryCode(code);
                          setPhoneError('');
                        }}
                        value={phone}
                        onChangeText={(num) => {
                          setPhone(num);
                          if (phoneError) setPhoneError('');
                        }}
                        placeholder={isHindi ? '10 अंकों का नंबर' : '10-digit number'}
                        error={phoneError}
                      />
                    </View>

                    {/* Email Input with @ and .domain check */}
                    <View style={[styles.formGroup, isMobile ? styles.formGroupFull : { flex: 1.2 }]}>
                      <View style={styles.labelRow}>
                        <Mail size={13} color="#94A3B8" />
                        <Text style={styles.label}>
                          {isHindi ? 'ईमेल पता' : 'EMAIL ADDRESS'}
                        </Text>
                      </View>
                      <TextInput
                        style={[styles.input, emailError && styles.inputError]}
                        placeholder={isHindi ? 'name@example.com' : 'rider@example.com'}
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (emailError) setEmailError('');
                        }}
                      />
                      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                    </View>
                  </View>

                  {/* Bike of Interest - FlexWrap cleanly without spilling or cutting off */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      {isHindi ? 'पसंदीदा मोटरसाइकिल चुनें' : 'SELECT MOTORBIKE OF INTEREST'}
                    </Text>
                    <View style={styles.bikePillsWrap}>
                      {BIKES_DATA.map((b) => {
                        const isSelected = selectedBikeId === b.id;
                        return (
                          <TouchableOpacity
                            key={b.id}
                            style={[styles.bikePill, isSelected && styles.bikePillActive]}
                            onPress={() => setSelectedBikeId(b.id)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.bikePillText, isSelected && styles.bikePillTextActive]}>
                              {b.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Message */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      {isHindi ? 'विशेष आवश्यकताएं / यात्रा विवरण (वैकल्पिक)' : 'SPECIAL REQUIREMENTS / TRIP DETAILS (OPTIONAL)'}
                    </Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder={
                        isHindi
                          ? 'उदा. अतिरिक्त हेलमेट चाहिए, ऋषिकेश यात्रा की योजना है...'
                          : 'e.g. Need extra helmet, planning weekend trip to Rishikesh...'
                      }
                      placeholderTextColor={COLORS.textMuted}
                      multiline
                      numberOfLines={3}
                      value={message}
                      onChangeText={setMessage}
                    />
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleSubmit}
                    activeOpacity={0.8}
                  >
                    <Send size={16} color="#FFFFFF" />
                    <Text style={styles.submitBtnText}>
                      {isHindi ? 'पूछताछ सबमिट करें' : 'Submit Rental Enquiry'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  contentContainer: {
    paddingBottom: 60,
  },
  centerContainer: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  header: {
    marginBottom: 24,
  },
  pretitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1.4,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    maxWidth: 680,
    lineHeight: 21,
  },
  mainLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  leftColumn: {
    flex: 1,
    minWidth: 300,
    gap: 16,
  },
  rightColumn: {
    flex: 1.25,
    minWidth: 300,
  },
  actionCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 3,
    textAlign: 'center',
  },
  actionCardSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 20,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  infoText: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  infoSubText: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  mapLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  formCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 22,
  },
  formCardMobile: {
    padding: 16,
  },
  formTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 18,
  },
  formFields: {
    gap: 14,
  },
  formGroup: {
    gap: 6,
  },
  formGroupFull: {
    width: '100%',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formRowMobile: {
    flexDirection: 'column',
    gap: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: '#111A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    height: 44,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  inputError: {
    borderColor: 'rgba(225, 29, 72, 0.6)',
    backgroundColor: 'rgba(225, 29, 72, 0.05)',
  },
  errorText: {
    color: '#FDA4AF',
    fontSize: 11,
    marginTop: 2,
  },
  textArea: {
    height: 76,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  bikePillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 2,
  },
  bikePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
  },
  bikePillActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
    borderColor: '#38BDF8',
  },
  bikePillText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  bikePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADIUS.full,
    paddingVertical: 13,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  successText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
});
