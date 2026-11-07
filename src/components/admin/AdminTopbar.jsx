import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Menu,
  Search,
  Bell,
  User,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  LogOut,
  X,
} from 'lucide-react-native';
import { COLORS, RADIUS } from '../../theme/colors';

export default function AdminTopbar({
  onToggleSidebar,
  isSidebarOpen = true,
  searchQuery,
  onSearchChange,
  onExitToMarketplace,
  unreadNotifications = 3,
  navigation: propNavigation,
}) {
  let hookNavigation = null;
  try {
    hookNavigation = useNavigation();
  } catch (e) {
    // Graceful fallback if rendered outside a NavigationContainer
  }
  const navigation = propNavigation || hookNavigation;

  const handleReturnToHome = () => {
    if (typeof onExitToMarketplace === 'function') {
      onExitToMarketplace();
      return;
    }
    if (navigation?.navigate) {
      try {
        navigation.navigate('MainTabs', { screen: 'Home' });
      } catch (err) {
        try {
          navigation.navigate('Home');
        } catch (e) {
          if (navigation.canGoBack && navigation.canGoBack()) {
            navigation.goBack();
          }
        }
      }
    }
  };

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notificationsList = [
    { id: 1, title: 'New Bike Listing Submitted', desc: 'Royal Enfield Himalayan 450 (MH 02 FJ 9042) submitted for RC verification.', time: '10m ago', unread: true },
    { id: 2, title: 'Owner KYC Re-upload Needed', desc: 'Rajesh K. Verma submitted a blurry address document.', time: '1h ago', unread: true },
    { id: 3, title: 'Security Report Created', desc: 'Report #REP-701: Late return & minor damage reported by owner.', time: '3h ago', unread: true },
    { id: 4, title: 'Settlement Released', desc: 'Payout of ₹4,320 credited for Booking BK-9410.', time: '1d ago', unread: false },
  ];

  return (
    <View style={styles.topbarWrapper}>
      <View style={styles.topbarLeft}>
        <TouchableOpacity
          style={[styles.menuBtn, isSidebarOpen && styles.menuBtnActive]}
          onPress={onToggleSidebar}
          activeOpacity={0.7}
          accessibilityLabel={isSidebarOpen ? 'Hide left sidebar' : 'Show left sidebar'}
        >
          <Menu size={20} color={isSidebarOpen ? '#38BDF8' : '#CBD5E1'} />
        </TouchableOpacity>

        {/* Global Search Bar */}
        <View style={styles.searchBox}>
          <Search size={16} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Search owners, bikes, bookings, VIN..."
            placeholderTextColor={COLORS.textMuted}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => onSearchChange('')} style={{ padding: 4 }}>
              <X size={14} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.topbarRight}>
        {/* Marketplace Switcher Link */}
        <TouchableOpacity
          style={styles.marketplaceSwitchBtn}
          onPress={handleReturnToHome}
          activeOpacity={0.8}
        >
          <ExternalLink size={13} color="#38BDF8" />
          <Text style={styles.marketplaceSwitchText}>View Marketplace</Text>
        </TouchableOpacity>

        {/* Notification Bell */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            setShowNotifications(!showNotifications);
            setShowProfileMenu(false);
          }}
          activeOpacity={0.7}
        >
          <Bell size={18} color="#CBD5E1" />
          {unreadNotifications > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unreadNotifications}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Admin Profile Dropdown */}
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => {
            setShowProfileMenu(!showProfileMenu);
            setShowNotifications(false);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.avatarBox}>
            <Text style={styles.avatarInitials}>RS</Text>
          </View>
          <View style={styles.profileInfoText}>
            <Text style={styles.adminName}>Rohan S.</Text>
            <Text style={styles.adminBadge}>SUPER ADMIN</Text>
          </View>
          <ChevronDown size={14} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Notifications Dropdown Panel */}
      {showNotifications && (
        <View style={styles.dropdownPanel}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>Notifications & Queue</Text>
            <TouchableOpacity onPress={() => setShowNotifications(false)}>
              <X size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.notifList}>
            {notificationsList.map((n) => (
              <View key={n.id} style={[styles.notifItem, n.unread && styles.notifItemUnread]}>
                <View style={styles.notifDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifItemTitle}>{n.title}</Text>
                  <Text style={styles.notifItemDesc}>{n.desc}</Text>
                  <Text style={styles.notifItemTime}>{n.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Profile Menu Dropdown */}
      {showProfileMenu && (
        <View style={[styles.dropdownPanel, styles.profileDropdown]}>
          <View style={styles.profileDropHeader}>
            <Text style={styles.dropAdminName}>Rohan Sharma</Text>
            <Text style={styles.dropAdminEmail}>admin@theroadeagle.com</Text>
            <View style={styles.roleTag}>
              <ShieldCheck size={12} color="#10B981" />
              <Text style={styles.roleTagText}>Platform Operations Level 3</Text>
            </View>
          </View>

          <View style={styles.profileDropDivider} />

          <TouchableOpacity
            style={styles.profileDropItem}
            onPress={() => {
              setShowProfileMenu(false);
              handleReturnToHome();
            }}
          >
            <ExternalLink size={15} color="#38BDF8" />
            <Text style={styles.profileDropItemText}>Return to Customer App</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.profileDropItem, { marginTop: 4 }]}
            onPress={() => {
              setShowProfileMenu(false);
              handleReturnToHome();
            }}
          >
            <LogOut size={15} color="#F43F5E" />
            <Text style={[styles.profileDropItemText, { color: '#F43F5E' }]}>Sign Out Admin</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topbarWrapper: {
    height: 64,
    backgroundColor: '#0A1222',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    position: 'relative',
    zIndex: 100,
  },
  topbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    maxWidth: 480,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuBtnActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.2)',
    borderColor: '#38BDF8',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    height: 38,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    height: '100%',
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  marketplaceSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  marketplaceSwitchText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E11D48',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  avatarBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  profileInfoText: {
    display: Platform.OS === 'web' ? 'flex' : 'none',
  },
  adminName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  adminBadge: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.4,
  },
  dropdownPanel: {
    position: 'absolute',
    top: 68,
    right: 16,
    width: 320,
    backgroundColor: '#0D1526',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: RADIUS.lg,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 200,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCard,
    marginBottom: 10,
  },
  dropdownTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  notifList: {
    gap: 10,
  },
  notifItem: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgDark,
  },
  notifItemUnread: {
    borderLeftWidth: 2,
    borderLeftColor: '#38BDF8',
  },
  notifDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    marginTop: 6,
  },
  notifItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  notifItemDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 15,
    marginTop: 2,
  },
  notifItemTime: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  profileDropdown: {
    width: 260,
  },
  profileDropHeader: {
    paddingBottom: 8,
  },
  dropAdminName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dropAdminEmail: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  profileDropDivider: {
    height: 1,
    backgroundColor: COLORS.borderCard,
    marginVertical: 8,
  },
  profileDropItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  profileDropItemText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});

