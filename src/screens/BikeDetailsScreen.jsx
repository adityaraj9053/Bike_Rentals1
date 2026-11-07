import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import {
  Star,
  CheckCircle2,
  ShieldCheck,
  MessageCircle,
  ArrowRight,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import { BIKES_DATA } from '../data/bikes';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import WhatsAppIcon from '../components/WhatsAppIcon';

export default function BikeDetailsScreen({
  route,
  navigation,
  onStartBooking,
  onOpenWhatsApp,
  onOpenBookModal,
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const bike = route?.params?.bike || BIKES_DATA[0];
  const gallery = bike.gallerySources || [bike.imageSource];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const similarBikes = BIKES_DATA.filter((b) => b.id !== bike.id).slice(0, 3);

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centerContainer}>
          {/* ================= GALLERY SHOWCASE CARD ================= */}
          <View style={[styles.galleryCard, isMobile ? styles.galleryCardMobile : styles.galleryCardDesktop]}>
            <Image
              source={gallery[activeImageIndex] || bike.imageSource}
              style={styles.mainImage}
              resizeMode="contain"
            />

            {/* Badges on image */}
            <View style={styles.imageBadges}>
              <View style={styles.badgePrimary}>
                <Sparkles size={12} color="#38BDF8" style={{ marginRight: 4 }} />
                <Text style={styles.badgePrimaryText}>{bike.badge || 'PREMIUM'}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      bike.statusBadge === 'LIMITED'
                        ? 'rgba(245, 158, 11, 0.95)'
                        : 'rgba(16, 185, 129, 0.95)',
                  },
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {bike.statusBadge || 'AVAILABLE'}
                </Text>
              </View>
            </View>
          </View>

          {/* Thumbnail Selector */}
          {gallery.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbsScroll}
            >
              {gallery.map((img, idx) => {
                const isActive = activeImageIndex === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.thumbWrap, isActive && styles.thumbWrapActive]}
                    onPress={() => setActiveImageIndex(idx)}
                    activeOpacity={0.8}
                  >
                    <Image source={img} style={styles.thumbImage} resizeMode="cover" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* ================= BIKE OVERVIEW ================= */}
          <View style={styles.infoSection}>
            <View style={styles.titlePriceRow}>
              <View style={{ flex: 1, minWidth: 240 }}>
                <Text style={styles.bikeName}>{bike.name}</Text>
                <Text style={styles.bikeModel}>{bike.model}</Text>

                {/* Rating */}
                <View style={styles.ratingRow}>
                  <View style={styles.stars}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} color="#FBBF24" fill="#FBBF24" />
                    ))}
                  </View>
                  <Text style={styles.ratingScore}>{bike.rating}</Text>
                  <Text style={styles.reviewCount}>({bike.reviewsCount} verified reviews)</Text>
                </View>
              </View>

              {/* Price Tag */}
              <View style={styles.priceBox}>
                <View style={styles.priceAmountRow}>
                  <Text style={styles.priceNumber}>₹{(bike.pricePerDay ?? bike.dailyPrice ?? 1500).toLocaleString()}</Text>
                  <Text style={styles.perDayLabel}>/ day</Text>
                </View>
                <View style={styles.depositPill}>
                  <Text style={styles.depositPillText}>
                    Refundable Deposit: ₹{(bike.deposit ?? bike.securityDeposit ?? 3000).toLocaleString()}*
                  </Text>
                </View>
              </View>
            </View>

            {/* Availability Banner */}
            <View style={styles.availabilityBanner}>
              <CheckCircle2 size={15} color="#10B981" />
              <Text style={styles.availabilityText}>
                {bike.availability || 'Available for immediate pickup at Central Hub'}
              </Text>
            </View>

            {/* Clean, Proportionate Action Buttons */}
            <View style={[styles.actionsRow, isMobile && styles.actionsRowMobile]}>
              <TouchableOpacity
                style={styles.bookBtn}
                onPress={() => {
                  if (onStartBooking) {
                    onStartBooking(bike);
                  } else if (onOpenBookModal) {
                    onOpenBookModal(bike);
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.bookBtnText}>Book This Bike</Text>
                <ArrowRight size={15} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.whatsAppBtn}
                onPress={() => onOpenWhatsApp(bike)}
                activeOpacity={0.8}
              >
                <WhatsAppIcon size={14} color="#FFFFFF" withCircle circleSize={24} />
                <Text style={styles.whatsAppBtnText}>Enquire on WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ================= SPECS GRID ================= */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technical Specifications</Text>

            <View style={styles.specsGrid}>
              {[
                { key: 'Displacement', val: bike.specs?.displacement || '350 CC' },
                { key: 'Max Power', val: bike.specs?.power || '20.2 BHP' },
                { key: 'Transmission', val: bike.specs?.transmission || 'Manual' },
                { key: 'Fuel System', val: bike.specs?.fuelSystem || 'EFI' },
                { key: 'Tank Capacity', val: bike.specs?.tankCapacity || '15 L' },
                { key: 'Mileage', val: bike.specs?.mileage || '40 kmpl' },
                { key: 'Braking', val: bike.specs?.braking || 'Dual ABS' },
                { key: 'Kerb Weight', val: bike.specs?.weight || '190 kg' },
              ].map((s, idx) => (
                <View key={idx} style={[styles.specBox, isMobile ? styles.specBoxMobile : styles.specBoxDesktop]}>
                  <Text style={styles.specKey}>{s.key}</Text>
                  <Text style={styles.specVal}>{s.val}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ================= FEATURES LIST ================= */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Features & Highlights</Text>
            <View style={styles.featuresGrid}>
              {(bike.features || []).map((feat, idx) => (
                <View key={idx} style={[styles.featureCard, isMobile ? styles.featureCardMobile : styles.featureCardDesktop]}>
                  <CheckCircle2 size={16} color="#38BDF8" />
                  <Text style={styles.featureText}>{feat}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ================= RENTAL GUIDELINES ================= */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rental Terms & Requirements</Text>

            <View style={[styles.guidelinesList, !isMobile && styles.guidelinesListDesktop]}>
              <View style={[styles.guidelineCard, !isMobile && styles.guidelineCardDesktop]}>
                <View style={styles.guidelineHeader}>
                  <Clock size={16} color="#38BDF8" />
                  <Text style={styles.guidelineTitle}>Rental Duration</Text>
                </View>
                <Text style={styles.guidelineDesc}>
                  {bike.guidelines?.duration || 'Minimum rental duration is 24 hours. Flexible hourly extension available.'}
                </Text>
              </View>

              <View style={[styles.guidelineCard, !isMobile && styles.guidelineCardDesktop]}>
                <View style={styles.guidelineHeader}>
                  <FileText size={16} color="#38BDF8" />
                  <Text style={styles.guidelineTitle}>Required Documents</Text>
                </View>
                <Text style={styles.guidelineDesc}>
                  {bike.guidelines?.documents || 'Valid Driving Licence & Government ID (Aadhaar/Voter ID) required at pickup.'}
                </Text>
              </View>

              <View style={[styles.guidelineCard, !isMobile && styles.guidelineCardDesktop]}>
                <View style={styles.guidelineHeader}>
                  <ShieldCheck size={16} color="#38BDF8" />
                  <Text style={styles.guidelineTitle}>Security Deposit Policy</Text>
                </View>
                <Text style={styles.guidelineDesc}>
                  {bike.guidelines?.deposit || `Refundable security deposit of ₹${(bike.deposit ?? bike.securityDeposit ?? 3000).toLocaleString()}* refunded within 2 hours of return.`}
                </Text>
              </View>
            </View>
          </View>

          {/* ================= SIMILAR BIKES ================= */}
          <View style={[styles.section, { marginBottom: 30 }]}>
            <Text style={styles.sectionTitle}>You Might Also Like</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similarScroll}
            >
              {similarBikes.map((sb) => (
                <TouchableOpacity
                  key={sb.id}
                  style={[styles.similarCard, SHADOWS.card]}
                  onPress={() => navigation.push('BikeDetails', { bike: sb })}
                  activeOpacity={0.8}
                >
                  <Image source={sb.imageSource} style={styles.similarImg} />
                  <View style={styles.similarContent}>
                    <Text style={styles.similarName} numberOfLines={1}>
                      {sb.name}
                    </Text>
                    <Text style={styles.similarPrice}>
                      ₹{(sb.pricePerDay ?? sb.dailyPrice ?? 1500).toLocaleString()}/day
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* ================= STICKY BOTTOM BAR ================= */}
      <View style={styles.stickyBottomBar}>
        <View style={styles.stickyInner}>
          <View>
            <Text style={styles.stickyPriceLabel}>Daily Rental</Text>
            <Text style={styles.stickyPriceValue}>
              ₹{(bike.pricePerDay ?? bike.dailyPrice ?? 1500).toLocaleString()}
              <Text style={{ fontSize: 12, color: COLORS.textMuted }}> /day</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.stickyBookBtn}
            onPress={() => {
              if (onStartBooking) {
                onStartBooking(bike);
              } else if (onOpenBookModal) {
                onOpenBookModal(bike);
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.stickyBookBtnText}>Book This Bike</Text>
            <ArrowRight size={15} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  centerContainer: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  galleryCard: {
    width: '100%',
    backgroundColor: '#0F1A2E',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  galleryCardDesktop: {
    height: 380,
  },
  galleryCardMobile: {
    height: 250,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imageBadges: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badgePrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 20, 38, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgePrimaryText: {
    color: '#38BDF8',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  thumbsScroll: {
    paddingVertical: 12,
    gap: 10,
  },
  thumbWrap: {
    width: 64,
    height: 48,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#1E293B',
  },
  thumbWrapActive: {
    borderColor: '#38BDF8',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  titlePriceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 14,
  },
  bikeName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  bikeModel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingScore: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewCount: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  priceBox: {
    alignItems: 'flex-start',
    gap: 6,
  },
  priceAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#38BDF8',
  },
  perDayLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  depositPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  depositPillText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  availabilityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 16,
  },
  availabilityText: {
    color: '#10B981',
    fontSize: 12.5,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    maxWidth: 460,
  },
  actionsRowMobile: {
    maxWidth: '100%',
  },
  bookBtn: {
    flex: 1.2,
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  whatsAppBtn: {
    flex: 1.1,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  whatsAppBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  specBox: {
    backgroundColor: '#0F1A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  specBoxDesktop: {
    width: '23.5%',
    minWidth: 140,
    flexGrow: 1,
  },
  specBoxMobile: {
    width: '48%',
    flexGrow: 1,
  },
  specKey: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 3,
  },
  specVal: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  featureCard: {
    backgroundColor: '#0F1A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureCardDesktop: {
    width: '49%',
    flexGrow: 1,
  },
  featureCardMobile: {
    width: '100%',
  },
  featureText: {
    fontSize: 13,
    color: '#CBD5E1',
    flex: 1,
  },
  guidelinesList: {
    gap: 10,
  },
  guidelinesListDesktop: {
    flexDirection: 'row',
  },
  guidelineCard: {
    backgroundColor: '#0F1A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.md,
    padding: 14,
    gap: 6,
  },
  guidelineCardDesktop: {
    flex: 1,
  },
  guidelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  guidelineTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  guidelineDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  similarScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  similarCard: {
    width: 170,
    backgroundColor: '#0F1A2E',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  similarImg: {
    width: '100%',
    height: 105,
    backgroundColor: '#1E293B',
  },
  similarContent: {
    padding: 10,
  },
  similarName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  similarPrice: {
    fontSize: 11.5,
    color: '#38BDF8',
    fontWeight: '700',
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 15, 29, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 100,
  },
  stickyInner: {
    width: '100%',
    maxWidth: 1080,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stickyPriceLabel: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  stickyPriceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#38BDF8',
  },
  stickyBookBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  stickyBookBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
