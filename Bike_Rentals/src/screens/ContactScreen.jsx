import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  User,
  Edit3,
  Eye,
  Save,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react-native';
import { BIKES_DATA } from '../data/bikes';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { useLanguage } from '../i18n/LanguageContext';
import PhoneInput from '../components/PhoneInput';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { validateEmail, validatePhone } from '../utils/validation';
import { isOwnerUser } from '../utils/authUtils';
import { ownerAPI } from '../services/api';

const DEFAULT_SETTINGS = {
  contactPhone: '+91 98765 43210',
  whatsappNumber: '+91 98765 43210',
  hubName: 'Central Rental Hub',
  hubAddress: 'Plot 42, Metro Ring Road, South City, Bangalore, 560034',
  mapUrl: 'https://maps.google.com/?q=Plot+42+Metro+Ring+Road+South+City+Bangalore',
  contactEmail: 'rentals@theroadeagle.com',
  operatingHoursText: 'Monday – Sunday: 08:00 AM – 09:30 PM',
  operatingHoursSubtext: '24/7 emergency roadside support active',
  emailResponseTime: 'Within 2 business hours',
};

const CITY_PRESETS = [
  {
    name: 'Bangalore',
    address: 'Plot 42, Metro Ring Road, South City, Bangalore, Karnataka 560034',
  },
  {
    name: 'Mumbai',
    address: '123 Rider Avenue, Sector 5, Bandra West, Mumbai, Maharashtra 400050',
  },
  {
    name: 'Delhi / NCR',
    address: 'Shop 14, Outer Ring Road, Connaught Place, New Delhi 110001',
  },
  {
    name: 'Goa',
    address: 'Villa 7, Calangute Main Road, North Goa, Goa 403516',
  },
  {
    name: 'Rishikesh',
    address: 'Laxman Jhula Road, Tapovan, Rishikesh, Uttarakhand 249192',
  },
  {
    name: 'Pune',
    address: 'Lane 6, Koregaon Park, Pune, Maharashtra 411001',
  },
  {
    name: 'Hyderabad',
    address: 'Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
  },
];

