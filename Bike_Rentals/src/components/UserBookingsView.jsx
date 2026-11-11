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
  Lock,
  ExternalLink,
} from 'lucide-react-native';
import { COLORS, RADIUS } from '../theme/colors';
import { bookingsAPI, authStorage } from '../services/api';
import DocumentPreviewModal from './DocumentPreviewModal';

export default function UserBookingsView({
  user,
  onSignOut,
  onShowToast,
  onExploreBikes,
}) {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isDocModalVisible, setIsDocModalVisible] = useState(false);

  const fetchUserBookings = async () => {
    setLoading(true);
    try {
      const activeUser = user || authStorage.getUser() || {};
      const userEmail = (activeUser.email || '').trim().toLowerCase();
      const userId = activeUser.id || activeUser._id;

      // Request server bookings with explicit email & userId query parameters as fallbacks
      const res = await bookingsAPI.getMyBookings({
        email: userEmail,
        userId: userId,
      }).catch((err) => {
        console.warn('[UserBookingsView] API notice:', err.message);
        return null;
      });

      const serverList = (res && Array.isArray(res.data)) ? res.data : [];

      // Also read locally cached bookings
      let cachedList = [];
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const cached = window.localStorage.getItem('my_user_bookings');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              cachedList = parsed;
            }
          }
        } catch (e) {}
      }

      // Merge serverList and cachedList without duplicates
      const combined = [...serverList];
      const seenCodes = new Set(
        serverList.map((b) => String(b.bookingCode || b._id || b.id || '').trim().toUpperCase())
      );

      for (const item of cachedList) {
        const itemCode = String(item.bookingCode || item._id || item.id || '').trim().toUpperCase();
        if (itemCode && !seenCodes.has(itemCode)) {
          // If active user email is known, only include if matches or if no email filter
          const itemEmail = (item.riderDetails?.email || item.email || '').trim().toLowerCase();
          if (!userEmail || !itemEmail || itemEmail === userEmail) {
            combined.push(item);
            seenCodes.add(itemCode);
          }
        }
      }

      setBookings(combined);

      // Refresh cache with active merged list
      if (typeof window !== 'undefined' && window.localStorage && combined.length > 0) {
        window.localStorage.setItem('my_user_bookings', JSON.stringify(combined));
      }
    } catch (err) {
      console.warn('[UserBookingsView] Error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBookings();
    // Refresh periodically
    const interval = setInterval(fetchUserBookings, 30000);
    return () => clearInterval(interval);
  }, [user?.email, user?.id, user?._id]);

  const handleOpenDoc = (title, docUrl, fallbackName) => {
    if (!docUrl) {
      if (onShowToast) onShowToast('Document preview not available.');
      return;
    }
    const finalUrl =
      typeof docUrl === 'string'
        ? docUrl
        : (docUrl.signedUrl || docUrl.fileUrl || docUrl.url || docUrl.key || docUrl.fileName);
    const fileName =
      (typeof docUrl === 'object' && (docUrl.fileName || docUrl.name)) ||
      (typeof docUrl === 'string' ? docUrl : fallbackName);

    setSelectedDoc({
      title,
      url: finalUrl || fileName,
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

  const isExpiredBooking = (booking) => {
    if (booking.isExpired || booking.bookingStatus === 'COMPLETED' || booking.bookingStatus === 'CANCELLED') {
      return true;
    }
    const returnTime = new Date(booking.returnDatetime || booking.returnDate).getTime();
    if (isNaN(returnTime)) return false;
    return Date.now() >= returnTime;
  };

  const getTimeRemaining = (returnDateStr) => {
    if (!returnDateStr) return '';
    const diffMs = new Date(returnDateStr).getTime() - Date.now();
    if (diffMs <= 0) return 'Rental Completed';
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
      <View style={styles.userProfileHeader}>
        <View style={styles.userAvatarCircle}>
          <Text style={styles.userAvatarInitial}>
            {(user?.name || user?.email || 'U').trim().charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <View style={styles.verifiedTag}>
            <ShieldCheck size={11} color="#34D399" />
            <Text style={styles.verifiedTagText}>18+ Verified Rider</Text>
          </View>
          <Text style={styles.userNameText}>{user?.name || 'Rider'}</Text>
          <Text style={styles.userEmailText}>{user?.email}</Text>
          {user?.phone ? (
            <Text style={styles.userPhoneText}>
              {user.countryCode || '+91'} {user.phone}
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.refreshIconBtn}
          onPress={fetchUserBookings}
          activeOpacity={0.7}
          accessibilityLabel="Refresh Bookings"
        >
          <RefreshCw size={15} color="#38BDF8" />
        </TouchableOpacity>
      </View>

      {/* Prominent "My Bookings" Section Header */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionTitle}>My Bookings</Text>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{bookings.length} Booked</Text>
          </View>
        </View>
      </View>

      {/* Bookings List */}
      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="small" color="#38BDF8" />
          <Text style={styles.loadingText}>Loading your booked motorcycles...</Text>
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Bike size={28} color="#38BDF8" />
          </View>
          <Text style={styles.emptyTitle}>No Bookings Yet</Text>
          <Text style={styles.emptySub}>
            You haven't booked any motorcycle yet. Explore our verified fleet and rent your favorite machine!
          </Text>
          {onExploreBikes ? (
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={onExploreBikes}
              activeOpacity={0.8}
            >
              <Bike size={14} color="#FFFFFF" />
              <Text style={styles.exploreBtnText}>Explore Fleet</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <View style={styles.bookingsList}>
          {bookings.map((b, idx) => {
            const bike = b.bikeId || b.bike || {};
            const bikeName = bike.name || `${bike.brand || ''} ${bike.model || ''}` || 'Motorcycle';
            const bikeImg =
              bike.images?.front ||
              bike.photos?.front ||
              bike.image ||
              'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800';

            const expired = isExpiredBooking(b);
            const timeRemaining = getTimeRemaining(b.returnDatetime);

            // Official Bike Documents
            const bikeDocs = b.bikeDocuments || bike.documents || b.documents || {};
            const regNo = bike.registrationNumber || bike._id || bike.id || '';
            const rcDoc = bikeDocs.rcSmartCardUrl || bikeDocs.rc || (regNo ? `/api/documents/file/${encodeURIComponent(regNo)}/rc` : null);
            const pucDoc = bikeDocs.pucCertificateUrl || bikeDocs.puc || (regNo ? `/api/documents/file/${encodeURIComponent(regNo)}/puc` : null);
            const insDoc = bikeDocs.insurancePolicyUrl || bikeDocs.insurance || bikeDocs.insurancePolicy || (regNo ? `/api/documents/file/${encodeURIComponent(regNo)}/insurance` : null);

            return (
              <View key={b._id || b.id || `my-booking-${idx}`} style={styles.bookingCard}>
                {/* Card Top Strip */}
                <View style={styles.cardHeader}>
                  <Text style={styles.bookingCodeText}>
                    Booking #{b.bookingCode || b.id || `RDE-${idx + 1}`}
                  </Text>
                  {expired ? (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedBadgeText}>RENTAL COMPLETED</Text>
                    </View>
                  ) : (
                    <View style={styles.activeBadge}>
                      <View style={styles.pulseDot} />
                      <Text style={styles.activeBadgeText}>ACTIVE RENTAL</Text>
                    </View>
                  )}
                </View>

                {/* Bike Card Row */}
                <View style={styles.bikeRow}>
                  <Image source={{ uri: bikeImg }} style={styles.bikeThumb} />
                  <View style={styles.bikeInfo}>
                    <Text style={styles.bikeName} numberOfLines={1}>
                      {bikeName}
                    </Text>
                    <Text style={styles.bikeReg}>
                      Reg No: {bike.registrationNumber || 'MH 02 FJ 9042'}
                    </Text>
                    <Text style={styles.pricingText}>
                      Total: ₹{(b.pricing?.totalPayable || b.pricing?.rentalTotal || 3000).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                {/* Rental Timelines */}
                <View style={styles.timelineBox}>
                  <Text style={styles.boxTitle}>Rental Timelines</Text>
                  <View style={styles.timelineRow}>
                    <View style={styles.timelineCol}>
                      <Text style={styles.timelineLabel}>Pickup / Start</Text>
                      <Text style={styles.timelineValue}>{formatTimeline(b.pickupDatetime)}</Text>
                    </View>
                    <View style={styles.timelineCol}>
                      <Text style={styles.timelineLabel}>Return Date</Text>
                      <Text style={styles.timelineValue}>{formatTimeline(b.returnDatetime)}</Text>
                    </View>
                  </View>
                  {!expired && (
                    <Text style={styles.timelineRemainingNote}>
                      ⏱️ {timeRemaining}
                    </Text>
                  )}
                </View>

                {/* Bike's Official Documents Section with Auto-Deletion */}
                <View style={styles.officialDocsBox}>
                  <View style={styles.officialDocsHeader}>
                    <Text style={styles.boxTitle}>Bike Official Documents</Text>
                    {expired && (
                      <View style={styles.purgedPill}>
                        <Lock size={10} color="#F43F5E" />
                        <Text style={styles.purgedPillText}>Auto-Deleted</Text>
                      </View>
                    )}
                  </View>

                  {expired ? (
                    /* Auto-Deletion Notice: Documents deleted after return date/time passed */
                    <View style={styles.autoDeletedCard}>
                      <View style={styles.lockIconCircle}>
                        <Lock size={15} color="#F43F5E" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.autoDeletedTitle}>
                          Official Documents Auto-Deleted
                        </Text>
                        <Text style={styles.autoDeletedSub}>
                          The bike's official RC, PUC, and Insurance documents have been securely purged from your view because the returning date and time has passed.
                        </Text>
                      </View>
                    </View>
                  ) : (
                    /* Active Rental: User can view RC, Insurance & PUC documents */
                    <View style={styles.docsGrid}>
                      {/* RC Document */}
                      <View style={styles.docItemCard}>
                        <View style={styles.docHeaderRow}>
                          <FileText size={14} color="#38BDF8" />
                          <Text style={styles.docItemTitle} numberOfLines={1}>RC Smart Card</Text>
                        </View>
                        <Text style={styles.docItemSub} numberOfLines={1}>Registration</Text>
                        <TouchableOpacity
                          style={styles.viewDocBtn}
                          onPress={() =>
                            handleOpenDoc(
                              `${bikeName} - RC Smart Card`,
                              rcDoc,
                              `RC_${bike.registrationNumber || 'Vehicle'}.pdf`
                            )
                          }
                          activeOpacity={0.8}
                        >
                          <Eye size={12} color="#38BDF8" />
                          <Text style={styles.viewDocBtnText}>View RC</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Insurance Certificate */}
                      <View style={styles.docItemCard}>
                        <View style={styles.docHeaderRow}>
                          <ShieldCheck size={14} color="#38BDF8" />
                          <Text style={styles.docItemTitle} numberOfLines={1}>Insurance</Text>
                        </View>
                        <Text style={styles.docItemSub} numberOfLines={1}>Policy Certificate</Text>
                        <TouchableOpacity
                          style={styles.viewDocBtn}
                          onPress={() =>
                            handleOpenDoc(
                              `${bikeName} - Insurance Policy`,
                              insDoc,
                              `Insurance_${bike.registrationNumber || 'Vehicle'}.pdf`
                            )
                          }
                          activeOpacity={0.8}
                        >
                          <Eye size={12} color="#38BDF8" />
                          <Text style={styles.viewDocBtnText}>View Policy</Text>
                        </TouchableOpacity>
                      </View>

                      {/* PUC Certificate */}
                      <View style={styles.docItemCard}>
                        <View style={styles.docHeaderRow}>
                          <FileText size={14} color="#38BDF8" />
                          <Text style={styles.docItemTitle} numberOfLines={1}>PUC</Text>
                        </View>
                        <Text style={styles.docItemSub} numberOfLines={1}>Pollution Valid</Text>
                        <TouchableOpacity
                          style={styles.viewDocBtn}
                          onPress={() =>
                            handleOpenDoc(
                              `${bikeName} - PUC Certificate`,
                              pucDoc,
                              `PUC_${bike.registrationNumber || 'Vehicle'}.pdf`
                            )
                          }
                          activeOpacity={0.8}
                        >
                          <Eye size={12} color="#38BDF8" />
                          <Text style={styles.viewDocBtnText}>View PUC</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Footer Sign Out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut} activeOpacity={0.8}>
        <LogOut size={15} color="#EF4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
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
  userProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    marginBottom: 16,
  },
  userAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  userAvatarInitial: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  userInfo: {
    flex: 1,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  verifiedTagText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
  },
  userNameText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  userEmailText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  userPhoneText: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 1,
  },
  refreshIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
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
  countPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  countPillText: {
    color: '#38BDF8',
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
    marginBottom: 14,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  bookingCodeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  activeBadge: {
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
  activeBadgeText: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  completedBadge: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedBadgeText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
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
  timelineBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: RADIUS.sm,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  boxTitle: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timelineCol: {
    flex: 1,
  },
  timelineLabel: {
    color: '#94A3B8',
    fontSize: 10,
  },
  timelineValue: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  timelineRemainingNote: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  officialDocsBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: RADIUS.sm,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  officialDocsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  purgedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  purgedPillText: {
    color: '#F43F5E',
    fontSize: 10,
    fontWeight: '700',
  },
  autoDeletedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  lockIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  autoDeletedTitle: {
    color: '#FDA4AF',
    fontSize: 12,
    fontWeight: '700',
  },
  autoDeletedSub: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  docsGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  docItemCard: {
    flex: 1,
    minWidth: 95,
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    padding: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  docHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  docItemTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  docItemSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
    marginBottom: 8,
  },
  viewDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
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

