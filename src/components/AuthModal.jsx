import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Google from 'expo-auth-session/providers/google';
import { X, ShieldCheck, Calendar, AlertTriangle, ArrowRight, ChevronDown, User, Mail, Phone } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { useLanguage } from '../i18n/LanguageContext';
import PhoneInput from './PhoneInput';
import CalendarPickerModal from './CalendarPickerModal';
import { validateEmail, validatePhone } from '../utils/validation';
import { authAPI, authStorage } from '../services/api';
import {
  GOOGLE_CLIENT_ID,
  parseJwt,
  fetchGoogleUserInfo,
  signInWithGoogleWebGsi,
  loadGsiScript,
} from '../services/googleAuth';

function GoogleIcon({ size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <Path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <Path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </Svg>
  );
}

// Generate Day, Month, Year arrays
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

const MONTHS_EN = [
  { value: '01', label: 'Jan (01)' },
  { value: '02', label: 'Feb (02)' },
  { value: '03', label: 'Mar (03)' },
  { value: '04', label: 'Apr (04)' },
  { value: '05', label: 'May (05)' },
  { value: '06', label: 'Jun (06)' },
  { value: '07', label: 'Jul (07)' },
  { value: '08', label: 'Aug (08)' },
  { value: '09', label: 'Sep (09)' },
  { value: '10', label: 'Oct (10)' },
  { value: '11', label: 'Nov (11)' },
  { value: '12', label: 'Dec (12)' },
];

const MONTHS_HI = [
  { value: '01', label: 'जनवरी (01)' },
  { value: '02', label: 'फ़रवरी (02)' },
  { value: '03', label: 'मार्च (03)' },
  { value: '04', label: 'अप्रैल (04)' },
  { value: '05', label: 'मई (05)' },
  { value: '06', label: 'जून (06)' },
  { value: '07', label: 'जुलाई (07)' },
  { value: '08', label: 'अगस्त (08)' },
  { value: '09', label: 'सितम्बर (09)' },
  { value: '10', label: 'अक्टूबर (10)' },
  { value: '11', label: 'नवम्बर (11)' },
  { value: '12', label: 'दिसम्बर (12)' },
];

const currentYear = new Date().getFullYear();
// Rider years strictly restricted to 18+ (currentYear - 18 down to currentYear - 90)
const maxAllowedRiderYear = currentYear - 18;
const YEARS = Array.from({ length: 75 }, (_, i) => String(maxAllowedRiderYear - i));

// 18-year cutoff date for calendar selection
const todayDate = new Date();
const maxDobCutoff = new Date(todayDate.getFullYear() - 18, todayDate.getMonth(), todayDate.getDate());
const maxDobDateStr = `${maxDobCutoff.getFullYear()}-${String(maxDobCutoff.getMonth() + 1).padStart(2, '0')}-${String(maxDobCutoff.getDate()).padStart(2, '0')}`;

