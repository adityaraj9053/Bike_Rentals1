import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import {
  LayoutDashboard,
  BarChart3,
  UserCheck,
  FileCheck2,
  Users,
  Bike,
  CalendarDays,
  MapPin,
  CreditCard,
  FileText,
  AlertOctagon,
  Settings,
  Shield,
  Compass,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react-native';
import { COLORS, RADIUS } from '../../theme/colors';

const NAV_SECTIONS = [
  {
    title: 'OVERVIEW',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    ],
  },
  {
    title: 'VERIFICATION MANAGEMENT',
    items: [
      { id: 'owner-verification', label: 'Owner Verification', icon: UserCheck, badgeKey: 'pendingOwners' },
      { id: 'bike-verification', label: 'Bike / RC Verification', icon: FileCheck2, badgeKey: 'pendingBikes' },
      { id: 'renter-verification', label: 'Renter Verification', icon: Shield, badgeKey: 'pendingRenters' },
    ],
  },
  {
    title: 'MARKETPLACE MANAGEMENT',
    items: [
      { id: 'bike-listings', label: 'Manage Bike Listings', icon: Bike },
      { id: 'bookings', label: 'Manage Bookings', icon: CalendarDays, badgeKey: 'activeBookings' },
      { id: 'users', label: 'Manage Users', icon: Users },
      { id: 'locations', label: 'Manage Locations', icon: MapPin },
    ],
  },
  {
    title: 'OPERATIONS & FINANCE',
    items: [
      { id: 'payments', label: 'Payments & Deposits', icon: CreditCard },
      { id: 'agreements', label: 'Rental Agreements', icon: FileText },
      { id: 'complaints', label: 'Complaints & Reports', icon: AlertOctagon, badgeKey: 'openComplaints' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function AdminSidebar({
  activeTab,
  onSelectTab,
  badges = {},
  isOpen = true,
  isMobile = false,
  onClose,
}) {
  if (!isOpen) return null;

  const content = (
    <View style={[styles.sidebarContainer, isMobile && styles.sidebarContainerMobile]}>
      {/* Brand Header */}
      <View style={styles.brandBar}>
        <View style={styles.brandLeft}>
          <View style={styles.logoBox}>
            <Compass size={18} color="#FFFFFF" strokeWidth={2.5} />
          </View>
          <View>
            <Text style={styles.brandTitle}>ROAD EAGLE</Text>
            <Text style={styles.brandRole}>ADMIN DASHBOARD</Text>
          </View>
        </View>

        {/* Close / Collapse button accessible on BOTH desktop and mobile */}
        {onClose && (
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            activeOpacity={0.7}
            accessibilityLabel="Close sidebar panel"
          >
            {isMobile ? <X size={18} color="#CBD5E1" /> : <ChevronLeft size={18} color="#94A3B8" />}
          </TouchableOpacity>
        )}
      </View>

      {/* Navigation Sections */}
      <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
        {NAV_SECTIONS.map((section) => (
          <View key={section.title} style={styles.sectionGroup}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              const badgeCount = item.badgeKey ? badges[item.badgeKey] : null;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => {
                    onSelectTab(item.id);
                    if (isMobile && onClose) onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <IconComp
                    size={17}
                    color={isActive ? '#38BDF8' : COLORS.textMuted}
                    style={styles.navIcon}
                  />
                  <Text
                    style={[styles.navLabel, isActive && styles.navLabelActive]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>

                  {badgeCount ? (
                    <View style={[styles.badgePill, isActive && styles.badgePillActive]}>
                      <Text style={styles.badgePillText}>{badgeCount}</Text>
                    </View>
                  ) : isActive ? (
                    <ChevronRight size={14} color="#38BDF8" />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Security sandbox notice */}
        <View style={styles.securityBox}>
          <Shield size={14} color="#10B981" />
          <Text style={styles.securityText}>Simulated Operations Mode v2.4</Text>
        </View>
      </ScrollView>
    </View>
  );

  if (isMobile) {
    return (
      <View style={styles.mobileOverlayWrapper}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={0.7}
          onPress={onClose}
          accessibilityLabel="Dismiss sidebar"
        />
        {content}
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  sidebarContainer: {
    width: 250,
    backgroundColor: '#070E1B',
    borderRightWidth: 1,
    borderRightColor: COLORS.borderCard,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  sidebarContainerMobile: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 1000,
    width: 280,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 24,
  },
  mobileOverlayWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 11, 20, 0.75)',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandBar: {
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  brandRole: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  closeMobileBtn: {
    padding: 6,
  },
  navScroll: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  sectionGroup: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    marginBottom: 2,
    gap: 10,
  },
  navItemActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  navIcon: {
    width: 20,
  },
  navLabel: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  badgePill: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  badgePillActive: {
    backgroundColor: '#0284C7',
  },
  badgePillText: {
    color: '#F59E0B',
    fontSize: 10.5,
    fontWeight: '800',
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: RADIUS.sm,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  securityText: {
    fontSize: 10.5,
    color: '#10B981',
    fontWeight: '600',
  },
});

