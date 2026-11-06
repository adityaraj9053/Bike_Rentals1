import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Compass, User, ChevronLeft, Globe, Sparkles, Shield } from 'lucide-react-native';
import { COLORS, RADIUS } from '../theme/colors';
import { useLanguage } from '../i18n/LanguageContext';

export default function CustomHeader({
  navigation,
  showBack = false,
  title,
  user,
  onOpenAuth,
  onOpenWhatsApp,
  onStartBooking,
}) {
  const { language, toggleLanguage, t, isHindi } = useLanguage();
  const { width } = useWindowDimensions();

  // Responsive: remove/hide the brand name in mobile view (< 768px)
  const isMobile = width < 768;
  const showBrandName = !isMobile;
  const isVerySmall = width < 420;

  const handleBookPress = () => {
    // Requirement: In navbar, clicking the booking button directly opens the Fleet (Motorbikes) page!
    if (navigation) {
      navigation.navigate('Motorbikes');
    }
  };

  const getUserDisplayName = () => {
    if (!user) return t('nav.login', 'Log In');
    const first = (user.name || '').split(' ')[0] || 'User';
    return isVerySmall ? first.slice(0, 5) : first.length > 8 ? `${first.slice(0, 7)}…` : first;
  };

  return (
    <View style={styles.headerWrapper}>
      <View style={[styles.headerContainer, isMobile && styles.headerContainerMobile]}>
        <View style={styles.headerLeft}>
          {showBack ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation?.goBack()}
              activeOpacity={0.7}
            >
              <ChevronLeft size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.brandContainer}
              onPress={() => navigation?.navigate('Home')}
              activeOpacity={0.8}
            >
              <View style={styles.logoIcon}>
                <Compass size={17} color="#FFFFFF" strokeWidth={2.3} />
              </View>
              {showBrandName && (
                <Text style={styles.brandTitle}>{t('nav.brand', 'THE ROAD EAGLE')}</Text>
              )}
            </TouchableOpacity>
          )}

          {showBack && title && (
            <Text style={styles.screenTitle} numberOfLines={1}>
              {title}
            </Text>
          )}
        </View>

        <View style={[styles.headerRight, isMobile && styles.headerRightMobile]}>
          {/* Rent Your Bike Navigation Button */}
          <TouchableOpacity
            style={[styles.rentBikeBtn, isVerySmall && styles.rentBikeBtnSmall]}
            onPress={() => navigation?.navigate('RentBike')}
            activeOpacity={0.8}
          >
            <Sparkles size={12} color="#FFFFFF" />
            <Text style={styles.rentBikeBtnText}>{isMobile ? 'List Bike' : 'Rent Your Bike'}</Text>
          </TouchableOpacity>

          {/* Admin Dashboard Quick Access Button */}
          <TouchableOpacity
            style={[styles.adminHeaderBtn, isVerySmall && styles.adminHeaderBtnSmall]}
            onPress={() => navigation?.navigate('AdminDashboard')}
            activeOpacity={0.8}
            accessibilityLabel="Admin Dashboard"
          >
            <Shield size={12} color="#38BDF8" />
            <Text style={styles.adminHeaderText}>Admin</Text>
          </TouchableOpacity>

          {/* Quick Book Action - Directly navigates to Fleet (Motorbikes) page */}
          <TouchableOpacity
            style={[styles.headerBookBtn, isVerySmall && styles.headerBookBtnSmall]}
            onPress={handleBookPress}
            activeOpacity={0.8}
          >
            <Text style={styles.headerBookBtnText}>{t('nav.bookNow', 'Book Now')}</Text>
          </TouchableOpacity>

          {/* Language Switcher Toggle next to Login */}
          <TouchableOpacity
            style={[styles.langToggleBtn, isVerySmall && styles.langToggleBtnSmall]}
            onPress={toggleLanguage}
            activeOpacity={0.8}
            accessibilityLabel="Switch Language"
          >
            <Globe size={13} color="#38BDF8" />
            <Text style={styles.langToggleText}>
              {isHindi ? 'English' : 'हिन्दी'}
            </Text>
          </TouchableOpacity>

          {/* User Account Button */}
          <TouchableOpacity
            style={[styles.userButton, isVerySmall && styles.userButtonSmall]}
            onPress={onOpenAuth}
            activeOpacity={0.8}
          >
            <User size={14} color={COLORS.accentCyan} />
            <Text style={styles.userButtonText} numberOfLines={1}>
              {getUserDisplayName()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: COLORS.bgDark,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCard,
    alignItems: 'center',
    width: '100%',
  },
  headerContainer: {
    height: Platform.OS === 'ios' ? 58 : 62,
    width: '100%',
    maxWidth: 1240,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  headerContainerMobile: {
    paddingHorizontal: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 40,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  screenTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
    borderWidth: 1.5,
    borderColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerRightMobile: {
    gap: 6,
  },
  rentBikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: RADIUS.full,
  },
  rentBikeBtnSmall: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  rentBikeBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
  },
  adminHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  adminHeaderBtnSmall: {
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  adminHeaderText: {
    color: '#CBD5E1',
    fontSize: 11.5,
    fontWeight: '700',
  },
  headerBookBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  headerBookBtnSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerBookBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  langToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  langToggleBtnSmall: {
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  langToggleText: {
    color: '#38BDF8',
    fontSize: 11.5,
    fontWeight: '700',
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: RADIUS.full,
  },
  userButtonSmall: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  userButtonText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 72,
  },
});