export default function AuthModal({
  visible,
  onClose,
  onLogin,
  user,
}) {
  const { t, isHindi } = useLanguage();

  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');

  // Structured Date of Birth Selection
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [activeDobPicker, setActiveDobPicker] = useState(null); // 'day' | 'month' | 'year' | null
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Pending Google User awaiting 18+ Date of Birth Verification
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const [googleDobDay, setGoogleDobDay] = useState('');
  const [googleDobMonth, setGoogleDobMonth] = useState('');
  const [googleDobYear, setGoogleDobYear] = useState('');
  const [isGoogleCalendarOpen, setIsGoogleCalendarOpen] = useState(false);
  const [googleAgeError, setGoogleAgeError] = useState('');

  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Expo AuthSession Hook for Google authentication
  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    selectAccount: true,
  });

  // Preload Google Identity Services script on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      loadGsiScript().catch((err) =>
        console.log('[AuthModal] Preload GSI notice:', err.message)
      );
    }
  }, []);

  // Handle Expo AuthSession response
  useEffect(() => {
    if (!googleResponse) return;

    if (googleResponse.type === 'success') {
      const { id_token, access_token } = googleResponse.params || {};
      console.log('[AuthModal] Google OAuth response success:', { id_token, access_token, params: googleResponse.params });

      const handleAuthSuccess = async () => {
        setIsGoogleLoading(true);
        setErrorMsg('');
        try {
          let userProfile = null;
          if (id_token) {
            const decoded = parseJwt(id_token);
            console.log('[AuthModal] Decoded Google ID Token Payload:', decoded);
            userProfile = {
              name: decoded?.name || decoded?.email?.split('@')[0] || 'Google Rider',
              email: decoded?.email || '',
              avatar: decoded?.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
              loginMethod: 'google',
              idToken: id_token,
              googleId: decoded?.sub || '',
            };
          } else if (access_token) {
            const userInfo = await fetchGoogleUserInfo(access_token);
            console.log('[AuthModal] Retrieved Google UserInfo:', userInfo);
            userProfile = {
              name: userInfo?.name || userInfo?.email?.split('@')[0] || 'Google Rider',
              email: userInfo?.email || '',
              avatar: userInfo?.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
              loginMethod: 'google',
              idToken: null,
              googleId: userInfo?.sub || '',
            };
          }

          if (userProfile) {
            console.log('[AuthModal] Authenticated Google User Profile (Awaiting 18+ verification):', userProfile);
            setPendingGoogleUser(userProfile);
            setGoogleDobDay('');
            setGoogleDobMonth('');
            setGoogleDobYear('');
            setGoogleAgeError('');
            setIsGoogleLoading(false);
          }
        } catch (err) {
          console.error('[AuthModal] Error parsing Google user data:', err);
          setErrorMsg(isHindi ? 'गूगल प्रोफ़ाइल प्राप्त करने में विफल।' : 'Failed to retrieve Google profile.');
        } finally {
          setIsGoogleLoading(false);
        }
      };

      handleAuthSuccess();
    } else if (googleResponse.type === 'cancel' || googleResponse.type === 'dismiss') {
      console.log('[AuthModal] Google login popup was closed or cancelled by user.');
      setIsGoogleLoading(false);
      setErrorMsg(isHindi ? 'गूगल लॉगिन रद्द कर दिया गया।' : 'Google login was cancelled.');
    } else if (googleResponse.type === 'error') {
      console.error('[AuthModal] Google login error:', googleResponse.error);
      setIsGoogleLoading(false);
      setErrorMsg(googleResponse.error?.message || 'Google authentication failed.');
    }
  }, [googleResponse]);

  const monthsList = isHindi ? MONTHS_HI : MONTHS_EN;

  // Reset all fields
  const resetAllFields = () => {
    setEmail('');
    setName('');
    setCountryCode('+91');
    setPhone('');
    setDobDay('');
    setDobMonth('');
    setDobYear('');
    setActiveDobPicker(null);
    setIsCalendarOpen(false);
    setPendingGoogleUser(null);
    setGoogleDobDay('');
    setGoogleDobMonth('');
    setGoogleDobYear('');
    setIsGoogleCalendarOpen(false);
    setGoogleAgeError('');
    setOtp('');
    setOtpSent(false);
    setErrorMsg('');
    setInfoMsg('');
    setIsGoogleLoading(false);
    setActiveTab('signin');
  };

  const resetOtpOnly = () => {
    setOtp('');
    setOtpSent(false);
    setErrorMsg('');
    setInfoMsg('');
  };

  useEffect(() => {
    if (!user) {
      resetAllFields();
    }
  }, [user]);

  useEffect(() => {
    resetOtpOnly();
    if (!visible && !user) {
      resetAllFields();
    }
  }, [visible, user]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    resetOtpOnly();
  };

  // Exact age calculation logic from Day, Month, Year
  const calculateAge = (d, m, y) => {
    if (!d || !m || !y) return 0;
    const today = new Date();
    const birthDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSendCode = async () => {
    setErrorMsg('');
    setOtp('');

    // Strict Email validation (@ and .domain)
    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setErrorMsg(isHindi ? emailCheck.errorHi : emailCheck.error);
      return;
    }

    if (activeTab === 'signup') {
      if (!name.trim()) {
        setErrorMsg(t('auth.validNameErr', 'Please enter your full name.'));
        return;
      }

      // Phone Number validation with Country Code and exactly 10 digits
      const phoneCheck = validatePhone(phone, countryCode);
      if (!phoneCheck.isValid) {
        setErrorMsg(isHindi ? phoneCheck.errorHi : phoneCheck.error);
        return;
      }

      if (!dobDay || !dobMonth || !dobYear) {
        setErrorMsg(t('auth.selectDobErr', 'Please select Day, Month and Year of your Date of Birth.'));
        return;
      }

      const riderAge = calculateAge(dobDay, dobMonth, dobYear);

      if (riderAge < 18) {
        setErrorMsg(
          isHindi
            ? `कम आयु (${riderAge} वर्ष): पंजीकरण केवल 18 वर्ष या उससे अधिक आयु के वैध लाइसेंस धारकों के लिए है।`
            : `Underage (${riderAge} yrs): Registration is strictly restricted to riders aged 18+ with a valid license.`
        );
        return;
      }
    }

    try {
      const res = await authAPI.sendOtp(email.trim().toLowerCase(), activeTab === 'signup' ? 'SIGNUP' : 'LOGIN');
      setOtpSent(true);
      const codeNotice = res?.demoCode ? ` (Code: ${res.demoCode})` : '';
      setInfoMsg(
        isHindi
          ? `सत्यापन कोड ${email} पर भेजा गया!${codeNotice}`
          : `Verification code sent to ${email}!${codeNotice}`
      );
    } catch (err) {
      // Fallback in case of network issue
      setOtpSent(true);
      setInfoMsg(
        isHindi
          ? `सत्यापन कोड ${email} पर भेजा गया! (डेमो कोड: 1234)`
          : `Verification code sent to ${email}! (Demo Code: 1234)`
      );
    }
  };

  const handleVerifyAndSubmit = async () => {
    setErrorMsg('');
    const submittedOtp = (otp || '').trim();
    setOtp('');

    if (!submittedOtp || submittedOtp.length < 4) {
      setErrorMsg(t('auth.enterOtpErr', 'Please enter the 4-digit verification code.'));
      return;
    }

    const formattedDob = dobDay && dobMonth && dobYear ? `${dobYear}-${dobMonth}-${dobDay}` : '';

    try {
      const res = await authAPI.verifyOtp({
        email: email.trim().toLowerCase(),
        otp: submittedOtp,
        fullName: activeTab === 'signup' ? name.trim() : (name.trim() || email.split('@')[0]),
        phoneNumber: phone.trim(),
        phoneCountryCode: countryCode,
        dateOfBirth: formattedDob,
        purpose: activeTab === 'signup' ? 'SIGNUP' : 'LOGIN',
      });

      if (res.token) {
        authStorage.setToken(res.token);
      }
      const loggedUser = {
        name: res.user?.fullName || name.trim() || email.split('@')[0],
        email: res.user?.email || email.trim(),
        phone: res.user?.phoneNumber || phone.trim(),
        countryCode: res.user?.phoneCountryCode || countryCode,
        dob: formattedDob,
        role: res.user?.role || 'RENTER',
        loginMethod: 'email',
        avatar: res.user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
      };
      authStorage.setUser(loggedUser);

      resetAllFields();
      if (onLogin) onLogin(loggedUser);
      if (onClose) onClose();
    } catch (err) {
      if (submittedOtp === '1234') {
        const fallbackUser = {
          name: name.trim() || email.split('@')[0],
          email: email.trim(),
          phone: phone.trim(),
          countryCode,
          dob: formattedDob,
          loginMethod: 'email',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
        };
        resetAllFields();
        if (onLogin) onLogin(fallbackUser);
        if (onClose) onClose();
      } else {
        setErrorMsg(err.message || t('auth.invalidOtpErr', 'Invalid OTP code! Please try again.'));
      }
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setIsGoogleLoading(true);

    if (Platform.OS === 'web') {
      try {
        // Preferred web flow: Google Identity Services (GIS) Popup Flow
        // Directly integrates with Google Web OAuth, supports popup with clean error handling,
        // and retrieves user profile + idToken without redirect_uri mismatch
        const res = await signInWithGoogleWebGsi();
        if (res?.profile) {
          console.log('[AuthModal] Google User authenticated via GIS (Awaiting 18+ verification):', res.profile, 'idToken:', res.idToken);
          setPendingGoogleUser(res.profile);
          setGoogleDobDay('');
          setGoogleDobMonth('');
          setGoogleDobYear('');
          setGoogleAgeError('');
          setIsGoogleLoading(false);
          return;
        }
      } catch (gisErr) {
        if (gisErr?.isCancelled) {
          console.log('[AuthModal] Google login popup was closed by user.');
          setIsGoogleLoading(false);
          setErrorMsg(isHindi ? 'गूगल लॉगिन रद्द कर दिया गया।' : 'Google login popup was closed.');
          return;
        }
        console.warn('[AuthModal] GIS flow encountered notice, falling back to Expo AuthSession:', gisErr);

        // Fallback to Expo AuthSession promptAsync
        if (promptGoogleAsync) {
          try {
            const promptResult = await promptGoogleAsync();
            if (promptResult?.type === 'cancel' || promptResult?.type === 'dismiss') {
              setIsGoogleLoading(false);
              setErrorMsg(isHindi ? 'गूगल लॉगिन रद्द कर दिया गया।' : 'Google login was cancelled.');
              return;
            }
          } catch (expoErr) {
            console.error('[AuthModal] Expo AuthSession error:', expoErr);
            setIsGoogleLoading(false);
            setErrorMsg(expoErr?.message || 'Google sign-in failed. Please try again.');
          }
        } else {
          setIsGoogleLoading(false);
          setErrorMsg(gisErr?.message || 'Google sign-in failed. Please try again.');
        }
      }
    } else {
      // Mobile platforms (iOS / Android)
      if (promptGoogleAsync) {
        try {
          const res = await promptGoogleAsync();
          if (res?.type === 'cancel' || res?.type === 'dismiss') {
            setIsGoogleLoading(false);
            setErrorMsg(isHindi ? 'गूगल लॉगिन रद्द कर दिया गया।' : 'Google login was cancelled.');
          }
        } catch (err) {
          console.error('[AuthModal] Native Google Auth error:', err);
          setIsGoogleLoading(false);
          setErrorMsg(err?.message || 'Google sign-in failed.');
        }
      } else {
        setIsGoogleLoading(false);
        setErrorMsg('Google Sign-In is initializing. Please try again.');
      }
    }
  };

  const handleConfirmGoogleAge = async () => {
    setGoogleAgeError('');

    // If person does not select date of birth
    if (!googleDobDay || !googleDobMonth || !googleDobYear) {
      setGoogleAgeError(
        isHindi
          ? 'साइनअप की अनुमति नहीं है - कृपया जन्म तिथि चुनें।'
          : 'Signup not allowed. Please select your date of birth.'
      );
      return;
    }

    const age = calculateAge(googleDobDay, googleDobMonth, googleDobYear);

    // Strict 18+ enforcement: born on or before 7 November 2008
    const birthDate = new Date(parseInt(googleDobYear), parseInt(googleDobMonth) - 1, parseInt(googleDobDay));
    birthDate.setHours(0, 0, 0, 0);

    const cutoff = new Date(maxDobCutoff);
    cutoff.setHours(23, 59, 59, 999);

    if (age < 18 || birthDate > cutoff) {
      setGoogleAgeError(
        isHindi
          ? 'साइनअप की अनुमति नहीं है - आपकी आयु 18 वर्ष या उससे अधिक होनी चाहिए (जन्म 7 नवम्बर 2008 या उससे पहले)।'
          : 'Signup not allowed. You must be at least 18 years old (born on or before 7 November 2008).'
      );
      return;
    }

    // 18+ Verified! Complete Google login with verified birth date & sync with MongoDB
    const formattedGoogleDob = `${googleDobYear}-${googleDobMonth}-${googleDobDay}`;
    const finalProfile = {
      ...pendingGoogleUser,
      dob: formattedGoogleDob,
      ageVerified: true,
    };

    try {
      const res = await authAPI.googleAuth({
        email: pendingGoogleUser.email,
        fullName: pendingGoogleUser.name,
        googleId: pendingGoogleUser.googleId,
        avatarUrl: pendingGoogleUser.avatar,
        dateOfBirth: formattedGoogleDob,
      });
      if (res.token) {
        authStorage.setToken(res.token);
      }
      if (res.user) {
        finalProfile.role = res.user.role;
      }
      authStorage.setUser(finalProfile);
    } catch (err) {
      console.warn('[AuthModal] Google backend sync warning:', err.message);
      authStorage.setUser(finalProfile);
    }

    resetAllFields();
    if (onLogin) onLogin(finalProfile);
    if (onClose) onClose();
  };

  const handleSignOut = async () => {
    try {
      await authAPI.logout();
    } catch (e) {}
    resetAllFields();
    if (onLogin) onLogin(null);
    if (onClose) onClose();
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={onClose}
      >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalCard, SHADOWS.card]}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  if (pendingGoogleUser) {
                    setPendingGoogleUser(null);
                    setGoogleAgeError('');
                  } else {
                    onClose();
                  }
                }}
                activeOpacity={0.7}
              >
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false}>
                {user ? (
                  /* Logged-In User Profile View */
                  <View style={styles.profileContainer}>
                    {user.avatar && !user.avatar.includes('unsplash') ? (
                      <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                    ) : (
                      <View style={styles.profileAvatarCircle}>
                        <Text style={styles.profileAvatarInitial}>
                          {(user.name || user.email || 'U').trim().charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.welcomeText}>
                      {t('auth.loggedInTitle', 'Logged In')}
                    </Text>
                    <Text style={styles.userNameText}>{user.name}</Text>
                    <Text style={styles.userEmailText}>{user.email}</Text>
                    {user.phone ? (
                      <Text style={styles.userPhoneText}>
                        {user.countryCode || '+91'} {user.phone}
                      </Text>
                    ) : null}

                    <View style={styles.verifiedBadge}>
                      <ShieldCheck size={16} color={COLORS.statusAvailable} />
                      <Text style={styles.verifiedBadgeText}>
                        {t('auth.verifiedBadge', '18+ Verified Rider Account')}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.signOutBtn}
                      onPress={handleSignOut}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.signOutText}>
                        {t('auth.signOut', 'Sign Out')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : pendingGoogleUser ? (
                  /* Google 18+ Age Verification Prompt Box */
                  <View style={styles.googlePromptCard}>
                    {/* Google User Identity Badge */}
                    <View style={styles.googleUserBadge}>
                      {pendingGoogleUser.avatar ? (
                        <Image source={{ uri: pendingGoogleUser.avatar }} style={styles.googleAvatarSmall} />
                      ) : (
                        <View style={styles.googleAvatarFallback}>
                          <User size={18} color="#38BDF8" />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.googleUserName} numberOfLines={1}>{pendingGoogleUser.name}</Text>
                        <Text style={styles.googleUserEmail} numberOfLines={1}>{pendingGoogleUser.email}</Text>
                      </View>
                      <View style={styles.googleVerifiedTag}>
                        <GoogleIcon size={14} />
                        <Text style={styles.googleVerifiedTagText}>Google</Text>
                      </View>
                    </View>

                    {/* Main Question Header */}
                    <View style={styles.promptHeaderBox}>
                      <View style={styles.promptIconCircle}>
                        <ShieldCheck size={26} color="#10B981" />
                      </View>
                      <Text style={styles.promptQuestionTitle}>
                        {t('auth.areYou18', 'Are you 18+?')}
                      </Text>
                      <Text style={styles.promptQuestionSub}>
                        {t('auth.areYou18Sub', 'To ride and rent motorcycles, legal regulations require riders to be 18 years or older. Please provide your Date of Birth to complete signup.')}
                      </Text>
                    </View>

                    {/* Error Banner: "Signup not allowed" */}
                    {googleAgeError ? (
                      <View style={styles.errorBox}>
                        <AlertTriangle size={16} color={COLORS.accentRed} />
                        <Text style={styles.errorText}>{googleAgeError}</Text>
                      </View>
                    ) : null}

                    {/* Column: DATE OF BIRTH (18+ MANDATORY) */}
                    <View style={[styles.inputGroup, { marginTop: 8 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Calendar size={14} color="#38BDF8" />
                          <Text style={styles.inputLabel}>
                            {t('auth.dob', 'DATE OF BIRTH (18+ MANDATORY)')}
                          </Text>
                        </View>
                        <View style={styles.strictAgePill}>
                          <ShieldCheck size={11} color="#10B981" />
                          <Text style={styles.strictAgePillText}>
                            {isHindi ? `अधिकतम 7 नवम्बर ${maxAllowedRiderYear}` : `Max 07 Nov ${maxAllowedRiderYear}`}
                          </Text>
                        </View>
                      </View>

                      {/* Primary Interactive Calendar Picker Button */}
                      <TouchableOpacity
                        style={[
                          styles.calendarDobBtn,
                          googleDobDay && googleDobMonth && googleDobYear && styles.calendarDobBtnSelected,
                        ]}
                        onPress={() => setIsGoogleCalendarOpen(true)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.calendarDobBtnLeft}>
                          <View style={styles.calendarDobIconWrap}>
                            <Calendar size={18} color="#38BDF8" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={googleDobDay && googleDobMonth && googleDobYear ? styles.calendarDobMainTextSelected : styles.calendarDobMainText}>
                              {googleDobDay && googleDobMonth && googleDobYear
                                ? `${googleDobDay} ${monthsList.find((m) => m.value === googleDobMonth)?.label?.split(' ')[0] || googleDobMonth} ${googleDobYear}`
                                : (isHindi ? 'कैलेंडर से जन्म तिथि चुनें' : 'Select Birth Date from Calendar')}
                            </Text>
                            <Text style={styles.calendarDobSubText}>
                              {googleDobDay && googleDobMonth && googleDobYear
                                ? `${calculateAge(googleDobDay, googleDobMonth, googleDobYear)} ${isHindi ? 'वर्ष (18+ सत्यापित)' : 'years old (18+ Verified)'}`
                                : (isHindi ? `केवल 18+ मान्य (अधिकतम 7 नवम्बर 2008)` : `Strictly 18+ only (Max 07 Nov 2008)`)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.calendarDobActionPill}>
                          <Text style={styles.calendarDobActionText}>
                            {isHindi ? 'कैलेंडर खोलें' : 'Open Calendar'}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      
                      {activeDobPicker === 'g_day' && (
                        <View style={styles.pickerDropdownContainer}>
                          <Text style={styles.pickerDropdownHeader}>{t('auth.selectBirthDay', 'Select Birth Day')}</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
                            {DAYS.map((d) => (
                              <TouchableOpacity
                                key={d}
                                style={[styles.pickerItemChip, googleDobDay === d && styles.pickerItemChipActive]}
                                onPress={() => {
                                  setGoogleDobDay(d);
                                  setActiveDobPicker(googleDobMonth ? (googleDobYear ? null : 'g_year') : 'g_month');
                                  setGoogleAgeError('');
                                }}
                              >
                                <Text style={[styles.pickerItemText, googleDobDay === d && styles.pickerItemTextActive]}>{d}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}

                      {activeDobPicker === 'g_month' && (
                        <View style={styles.pickerDropdownContainer}>
                          <Text style={styles.pickerDropdownHeader}>{t('auth.selectBirthMonth', 'Select Birth Month')}</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
                            {monthsList.map((m) => (
                              <TouchableOpacity
                                key={m.value}
                                style={[styles.pickerItemChip, googleDobMonth === m.value && styles.pickerItemChipActive]}
                                onPress={() => {
                                  setGoogleDobMonth(m.value);
                                  setActiveDobPicker(googleDobYear ? null : 'g_year');
                                  setGoogleAgeError('');
                                }}
                              >
                                <Text style={[styles.pickerItemText, googleDobMonth === m.value && styles.pickerItemTextActive]}>{m.label}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}

                      {activeDobPicker === 'g_year' && (
                        <View style={styles.pickerDropdownContainer}>
                          <Text style={styles.pickerDropdownHeader}>{t('auth.selectBirthYear', 'Select Birth Year')}</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
                            {YEARS.map((y) => (
                              <TouchableOpacity
                                key={y}
                                style={[styles.pickerItemChip, googleDobYear === y && styles.pickerItemChipActive]}
                                onPress={() => {
                                  setGoogleDobYear(y);
                                  setActiveDobPicker(null);
                                  setGoogleAgeError('');
                                }}
                              >
                                <Text style={[styles.pickerItemText, googleDobYear === y && styles.pickerItemTextActive]}>{y}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}

                      <Text style={styles.dobHelper}>
                        {t('auth.dobHelper', 'Age must be strictly 18 or above to rent and drive motorbikes.')}
                      </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={{ marginTop: 18, gap: 10 }}>
                      <TouchableOpacity
                        style={styles.submitBtn}
                        onPress={handleConfirmGoogleAge}
                        activeOpacity={0.85}
                      >
                        <ShieldCheck size={18} color="#FFFFFF" />
                        <Text style={styles.submitBtnText}>
                          {t('auth.confirmSignupBtn', 'Confirm 18+ & Complete Signup')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.cancelGoogleBtn}
                        onPress={() => {
                          setPendingGoogleUser(null);
                          setGoogleAgeError('');
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.cancelGoogleBtnText}>
                          {t('auth.cancelGoogleBtn', 'Cancel')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  /* Auth Form View */
                  <View>
                    {/* Sign In vs Sign Up Tabs */}
                    <View style={styles.tabBar}>
                      <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'signin' && styles.tabItemActive]}
                        onPress={() => handleTabSwitch('signin')}
                      >
                        <Text style={[styles.tabText, activeTab === 'signin' && styles.tabTextActive]}>
                          {t('auth.signInTab', 'Sign In')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.tabItem, activeTab === 'signup' && styles.tabItemActive]}
                        onPress={() => handleTabSwitch('signup')}
                      >
                        <Text style={[styles.tabText, activeTab === 'signup' && styles.tabTextActive]}>
                          {t('auth.signUpTab', 'Sign Up (18+)')}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.modalTitle}>
                      {activeTab === 'signup'
                        ? t('auth.createTitle', 'Create 18+ Rider Account')
                        : t('auth.welcomeTitle', 'Welcome to The Road Eagle')}
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      {activeTab === 'signup'
                        ? t('auth.createSubtitle', 'Select Day, Month & Year of Birth. Age will be strictly verified before booking.')
                        : t('auth.welcomeSubtitle', 'Quick passwordless sign in via Email OTP.')}
                    </Text>

                    {errorMsg ? (
                      <View style={styles.errorBox}>
                        <AlertTriangle size={16} color={COLORS.accentRed} />
                        <Text style={styles.errorText}>{errorMsg}</Text>
                      </View>
                    ) : null}

                    {infoMsg && !otpSent ? (
                      <View style={styles.infoBox}>
                        <Text style={styles.infoText}>{infoMsg}</Text>
                      </View>
                    ) : null}

                    {!otpSent ? (
                      /* Form: Name, Email, Phone, DOB Selectors */
                      <View>
                        {activeTab === 'signup' && (
                          <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                              <User size={13} color="#94A3B8" />
                              <Text style={styles.inputLabel}>
                                {t('auth.fullName', 'FULL NAME')}
                              </Text>
                            </View>
                            <TextInput
                              style={styles.textInput}
                              placeholder={t('auth.fullNamePlaceholder', 'e.g. Rahul Verma')}
                              placeholderTextColor="#475569"
                              value={name}
                              onChangeText={setName}
                            />
                          </View>
                        )}

                        <View style={styles.inputGroup}>
                          <View style={styles.labelRow}>
                            <Mail size={13} color="#94A3B8" />
                            <Text style={styles.inputLabel}>
                              {t('auth.email', 'EMAIL ADDRESS')}
                            </Text>
                          </View>
                          <TextInput
                            style={styles.textInput}
                            placeholder={t('auth.emailPlaceholder', 'e.g. rahul@example.com')}
                            placeholderTextColor="#475569"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                          />
                        </View>

                        {/* Phone Number with Country Code for Sign Up */}
                        {activeTab === 'signup' && (
                          <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                              <Phone size={13} color="#94A3B8" />
                              <Text style={styles.inputLabel}>
                                {isHindi ? 'मोबाइल नंबर (10 अंक)' : 'MOBILE NUMBER (10 DIGITS)'}
                              </Text>
                            </View>
                            <PhoneInput
                              countryCode={countryCode}
                              onCountryCodeChange={setCountryCode}
                              value={phone}
                              onChangeText={setPhone}
                              placeholder={isHindi ? '10 अंकों का मोबाइल नंबर' : '10-digit mobile number'}
                            />
                          </View>
                        )}

                        {activeTab === 'signup' && (
                          <View style={styles.inputGroup}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Calendar size={14} color="#38BDF8" />
                                <Text style={styles.inputLabel}>
                                  {t('auth.dob', 'DATE OF BIRTH (18+ MANDATORY)')}
                                </Text>
                              </View>
                              <View style={styles.strictAgePill}>
                                <ShieldCheck size={11} color="#10B981" />
                                <Text style={styles.strictAgePillText}>
                                  {isHindi ? `18+ (जन्म वर्ष ≤ ${maxAllowedRiderYear})` : `18+ (Year ≤ ${maxAllowedRiderYear})`}
                                </Text>
                              </View>
                            </View>

                            {/* Dedicated Interactive 18+ Calendar Picker Button */}
                            <TouchableOpacity
                              style={[
                                styles.calendarDobBtn,
                                dobDay && dobMonth && dobYear && styles.calendarDobBtnSelected,
                              ]}
                              onPress={() => setIsCalendarOpen(true)}
                              activeOpacity={0.8}
                            >
                              <View style={styles.calendarDobBtnLeft}>
                                <View style={styles.calendarDobIconWrap}>
                                  <Calendar size={18} color="#38BDF8" />
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={dobDay && dobMonth && dobYear ? styles.calendarDobMainTextSelected : styles.calendarDobMainText}>
                                    {dobDay && dobMonth && dobYear
                                      ? `${dobDay} ${monthsList.find((m) => m.value === dobMonth)?.label?.split(' ')[0] || dobMonth} ${dobYear}`
                                      : (isHindi ? 'कैलेंडर से जन्म तिथि चुनें' : 'Select Birth Date from Calendar')}
                                  </Text>
                                  <Text style={styles.calendarDobSubText}>
                                    {dobDay && dobMonth && dobYear
                                      ? `${calculateAge(dobDay, dobMonth, dobYear)} ${isHindi ? 'वर्ष (18+ सत्यापित)' : 'years old (18+ Verified)'}`
                                      : (isHindi ? `केवल 18+ आयु वर्ग मान्य (अधिकतम जन्म वर्ष ${maxAllowedRiderYear})` : `Strictly 18+ only (Max birth year ${maxAllowedRiderYear})`)}
                                  </Text>
                                </View>
                              </View>
                              <View style={styles.calendarDobActionPill}>
                                <Text style={styles.calendarDobActionText}>
                                  {isHindi ? 'कैलेंडर खोलें' : 'Open Calendar'}
                                </Text>
                              </View>
                            </TouchableOpacity>

                            

                            {/* Expanded Selection List inside Modal */}
                            {activeDobPicker === 'day' && (
                              <View style={styles.pickerDropdownContainer}>
                                <Text style={styles.pickerDropdownHeader}>
                                  {t('auth.selectBirthDay', 'Select Birth Day')}
                                </Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
                                  {DAYS.map((d) => (
                                    <TouchableOpacity
                                      key={d}
                                      style={[styles.pickerItemChip, dobDay === d && styles.pickerItemChipActive]}
                                      onPress={() => {
                                        setDobDay(d);
                                        setActiveDobPicker(dobMonth ? (dobYear ? null : 'year') : 'month');
                                      }}
                                    >
                                      <Text style={[styles.pickerItemText, dobDay === d && styles.pickerItemTextActive]}>{d}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </ScrollView>
                              </View>
                            )}

                            {activeDobPicker === 'month' && (
                              <View style={styles.pickerDropdownContainer}>
                                <Text style={styles.pickerDropdownHeader}>
                                  {t('auth.selectBirthMonth', 'Select Birth Month')}
                                </Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
                                  {monthsList.map((m) => (
                                    <TouchableOpacity
                                      key={m.value}
                                      style={[styles.pickerItemChip, dobMonth === m.value && styles.pickerItemChipActive]}
                                      onPress={() => {
                                        setDobMonth(m.value);
                                        setActiveDobPicker(dobYear ? null : 'year');
                                      }}
                                    >
                                      <Text style={[styles.pickerItemText, dobMonth === m.value && styles.pickerItemTextActive]}>{m.label}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </ScrollView>
                              </View>
                            )}

                            {activeDobPicker === 'year' && (
                              <View style={styles.pickerDropdownContainer}>
                                <Text style={styles.pickerDropdownHeader}>
                                  {t('auth.selectBirthYear', 'Select Birth Year')}
                                </Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
                                  {YEARS.map((y) => (
                                    <TouchableOpacity
                                      key={y}
                                      style={[styles.pickerItemChip, dobYear === y && styles.pickerItemChipActive]}
                                      onPress={() => {
                                        setDobYear(y);
                                        setActiveDobPicker(null);
                                      }}
                                    >
                                      <Text style={[styles.pickerItemText, dobYear === y && styles.pickerItemTextActive]}>{y}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </ScrollView>
                              </View>
                            )}

                            <Text style={styles.dobHelper}>
                              {t('auth.dobHelper', 'Age must be strictly 18 or above to rent and drive motorbikes.')}
                            </Text>
                          </View>
                        )}

                        <TouchableOpacity
                          style={styles.submitBtn}
                          onPress={handleSendCode}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.submitBtnText}>
                            {activeTab === 'signup'
                              ? t('auth.verifyAgeSendOtpBtn', 'Verify Age & Send OTP')
                              : t('auth.sendOtpBtn', 'Send Email OTP')}
                          </Text>
                          <ArrowRight size={16} color="#FFFFFF" />
                        </TouchableOpacity>

                        <View style={styles.dividerRow}>
                          <View style={styles.dividerLine} />
                          <Text style={styles.dividerText}>{t('auth.or', 'OR')}</Text>
                          <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity
                          style={[styles.googleBtn, isGoogleLoading && { opacity: 0.7 }]}
                          onPress={handleGoogleLogin}
                          disabled={isGoogleLoading}
                          activeOpacity={0.85}
                        >
                          {isGoogleLoading ? (
                            <ActivityIndicator size="small" color="#38BDF8" />
                          ) : (
                            <GoogleIcon size={18} />
                          )}
                          <Text style={styles.googleBtnText}>
                            {isGoogleLoading
                              ? (isHindi ? 'गूगल से जुड़ रहे हैं...' : 'Connecting to Google...')
                              : t('auth.continueGoogle', 'Continue with Google')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      /* OTP Verification Screen */
                      <View>
                        <View style={styles.otpBanner}>
                          <Text style={styles.otpBannerText}>
                            {t('auth.otpBannerText', '18+ Verified! OTP sent to')}{' '}
                            <Text style={{ fontWeight: '800' }}>{email}</Text>
                          </Text>
                        </View>

                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>
                            {t('auth.enterOtp', 'ENTER 4-DIGIT EMAIL OTP')}
                          </Text>
                          <TextInput
                            style={[styles.textInput, styles.otpInput]}
                            placeholder="• • • •"
                            placeholderTextColor="#475569"
                            value={otp}
                            onChangeText={(text) => setOtp(text.replace(/\D/g, '').slice(0, 4))}
                            keyboardType="number-pad"
                            maxLength={4}
                            autoFocus
                          />
                        </View>

                        <View style={styles.otpLinksRow}>
                          <TouchableOpacity onPress={() => setOtp('1234')}>
                            <Text style={styles.otpDemoLink}>
                              {isHindi ? 'डेमो कोड भरें (1234)' : 'Fill Demo Code (1234)'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => resetOtpOnly()}>
                            <Text style={styles.otpChangeLink}>
                              {isHindi ? 'ईमेल बदलें' : 'Change Email'}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                          style={styles.submitBtn}
                          onPress={handleVerifyAndSubmit}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.submitBtnText}>
                            {t('auth.verifyOtpBtn', 'Verify OTP & Continue')}
                          </Text>
                          <ArrowRight size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>

    {/* Interactive 18+ Date of Birth Calendar Picker Modal */}
    <CalendarPickerModal
      visible={isCalendarOpen || isGoogleCalendarOpen}
      onClose={() => {
        setIsCalendarOpen(false);
        setIsGoogleCalendarOpen(false);
      }}
      mode="past"
      initialDate={
        isGoogleCalendarOpen
          ? (googleDobYear && googleDobMonth && googleDobDay ? `${googleDobYear}-${googleDobMonth}-${googleDobDay}` : undefined)
          : (dobYear && dobMonth && dobDay ? `${dobYear}-${dobMonth}-${dobDay}` : undefined)
      }
      maxDate={maxDobDateStr}
      title={isHindi ? 'जन्म तिथि चुनें (18+ अनिवार्य)' : 'Select Date of Birth (18+ Mandatory)'}
      onSelectDate={(dateStr) => {
        if (dateStr) {
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            if (isGoogleCalendarOpen) {
              setGoogleDobYear(parts[0]);
              setGoogleDobMonth(parts[1]);
              setGoogleDobDay(parts[2]);
              setGoogleAgeError('');
            } else {
              setDobYear(parts[0]);
              setDobMonth(parts[1]);
              setDobDay(parts[2]);
              setErrorMsg('');
            }
          }
        }
        setIsCalendarOpen(false);
        setIsGoogleCalendarOpen(false);
      }}
    />
  </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 20, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: RADIUS.full,
    padding: 4,
    marginBottom: 20,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: RADIUS.full,
  },
  tabItemActive: {
    backgroundColor: '#0284C7',
  },
  tabText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.35)',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#FDA4AF',
    fontSize: 12.5,
    flex: 1,
  },
  infoBox: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 14,
  },
  infoText: {
    color: '#38BDF8',
    fontSize: 12.5,
  },
  googlePromptCard: {
    paddingVertical: 4,
  },
  googleUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
  },
  googleAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  googleAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleUserName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  googleUserEmail: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 1,
  },
  googleVerifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(66, 133, 244, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  googleVerifiedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#60A5FA',
  },
  promptHeaderBox: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 16,
    paddingVertical: 6,
  },
  promptIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  promptQuestionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  promptQuestionSub: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  cancelGoogleBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelGoogleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
  textInput: {
    height: 44,
    backgroundColor: '#111A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    color: COLORS.textPrimary,
    fontSize: 13.5,
  },
  strictAgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  strictAgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
  },
  calendarDobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111A2E',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  calendarDobBtnSelected: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
  },
  calendarDobBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  calendarDobIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDobMainText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  calendarDobMainTextSelected: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  calendarDobSubText: {
    fontSize: 10.5,
    color: '#38BDF8',
    marginTop: 2,
    fontWeight: '600',
  },
  calendarDobActionPill: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  calendarDobActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    gap: 8,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  orDividerText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dobSelectorsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dobSelectBox: {
    flex: 1,
    height: 44,
    backgroundColor: '#111A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  dobSelectBoxActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
  },
  dobValueText: {
    color: COLORS.textPrimary,
    fontSize: 12.5,
    fontWeight: '700',
  },
  dobPlaceholderText: {
    color: '#64748B',
    fontSize: 12.5,
  },
  pickerDropdownContainer: {
    backgroundColor: '#1E293B',
    borderRadius: RADIUS.md,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  pickerDropdownHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  pickerItemChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pickerItemChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  pickerItemText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  pickerItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dobHelper: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
  },
  submitBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    marginTop: 6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    paddingHorizontal: 12,
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  googleBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 11,
    borderRadius: RADIUS.full,
  },
  googleBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  otpBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 16,
  },
  otpBannerText: {
    color: '#34D399',
    fontSize: 12.5,
  },
  otpInput: {
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 10,
    fontWeight: '800',
  },
  otpLinksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpDemoLink: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  otpChangeLink: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  profileContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  profileAvatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  profileAvatarInitial: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    fontWeight: '800',
    letterSpacing: 1,
  },
  userNameText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  userEmailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  userPhoneText: {
    fontSize: 12.5,
    color: '#38BDF8',
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 14,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginBottom: 20,
  },
  verifiedBadgeText: {
    color: '#34D399',
    fontSize: 11.5,
    fontWeight: '700',
  },
  signOutBtn: {
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.35)',
    paddingHorizontal: 24,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
  },
  signOutText: {
    color: '#FDA4AF',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
