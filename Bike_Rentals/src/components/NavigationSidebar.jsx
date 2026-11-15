import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import {
  X,
  User,
  Calendar,
  Bike,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Sparkles,
  Phone,
  Mail,
  Award,
  EyeOff,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { isOwnerUser } from '../utils/authUtils';

export default function NavigationSidebar({
  visible,
  onClose,
  user,
  sharedBikes = [],
  onNavigate,
  onSignOut,
}) {
  const [bookingCount, setBookingCount] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cached = JSON.parse(window.localStorage.getItem('my_user_bookings') || '[]');
        if (Array.isArray(cached)) {
          setBookingCount(cached.length);
        }
      } catch (e) {}
    }
  }, [visible]);

  if (!visible) return null;

  const isOwner = isOwnerUser(user);
  const userInitial = (user?.name || user?.fullName || user?.email || 'U').trim().charAt(0).toUpperCase();
  const userName = user?.fullName || user?.name || 'Registered Rider';
  const userEmail = user?.email || '';

  const unpublishedCount = (sharedBikes || []).filter(
    (b) => b.isPublished === false || b.status === 'UNPUBLISHED'
  ).length;

  const handleItemPress = (screenName) => {
    onClose();
    if (onNavigate) {
      onNavigate(screenName);
    }
  };

  const handleSignOutPress = () => {
    onClose();
    if (onSignOut) {
      onSignOut();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        {/* Semi-transparent backdrop - tap outside to dismiss */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Sidebar Drawer Panel sliding in from right */}
        <View style={[styles.sidebarPanel, SHADOWS.card]}>
          {/* Header Profile Box */}
          <View style={styles.sidebarHeader}>
            <View style={styles.headerProfileRow}>
              <View style={[styles.avatarCircle, isOwner && styles.ownerAvatarCircle]}>
                <Text style={styles.avatarInitial}>{userInitial}</Text>
              </View>

              <View style={styles.profileTextWrapper}>
                <View style={styles.badgeRow}>
                  <View style={styles.verifiedTag}>
                    <ShieldCheck size={11} color="#34D399" />
                    <Text style={styles.verifiedTagText}>
                      {isOwner ? 'Fleet Owner' : '18+ Verified Rider'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.profileName} numberOfLines={1}>
                  {userName}
                </Text>
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {userEmail}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
                accessibilityLabel="Close navigation menu"
              >
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Menu Items List */}
          <ScrollView
            style={styles.menuScrollView}
            contentContainerStyle={styles.menuContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionHeading}>Account Navigation</Text>

            {/* If Non-Owner: My Bookings (Only visible to non-owner) */}
            {!isOwner && (
              <TouchableOpacity
                style={styles.menuItemCard}
                onPress={() => handleItemPress('MyBookings')}
                activeOpacity={0.75}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
                  <Calendar size={18} color="#38BDF8" />
                </View>

                <View style={styles.menuItemTextContainer}>
                  <View style={styles.menuItemTitleRow}>
                    <Text style={styles.menuItemTitle}>My Bookings</Text>
                    {bookingCount > 0 && (
                      <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{bookingCount} Active</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.menuItemSub}>
                    Active rentals, timelines & bike compliance docs
                  </Text>
                </View>

                <ChevronRight size={16} color="#64748B" />
              </TouchableOpacity>
            )}

            {/* If Owner: Buyer's Detail (Only visible in owner's account) */}
            {isOwner && (
              <TouchableOpacity
                style={[styles.menuItemCard, styles.ownerMenuItemCard]}
                onPress={() => handleItemPress('BuyerDetails')}
                activeOpacity={0.75}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.14)' }]}>
                  <User size={18} color="#F59E0B" />
                </View>

                <View style={styles.menuItemTextContainer}>
                  <Text style={[styles.menuItemTitle, { color: '#FCD34D' }]}>Buyer's Detail</Text>
                  <Text style={styles.menuItemSub}>
                    Active buyer rentals, verification & submitted documents
                  </Text>
                </View>

                <ChevronRight size={16} color="#F59E0B" />
              </TouchableOpacity>
            )}

            {/* If Owner: Unpublished Bikes (Only visible in owner's account) */}
            {isOwner && (
              <TouchableOpacity
                style={[styles.menuItemCard, styles.unpublishedMenuItemCard]}
                onPress={() => handleItemPress('UnpublishedBikes')}
                activeOpacity={0.75}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.14)' }]}>
                  <EyeOff size={18} color="#F87171" />
                </View>

                <View style={styles.menuItemTextContainer}>
                  <View style={styles.menuItemTitleRow}>
                    <Text style={[styles.menuItemTitle, { color: '#F87171' }]}>Unpublished Bikes</Text>
                    {unpublishedCount > 0 && (
                      <View style={styles.unpublishedCountBadge}>
                        <Text style={styles.unpublishedCountBadgeText}>{unpublishedCount} Hidden</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.menuItemSub}>
                    Manage hidden fleet motorcycles, update status & republish
                  </Text>
                </View>

                <ChevronRight size={16} color="#F87171" />
              </TouchableOpacity>
            )}

            <Text style={[styles.sectionHeading, { marginTop: 12 }]}>Fleet Services</Text>

            {/* Menu Item 3: Browse Fleet */}
            <TouchableOpacity
              style={styles.menuItemCard}
              onPress={() => handleItemPress('Motorbikes')}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(129, 140, 248, 0.12)' }]}>
                <Bike size={18} color="#818CF8" />
              </View>

              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemTitle}>Browse Fleet</Text>
                <Text style={styles.menuItemSub}>
                  Explore and rent premium motorcycles
                </Text>
              </View>

              <ChevronRight size={16} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Menu Item 4: Sign Out Button (Requested as Menu Item) */}
            <TouchableOpacity
              style={styles.signOutMenuItem}
              onPress={handleSignOutPress}
              activeOpacity={0.75}
            >
              <View style={styles.signOutIconContainer}>
                <LogOut size={18} color="#EF4444" />
              </View>

              <View style={styles.menuItemTextContainer}>
                <Text style={styles.signOutTitle}>Sign Out</Text>
                <Text style={styles.signOutSub}>End your active session securely</Text>
              </View>

              <ChevronRight size={16} color="#EF4444" />
            </TouchableOpacity>
          </ScrollView>

          {/* Footer note */}
          <View style={styles.sidebarFooter}>
            <Text style={styles.footerBrandText}>THE ROAD EAGLE</Text>
            <Text style={styles.footerVersionText}>Verified Fleet Rentals • v1.0.0</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(380, width * 0.88);

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sidebarPanel: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: '#0B1120',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(56, 189, 248, 0.2)',
    flexDirection: 'column',
    justifyContent: 'space-between',
    zIndex: 10,
    elevation: 20,
  },
  sidebarHeader: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  ownerAvatarCircle: {
    backgroundColor: '#D97706',
    borderColor: '#F59E0B',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  profileTextWrapper: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedTagText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '700',
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  profileEmail: {
    color: '#94A3B8',
    fontSize: 11,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuScrollView: {
    flex: 1,
  },
  menuContent: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 10,
  },
  sectionHeading: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginLeft: 4,
    marginBottom: 4,
  },
  menuItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  ownerMenuItemCard: {
    borderColor: 'rgba(245, 158, 11, 0.25)',
    backgroundColor: 'rgba(30, 27, 75, 0.4)',
  },
  unpublishedMenuItemCard: {
    borderColor: 'rgba(239, 68, 68, 0.25)',
    backgroundColor: 'rgba(30, 27, 75, 0.35)',
    marginTop: 8,
  },
  unpublishedCountBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  unpublishedCountBadgeText: {
    color: '#FCA5A5',
    fontSize: 10,
    fontWeight: '700',
  },
  menuIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTextContainer: {
    flex: 1,
    gap: 2,
  },
  menuItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuItemTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  countBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  menuItemSub: {
    color: '#94A3B8',
    fontSize: 10.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 6,
  },
  signOutMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  signOutIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutTitle: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '700',
  },
  signOutSub: {
    color: '#FCA5A5',
    fontSize: 10.5,
  },
  sidebarFooter: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    alignItems: 'center',
    gap: 2,
  },
  footerBrandText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  footerVersionText: {
    color: '#64748B',
    fontSize: 9.5,
  },
});

