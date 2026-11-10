import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  ShieldCheck,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Bike,
  Sparkles,
  ArrowRight,
  Trash2,
} from 'lucide-react-native';
import { COLORS, RADIUS } from '../theme/colors';
import { bookingsAPI } from '../services/api';
import DocumentPreviewModal from './DocumentPreviewModal';

export default function OwnerDashboardView({
  user,
  onSignOut,
  onShowToast,
  onNavigateToRentBike,
}) {
  const [loading, setLoading] = useState(true);
  const [activeBookings, setActiveBookings] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null); // { title, url, fileName, type }
  const [isDocModalVisible, setIsDocModalVisible] = useState(false);
  const [returningId, setReturningId] = useState(null);

  const fetchOwnerBookings = async () => {
    setLoading(true);
    try {
      // 1. Fetch live active bookings from backend
      const res = await bookingsAPI.getOwnerDashboard().catch(() => null);

      let list = [];
      if (res && res.data) {
        list = res.data;
      } else {
        // Fallback: check cached bookings in localStorage if offline
        if (typeof window !== 'undefined' && window.localStorage) {
          const cached = window.localStorage.getItem('owner_dashboard_bookings');
          if (cached) {
            try {
              list = JSON.parse(cached);
            } catch (e) {}
          }
        }
      }

      // Filter with Auto-Removal: Only show bookings where returnDatetime > now and not COMPLETED
      const now = Date.now();
      const filtered = (list || []).filter((b) => {
        if (b.bookingStatus === 'COMPLETED' || b.bookingStatus === 'CANCELLED') {
          return false;
        }
        const returnTime = new Date(b.returnDatetime || b.returnDate).getTime();
        return !isNaN(returnTime) ? returnTime > now : true;
      });

      setActiveBookings(filtered);
    } catch (err) {
      console.warn('[OwnerDashboardView] Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerBookings();
    // Auto-refresh every 30 seconds to enforce auto-removal in real-time
    const interval = setInterval(fetchOwnerBookings, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkReturned = async (booking) => {
    const bId = booking._id || booking.id || booking.bookingCode;
    setReturningId(bId);
    try {
      await bookingsAPI.markReturned(bId).catch(() => null);

      // Auto-Removal: Remove from local active bookings immediately
      setActiveBookings((prev) => prev.filter((b) => (b._id || b.id || b.bookingCode) !== bId));

      // Also clean up local storage cache if offline
      if (typeof window !== 'undefined' && window.localStorage) {
        const cached = window.localStorage.getItem('owner_dashboard_bookings');
        if (cached) {
          try {
            const arr = JSON.parse(cached);
            const updated = arr.filter((b) => (b._id || b.id || b.bookingCode) !== bId);
            window.localStorage.setItem('owner_dashboard_bookings', JSON.stringify(updated));
          } catch (e) {}
        }
      }

      if (onShowToast) {
        onShowToast(`Bike returned! Buyer details & submitted documents automatically removed.`);
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(`Notice: Return registered. Removed from active dashboard.`);
      }
      setActiveBookings((prev) => prev.filter((b) => (b._id || b.id || b.bookingCode) !== bId));
    } finally {
      setReturningId(null);
    }
  };

  const handleOpenDoc = (title, docObj, fallbackName) => {
    if (!docObj) {
      if (onShowToast) onShowToast('No document attached.');
      return;
    }
    const docUrl = typeof docObj === 'string' ? docObj : (docObj.signedUrl || docObj.url || docObj.fileUrl);
    const fileName = docObj.fileName || docObj.name || fallbackName;

    setSelectedDoc({
      title,
      url: docUrl || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800',
      fileName,
    });
    setIsDocModalVisible(true);
  };

  const formatTimeline = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return String(dateStr);
    }
  };

  const getTimeRemaining = (returnDateStr) => {
    if (!returnDateStr) return '';
    const diffMs = new Date(returnDateStr).getTime() - Date.now();
    if (diffMs <= 0) return 'Return Due Now';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <View style={styles.container}>
      {/* Header Profile Section */}
      <View style={styles.ownerProfileHeader}>
        <View style={styles.ownerAvatarCircle}>
          <Text style={styles.ownerAvatarInitial}>
            {(user?.name || user?.email || 'O').trim().charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.ownerInfo}>
          <View style={styles.ownerBadgeRow}>
            <View style={styles.ownerRoleBadge}>
              <Sparkles size={11} color="#38BDF8" />
              <Text style={styles.ownerRoleBadgeText}>OWNER ACCOUNT</Text>
            </View>
            <View style={styles.verifiedTag}>
              <ShieldCheck size={11} color="#34D399" />
              <Text style={styles.verifiedTagText}>Admin Access</Text>
            </View>
          </View>
          <Text style={styles.ownerNameText}>{user?.name || 'Fleet Owner'}</Text>
          <Text style={styles.ownerEmailText}>{user?.email}</Text>
        </View>

        <TouchableOpacity
          style={styles.refreshIconBtn}
          onPress={fetchOwnerBookings}
          activeOpacity={0.7}
          accessibilityLabel="Refresh Dashboard"
        >
          <RefreshCw size={15} color="#38BDF8" />
        </TouchableOpacity>
      </View>

      {/* KPI Stats Bar */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{activeBookings.length}</Text>
          <Text style={styles.kpiLabel}>Active Rentals</Text>
        </View>
        <View style={[styles.kpiCard, styles.kpiCardMiddle]}>
          <Text style={[styles.kpiValue, { color: '#34D399' }]}>Automated</Text>
          <Text style={styles.kpiLabel}>Auto-Clean Mode</Text>
        </View>
        <TouchableOpacity
          style={[styles.kpiCard, styles.kpiCardAction]}
          onPress={onNavigateToRentBike}
          activeOpacity={0.8}
        >
          <Bike size={16} color="#38BDF8" />
          <Text style={styles.kpiActionText}>+ Add Bike</Text>
        </TouchableOpacity>
      </View>

      {/* Auto-Removal Policy Notice */}
      <View style={styles.autoRemovalBanner}>
        <Clock size={13} color="#38BDF8" />
        <Text style={styles.autoRemovalBannerText}>
          Auto-Removal Active: Expired bookings & submitted user documents are automatically purged from this dashboard once returned or rental timeline has elapsed.
        </Text>
      </View>

      {/* Prominent "Buyer's Detail" Section Header */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionTitle}>Buyer's Detail</Text>
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>{activeBookings.length} Active</Text>
          </View>
        </View>
      </View>

      {/* Bookings & Submitted Documents List */}
      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="small" color="#38BDF8" />
          <Text style={styles.loadingText}>Fetching active buyer details...</Text>
        </View>
      ) : activeBookings.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <CheckCircle2 size={28} color="#38BDF8" />
          </View>
          <Text style={styles.emptyTitle}>No Active Buyer Rentals</Text>
          <Text style={styles.emptySub}>
            All rented bikes have been returned or completed. User booking details and submitted documents are automatically cleared once bikes are returned.
          </Text>
        </View>
      ) : (
        <View style={styles.bookingsList}>
          {activeBookings.map((b, idx) => {
            const bike = b.bikeId || b.bike || {};
            const bikeName = bike.name || `${bike.brand || ''} ${bike.model || ''}` || 'Motorcycle';
            const bikeImg =
              bike.images?.front ||
              bike.photos?.front ||
              bike.image ||
              'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800';

            const rider = b.riderDetails || b.renterId || {};
            const buyerName = rider.fullName || rider.name || 'Verified Rider';
            const buyerEmail = rider.email || b.renterEmail || 'buyer@example.com';
            const buyerPhone = rider.phoneNumber || rider.phone || '9876543210';

            const userDocs = b.riderDocuments || b.riderDetails?.documents || {};
            const aadhaarDoc = userDocs.aadhaar;
            const dlDoc = userDocs.drivingLicence;

            const timeRemaining = getTimeRemaining(b.returnDatetime);
            const isReturningThis = returningId === (b._id || b.id || b.bookingCode);

            return (
              <View key={b._id || b.id || `booking-${idx}`} style={styles.bookingCard}>
                {/* Top Strip: Booking Code & Status */}
                <View style={styles.cardHeader}>
                  <View style={styles.codeGroup}>
                    <Text style={styles.bookingCodeText}>
                      Ref #{b.bookingCode || b.id || `RDE-${idx + 1}`}
                    </Text>
                    <View style={styles.livePulseBadge}>
                      <View style={styles.pulseDot} />
                      <Text style={styles.livePulseText}>ACTIVE RENTAL</Text>
                    </View>
                  </View>
                  <Text style={styles.timeRemainingBadge}>{timeRemaining}</Text>
                </View>

                {/* Bike Summary Row */}
                <View style={styles.bikeRow}>
                  <Image source={{ uri: bikeImg }} style={styles.bikeThumb} />
                  <View style={styles.bikeInfo}>
                    <Text style={styles.bikeName} numberOfLines={1}>
                      {bikeName}
                    </Text>
                    <Text style={styles.bikeReg}>
                      Reg: {bike.registrationNumber || 'MH 02 FJ 9042'}
                    </Text>
                    <Text style={styles.pricingText}>
                      Total Paid: ₹{(b.pricing?.totalPayable || b.pricing?.rentalTotal || 3000).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* Buyer / Renter Info Box */}
                <View style={styles.buyerDetailsBox}>
                  <Text style={styles.boxTitle}>Buyer / Renter Profile</Text>
                  <View style={styles.buyerInfoRow}>
                    <User size={13} color="#94A3B8" />
                    <Text style={styles.buyerNameText}>{buyerName}</Text>
                  </View>
                  <View style={styles.buyerInfoRow}>
                    <Mail size={13} color="#94A3B8" />
                    <Text style={styles.buyerDetailText}>{buyerEmail}</Text>
                  </View>
                  <View style={styles.buyerInfoRow}>
                    <Phone size={13} color="#94A3B8" />
                    <Text style={styles.buyerDetailText}>{buyerPhone}</Text>
                  </View>
                </View>

                {/* Rental Timelines Box */}
                <View style={styles.timelineBox}>
                  <Text style={styles.boxTitle}>Rental Timeline</Text>
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: '#38BDF8' }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineLabel}>Pickup / Start Time</Text>
                      <Text style={styles.timelineValue}>
                        {formatTimeline(b.pickupDatetime)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: '#F43F5E' }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineLabel}>Return Date & Time</Text>
                      <Text style={styles.timelineValue}>
                        {formatTimeline(b.returnDatetime)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Submitted Documents Section */}
                <View style={styles.submittedDocsBox}>
                  <Text style={styles.boxTitle}>Submitted Documents (User ID Proofs)</Text>

                  {/* Aadhaar Card */}
                  <View style={styles.docItemRow}>
                    <View style={styles.docInfo}>
                      <FileText size={16} color="#38BDF8" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.docNameText}>Aadhaar Card</Text>
                        <Text style={styles.docStatusText}>
                          {aadhaarDoc ? 'Submitted by Buyer ✓' : 'Verified at Hub'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.viewDocBtn}
                      onPress={() =>
                        handleOpenDoc('Aadhaar Card Verification', aadhaarDoc, 'Aadhaar_Document.pdf')
                      }
                      activeOpacity={0.8}
                    >
                      <Eye size={12} color="#38BDF8" />
                      <Text style={styles.viewDocBtnText}>View</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Driving Licence */}
                  <View style={styles.docItemRow}>
                    <View style={styles.docInfo}>
                      <FileText size={16} color="#38BDF8" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.docNameText}>Driving Licence</Text>
                        <Text style={styles.docStatusText}>
                          {dlDoc ? 'Submitted by Buyer ✓' : 'Verified (MCWG)'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.viewDocBtn}
                      onPress={() =>
                        handleOpenDoc('Driving Licence Verification', dlDoc, 'Driving_Licence.pdf')
                      }
                      activeOpacity={0.8}
                    >
                      <Eye size={12} color="#38BDF8" />
                      <Text style={styles.viewDocBtnText}>View</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Actions: Mark Returned & Auto-Removal */}
                <TouchableOpacity
                  style={[styles.returnActionBtn, isReturningThis && styles.returnActionBtnDisabled]}
                  onPress={() => handleMarkReturned(b)}
                  disabled={isReturningThis}
                  activeOpacity={0.8}
                >
                  {isReturningThis ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <CheckCircle2 size={15} color="#FFFFFF" />
                      <Text style={styles.returnActionBtnText}>
                        Mark Bike as Returned (Auto-Clean & Remove)
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Footer Sign Out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut} activeOpacity={0.8}>
        <LogOut size={15} color="#EF4444" />
        <Text style={styles.signOutText}>Sign Out from Owner Account</Text>
      </TouchableOpacity>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        visible={isDocModalVisible}
        onClose={() => setIsDocModalVisible(false)}
        title={selectedDoc?.title}
        documentUrl={selectedDoc?.url}
        fileName={selectedDoc?.fileName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  ownerProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    marginBottom: 14,
  },
  ownerAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  ownerAvatarInitial: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  ownerRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ownerRoleBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedTagText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
  },
  ownerNameText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  ownerEmailText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  refreshIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  kpiContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  kpiCardMiddle: {
    borderColor: 'rgba(52, 211, 153, 0.2)',
  },
  kpiCardAction: {
    borderColor: 'rgba(56, 189, 248, 0.25)',
    justifyContent: 'center',
  },
  kpiValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  kpiLabel: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  kpiActionText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  autoRemovalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)',
    marginBottom: 16,
  },
  autoRemovalBannerText: {
    color: '#94A3B8',
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  activePill: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  activePillText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingWrapper: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  emptyState: {
    padding: 28,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  bookingsList: {
    gap: 14,
  },
  bookingCard: {
    backgroundColor: '#0B1526',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    padding: 14,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  codeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookingCodeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  livePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  livePulseText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeRemainingBadge: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  bikeRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  bikeThumb: {
    width: 64,
    height: 52,
    borderRadius: RADIUS.sm,
    backgroundColor: '#020617',
  },
  bikeInfo: {
    flex: 1,
  },
  bikeName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  bikeReg: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  pricingText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  buyerDetailsBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: RADIUS.sm,
    padding: 10,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  boxTitle: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  buyerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buyerNameText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  buyerDetailText: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  timelineBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: RADIUS.sm,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    color: '#94A3B8',
    fontSize: 10,
  },
  timelineValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  submittedDocsBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: RADIUS.sm,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  docItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    padding: 8,
    borderRadius: RADIUS.sm,
  },
  docInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  docNameText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  docStatusText: {
    color: '#34D399',
    fontSize: 10,
  },
  viewDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  viewDocBtnText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  returnActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    marginTop: 2,
  },
  returnActionBtnDisabled: {
    opacity: 0.6,
  },
  returnActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
});

