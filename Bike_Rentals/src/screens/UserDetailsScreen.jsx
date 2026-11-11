import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  FileText,
  CheckCircle2,
  Bike,
  ArrowLeft,
  RefreshCw,
  LogOut,
  Award,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { authAPI, authStorage } from '../services/api';
import { isOwnerUser } from '../utils/authUtils';

export default function UserDetailsScreen({
  navigation,
  user: initialUser,
  onSignOut,
  onShowToast,
}) {
  const [user, setUser] = useState(initialUser || authStorage.getUser() || null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await authAPI.getMe().catch(() => null);
      if (res?.user) {
        setUser((prev) => ({
          ...(prev || {}),
          ...res.user,
          name: res.user.fullName || res.user.name,
          phone: res.user.phoneNumber || res.user.phone || prev?.phone,
        }));
      }
    } catch (e) {
      console.warn('[UserDetailsScreen] Notice fetching profile:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const isOwner = isOwnerUser(user);
  const userInitial = (user?.name || user?.fullName || user?.email || 'U').trim().charAt(0).toUpperCase();
  const phoneDisplay = user?.phoneNumber || user?.phone || user?.phone_number || 'Not Provided';
  const emailDisplay = user?.email || 'Not Provided';
  const nameDisplay = user?.fullName || user?.name || 'Registered Rider';

  const formatDob = (dob) => {
    if (!dob) return 'Verified (18+)';
    try {
      const d = new Date(dob);
      if (isNaN(d.getTime())) return String(dob);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(dob);
    }
  };

  const dlNumber =
    user?.drivingLicense?.dlNumber ||
    (typeof user?.drivingLicense === 'string' ? user.drivingLicense : null) ||
    'Verified at Pickup';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button & Page Header */}
        <View style={styles.topNavRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation?.goBack?.() || navigation?.navigate?.('Home')}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color="#38BDF8" />
            <Text style={styles.backButtonText}>Back to Fleet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchProfile}
            activeOpacity={0.7}
          >
            <RefreshCw size={14} color="#38BDF8" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Hero Card */}
        <View style={[styles.heroCard, SHADOWS.card]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{userInitial}</Text>
          </View>

          <View style={styles.heroDetails}>
            <View style={styles.badgeRow}>
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={12} color="#34D399" />
                <Text style={styles.verifiedBadgeText}>
                  {isOwner ? 'Fleet Operations Owner' : '18+ Verified Rider'}
                </Text>
              </View>
              {user?.emailVerified && (
                <View style={styles.emailVerifiedBadge}>
                  <CheckCircle2 size={11} color="#38BDF8" />
                  <Text style={styles.emailVerifiedText}>Email Verified</Text>
                </View>
              )}
            </View>

            <Text style={styles.heroName}>{nameDisplay}</Text>
            <Text style={styles.heroEmail}>{emailDisplay}</Text>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingBanner}>
            <ActivityIndicator size="small" color="#38BDF8" />
            <Text style={styles.loadingBannerText}>Updating profile details from database...</Text>
          </View>
        )}

        {/* Personal & Contact Information Card */}
        <View style={[styles.sectionCard, SHADOWS.card]}>
          {/* <View style={styles.sectionHeader}>
            <User size={16} color="#38BDF8" />
            <Text style={styles.sectionTitle}>Personal & Contact Details</Text>
          </View> */}

          <View style={styles.grid}>
            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <Text style={styles.fieldValue}>{nameDisplay}</Text>
            </View>

            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <Text style={styles.fieldValue}>{emailDisplay}</Text>
            </View>

            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <Text style={styles.fieldValue}>
                {user?.phoneCountryCode || '+91'} {phoneDisplay}
              </Text>
            </View>

            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>Age Eligibility</Text>
              <Text style={styles.fieldValue}>{formatDob(user?.dateOfBirth)}</Text>
            </View>
          </View>
        </View>

        {/* Driving Licence & Identification Card */}
        <View style={[styles.sectionCard, SHADOWS.card]}>
          <View style={styles.sectionHeader}>
            <Award size={16} color="#34D399" />
            <Text style={styles.sectionTitle}>Driving Licence & Verification</Text>
          </View>

          <View style={styles.grid}>
            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>Driving Licence Number</Text>
              <Text style={styles.fieldValue}>{dlNumber}</Text>
            </View>

            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>Licence Class</Text>
              <Text style={styles.fieldValue}>
                {user?.drivingLicense?.dlClass || 'MCWG (Motorcycle with Gear)'}
              </Text>
            </View>

            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>KYC Status</Text>
              <View style={styles.kycStatusRow}>
                <CheckCircle2 size={13} color="#10B981" />
                <Text style={styles.kycStatusText}>Document Check at Hub</Text>
              </View>
            </View>

            <View style={styles.fieldBox}>
              <Text style={styles.fieldLabel}>Membership Tier</Text>
              <Text style={styles.fieldValue}>
                {isOwner ? 'Fleet Partner' : 'Standard Rider Member'}
              </Text>
            </View>
          </View>
        </View>

        {/* Navigation Quick Actions */}
        <View style={styles.actionsBox}>
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => navigation?.navigate?.('MyBookings')}
            activeOpacity={0.8}
          >
            <Bike size={16} color="#FFFFFF" />
            <Text style={styles.actionBtnPrimaryText}>View My Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() => navigation?.navigate?.('Motorbikes')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnSecondaryText}>Explore Motorcycles</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        {onSignOut && (
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={onSignOut}
            activeOpacity={0.8}
          >
            <LogOut size={16} color="#EF4444" />
            <Text style={styles.signOutBtnText}>Sign Out of Account</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  backButtonText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  refreshButtonText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: RADIUS.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  heroDetails: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  verifiedBadgeText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
  },
  emailVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  emailVerifiedText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '600',
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  heroEmail: {
    color: '#94A3B8',
    fontSize: 12,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
  },
  loadingBannerText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: RADIUS.md,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 10,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fieldBox: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    padding: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  fieldLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldValue: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
  },
  kycStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  kycStatusText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  actionsBox: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnSecondary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  actionBtnSecondaryText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    marginTop: 8,
  },
  signOutBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
});

