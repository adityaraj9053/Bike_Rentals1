import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
  Dimensions,
  useWindowDimensions,
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
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  RotateCcw,
  Flag,
  Ban,
  Check,
  HelpCircle,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminTopbar from '../components/admin/AdminTopbar';
import BikeVerificationModal from '../components/admin/BikeVerificationModal';
import OwnerDetailsModal from '../components/admin/OwnerDetailsModal';
import RenterDetailsModal from '../components/admin/RenterDetailsModal';
import BookingDetailsModal from '../components/admin/BookingDetailsModal';
import ComplaintDetailsModal from '../components/admin/ComplaintDetailsModal';
import EditBikeListingModal from '../components/admin/EditBikeListingModal';

import {
  INITIAL_OWNERS,
  INITIAL_BIKE_LISTINGS,
  INITIAL_RENTERS,
  INITIAL_BOOKINGS,
  INITIAL_TRANSACTIONS,
  INITIAL_COMPLAINTS,
  INITIAL_LOCATIONS,
  ANALYTICS_DATA,
  PLATFORM_SETTINGS,
} from '../data/marketplaceData';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen({
  navigation,
  route,
  onShowToast,
  sharedBikes,
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 900;
  const initialTab = route?.params?.initialTab || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(width >= 900);
  const [globalSearch, setGlobalSearch] = useState('');

  // Primary State
  const [ownersList, setOwnersList] = useState(INITIAL_OWNERS);
  const [bikesList, setBikesList] = useState(sharedBikes || INITIAL_BIKE_LISTINGS);
  const [rentersList, setRentersList] = useState(INITIAL_RENTERS);
  const [bookingsList, setBookingsList] = useState(INITIAL_BOOKINGS);
  const [transactionsList, setTransactionsList] = useState(INITIAL_TRANSACTIONS);
  const [complaintsList, setComplaintsList] = useState(INITIAL_COMPLAINTS);
  const [locationsList, setLocationsList] = useState(INITIAL_LOCATIONS);
  const [settingsData, setSettingsData] = useState(PLATFORM_SETTINGS);

  // Active Modals State
  const [selectedBikeForReview, setSelectedBikeForReview] = useState(null);
  const [selectedOwnerForView, setSelectedOwnerForView] = useState(null);
  const [selectedRenterForView, setSelectedRenterForView] = useState(null);
  const [selectedBookingForView, setSelectedBookingForView] = useState(null);
  const [selectedComplaintForView, setSelectedComplaintForView] = useState(null);
  const [selectedBikeForEdit, setSelectedBikeForEdit] = useState(null);

  // Filtering & Search for individual tabs
  const [ownerFilterStatus, setOwnerFilterStatus] = useState('All');
  const [bikeFilterStatus, setBikeFilterStatus] = useState('All');
  const [renterFilterStatus, setRenterFilterStatus] = useState('All');
  const [bookingFilterStatus, setBookingFilterStatus] = useState('All');
  const [txnFilterStatus, setTxnFilterStatus] = useState('All');
  const [complaintFilterStatus, setComplaintFilterStatus] = useState('All');

  // Pagination State
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 6;

  // Sidebar badge counts
  const badges = useMemo(() => {
    return {
      pendingOwners: ownersList.filter((o) => o.status === 'Pending' || o.status === 'Needs Correction').length,
      pendingBikes: bikesList.filter((b) => b.status === 'Pending Verification' || b.status === 'Needs Correction').length,
      pendingRenters: rentersList.filter((r) => r.verificationStatus === 'Pending' || r.verificationStatus === 'Needs Correction').length,
      activeBookings: bookingsList.filter((b) => b.bookingStatus === 'Active' || b.bookingStatus === 'Requested').length,
      openComplaints: complaintsList.filter((c) => c.status === 'Open' || c.status === 'In Investigation').length,
    };
  }, [ownersList, bikesList, rentersList, bookingsList, complaintsList]);

  // Actions handlers
  const handleUpdateBikeStatus = (bikeId, newStatus, adminRemark) => {
    setBikesList((prev) =>
      prev.map((b) => {
        if (b.id === bikeId) {
          return {
            ...b,
            status: newStatus,
            adminNotes: adminRemark,
            rcStatus: newStatus === 'Approved' ? 'Verified' : b.rcStatus,
          };
        }
        return b;
      })
    );
  };

  const handleUpdateOwnerStatus = (ownerId, newStatus, remark) => {
    setOwnersList((prev) =>
      prev.map((o) => {
        if (o.id === ownerId) {
          return {
            ...o,
            status: newStatus,
            verificationHistory: [
              { date: new Date().toISOString().split('T')[0], action: `Admin action: ${newStatus} (${remark || 'No remark'})`, by: 'Admin' },
              ...(o.verificationHistory || []),
            ],
          };
        }
        return o;
      })
    );
  };

  const handleUpdateRenterStatus = (renterId, newStatus, remark) => {
    setRentersList((prev) =>
      prev.map((r) => (r.id === renterId ? { ...r, verificationStatus: newStatus } : r))
    );
  };

  const handleUpdateBookingStatus = (bookingId, newStatus) => {
    setBookingsList((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, bookingStatus: newStatus } : b))
    );
  };

  const handleSaveComplaintResolution = (complaintId, updates) => {
    setComplaintsList((prev) =>
      prev.map((c) => (c.id === complaintId ? { ...c, ...updates } : c))
    );
  };

  const handleSaveEditedBike = (bikeId, editedFields) => {
    setBikesList((prev) =>
      prev.map((b) => (b.id === bikeId ? { ...b, ...editedFields } : b))
    );
  };

  const handleDeleteBike = (bikeId) => {
    setBikesList((prev) => prev.filter((b) => b.id !== bikeId));
  };

  return (
    <View style={styles.screenRoot}>
      {/* Top Navbar */}
      <AdminTopbar
        navigation={navigation}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
        searchQuery={globalSearch}
        onSearchChange={setGlobalSearch}
        onExitToMarketplace={() => {
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
        }}
        unreadNotifications={badges.openComplaints + badges.pendingBikes}
      />

      <View style={styles.mainLayout}>
        {/* Toggleable / Collapsible Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          onSelectTab={(tabId) => {
            setActiveTab(tabId);
            setPageNumber(1);
            if (isMobile) setIsSidebarOpen(false);
          }}
          badges={badges}
          isOpen={isSidebarOpen}
          isMobile={isMobile}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Floating reopen tab on desktop when left panel is collapsed */}
        {!isSidebarOpen && !isMobile && (
          <TouchableOpacity
            style={styles.reopenSidebarTab}
            onPress={() => setIsSidebarOpen(true)}
            activeOpacity={0.8}
            accessibilityLabel="Show left panel"
          >
            <ChevronRight size={14} color="#38BDF8" />
            <Text style={styles.reopenSidebarTabText}>Open Menu</Text>
          </TouchableOpacity>
        )}

        {/* Main Content Area */}
        <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.contentInner}>
            {/* 1. OVERVIEW: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <View style={styles.sectionWrapper}>
                <View style={styles.headingBlock}>
                  <Text style={styles.pageMainTitle}>Platform Operations Overview</Text>
                  <Text style={styles.pageSubTitle}>
                    Real-time monitoring of bike owners, renter verifications, live fleet operations, and platform revenue.
                  </Text>
                </View>

                {/* 9 Requested Stat Cards */}
                <View style={styles.statsCardsGrid}>
                  {[
                    { label: 'Total Registered Users', val: '1,420', sub: '+18% this month', icon: Users, color: '#38BDF8' },
                    { label: 'Total Bike Owners', val: ownersList.length, sub: 'Active vehicle listers', icon: UserCheck, color: '#0284C7' },
                    { label: 'Total Renters', val: rentersList.length, sub: 'Verified riders', icon: ShieldCheck, color: '#10B981' },
                    { label: 'Total Listed Bikes', val: bikesList.length, sub: 'Cruisers, Sports, EVs', icon: Bike, color: '#F59E0B' },
                    { label: 'Pending Verifications', val: badges.pendingBikes + badges.pendingOwners, sub: 'Requires admin action', icon: Clock, color: '#E11D48', highlight: true },
                    { label: 'Approved Live Bikes', val: bikesList.filter((b) => b.status === 'Approved').length, sub: 'Active in marketplace', icon: CheckCircle2, color: '#10B981' },
                    { label: 'Active Bookings', val: bookingsList.filter((b) => b.bookingStatus === 'Active').length, sub: 'Currently on road', icon: CalendarDays, color: '#38BDF8' },
                    { label: 'Completed Bookings', val: '342', sub: 'Past 90 days', icon: RotateCcw, color: '#8B5CF6' },
                    { label: 'Total Platform Revenue', val: '₹6,48,500', sub: 'GMV: ₹64.8 Lakhs', icon: DollarSign, color: '#10B981', highlight: true },
                  ].map((card, idx) => {
                    const IconComp = card.icon;
                    return (
                      <View key={idx} style={[styles.statCard, card.highlight && styles.statCardHighlight]}>
                        <View style={styles.statTop}>
                          <Text style={styles.statLabel}>{card.label}</Text>
                          <View style={[styles.statIconWrap, { backgroundColor: `${card.color}20` }]}>
                            <IconComp size={18} color={card.color} />
                          </View>
                        </View>
                        <Text style={styles.statVal}>{card.val}</Text>
                        <Text style={styles.statSub}>{card.sub}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Quick Action Buttons Row */}
                <View style={styles.quickActionsBar}>
                  <Text style={styles.quickActionsLabel}>Quick Actions:</Text>
                  <TouchableOpacity
                    style={styles.quickActionBtn}
                    onPress={() => setActiveTab('bike-verification')}
                  >
                    <FileCheck2 size={15} color="#38BDF8" />
                    <Text style={styles.quickActionBtnText}>Review Pending Bikes ({badges.pendingBikes})</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickActionBtn}
                    onPress={() => setActiveTab('owner-verification')}
                  >
                    <UserCheck size={15} color="#38BDF8" />
                    <Text style={styles.quickActionBtnText}>Verify Owners ({badges.pendingOwners})</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickActionBtn}
                    onPress={() => setActiveTab('complaints')}
                  >
                    <AlertOctagon size={15} color="#F43F5E" />
                    <Text style={[styles.quickActionBtnText, { color: '#F43F5E' }]}>
                      Resolve Complaints ({badges.openComplaints})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.quickActionBtn}
                    onPress={() => navigation?.navigate('RentBike')}
                  >
                    <Plus size={15} color="#10B981" />
                    <Text style={[styles.quickActionBtnText, { color: '#10B981' }]}>Test Owner Listing Flow</Text>
                  </TouchableOpacity>
                </View>

                {/* Revenue and Booking Chart Visualizations */}
                <View style={styles.chartsGrid}>
                  <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                      <View>
                        <Text style={styles.chartTitle}>Monthly Platform GMV & Revenue</Text>
                        <Text style={styles.chartSubtitle}>Commissions collected (₹) across months</Text>
                      </View>
                      <View style={styles.chartTag}>
                        <TrendingUp size={13} color="#10B981" />
                        <Text style={styles.chartTagText}>+28% MoM</Text>
                      </View>
                    </View>

                    {/* Bar Graph Simulation */}
                    <View style={styles.barGraphArea}>
                      {ANALYTICS_DATA.revenueByMonth.map((m, idx) => {
                        const maxHeight = 120;
                        const height = (m.revenue / 24000) * maxHeight;
                        return (
                          <View key={idx} style={styles.barCol}>
                            <Text style={styles.barValText}>₹{(m.revenue / 1000).toFixed(0)}k</Text>
                            <View style={[styles.barFill, { height }]} />
                            <Text style={styles.barMonthLabel}>{m.month}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                      <View>
                        <Text style={styles.chartTitle}>Bookings by Vehicle Category</Text>
                        <Text style={styles.chartSubtitle}>Demand distribution across motorcycle classes</Text>
                      </View>
                    </View>

                    <View style={styles.categoryBarsList}>
                      {ANALYTICS_DATA.bookingsByCategory.map((cat, idx) => (
                        <View key={idx} style={styles.catBarRow}>
                          <View style={styles.catBarLabelRow}>
                            <Text style={styles.catBarName}>{cat.name}</Text>
                            <Text style={styles.catBarCount}>{cat.count} rides ({cat.share})</Text>
                          </View>
                          <View style={styles.catBarTrack}>
                            <View style={[styles.catBarFill, { width: cat.share }]} />
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Recent Submissions & Bookings Row */}
                <View style={styles.tablesRow}>
                  {/* Recent Pending Bike Submissions */}
                  <View style={styles.halfTableCard}>
                    <View style={styles.tableCardHeader}>
                      <Text style={styles.tableCardTitle}>Recent Bike Submissions</Text>
                      <TouchableOpacity onPress={() => setActiveTab('bike-verification')}>
                        <Text style={styles.viewAllLink}>View All</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.miniList}>
                      {bikesList.slice(0, 4).map((b) => (
                        <View key={b.id} style={styles.miniListItem}>
                          <View style={styles.miniItemLeft}>
                            <Bike size={18} color="#38BDF8" />
                            <View>
                              <Text style={styles.miniItemTitle}>{b.brand} {b.model}</Text>
                              <Text style={styles.miniItemSub}>{b.registrationNumber} • {b.ownerName}</Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            style={styles.reviewBtnSmall}
                            onPress={() => setSelectedBikeForReview(b)}
                          >
                            <Text style={styles.reviewBtnText}>Review</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Recent Bookings */}
                  <View style={styles.halfTableCard}>
                    <View style={styles.tableCardHeader}>
                      <Text style={styles.tableCardTitle}>Recent Bookings</Text>
                      <TouchableOpacity onPress={() => setActiveTab('bookings')}>
                        <Text style={styles.viewAllLink}>View All</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.miniList}>
                      {bookingsList.slice(0, 4).map((bk) => (
                        <View key={bk.id} style={styles.miniListItem}>
                          <View style={styles.miniItemLeft}>
                            <CalendarDays size={18} color="#10B981" />
                            <View>
                              <Text style={styles.miniItemTitle}>#{bk.id} - {bk.bikeName}</Text>
                              <Text style={styles.miniItemSub}>{bk.renterName} • ₹{bk.rentalTotal}</Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            style={styles.reviewBtnSmall}
                            onPress={() => setSelectedBookingForView(bk)}
                          >
                            <Text style={styles.reviewBtnText}>Inspect</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* 2. OVERVIEW: ANALYTICS */}
            {activeTab === 'analytics' && (
              <View style={styles.sectionWrapper}>
                <View style={styles.headingBlock}>
                  <Text style={styles.pageMainTitle}>Analytics & Platform Reports</Text>
                  <Text style={styles.pageSubTitle}>
                    Comprehensive data on platform demand, fleet utilization, revenue trends, and regional performance.
                  </Text>
                </View>

                <View style={styles.analyticsGrid}>
                  <View style={styles.analyticsCard}>
                    <Text style={styles.analyticsCardTitle}>Top Performing Locations</Text>
                    {ANALYTICS_DATA.popularLocations.map((loc, idx) => (
                      <View key={idx} style={styles.locationStatRow}>
                        <MapPin size={16} color="#38BDF8" />
                        <Text style={styles.locName}>{loc.city}</Text>
                        <Text style={styles.locVol}>{loc.volume} of Platform Volume</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.analyticsCard}>
                    <Text style={styles.analyticsCardTitle}>Fleet Verification Health</Text>
                    <View style={styles.healthStats}>
                      <Text style={styles.healthStatLine}>• Average Approval Time: <Text style={{ color: '#10B981', fontWeight: '700' }}>4.2 Hours</Text></Text>
                      <Text style={styles.healthStatLine}>• First-Time Pass Rate: <Text style={{ color: '#38BDF8', fontWeight: '700' }}>82.4%</Text></Text>
                      <Text style={styles.healthStatLine}>• Document Rejection Rate: <Text style={{ color: '#F59E0B', fontWeight: '700' }}>14.1% (Mostly expired PUC)</Text></Text>
                      <Text style={styles.healthStatLine}>• Flagged Fraud Attempts: <Text style={{ color: '#EF4444', fontWeight: '700' }}>3 Cases Blocked</Text></Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* 3. VERIFICATION MANAGEMENT: OWNER VERIFICATION */}
            {activeTab === 'owner-verification' && (
              <View style={styles.sectionWrapper}>
                <View style={styles.headingBlock}>
                  <Text style={styles.pageMainTitle}>Owner Verification Management</Text>
                  <Text style={styles.pageSubTitle}>
                    Screen and verify identity documents, proof of residential address, and ownership authorizations of motorcycle hosts.
                  </Text>
                </View>

                {/* Filters & Search Row */}
                <View style={styles.filterBar}>
                  <View style={styles.filterPillsRow}>
                    {['All', 'Approved', 'Pending', 'Needs Correction', 'Suspended'].map((st) => (
                      <TouchableOpacity
                        key={st}
                        style={[styles.filterPill, ownerFilterStatus === st && styles.filterPillActive]}
                        onPress={() => setOwnerFilterStatus(st)}
                      >
                        <Text style={[styles.filterPillText, ownerFilterStatus === st && styles.filterPillTextActive]}>
                          {st}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Owner Table */}
                <View style={styles.tableCard}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ minWidth: 860 }}>
                      <View style={styles.tableRowHeader}>
                        <Text style={[styles.th, { width: 110 }]}>Owner ID</Text>
                        <Text style={[styles.th, { width: 180 }]}>Owner Name</Text>
                        <Text style={[styles.th, { width: 150 }]}>Mobile Number</Text>
                        <Text style={[styles.th, { width: 180 }]}>Email</Text>
                        <Text style={[styles.th, { width: 140 }]}>Identity KYC</Text>
                        <Text style={[styles.th, { width: 120 }]}>Status</Text>
                        <Text style={[styles.th, { width: 110, textAlign: 'right' }]}>Action</Text>
                      </View>

                      {ownersList
                        .filter((o) => {
                          if (ownerFilterStatus !== 'All' && o.status !== ownerFilterStatus) return false;
                          if (globalSearch && !o.name.toLowerCase().includes(globalSearch.toLowerCase()) && !o.id.toLowerCase().includes(globalSearch.toLowerCase())) return false;
                          return true;
                        })
                        .map((owner) => (
                          <View key={owner.id} style={styles.tableRow}>
                            <Text style={[styles.td, styles.mono, { width: 110 }]}>{owner.id}</Text>
                            <View style={{ width: 180 }}>
                              <Text style={[styles.td, { fontWeight: '700', color: '#FFFFFF' }]}>{owner.name}</Text>
                              <Text style={styles.tdSub}>{owner.city}, {owner.state}</Text>
                            </View>
                            <Text style={[styles.td, { width: 150 }]}>{owner.phone}</Text>
                            <Text style={[styles.td, { width: 180 }]} numberOfLines={1}>{owner.email}</Text>
                            <View style={{ width: 140 }}>
                              <Text style={[styles.statusTextSmall, { color: owner.idStatus === 'Verified' ? '#10B981' : '#F59E0B' }]}>
                                {owner.idStatus}
                              </Text>
                            </View>
                            <View style={{ width: 120 }}>
                              <View style={[styles.statusBadgeSmall, styles[`badge_${(owner.status || '').replace(/\s+/g, '')}`]]}>
                                <Text style={styles.statusBadgeTextSmall}>{owner.status}</Text>
                              </View>
                            </View>
                            <View style={{ width: 110, alignItems: 'flex-end' }}>
                              <TouchableOpacity
                                style={styles.actionBtnPrimary}
                                onPress={() => setSelectedOwnerForView(owner)}
                              >
                                <Text style={styles.actionBtnPrimaryText}>View Details</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            )}

            {/* 4. VERIFICATION MANAGEMENT: BIKE / RC VERIFICATION */}
            {activeTab === 'bike-verification' && (
              <View style={styles.sectionWrapper}>
                <View style={styles.headingBlock}>
                  <View style={styles.heroBadgeRow}>
                    <Text style={styles.pageMainTitle}>Bike & RC Verification</Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{bikesList.length} Vehicles</Text>
                    </View>
                  </View>
                  <Text style={styles.pageSubTitle}>
                    Comprehensive 2-column compliance review: Check Registration Certificate (RC), Comprehensive Insurance, PUC certificates, and chassis alignment against owner declarations.
                  </Text>
                </View>

                {/* Filter Row */}
                <View style={styles.filterBar}>
                  <View style={styles.filterPillsRow}>
                    {['All', 'Pending Verification', 'Approved', 'Needs Correction', 'Suspended'].map((st) => (
                      <TouchableOpacity
                        key={st}
                        style={[styles.filterPill, bikeFilterStatus === st && styles.filterPillActive]}
                        onPress={() => setBikeFilterStatus(st)}
                      >
                        <Text style={[styles.filterPillText, bikeFilterStatus === st && styles.filterPillTextActive]}>
                          {st}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Table containing all required columns */}
                <View style={styles.tableCard}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ minWidth: 980 }}>
                      <View style={styles.tableRowHeader}>
                        <Text style={[styles.th, { width: 110 }]}>Bike ID</Text>
                        <Text style={[styles.th, { width: 160 }]}>Owner Name</Text>
                        <Text style={[styles.th, { width: 200 }]}>Brand & Model</Text>
                        <Text style={[styles.th, { width: 140 }]}>Registration No</Text>
                        <Text style={[styles.th, { width: 110 }]}>RC Status</Text>
                        <Text style={[styles.th, { width: 110 }]}>Insurance</Text>
                        <Text style={[styles.th, { width: 90 }]}>PUC</Text>
                        <Text style={[styles.th, { width: 130 }]}>Listing Status</Text>
                        <Text style={[styles.th, { width: 110, textAlign: 'right' }]}>Action</Text>
                      </View>

                      {bikesList
                        .filter((b) => {
                          if (bikeFilterStatus !== 'All' && b.status !== bikeFilterStatus) return false;
                          if (globalSearch && !b.model.toLowerCase().includes(globalSearch.toLowerCase()) && !b.registrationNumber.toLowerCase().includes(globalSearch.toLowerCase()) && !b.ownerName.toLowerCase().includes(globalSearch.toLowerCase())) return false;
                          return true;
                        })
                        .map((b) => (
                          <View key={b.id} style={styles.tableRow}>
                            <Text style={[styles.td, styles.mono, { width: 110 }]}>{b.id}</Text>
                            <Text style={[styles.td, { width: 160, fontWeight: '700', color: '#FFFFFF' }]}>
                              {b.ownerName}
                            </Text>
                            <View style={{ width: 200 }}>
                              <Text style={[styles.td, { color: '#FFFFFF', fontWeight: '600' }]}>{b.brand} {b.model}</Text>
                              <Text style={styles.tdSub}>{b.category} ({b.year})</Text>
                            </View>
                            <Text style={[styles.td, styles.monoBold, { width: 140 }]}>{b.registrationNumber}</Text>
                            <View style={{ width: 110 }}>
                              <Text style={[styles.statusTextSmall, { color: b.rcStatus === 'Verified' ? '#10B981' : '#F59E0B' }]}>
                                {b.rcStatus || 'Pending'}
                              </Text>
                            </View>
                            <View style={{ width: 110 }}>
                              <Text style={[styles.statusTextSmall, { color: b.insuranceStatus === 'Verified' ? '#10B981' : '#F59E0B' }]}>
                                {b.insuranceStatus || 'Pending'}
                              </Text>
                            </View>
                            <View style={{ width: 90 }}>
                              <Text style={[styles.statusTextSmall, { color: b.pucStatus === 'Verified' ? '#10B981' : '#F59E0B' }]}>
                                {b.pucStatus || 'Pending'}
                              </Text>
                            </View>
                            <View style={{ width: 130 }}>
                              <View style={[styles.statusBadgeSmall, styles[`badge_${(b.status || '').replace(/\s+/g, '')}`]]}>
                                <Text style={styles.statusBadgeTextSmall}>{b.status}</Text>
                              </View>
                            </View>
                            <View style={{ width: 110, alignItems: 'flex-end' }}>
                              <TouchableOpacity
                                style={styles.actionBtnPrimary}
                                onPress={() => setSelectedBikeForReview(b)}
                              >
                                <Text style={styles.actionBtnPrimaryText}>Review Bike</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            )}

            {/* 5. VERIFICATION MANAGEMENT: RENTER VERIFICATION */}
            {activeTab === 'renter-verification' && (
              <View style={styles.sectionWrapper}>
                <View style={styles.headingBlock}>
                  <Text style={styles.pageMainTitle}>Renter & Driver Licence Verification</Text>
                  <Text style={styles.pageSubTitle}>
                    Screen and verify driving licence validity, permitted vehicle class (MCWG vs MCWOG), and rider safety compliance.
                  </Text>
                </View>

                {/* Filter row */}
                <View style={styles.filterBar}>
                  <View style={styles.filterPillsRow}>
                    {['All', 'Approved', 'Pending', 'Needs Correction'].map((st) => (
                      <TouchableOpacity
                        key={st}
                        style={[styles.filterPill, renterFilterStatus === st && styles.filterPillActive]}
                        onPress={() => setRenterFilterStatus(st)}
                      >
                        <Text style={[styles.filterPillText, renterFilterStatus === st && styles.filterPillTextActive]}>
                          {st}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.tableCard}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ minWidth: 920 }}>
                      <View style={styles.tableRowHeader}>
                        <Text style={[styles.th, { width: 100 }]}>Renter ID</Text>
                        <Text style={[styles.th, { width: 180 }]}>Full Name</Text>
                        <Text style={[styles.th, { width: 140 }]}>Mobile Number</Text>
                        <Text style={[styles.th, { width: 120 }]}>DL Status</Text>
                        <Text style={[styles.th, { width: 130 }]}>Licence Expiry</Text>
                        <Text style={[styles.th, { width: 160 }]}>Vehicle Class</Text>
                        <Text style={[styles.th, { width: 120 }]}>Status</Text>
                        <Text style={[styles.th, { width: 110, textAlign: 'right' }]}>Action</Text>
                      </View>

                      {rentersList
                        .filter((r) => {
                          if (renterFilterStatus !== 'All' && r.verificationStatus !== renterFilterStatus) return false;
                          if (globalSearch && !r.name.toLowerCase().includes(globalSearch.toLowerCase()) && !r.id.toLowerCase().includes(globalSearch.toLowerCase())) return false;
                          return true;
                        })
                        .map((renter) => (
                          <View key={renter.id} style={styles.tableRow}>
                            <Text style={[styles.td, styles.mono, { width: 100 }]}>{renter.id}</Text>
                            <View style={{ width: 180 }}>
                              <Text style={[styles.td, { fontWeight: '700', color: '#FFFFFF' }]}>{renter.name}</Text>
                              <Text style={styles.tdSub}>{renter.city}</Text>
                            </View>
                            <Text style={[styles.td, { width: 140 }]}>{renter.phone}</Text>
                            <View style={{ width: 120 }}>
                              <Text style={[styles.statusTextSmall, { color: renter.dlStatus === 'Verified' ? '#10B981' : '#F59E0B' }]}>
                                {renter.dlStatus}
                              </Text>
                            </View>
                            <Text style={[styles.td, { width: 130 }]}>{renter.dlExpiry || '—'}</Text>
                            <Text style={[styles.td, { width: 160, color: '#38BDF8', fontWeight: '600' }]} numberOfLines={1}>
                              {renter.vehicleClass}
                            </Text>
                            <View style={{ width: 120 }}>
                              <View style={[styles.statusBadgeSmall, styles[`badge_${(renter.verificationStatus || '').replace(/\s+/g, '')}`]]}>
                                <Text style={styles.statusBadgeTextSmall}>{renter.verificationStatus}</Text>
                              </View>
                            </View>
                            <View style={{ width: 110, alignItems: 'flex-end' }}>
                              <TouchableOpacity
                                style={styles.actionBtnPrimary}
                                onPress={() => setSelectedRenterForView(renter)}
                              >
                                <Text style={styles.actionBtnPrimaryText}>View Profile</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            )}

            {/* 6. MARKETPLACE MANAGEMENT: MANAGE BIKE LISTINGS */}
            {activeTab === 'bike-listings' && (
              <View style={styles.sectionWrapper}>
                <View style={styles.headingBlock}>
                  <View style={styles.heroBadgeRow}>
                    <Text style={styles.pageMainTitle}>Manage Bike Listings</Text>
                    <TouchableOpacity
                      style={styles.headerActionBtn}
                      onPress={() => navigation?.navigate('RentBike')}
                    >
                      <Plus size={15} color="#FFFFFF" />
                      <Text style={styles.headerActionBtnText}>Add New Listing</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.pageSubTitle}>
                    Edit pricing, update rental rules, publish, suspend, or archive vehicles in the marketplace directory.
                  </Text>
                </View>

                {/* Listings Grid / Table */}
                <View style={styles.tableCard}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ minWidth: 980 }}>
                      <View style={styles.tableRowHeader}>
                        <Text style={[styles.th, { width: 70 }]}>Photo</Text>
                        <Text style={[styles.th, { width: 100 }]}>Bike ID</Text>
                        <Text style={[styles.th, { width: 180 }]}>Model</Text>
                        <Text style={[styles.th, { width: 150 }]}>Owner Name</Text>
                        <Text style={[styles.th, { width: 130 }]}>Registration</Text>
                        <Text style={[styles.th, { width: 120 }]}>Price/Day</Text>
                        <Text style={[styles.th, { width: 120 }]}>Status</Text>
                        <Text style={[styles.th, { width: 140, textAlign: 'right' }]}>Actions</Text>
                      </View>

                      {bikesList.map((bike) => (
                        <View key={bike.id} style={styles.tableRow}>
                          <View style={{ width: 70 }}>
                            <Image
                              source={{ uri: bike.images?.front || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=200' }}
                              style={styles.tableThumb}
                            />
                          </View>
                          <Text style={[styles.td, styles.mono, { width: 100 }]}>{bike.id}</Text>
                          <View style={{ width: 180 }}>
                            <Text style={[styles.td, { fontWeight: '700', color: '#FFFFFF' }]}>{bike.brand} {bike.model}</Text>
                            <Text style={styles.tdSub}>{bike.category}</Text>
                          </View>
                          <Text style={[styles.td, { width: 150 }]}>{bike.ownerName}</Text>
                          <Text style={[styles.td, styles.monoBold, { width: 130 }]}>{bike.registrationNumber}</Text>
                          <Text style={[styles.td, { width: 120, color: '#10B981', fontWeight: '800' }]}>
                            ₹{bike.dailyPrice || 1500}/d
                          </Text>
                          <View style={{ width: 120 }}>
                            <View style={[styles.statusBadgeSmall, styles[`badge_${(bike.status || '').replace(/\s+/g, '')}`]]}>
                              <Text style={styles.statusBadgeTextSmall}>{bike.status}</Text>
                            </View>
                          </View>
                          <View style={{ width: 140, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
                            <TouchableOpacity
                              style={styles.iconActionBtn}
                              onPress={() => setSelectedBikeForReview(bike)}
                              accessibilityLabel="Review Compliance"
                            >
                              <Eye size={14} color="#38BDF8" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.iconActionBtn}
                              onPress={() => setSelectedBikeForEdit(bike)}
                              accessibilityLabel="Edit Listing"
                            >
                              <Edit size={14} color="#10B981" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            )}

            {/* 7. MARKETPLACE MANAGEMENT: MANAGE BOOKINGS */}
            {activeTab === 'bookings' && (
              <View style={styles.sectionWrapper}>
                <View style={styles.headingBlock}>
                  <Text style={styles.pageMainTitle}>Manage Bookings</Text>
                  <Text style={styles.pageSubTitle}>
                    Audit active rental contracts, pickup/return inspection checklists, and security deposit escrow settlements.
                  </Text>
                </View>

                {/* Status Filters */}
                <View style={styles.filterBar}>
                  <View style={styles.filterPillsRow}>
                    {['All', 'Active', 'Upcoming', 'Completed', 'Disputed', 'Cancelled'].map((st) => (
                      <TouchableOpacity
                        key={st}
                        style={[styles.filterPill, bookingFilterStatus === st && styles.filterPillActive]}
                        onPress={() => setBookingFilterStatus(st)}
                      >
                        <Text style={[styles.filterPillText, bookingFilterStatus === st && styles.filterPillTextActive]}>
                          {st}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.tableCard}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ minWidth: 960 }}>
                      <View style={styles.tableRowHeader}>
                        <Text style={[styles.th, { width: 100 }]}>Booking ID</Text>
                        <Text style={[styles.th, { width: 180 }]}>Bike</Text>
                        <Text style={[styles.th, { width: 150 }]}>Owner</Text>
                        <Text style={[styles.th, { width: 150 }]}>Renter</Text>
                        <Text style={[styles.th, { width: 130 }]}>Dates</Text>
                        <Text style={[styles.th, { width: 110 }]}>Total Rent</Text>
                        <Text style={[styles.th, { width: 110 }]}>Status</Text>
                        <Text style={[styles.th, { width: 100, textAlign: 'right' }]}>Action</Text>
                      </View>

                      {bookingsList
                        .filter((bk) => {
                          if (bookingFilterStatus !== 'All' && bk.bookingStatus !== bookingFilterStatus) return false;
                          return true;
                        })
                        .map((b) => (
                          <View key={b.id} style={styles.tableRow}>
                            <Text style={[styles.td, styles.mono, { width: 100 }]}>#{b.id}</Text>
                            <View style={{ width: 180 }}>
                              <Text style={[styles.td, { fontWeight: '700', color: '#FFFFFF' }]}>{b.bikeName}</Text>
                              <Text style={styles.tdSub}>{b.bikeRegNo}</Text>
                            </View>
                            <Text style={[styles.td, { width: 150 }]}>{b.ownerName}</Text>
                            <Text style={[styles.td, { width: 150 }]}>{b.renterName}</Text>
                            <View style={{ width: 130 }}>
                              <Text style={styles.td}>{b.pickupDate}</Text>
                              <Text style={styles.tdSub}>to {b.returnDate}</Text>
                            </View>
                            <Text style={[styles.td, { width: 110, fontWeight: '700', color: '#10B981' }]}>
                              ₹{b.rentalTotal}
                            </Text>
                            <View style={{ width: 110 }}>
                              <View style={[styles.statusBadgeSmall, styles[`status_${(b.bookingStatus || '').replace(/\s+/g, '')}`]]}>
                                <Text style={styles.statusBadgeTextSmall}>{b.bookingStatus}</Text>
                              </View>
                            </View>
                            <View style={{ width: 100, alignItems: 'flex-end' }}>
                              <TouchableOpacity
                                style={styles.actionBtnPrimary}
                                onPress={() => setSelectedBookingForView(b)}
                              >
                                <Text style={styles.actionBtnPrimaryText}>Inspect</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            )}

            {/* 8. OPERATIONS & FINANCE: PAYMENTS & DEPOSITS */}
            {activeTab === 'payments' && (
              <View style={styles.sectionWrapper}>
                <View style={styles.headingBlock}>
                  <Text style={styles.pageMainTitle}>Payments & Security Deposits</Text>
                  <Text style={styles.pageSubTitle}>
                    Track platform transactions, escrow deposit holds, owner payouts, and refund settlements.
                  </Text>
                </View>

                {/* Financial KPI Summary Cards */}
                <View style={styles.statsCardsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Gross Booking Volume (GMV)</Text>
                    <Text style={[styles.statVal, { color: '#FFFFFF' }]}>₹64,85,000</Text>
                    <Text style={styles.statSub}>Total customer payments</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Platform Commissions (10%)</Text>
                    <Text style={[styles.statVal, { color: '#38BDF8' }]}>₹6,48,500</Text>
                    <Text style={styles.statSub}>Platform net earnings</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Deposits Held in Escrow</Text>
                    <Text style={[styles.statVal, { color: '#F59E0B' }]}>₹48,500</Text>
                    <Text style={styles.statSub}>14 Active trips</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Pending Owner Payouts</Text>
                    <Text style={[styles.statVal, { color: '#10B981' }]}>₹18,420</Text>
                    <Text style={styles.statSub}>Auto-clearing in 24 hrs</Text>
                  </View>
                </View>

                <View style={styles.tableCard}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ minWidth: 940 }}>
                      <View style={styles.tableRowHeader}>
                        <Text style={[styles.th, { width: 110 }]}>Transaction ID</Text>
                        <Text style={[styles.th, { width: 100 }]}>Booking ID</Text>
                        <Text style={[styles.th, { width: 160 }]}>Renter</Text>
                        <Text style={[styles.th, { width: 160 }]}>Owner</Text>
                        <Text style={[styles.th, { width: 120 }]}>Booking Total</Text>
                        <Text style={[styles.th, { width: 110 }]}>Platform (10%)</Text>
                        <Text style={[styles.th, { width: 110 }]}>Deposit</Text>
                        <Text style={[styles.th, { width: 110 }]}>Status</Text>
                      </View>

                      {transactionsList.map((t) => (
                        <View key={t.id} style={styles.tableRow}>
                          <Text style={[styles.td, styles.mono, { width: 110 }]}>{t.id}</Text>
                          <Text style={[styles.td, styles.mono, { width: 100 }]}>{t.bookingId}</Text>
                          <Text style={[styles.td, { width: 160 }]}>{t.renterName}</Text>
                          <Text style={[styles.td, { width: 160 }]}>{t.ownerName}</Text>
                          <Text style={[styles.td, { width: 120, fontWeight: '700', color: '#FFFFFF' }]}>₹{t.bookingAmount}</Text>
                          <Text style={[styles.td, { width: 110, color: '#38BDF8' }]}>₹{t.platformCommission}</Text>
                          <Text style={[styles.td, { width: 110, color: '#F59E0B' }]}>₹{t.securityDeposit}</Text>
                          <View style={{ width: 110 }}>
                            <Text style={[styles.statusTextSmall, { color: t.status === 'Successful' ? '#10B981' : '#F59E0B' }]}>
                              {t.status}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            )}

            {/* 9. OPERATIONS & FINANCE: COMPLAINTS & SECURITY REPORTS */}
            {activeTab === 'complaints' && (
              <View style={styles.sectionWrapper}>
                <View style={styles.headingBlock}>
                  <Text style={styles.pageMainTitle}>Complaints & Incident Security Reports</Text>
                  <Text style={styles.pageSubTitle}>
                    Investigate bike damage, late vehicle returns, document discrepancies, theft warnings, and rider dispute resolution.
                  </Text>
                </View>

                {/* Complaint Cards List */}
                <View style={styles.complaintCardsList}>
                  {complaintsList.map((c) => (
                    <View key={c.id} style={styles.incidentCard}>
                      <View style={styles.incidentTop}>
                        <View style={styles.incidentTopLeft}>
                          <View style={[styles.priorityBadge, styles[`priority_${c.priority}`]]}>
                            <Text style={styles.priorityText}>{c.priority} Priority</Text>
                          </View>
                          <Text style={styles.incidentCategory}>{c.category}</Text>
                        </View>
                        <Text style={styles.incidentId}>#{c.id}</Text>
                      </View>

                      <Text style={styles.incidentDesc}>{c.description}</Text>

                      <View style={styles.incidentBottomBar}>
                        <View style={styles.incidentMeta}>
                          <Text style={styles.incMetaItem}>Booking: <Text style={styles.mono}>{c.bookingId}</Text></Text>
                          <Text style={styles.incMetaItem}>Reported By: {c.reporter}</Text>
                          <Text style={styles.incMetaItem}>Admin: {c.assignedAdmin}</Text>
                        </View>

                        <View style={styles.incidentActions}>
                          <View style={[styles.statusBadgeSmall, c.status === 'Resolved' ? styles.badge_Approved : styles.badge_Pending]}>
                            <Text style={styles.statusBadgeTextSmall}>{c.status}</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.openReportBtn}
                            onPress={() => setSelectedComplaintForView(c)}
                          >
                            <Text style={styles.openReportBtnText}>Open Report</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 10. SYSTEM: USERS */}
            {activeTab === 'users' && (
              <View style={styles.sectionWrapper}>
                <View style={styles.headingBlock}>
                  <Text style={styles.pageMainTitle}>Platform Users Directory</Text>
                  <Text style={styles.pageSubTitle}>
                    Unified directory of registered owners, verified renters, and administrative personnel.
                  </Text>
                </View>

                <View style={styles.tableCard}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ minWidth: 840 }}>
                      <View style={styles.tableRowHeader}>
                        <Text style={[styles.th, { width: 120 }]}>User ID</Text>
                        <Text style={[styles.th, { width: 180 }]}>Full Name</Text>
                        <Text style={[styles.th, { width: 130 }]}>Role</Text>
                        <Text style={[styles.th, { width: 160 }]}>Contact Phone</Text>
                        <Text style={[styles.th, { width: 140 }]}>KYC Verification</Text>
                        <Text style={[styles.th, { width: 110, textAlign: 'right' }]}>Account State</Text>
                      </View>

                      {[...ownersList.map((o) => ({ ...o, role: 'Bike Owner' })), ...rentersList.map((r) => ({ ...r, role: 'Renter' }))].map((u) => (
                        <View key={u.id} style={styles.tableRow}>
                          <Text style={[styles.td, styles.mono, { width: 120 }]}>{u.id}</Text>
                          <Text style={[styles.td, { width: 180, fontWeight: '700', color: '#FFFFFF' }]}>{u.name}</Text>
                          <View style={{ width: 130 }}>
                            <View style={[styles.roleBadgePill, u.role === 'Bike Owner' ? styles.roleOwner : styles.roleRenter]}>
                              <Text style={styles.roleBadgeText}>{u.role}</Text>
                            </View>
                          </View>
                          <Text style={[styles.td, { width: 160 }]}>{u.phone}</Text>
                          <Text style={[styles.td, { width: 140, color: '#10B981' }]}>Verified</Text>
                          <View style={{ width: 110, alignItems: 'flex-end' }}>
                            <Text style={[styles.statusTextSmall, { color: '#10B981' }]}>Active</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            )}

            {/* 11. SYSTEM: LOCATIONS */}
            {activeTab === 'locations' && (
              <View style={styles.sectionWrapper}>
                <View style={styles.headingBlock}>
                  <Text style={styles.pageMainTitle}>Manage Pickup Locations & Hubs</Text>
                  <Text style={styles.pageSubTitle}>
                    Zonal operating cities, active pickup stations, and vehicle fleet distribution.
                  </Text>
                </View>

                <View style={styles.locationsGrid}>
                  {locationsList.map((loc) => (
                    <View key={loc.id} style={styles.locationCard}>
                      <View style={styles.locCardTop}>
                        <View style={styles.locIconBox}>
                          <MapPin size={20} color="#38BDF8" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.locCityName}>{loc.city}</Text>
                          <Text style={styles.locActiveBikes}>{loc.activeBikes} Active Vehicles</Text>
                        </View>
                        <View style={styles.statusBadgeSmall}>
                          <Text style={styles.statusBadgeTextSmall}>{loc.status}</Text>
                        </View>
                      </View>

                      <View style={styles.hubsList}>
                        <Text style={styles.hubsListTitle}>Zonal Hubs:</Text>
                        {loc.hubs.map((hub, i) => (
                          <Text key={i} style={styles.hubItemText}>• {hub}</Text>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 12. SYSTEM: RENTAL AGREEMENTS */}
            {activeTab === 'agreements' && (
              <View style={styles.sectionWrapper}>
                <View style={styles.headingBlock}>
                  <Text style={styles.pageMainTitle}>Digital Rental Agreements</Text>
                  <Text style={styles.pageSubTitle}>
                    Standardized legally binding tri-party electronic agreements between Vehicle Owner, Renter, and Platform.
                  </Text>
                </View>

                <View style={styles.agreementTemplateCard}>
                  <View style={styles.agreementHeader}>
                    <FileText size={22} color="#38BDF8" />
                    <View>
                      <Text style={styles.agreementTitle}>Motorcycle Sharing Master Contract (v3.2)</Text>
                      <Text style={styles.agreementSub}>Standard Digital E-Sign Master Template</Text>
                    </View>
                  </View>

                  <View style={styles.agreementClauses}>
                    <Text style={styles.clause}>1. Authorized Licensed Operation: Strictly riders holding valid non-expired Indian MCWG licences.</Text>
                    <Text style={styles.clause}>2. Escrow Deposit: Security deposits remain secured in platform escrow until both parties sign the digital return handover check.</Text>
                    <Text style={styles.clause}>3. Telematics & Geo-fencing: Real-time speed and boundary tracking enabled for rider and vehicle safety.</Text>
                    <Text style={styles.clause}>4. Insurance & Liability: Third-party damage covered as per Motor Vehicle Act guidelines; accidental own damage deductible borne by renter.</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 13. SYSTEM: SETTINGS */}
            {activeTab === 'settings' && (
              <View style={styles.sectionWrapper}>
                <View style={styles.headingBlock}>
                  <Text style={styles.pageMainTitle}>Platform Settings & Rules</Text>
                  <Text style={styles.pageSubTitle}>
                    Configure platform commission rates, document verification thresholds, and platform operations parameters.
                  </Text>
                </View>

                <View style={styles.settingsFormCard}>
                  <View style={styles.settingField}>
                    <Text style={styles.settingLabel}>Platform Commission Rate (%)</Text>
                    <TextInput
                      style={styles.settingInput}
                      value={String(settingsData.platformCommissionPercent)}
                      onChangeText={(val) => setSettingsData({ ...settingsData, platformCommissionPercent: val })}
                      keyboardType="number-pad"
                    />
                  </View>

                  <View style={styles.settingField}>
                    <Text style={styles.settingLabel}>Security Deposit Policy</Text>
                    <TextInput
                      style={styles.settingInput}
                      value={settingsData.securityDepositRequirement}
                      onChangeText={(val) => setSettingsData({ ...settingsData, securityDepositRequirement: val })}
                    />
                  </View>

                  <View style={styles.settingField}>
                    <Text style={styles.settingLabel}>KYC Verification Strictness</Text>
                    <TextInput
                      style={styles.settingInput}
                      value={settingsData.idVerificationLevel}
                      onChangeText={(val) => setSettingsData({ ...settingsData, idVerificationLevel: val })}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.saveSettingsBtn}
                    onPress={() => {
                      if (onShowToast) onShowToast('Platform settings saved successfully.');
                    }}
                  >
                    <Check size={16} color="#FFFFFF" />
                    <Text style={styles.saveSettingsBtnText}>Save Platform Rules</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Verification & Action Modals */}
      <BikeVerificationModal
        visible={!!selectedBikeForReview}
        bike={selectedBikeForReview}
        onClose={() => setSelectedBikeForReview(null)}
        onUpdateStatus={handleUpdateBikeStatus}
        onShowToast={onShowToast}
      />

      <OwnerDetailsModal
        visible={!!selectedOwnerForView}
        owner={selectedOwnerForView}
        onClose={() => setSelectedOwnerForView(null)}
        onUpdateStatus={handleUpdateOwnerStatus}
        onShowToast={onShowToast}
      />

      <RenterDetailsModal
        visible={!!selectedRenterForView}
        renter={selectedRenterForView}
        onClose={() => setSelectedRenterForView(null)}
        onUpdateStatus={handleUpdateRenterStatus}
        onShowToast={onShowToast}
      />

      <BookingDetailsModal
        visible={!!selectedBookingForView}
        booking={selectedBookingForView}
        onClose={() => setSelectedBookingForView(null)}
        onUpdateStatus={handleUpdateBookingStatus}
        onShowToast={onShowToast}
      />

      <ComplaintDetailsModal
        visible={!!selectedComplaintForView}
        complaint={selectedComplaintForView}
        onClose={() => setSelectedComplaintForView(null)}
        onSaveResolution={handleSaveComplaintResolution}
        onShowToast={onShowToast}
      />

      <EditBikeListingModal
        visible={!!selectedBikeForEdit}
        bike={selectedBikeForEdit}
        onClose={() => setSelectedBikeForEdit(null)}
        onSave={handleSaveEditedBike}
        onDelete={handleDeleteBike}
        onShowToast={onShowToast}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: '#070E1B',
    display: 'flex',
    flexDirection: 'column',
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
  },
  reopenSidebarTab: {
    position: 'absolute',
    top: 16,
    left: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0D1526',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderTopRightRadius: RADIUS.full,
    borderBottomRightRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 7,
    shadowColor: '#0284C7',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  reopenSidebarTabText: {
    color: '#38BDF8',
    fontSize: 11.5,
    fontWeight: '800',
  },
  contentScroll: {
    flex: 1,
    backgroundColor: '#070E1B',
  },
  contentInner: {
    padding: 24,
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
  },
  sectionWrapper: {
    gap: 20,
  },
  headingBlock: {
    marginBottom: 4,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  pageMainTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  pageSubTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginTop: 4,
  },
  countBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  headerActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  statsCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: '#0D1526',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 16,
  },
  statCardHighlight: {
    borderColor: 'rgba(56, 189, 248, 0.35)',
    backgroundColor: '#0F1A2E',
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.textMuted,
    maxWidth: 160,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  quickActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    backgroundColor: '#0D1526',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  quickActionsLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    marginRight: 4,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  quickActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  chartsGrid: {
    flexDirection: width < 900 ? 'column' : 'row',
    gap: 16,
  },
  chartCard: {
    flex: 1,
    backgroundColor: '#0D1526',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 18,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chartSubtitle: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  chartTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  chartTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
  },
  barGraphArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  barValText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  barFill: {
    width: 24,
    backgroundColor: '#0284C7',
    borderRadius: 4,
  },
  barMonthLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  categoryBarsList: {
    gap: 14,
  },
  catBarRow: {
    gap: 4,
  },
  catBarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catBarName: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  catBarCount: {
    fontSize: 11.5,
    color: '#38BDF8',
    fontWeight: '700',
  },
  catBarTrack: {
    height: 6,
    backgroundColor: COLORS.bgDark,
    borderRadius: 3,
    overflow: 'hidden',
  },
  catBarFill: {
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 3,
  },
  tablesRow: {
    flexDirection: width < 900 ? 'column' : 'row',
    gap: 16,
  },
  halfTableCard: {
    flex: 1,
    backgroundColor: '#0D1526',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 16,
  },
  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tableCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  miniList: {
    gap: 10,
  },
  miniListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#070E1B',
    padding: 10,
    borderRadius: RADIUS.md,
  },
  miniItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  miniItemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  miniItemSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  reviewBtnSmall: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  reviewBtnText: {
    color: '#38BDF8',
    fontSize: 11.5,
    fontWeight: '700',
  },
  filterBar: {
    marginBottom: 4,
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    backgroundColor: '#0D1526',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  filterPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  tableCard: {
    backgroundColor: '#0D1526',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  tableRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCard,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  th: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  td: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
  },
  tdSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#38BDF8',
  },
  monoBold: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#38BDF8',
    fontWeight: '700',
  },
  tableThumb: {
    width: 44,
    height: 34,
    borderRadius: RADIUS.sm,
    resizeMode: 'cover',
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  badge_Approved: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  badge_Pending: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  badge_PendingVerification: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  badge_NeedsCorrection: { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
  badge_Suspended: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
  statusBadgeTextSmall: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#38BDF8',
  },
  statusTextSmall: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  actionBtnPrimary: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  actionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  iconActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  complaintCardsList: {
    gap: 12,
  },
  incidentCard: {
    backgroundColor: '#0D1526',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 16,
    gap: 10,
  },
  incidentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incidentTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  priority_Critical: { backgroundColor: '#EF4444' },
  priority_High: { backgroundColor: '#F59E0B' },
  priority_Medium: { backgroundColor: '#0284C7' },
  priority_Low: { backgroundColor: '#64748B' },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  incidentCategory: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  incidentId: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#38BDF8',
    fontSize: 12,
  },
  incidentDesc: {
    fontSize: 12.5,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  incidentBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
    paddingTop: 10,
  },
  incidentMeta: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  incMetaItem: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  incidentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  openReportBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  openReportBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  locationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  locationCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#0D1526',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 16,
    gap: 10,
  },
  locCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locCityName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  locActiveBikes: {
    fontSize: 11.5,
    color: COLORS.textMuted,
  },
  hubsList: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
    paddingTop: 8,
  },
  hubsListTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  hubItemText: {
    fontSize: 11.5,
    color: '#E2E8F0',
  },
  roleBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  roleOwner: { backgroundColor: 'rgba(2, 132, 199, 0.2)' },
  roleRenter: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  roleBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#38BDF8',
  },
  agreementTemplateCard: {
    backgroundColor: '#0D1526',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 18,
    gap: 14,
  },
  agreementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  agreementTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  agreementSub: {
    fontSize: 11.5,
    color: COLORS.textMuted,
  },
  agreementClauses: {
    gap: 8,
    backgroundColor: '#070E1B',
    padding: 14,
    borderRadius: RADIUS.md,
  },
  clause: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  settingsFormCard: {
    backgroundColor: '#0D1526',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 20,
    gap: 14,
    maxWidth: 580,
  },
  settingField: {
    gap: 6,
  },
  settingLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  settingInput: {
    backgroundColor: '#070E1B',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.md,
    padding: 10,
    color: '#FFFFFF',
    fontSize: 13,
  },
  saveSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    marginTop: 8,
  },
  saveSettingsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  analyticsGrid: {
    flexDirection: width < 800 ? 'column' : 'row',
    gap: 16,
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: '#0D1526',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 18,
    gap: 12,
  },
  analyticsCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  locationStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  locVol: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '700',
  },
  healthStats: {
    gap: 8,
  },
  healthStatLine: {
    fontSize: 12.5,
    color: '#CBD5E1',
    lineHeight: 18,
  },
});