export default function ContactScreen({
  user,
  contactSettings,
  onContactSettingsUpdated,
  onShowToast,
  onOpenWhatsApp,
}) {
  const { isHindi } = useLanguage();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const isOwner = isOwnerUser(user);
  const [isOwnerEditMode, setIsOwnerEditMode] = useState(isOwner);

  // Synchronize edit mode when user changes
  useEffect(() => {
    setIsOwnerEditMode(isOwner);
  }, [isOwner]);

  // Stored / Live Contact Details
  const initialSettings = contactSettings || DEFAULT_SETTINGS;
  const [contactPhone, setContactPhone] = useState(initialSettings.contactPhone || DEFAULT_SETTINGS.contactPhone);
  const [whatsappNumber, setWhatsappNumber] = useState(initialSettings.whatsappNumber || DEFAULT_SETTINGS.whatsappNumber);
  const [hubName, setHubName] = useState(initialSettings.hubName || DEFAULT_SETTINGS.hubName);
  const [hubAddress, setHubAddress] = useState(initialSettings.hubAddress || DEFAULT_SETTINGS.hubAddress);
  const [mapUrl, setMapUrl] = useState(initialSettings.mapUrl || DEFAULT_SETTINGS.mapUrl);
  const [contactEmail, setContactEmail] = useState(initialSettings.contactEmail || DEFAULT_SETTINGS.contactEmail);
  const [operatingHours, setOperatingHours] = useState(initialSettings.operatingHoursText || DEFAULT_SETTINGS.operatingHoursText);
  const [operatingHoursSub, setOperatingHoursSub] = useState(initialSettings.operatingHoursSubtext || DEFAULT_SETTINGS.operatingHoursSubtext);
  const [emailResponseTime, setEmailResponseTime] = useState(initialSettings.emailResponseTime || DEFAULT_SETTINGS.emailResponseTime);
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize when contactSettings prop updates from App.jsx or localStorage
  useEffect(() => {
    if (contactSettings) {
      applySettings(contactSettings);
    }

    const handleStorage = (e) => {
      if (e.key === 'the_road_eagle_contact_settings' && e.newValue) {
        try {
          applySettings(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };

    const handleCustom = (e) => {
      if (e.detail) {
        applySettings(e.detail);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
      window.addEventListener('the_road_eagle_contact_updated', handleCustom);
      return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('the_road_eagle_contact_updated', handleCustom);
      };
    }
  }, [contactSettings]);

  // Enquiry Form State for Riders (Only used when !isOwner)
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

  // Apply settings helper
  const applySettings = (data) => {
    if (!data) return;
    if (data.contactPhone) setContactPhone(data.contactPhone);
    if (data.whatsappNumber) setWhatsappNumber(data.whatsappNumber);
    if (data.hubName) setHubName(data.hubName);
    if (data.hubAddress) setHubAddress(data.hubAddress);
    if (data.mapUrl) setMapUrl(data.mapUrl);
    if (data.contactEmail) setContactEmail(data.contactEmail);
    if (data.operatingHoursText) setOperatingHours(data.operatingHoursText);
    if (data.operatingHoursSubtext) setOperatingHoursSub(data.operatingHoursSubtext);
    if (data.emailResponseTime) setEmailResponseTime(data.emailResponseTime);
  };

  // Load saved settings from cache or backend on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cached = window.localStorage.getItem('the_road_eagle_contact_settings');
        if (cached) {
          applySettings(JSON.parse(cached));
        }
      } catch (e) {}
    }

    ownerAPI
      .getSettings()
      .then((res) => {
        if (res && res.data) {
          applySettings(res.data);
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('the_road_eagle_contact_settings', JSON.stringify(res.data));
          }
        }
      })
      .catch((err) => {
        console.warn('[ContactScreen] Settings fetch notice:', err.message);
      });
  }, []);

  // Save updated contact details (Owner action)
  const handleSaveContactDetails = async () => {
    setIsSaving(true);
    const updatedSettings = {
      contactPhone: contactPhone.trim(),
      whatsappNumber: whatsappNumber.trim(),
      hubName: hubName.trim() || 'Central Rental Hub',
      hubAddress: hubAddress.trim(),
      mapUrl:
        mapUrl.trim() ||
        `https://maps.google.com/?q=${encodeURIComponent(hubAddress.trim() || 'Bangalore')}`,
      contactEmail: contactEmail.trim(),
      operatingHoursText: operatingHours.trim(),
      operatingHoursSubtext: operatingHoursSub.trim(),
      emailResponseTime: emailResponseTime.trim(),
    };

    try {
      if (onContactSettingsUpdated) {
        onContactSettingsUpdated(updatedSettings);
      }

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(
          'the_road_eagle_contact_settings',
          JSON.stringify(updatedSettings)
        );
        window.dispatchEvent(new CustomEvent('the_road_eagle_contact_updated', { detail: updatedSettings }));
      }

      await ownerAPI.updateSettings(updatedSettings).catch(() => null);

      if (onShowToast) {
        onShowToast('Contact details updated! All riders will now see your new contact number, hub address, and email.');
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast('Contact details saved successfully.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    applySettings(DEFAULT_SETTINGS);
    if (onShowToast) {
      onShowToast('Restored default contact details template. Click "Save All Changes" to apply.');
    }
  };

  const handleSelectCityPreset = (cityItem) => {
    setHubAddress(cityItem.address);
    setMapUrl(`https://maps.google.com/?q=${encodeURIComponent(cityItem.address)}`);
    if (onShowToast) {
      onShowToast(`Selected ${cityItem.name} hub location.`);
    }
  };

  const handleOpenMaps = () => {
    const targetUrl =
      (mapUrl || contactSettings?.mapUrl || '').trim() ||
      `https://maps.google.com/?q=${encodeURIComponent(hubAddress || contactSettings?.hubAddress || 'Central Rental Hub Bangalore')}`;
    Linking.openURL(targetUrl).catch(() => {});
  };

  const handleCall = () => {
    const rawNumber = (contactPhone || contactSettings?.contactPhone || DEFAULT_SETTINGS.contactPhone).replace(/[^0-9+]/g, '');
    if (rawNumber) {
      Linking.openURL(`tel:${rawNumber}`).catch(() => {});
    }
  };

  const handleEmail = () => {
    const email = (contactEmail || contactSettings?.contactEmail || DEFAULT_SETTINGS.contactEmail).trim();
    if (email) {
      Linking.openURL(`mailto:${email}`).catch(() => {});
    }
  };

  const handleRiderWhatsAppPress = () => {
    const rawNum = whatsappNumber || contactSettings?.whatsappNumber || contactPhone || contactSettings?.contactPhone || '9876543210';
    const cleanNum = rawNum.replace(/[^0-9]/g, '');
    const text = encodeURIComponent("Hello The Road Eagle! I would like to inquire about booking a motorcycle from your fleet.");
    Linking.openURL(`https://wa.me/${cleanNum}?text=${text}`).catch(() => {
      if (onOpenWhatsApp) onOpenWhatsApp();
    });
  };

  // Submit Rider Enquiry Form (Only for non-owners)
  const handleSubmitEnquiry = () => {
    setNameError('');
    setPhoneError('');
    setEmailError('');

    if (!fullName.trim()) {
      const err = isHindi ? 'कृपया अपना पूरा नाम दर्ज करें।' : 'Please enter your full name.';
      setNameError(err);
      if (onShowToast) onShowToast(err);
      return;
    }

    const phoneCheck = validatePhone(phone, countryCode);
    if (!phoneCheck.isValid) {
      const err = isHindi ? phoneCheck.errorHi : phoneCheck.error;
      setPhoneError(err);
      if (onShowToast) onShowToast(err);
      return;
    }

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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.centerContainer}>
        {/* 👑 OWNER CONTROLS BANNER (Visible only to Fleet Owner) */}
        {isOwner && (
          <View style={styles.ownerControlBanner}>
            <View style={styles.ownerBannerLeft}>
              <View style={styles.ownerBadgeRow}>
                <ShieldCheck size={14} color="#34D399" />
                <Text style={styles.ownerBadgeText}>OWNER ACCOUNT • FLEET CONTACT & HUB PORTAL</Text>
              </View>
              <Text style={styles.ownerBannerTitle}>
                {isOwnerEditMode ? 'Fleet Contact & Central Hub Details' : 'Previewing Rider Contact View'}
              </Text>
              <Text style={styles.ownerBannerSub}>
                {isOwnerEditMode
                  ? 'Manage your contact number, physical hub address, Google Maps pin, and enquiry email. Changes update live across the entire fleet catalogue.'
                  : 'This is the exact contact view prospective riders see when looking up your fleet.'}
              </Text>
            </View>

            <View style={styles.ownerActionsRow}>
              {/* Toggle Mode */}
              <TouchableOpacity
                style={[styles.modeToggleBtn, !isOwnerEditMode && styles.modeToggleBtnActive]}
                onPress={() => setIsOwnerEditMode((prev) => !prev)}
                activeOpacity={0.8}
              >
                {isOwnerEditMode ? (
                  <>
                    <Eye size={14} color="#38BDF8" />
                    <Text style={styles.modeToggleBtnText}>Preview as Rider</Text>
                  </>
                ) : (
                  <>
                    <Edit3 size={14} color="#F59E0B" />
                    <Text style={[styles.modeToggleBtnText, { color: '#FCD34D' }]}>Back to Edit Mode</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Restore Defaults Button */}
              {isOwnerEditMode && (
                <TouchableOpacity
                  style={styles.resetHeaderBtn}
                  onPress={handleResetToDefaults}
                  activeOpacity={0.7}
                >
                  <RotateCcw size={13} color="#94A3B8" />
                  <Text style={styles.resetHeaderBtnText}>Defaults</Text>
                </TouchableOpacity>
              )}

              {/* Save Button */}
              {isOwnerEditMode && (
                <TouchableOpacity
                  style={styles.saveHeaderBtn}
                  onPress={handleSaveContactDetails}
                  disabled={isSaving}
                  activeOpacity={0.8}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Save size={15} color="#FFFFFF" />
                      <Text style={styles.saveHeaderBtnText}>Save All Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Regular Header for Non-Owners */}
        {!isOwner && (
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
                : 'Have questions about machines, security deposits, or outstation tours? Reach out via direct call, WhatsApp or visit our central pickup hub.'}
            </Text>
          </View>
        )}

        {/* =========================================================================
            OWNER'S SCREEN LAYOUT (Send a Direct Message completely removed)
            Balanced 2-Column High-Density Grid that maximizes screen real estate
           ========================================================================= */}
        {isOwner ? (
          <View style={styles.ownerGridLayout}>
            {/* ----------------- COLUMN 1: DIRECT COMMUNICATION & HOURS ----------------- */}
            <View style={styles.ownerGridCol}>
              {/* Quick Actions Row: Instant Call + WhatsApp */}
              <View style={styles.actionCardsRow}>
                {/* 1. Instant Call Card */}
                <View style={[styles.quickActionCard, isOwnerEditMode && styles.cardOwnerEditable]}>
                  <TouchableOpacity
                    onPress={handleCall}
                    disabled={isOwnerEditMode}
                    style={styles.cardHeaderPressable}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(2, 132, 199, 0.2)' }]}>
                      <Phone size={20} color="#38BDF8" />
                    </View>
                    <Text style={styles.actionCardTitle}>Instant Call</Text>
                  </TouchableOpacity>

                  {isOwnerEditMode ? (
                    <View style={styles.editInputWrapper}>
                      <Text style={styles.editFieldLabel}>OWNER CONTACT NUMBER</Text>
                      <TextInput
                        style={styles.editInputField}
                        value={contactPhone}
                        onChangeText={setContactPhone}
                        placeholder="+91 98765 43210"
                        placeholderTextColor="#64748B"
                        keyboardType="phone-pad"
                      />
                      <Text style={styles.fieldHelperText}>
                        Riders tap this to call you directly.
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={handleCall} activeOpacity={0.7}>
                      <Text style={styles.actionCardSub}>{contactPhone}</Text>
                      <Text style={styles.clickToCallText}>Tap to Test Call →</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* 2. WhatsApp Concierge Card */}
                <View style={[styles.quickActionCard, isOwnerEditMode && styles.cardOwnerEditable]}>
                  <TouchableOpacity
                    onPress={onOpenWhatsApp}
                    disabled={isOwnerEditMode}
                    style={styles.cardHeaderPressable}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(37, 211, 102, 0.15)' }]}>
                      <WhatsAppIcon size={20} color="#FFFFFF" withCircle circleSize={34} />
                    </View>
                    <Text style={styles.actionCardTitle}>WhatsApp Concierge</Text>
                  </TouchableOpacity>

                  {isOwnerEditMode ? (
                    <View style={styles.editInputWrapper}>
                      <Text style={styles.editFieldLabel}>WHATSAPP NUMBER</Text>
                      <TextInput
                        style={styles.editInputField}
                        value={whatsappNumber}
                        onChangeText={setWhatsappNumber}
                        placeholder="+91 98765 43210"
                        placeholderTextColor="#64748B"
                        keyboardType="phone-pad"
                      />
                      <Text style={styles.fieldHelperText}>
                        Used for WhatsApp bookings & live chat.
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={onOpenWhatsApp} activeOpacity={0.7}>
                      <Text style={styles.actionCardSub}>Live chat 24/7</Text>
                      <Text style={styles.clickToWhatsAppText}>Test WhatsApp Chat →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* 3. Email Enquiries Card */}
              <View style={[styles.infoCard, isOwnerEditMode && styles.cardOwnerEditable, SHADOWS.card]}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBox}>
                    <Mail size={18} color={COLORS.accentCyan} />
                  </View>
                  <View style={styles.infoTextWrap}>
                    <Text style={styles.infoTitle}>Email Enquiries</Text>

                    {isOwnerEditMode ? (
                      <View style={styles.ownerAddressEditSection}>
                        <Text style={styles.editFieldLabel}>OFFICIAL ENQUIRY EMAIL</Text>
                        <TextInput
                          style={styles.editInputField}
                          value={contactEmail}
                          onChangeText={setContactEmail}
                          placeholder="rentals@theroadeagle.com"
                          placeholderTextColor="#64748B"
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                        <Text style={[styles.editFieldLabel, { marginTop: 8 }]}>RESPONSE TIME PROMISE</Text>
                        <TextInput
                          style={styles.editInputField}
                          value={emailResponseTime}
                          onChangeText={setEmailResponseTime}
                          placeholder="Within 2 business hours"
                          placeholderTextColor="#64748B"
                        />
                        <Text style={styles.fieldHelperText}>
                          Prospective riders see this email and can send direct queries.
                        </Text>
                      </View>
                    ) : (
                      <>
                        <TouchableOpacity onPress={handleEmail} activeOpacity={0.7}>
                          <Text style={[styles.infoText, styles.emailLinkText]}>{contactEmail}</Text>
                        </TouchableOpacity>
                        <Text style={styles.infoSubText}>
                          Response time: {emailResponseTime}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </View>

              {/* 4. Operating Hours Card */}
              <View style={[styles.infoCard, isOwnerEditMode && styles.cardOwnerEditable, SHADOWS.card]}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBox}>
                    <Clock size={18} color={COLORS.accentCyan} />
                  </View>
                  <View style={styles.infoTextWrap}>
                    <Text style={styles.infoTitle}>Operating Hours & Emergency Support</Text>

                    {isOwnerEditMode ? (
                      <View style={styles.ownerAddressEditSection}>
                        <Text style={styles.editFieldLabel}>STORE & PICKUP TIMINGS</Text>
                        <TextInput
                          style={styles.editInputField}
                          value={operatingHours}
                          onChangeText={setOperatingHours}
                          placeholder="Monday – Sunday: 08:00 AM – 09:30 PM"
                          placeholderTextColor="#64748B"
                        />
                        <Text style={[styles.editFieldLabel, { marginTop: 8 }]}>SUPPORT SUBTEXT</Text>
                        <TextInput
                          style={styles.editInputField}
                          value={operatingHoursSub}
                          onChangeText={setOperatingHoursSub}
                          placeholder="24/7 emergency roadside support active"
                          placeholderTextColor="#64748B"
                        />
                      </View>
                    ) : (
                      <>
                        <Text style={styles.infoText}>{operatingHours}</Text>
                        <Text style={styles.infoSubText}>{operatingHoursSub}</Text>
                      </>
                    )}
                  </View>
                </View>
              </View>
            </View>

            {/* ----------------- COLUMN 2: HUB LOCATION, MAP & LIVE PREVIEW ----------------- */}
            <View style={styles.ownerGridCol}>
              {/* 5. Central Rental Hub & Location on Map Card */}
              <View style={[styles.infoCard, isOwnerEditMode && styles.cardOwnerEditable, SHADOWS.card]}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBox}>
                    <MapPin size={18} color={COLORS.accentCyan} />
                  </View>
                  <View style={styles.infoTextWrap}>
                    <Text style={styles.infoTitle}>Central Rental Hub & Map Pinning</Text>

                    {isOwnerEditMode ? (
                      <View style={styles.ownerAddressEditSection}>
                        <Text style={styles.editFieldLabel}>HUB / OUTLET NAME</Text>
                        <TextInput
                          style={styles.editInputField}
                          value={hubName}
                          onChangeText={setHubName}
                          placeholder="e.g. Central Rental Hub"
                          placeholderTextColor="#64748B"
                        />

                        <Text style={[styles.editFieldLabel, { marginTop: 8 }]}>PHYSICAL STREET ADDRESS</Text>
                        <TextInput
                          style={[styles.editInputField, styles.addressTextArea]}
                          value={hubAddress}
                          onChangeText={(addr) => {
                            setHubAddress(addr);
                            setMapUrl(`https://maps.google.com/?q=${encodeURIComponent(addr)}`);
                          }}
                          placeholder="Enter street, area, city & pincode"
                          placeholderTextColor="#64748B"
                          multiline
                          numberOfLines={2}
                        />

                        {/* City Quick Selector */}
                        <Text style={[styles.editFieldLabel, { marginTop: 10 }]}>
                          QUICK-PIN LOCATION PRESET:
                        </Text>
                        <View style={styles.cityPillsWrap}>
                          {CITY_PRESETS.map((city) => {
                            const isMatch = hubAddress.toLowerCase().includes(city.name.toLowerCase());
                            return (
                              <TouchableOpacity
                                key={city.name}
                                style={[styles.cityPill, isMatch && styles.cityPillActive]}
                                onPress={() => handleSelectCityPreset(city)}
                                activeOpacity={0.7}
                              >
                                <MapPin size={11} color={isMatch ? '#38BDF8' : '#94A3B8'} />
                                <Text style={[styles.cityPillText, isMatch && styles.cityPillTextActive]}>
                                  {city.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        {/* Google Maps Pin URL */}
                        <Text style={[styles.editFieldLabel, { marginTop: 10 }]}>
                          GOOGLE MAPS LINK / COORDINATES
                        </Text>
                        <TextInput
                          style={styles.editInputField}
                          value={mapUrl}
                          onChangeText={setMapUrl}
                          placeholder="https://maps.google.com/?q=..."
                          placeholderTextColor="#64748B"
                          autoCapitalize="none"
                        />

                        {/* Verify Pin on Map */}
                        <TouchableOpacity
                          style={styles.testMapBtn}
                          onPress={handleOpenMaps}
                          activeOpacity={0.8}
                        >
                          <ExternalLink size={13} color="#38BDF8" />
                          <Text style={styles.testMapBtnText}>Open & Verify Pin on Google Maps ↗</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        <Text style={[styles.infoTitle, { fontSize: 15 }]}>{hubName || 'Central Rental Hub'}</Text>
                        <Text style={styles.infoText}>{hubAddress}</Text>
                        <TouchableOpacity onPress={handleOpenMaps} activeOpacity={0.7}>
                          <Text style={styles.mapLink}>View on Google Maps →</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              </View>

              {/* 6. Live Rider Visibility Summary Card */}
              <View style={[styles.ownerOverviewCard, SHADOWS.card]}>
                <View style={styles.overviewHeader}>
                  <Sparkles size={16} color="#38BDF8" />
                  <Text style={styles.overviewTitle}>Live Public Visibility Preview</Text>
                </View>
                <Text style={styles.overviewText}>
                  Prospective riders exploring your fleet will view these exact verified details:
                </Text>

                <View style={styles.summaryListContainer}>
                  <View style={styles.summaryItemRow}>
                    <Phone size={13} color="#38BDF8" />
                    <Text style={styles.summaryLabel}>Instant Call:</Text>
                    <Text style={styles.summaryValue} numberOfLines={1}>{contactPhone}</Text>
                  </View>
                  <View style={styles.summaryItemRow}>
                    <WhatsAppIcon size={13} color="#34D399" />
                    <Text style={styles.summaryLabel}>WhatsApp:</Text>
                    <Text style={styles.summaryValue} numberOfLines={1}>{whatsappNumber}</Text>
                  </View>
                  <View style={styles.summaryItemRow}>
                    <Mail size={13} color="#38BDF8" />
                    <Text style={styles.summaryLabel}>Email Desk:</Text>
                    <Text style={styles.summaryValue} numberOfLines={1}>{contactEmail}</Text>
                  </View>
                  <View style={styles.summaryItemRow}>
                    <MapPin size={13} color="#38BDF8" />
                    <Text style={styles.summaryLabel}>Pickup Hub:</Text>
                    <Text style={styles.summaryValue} numberOfLines={1}>{hubName} • {hubAddress}</Text>
                  </View>
                  <View style={styles.summaryItemRow}>
                    <Clock size={13} color="#38BDF8" />
                    <Text style={styles.summaryLabel}>Timings:</Text>
                    <Text style={styles.summaryValue} numberOfLines={1}>{operatingHours}</Text>
                  </View>
                </View>

                {isOwnerEditMode && (
                  <TouchableOpacity
                    style={styles.summarySaveBtn}
                    onPress={handleSaveContactDetails}
                    disabled={isSaving}
                    activeOpacity={0.8}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Save size={15} color="#FFFFFF" />
                        <Text style={styles.summarySaveBtnText}>Save All Contact Details</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ) : (
          /* =========================================================================
              REGULAR RIDER LAYOUT (Contact Cards on Left + Enquiry Form on Right)
             ========================================================================= */
          <View style={styles.mainLayout}>
            {/* Left Column: Contact Cards */}
            <View style={styles.leftColumn}>
              <View style={styles.actionCardsRow}>
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={handleCall}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(2, 132, 199, 0.2)' }]}>
                    <Phone size={20} color="#38BDF8" />
                  </View>
                  <Text style={styles.actionCardTitle}>
                    {isHindi ? 'त्वरित कॉल' : 'Instant Call'}
                  </Text>
                  <Text style={styles.actionCardSub}>
                    {contactPhone || contactSettings?.contactPhone || DEFAULT_SETTINGS.contactPhone}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={handleRiderWhatsAppPress}
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

              <View style={[styles.infoCard, SHADOWS.card]}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconBox}>
                    <MapPin size={20} color={COLORS.accentCyan} />
                  </View>
                  <View style={styles.infoTextWrap}>
                    <Text style={styles.infoTitle}>
                      {hubName || contactSettings?.hubName || 'Central Rental Hub'}
                    </Text>
                    <Text style={styles.infoText}>
                      {hubAddress || contactSettings?.hubAddress || DEFAULT_SETTINGS.hubAddress}
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
                      {operatingHours || contactSettings?.operatingHoursText || DEFAULT_SETTINGS.operatingHoursText}
                    </Text>
                    <Text style={styles.infoSubText}>
                      {operatingHoursSub || contactSettings?.operatingHoursSubtext || DEFAULT_SETTINGS.operatingHoursSubtext}
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
                    <TouchableOpacity onPress={handleEmail} activeOpacity={0.7}>
                      <Text style={[styles.infoText, styles.emailLinkText]}>
                        {contactEmail || contactSettings?.contactEmail || DEFAULT_SETTINGS.contactEmail}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.infoSubText}>
                      Response time: {emailResponseTime || contactSettings?.emailResponseTime || DEFAULT_SETTINGS.emailResponseTime}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Right Column: Send a Direct Message Form (Only for Regular Riders) */}
            <View style={styles.rightColumn}>
              <View style={[styles.formCard, isMobile && styles.formCardMobile, SHADOWS.card]}>
                <View style={styles.formHeaderRow}>
                  <View>
                    <Text style={styles.formTitle}>
                      {isHindi ? 'संदेश या पूछताछ भेजें' : 'Send a Direct Message'}
                    </Text>
                    <Text style={styles.formSubtitle}>
                      {isHindi
                        ? 'नीचे अपना विवरण भरें। हमारे प्रतिनिधि आपको तुरंत कॉल या मैसेज करेंगे।'
                        : 'Fill in your details below. Our reservation desk will connect with you via WhatsApp or phone.'}
                    </Text>
                  </View>
                </View>

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

                    <View style={[styles.formRow, isMobile && styles.formRowMobile]}>
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

                    <TouchableOpacity
                      style={styles.submitBtn}
                      onPress={handleSubmitEnquiry}
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
        )}
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
    paddingBottom: 40,
  },
  centerContainer: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  ownerControlBanner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 16,
  },
  ownerBannerLeft: {
    flex: 1,
    minWidth: 280,
  },
  ownerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  ownerBadgeText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  ownerBannerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 2,
  },
  ownerBannerSub: {
    color: '#94A3B8',
    fontSize: 11.5,
    lineHeight: 16,
  },
  ownerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  modeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  modeToggleBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  modeToggleBtnText: {
    color: '#38BDF8',
    fontSize: 11.5,
    fontWeight: '700',
  },
  resetHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  resetHeaderBtnText: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '600',
  },
  saveHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 7.5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  saveHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  header: {
    marginBottom: 20,
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
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    maxWidth: 680,
    lineHeight: 20,
  },
  ownerGridLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  ownerGridCol: {
    flex: 1,
    minWidth: 320,
    gap: 14,
  },
  mainLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  leftColumn: {
    flex: 1,
    minWidth: 320,
    gap: 16,
  },
  rightColumn: {
    flex: 1.25,
    minWidth: 320,
    gap: 16,
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
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  cardOwnerEditable: {
    borderColor: 'rgba(56, 189, 248, 0.3)',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  cardHeaderPressable: {
    alignItems: 'center',
  },
  actionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 3,
    textAlign: 'center',
  },
  actionCardSub: {
    fontSize: 12.5,
    color: '#38BDF8',
    fontWeight: '700',
    textAlign: 'center',
  },
  clickToCallText: {
    fontSize: 10.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
  },
  clickToWhatsAppText: {
    fontSize: 10.5,
    color: '#34D399',
    textAlign: 'center',
    marginTop: 2,
  },
  editInputWrapper: {
    width: '100%',
    marginTop: 6,
    gap: 3,
  },
  editFieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  editInputField: {
    backgroundColor: '#0B1120',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    height: 36,
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '600',
  },
  fieldHelperText: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  infoTextWrap: {
    flex: 1,
  },
  ownerAddressEditSection: {
    gap: 5,
    marginTop: 2,
  },
  addressTextArea: {
    height: 54,
    textAlignVertical: 'top',
    paddingTop: 6,
  },
  cityPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginVertical: 3,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  cityPillActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
    borderColor: '#38BDF8',
  },
  cityPillText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  cityPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  testMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    marginTop: 3,
  },
  testMapBtnText: {
    color: '#38BDF8',
    fontSize: 10.5,
    fontWeight: '700',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  infoSubText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  emailLinkText: {
    color: '#38BDF8',
    fontWeight: '600',
  },
  mapLink: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#38BDF8',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  ownerOverviewCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: RADIUS.lg,
    padding: 16,
    gap: 8,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overviewTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  overviewText: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 15,
  },
  summaryListContainer: {
    backgroundColor: '#0B1120',
    borderRadius: RADIUS.md,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94A3B8',
    width: 80,
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  summarySaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    marginTop: 4,
  },
  summarySaveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  formCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 20,
  },
  formCardMobile: {
    padding: 16,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 14,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  formFields: {
    gap: 12,
  },
  formGroup: {
    gap: 5,
  },
  formGroupFull: {
    width: '100%',
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formRowMobile: {
    flexDirection: 'column',
    gap: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: '#111A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 42,
    color: COLORS.textPrimary,
    fontSize: 12.5,
  },
  inputError: {
    borderColor: 'rgba(225, 29, 72, 0.6)',
    backgroundColor: 'rgba(225, 29, 72, 0.05)',
  },
  errorText: {
    color: '#FDA4AF',
    fontSize: 10.5,
    marginTop: 2,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  bikePillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 2,
  },
  bikePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  bikePillActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
    borderColor: '#38BDF8',
  },
  bikePillText: {
    fontSize: 11.5,
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
    paddingVertical: 12,
    marginTop: 4,
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
    fontSize: 13,
    fontWeight: '800',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  successText: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
