import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Star, Zap, Fuel, Cog, ArrowRight, CheckCircle2, User, FileText } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { useLanguage } from '../i18n/LanguageContext';
import WhatsAppIcon from './WhatsAppIcon';

export default function BikeCard({
  bike,
  currentUser,
  user,
  onSelectBike,
  onOpenBookModal,
  onStartBooking,
  onOpenWhatsApp,
  onOpenBookingDetails,
  style,
  compact = false,
}) {
  const { t, isHindi } = useLanguage();
  if (!bike) return null;

  const activeUser = currentUser || user;
  const currentUserId = activeUser?.id || activeUser?._id;
  const bookedUserId = bike.currentBookedByUserId?._id || bike.currentBookedByUserId;
  const bookedUserEmail = (
    bike.currentBookedByEmail ||
    bike.currentBookingId?.riderDetails?.email ||
    bike.currentBookingId?.renterId?.email
  )?.trim()?.toLowerCase();
  const userEmail = activeUser?.email?.trim()?.toLowerCase();

  const hasActiveBooking = Boolean(
    bike.currentBookingId &&
    (typeof bike.currentBookingId === 'object'
      ? Boolean(bike.currentBookingId._id || Object.keys(bike.currentBookingId).length > 0)
      : Boolean(bike.currentBookingId))
  );

  const isMyBookedBike = Boolean(
    bike.isBooked &&
    hasActiveBooking && (
      (currentUserId && bookedUserId && String(bookedUserId) === String(currentUserId)) ||
      (userEmail && bookedUserEmail && userEmail === bookedUserEmail) ||
      bike.isMyBooking
    )
  );
  const isOwnerViewing = Boolean(activeUser?.role === 'OWNER' && bike.isBooked && hasActiveBooking);

  const price = Number(bike.pricePerDay ?? bike.dailyPrice ?? 0);
  const deposit = Number(bike.deposit ?? bike.securityDeposit ?? 0);
  const bikeName = bike.name || `${bike.brand || ''} ${bike.model || 'Motorcycle'}`.trim();
  const bikeModel = bike.model || '';
  const rating = bike.rating || 4.9;
  const reviewsCount = bike.reviews || bike.reviewsCount || 142;
  const imageSource =
    bike.imageSource ||
    (typeof bike.image === 'string' ? { uri: bike.image } : bike.image) ||
    (bike.photos?.front ? { uri: bike.photos.front } : null) ||
    (bike.images?.front ? { uri: bike.images.front } : null) ||
    (bike.images?.thumbnail ? { uri: bike.images.thumbnail } : null) ||
    require('../assets/hero.png');

  // =========================================================================
  // 1. 🏍️ RENTER WHO BOOKED THIS BIKE: Darkened Card with "BOOKED BY YOU" Badge
  // =========================================================================
  if (isMyBookedBike) {
    return (
      <TouchableOpacity
        style={[styles.card, styles.cardBookedDark, SHADOWS.card, compact && styles.cardCompact, style]}
        onPress={() => onOpenBookingDetails && onOpenBookingDetails(bike.currentBookingId || bike)}
        activeOpacity={0.85}
      >
        <View style={[styles.imageContainer, compact && styles.imageContainerCompact]}>
          <Image source={imageSource} style={[styles.bikeImage, styles.darkenedImage]} resizeMode="cover" />
          <View style={styles.darkDimOverlay} />

          {/* Booked By You Overlay Tag */}
          <View style={styles.bookedBadgeOverlay}>
            <CheckCircle2 size={13} color="#22C55E" />
            <Text style={styles.bookedBadgeText}>
              {isHindi ? 'आपके द्वारा बुक किया गया' : 'BOOKED BY YOU'}
            </Text>
          </View>
        </View>

        <View style={[styles.content, styles.contentDarkBooked, compact && styles.contentCompact]}>
          <View style={styles.titleRow}>
            <Text style={[styles.bikeName, styles.bikeNameDimmed]} numberOfLines={1}>
              {bikeName}
            </Text>
          </View>
          <Text style={[styles.bikeModel, styles.bikeModelDimmed]} numberOfLines={1}>
            {bikeModel}
          </Text>

          <View style={styles.bookedInfoRow}>
            <FileText size={13} color="#38BDF8" />
            <Text style={styles.bookedPromptText} numberOfLines={2}>
              {isHindi
                ? 'अपनी रसीद और पिकअप विवरण देखने के लिए टैप करें'
                : 'Tap to view your booking voucher & pickup details'}
            </Text>
          </View>

          <View style={styles.voucherActionRow}>
            <Text style={styles.voucherActionText}>
              {isHindi ? 'वाउचर देखें' : 'View Voucher'} →
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // =========================================================================
  // 2. 👑 FLEET OWNER VIEWING A BOOKED BIKE: Shows Renter Details & Action
  // =========================================================================
  if (isOwnerViewing) {
    const booking = typeof bike.currentBookingId === 'object' ? bike.currentBookingId : null;
    const renterName =
      booking?.renterId?.fullName ||
      booking?.riderDetails?.fullName ||
      'Active Customer';
    const renterPhone = booking?.renterId?.phoneNumber || booking?.riderDetails?.phoneNumber;

    return (
      <View style={[styles.card, styles.ownerBookedCard, SHADOWS.card, compact && styles.cardCompact, style]}>
        <View style={[styles.imageContainer, compact && styles.imageContainerCompact]}>
          <Image source={imageSource} style={[styles.bikeImage, { opacity: 0.75 }]} resizeMode="cover" />
          <View style={styles.ownerBadgeRow}>
            <View style={styles.ownerBookedTagBox}>
              <Text style={styles.ownerBookedTag}>BOOKED</Text>
            </View>
            <View style={styles.ownerFleetBadge}>
              <Text style={styles.ownerFleetBadgeText}>Fleet Unit</Text>
            </View>
          </View>
        </View>

        <View style={[styles.content, compact && styles.contentCompact]}>
          <Text style={styles.bikeName} numberOfLines={1}>
            {bikeName}
          </Text>
          <Text style={styles.bikeModel} numberOfLines={1}>
            {bikeModel} • Reg: {bike.registrationNumber || 'Fleet Vehicle'}
          </Text>

          {/* Renter Snippet */}
          <View style={styles.renterSnippetBox}>
            <View style={styles.renterSnippetHeader}>
              <User size={12} color="#38BDF8" />
              <Text style={styles.renterSnippetTitle}>Renter:</Text>
              <Text style={styles.renterNameSnippet} numberOfLines={1}>
                {renterName}
              </Text>
            </View>
            {renterPhone ? (
              <Text style={styles.renterPhoneSnippet}>Contact: {renterPhone}</Text>
            ) : null}
          </View>

          {/* Action button for Owner to view customer & booking timeline */}
          <TouchableOpacity
            style={styles.viewRenterBtn}
            onPress={() => onOpenBookingDetails && onOpenBookingDetails(bike.currentBookingId || bike)}
            activeOpacity={0.8}
          >
            <Text style={styles.viewRenterBtnText}>View Customer & Booking Details</Text>
            <ArrowRight size={13} color="#FFFFFF" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // =========================================================================
  // 3. 🏍️ REGULAR AVAILABLE BIKE CARD FOR BROWSING
  // =========================================================================
  const isLimited = bike.statusBadge === 'LIMITED';

  return (
    <View style={[styles.card, SHADOWS.card, compact && styles.cardCompact, style]}>
      {/* Top Image Container */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onSelectBike && onSelectBike(bike)}
        style={[styles.imageContainer, compact && styles.imageContainerCompact]}
      >
        <Image
          source={imageSource}
          style={styles.bikeImage}
          resizeMode="cover"
        />

        {/* Dark elegant gradient vignette */}
        <View style={styles.imageOverlay} />

        {/* Top Floating Badges */}
        <View style={styles.badgeRow}>
          {bike.badge ? (
            <View style={[styles.primaryBadge, compact && styles.badgeCompact]}>
              <Text style={[styles.primaryBadgeText, compact && styles.badgeTextCompact]}>
                {bike.badge}
              </Text>
            </View>
          ) : <View />}

          <View
            style={[
              styles.statusBadge,
              compact && styles.badgeCompact,
              {
                backgroundColor: bike.isBooked
                  ? 'rgba(239, 68, 68, 0.9)'
                  : isLimited
                  ? 'rgba(245, 158, 11, 0.9)'
                  : 'rgba(16, 185, 129, 0.9)',
              },
            ]}
          >
            <Text style={[styles.statusBadgeText, compact && styles.badgeTextCompact]}>
              {bike.isBooked
                ? (isHindi ? 'आरक्षित' : 'RESERVED')
                : isLimited
                ? (isHindi ? 'सीमित' : 'LIMITED')
                : (isHindi ? 'उपलब्ध' : 'AVAILABLE')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Card Content */}
      <View style={[styles.content, compact && styles.contentCompact]}>
        <View style={styles.titleRow}>
          <Text style={[styles.bikeName, compact && styles.bikeNameCompact]} numberOfLines={1}>
            {bikeName}
          </Text>
        </View>

        <Text style={[styles.bikeModel, compact && styles.bikeModelCompact]} numberOfLines={1}>
          {bikeModel}
        </Text>

        {/* Rating and Reviews */}
        <View style={[styles.ratingRow, compact && styles.ratingRowCompact]}>
          <View style={styles.stars}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={compact ? 11 : 13}
                color={COLORS.accentCyan}
                fill={COLORS.accentCyan}
              />
            ))}
          </View>
          <Text style={[styles.ratingText, compact && styles.ratingTextCompact]}>
            {rating}
          </Text>
          <Text style={[styles.reviewCount, compact && styles.reviewCountCompact]}>
            ({reviewsCount})
          </Text>
        </View>

        {/* Technical Specs Tags */}
        <View style={[styles.specsRow, compact && styles.specsRowCompact]}>
          {bike.specs?.displacement ? (
            <View style={[styles.specPill, compact && styles.specPillCompact]}>
              <Zap size={compact ? 10 : 12} color={COLORS.accentCyan} />
              <Text style={[styles.specText, compact && styles.specTextCompact]}>
                {bike.specs.displacement}
              </Text>
            </View>
          ) : null}

          {bike.specs?.transmission ? (
            <View style={[styles.specPill, compact && styles.specPillCompact]}>
              <Cog size={compact ? 10 : 12} color={COLORS.accentCyan} />
              <Text style={[styles.specText, compact && styles.specTextCompact]}>
                {bike.specs.transmission.includes('Auto') ? 'Auto' : 'Manual'}
              </Text>
            </View>
          ) : null}

          {bike.specs?.mileage ? (
            <View style={[styles.specPill, compact && styles.specPillCompact]}>
              <Fuel size={compact ? 10 : 12} color={COLORS.accentCyan} />
              <Text style={[styles.specText, compact && styles.specTextCompact]}>
                {bike.specs.mileage}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Pricing & Booking CTA Footer */}
        <View style={[styles.footerRow, compact && styles.footerRowCompact]}>
          <View style={[styles.priceBlock, compact && styles.priceBlockCompact]}>
            <View style={styles.priceRow}>
              <Text style={[styles.fromLabel, compact && styles.fromLabelCompact]}>
                {t('fleet.from', 'from')}{' '}
              </Text>
              <Text style={[styles.priceValue, compact && styles.priceValueCompact]}>
                ₹{price.toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.perDayLabel, compact && styles.perDayLabelCompact]}>
                {t('fleet.perDay', '/day')}
              </Text>
            </View>
            <Text style={[styles.inrSubtext, compact && styles.inrSubtextCompact]}>
              {isHindi ? 'डिपॉजिट' : 'Deposit'} ₹{deposit.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={styles.actionButtonsRow}>
            {/* Quick WhatsApp Action Button */}
            <TouchableOpacity
              style={styles.cardWhatsAppBtn}
              onPress={() => onOpenWhatsApp && onOpenWhatsApp(bike)}
              activeOpacity={0.8}
              accessibilityLabel="Enquire on WhatsApp"
            >
              <WhatsAppIcon size={14} color="#FFFFFF" withCircle circleSize={28} />
            </TouchableOpacity>

            {/* Book Now Button */}
            <TouchableOpacity
              style={[
                styles.bookBtn,
                compact && styles.bookBtnCompact,
                bike.isBooked && { backgroundColor: '#334155', opacity: 0.8 },
              ]}
              disabled={Boolean(bike.isBooked)}
              onPress={() => {
                if (bike.isBooked) return;
                if (onStartBooking) {
                  onStartBooking(bike);
                } else if (onSelectBike) {
                  onSelectBike(bike);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.bookBtnText, compact && styles.bookBtnTextCompact]}>
                {bike.isBooked ? (isHindi ? 'आरक्षित' : 'Reserved') : t('fleet.bookBtn', 'Book')}
              </Text>
              {!bike.isBooked && (
                <ArrowRight size={compact ? 12 : 13} color="#FFFFFF" strokeWidth={2.2} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    width: '100%',
  },
  cardCompact: {
    width: '100%',
  },
  cardBookedDark: {
    backgroundColor: '#090D14',
    borderColor: 'rgba(34, 197, 94, 0.35)',
    borderWidth: 1.5,
  },
  ownerBookedCard: {
    backgroundColor: '#0A101D',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderWidth: 1.5,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.bgCardAlt,
    position: 'relative',
  },
  imageContainerCompact: {
    height: 160,
  },
  bikeImage: {
    width: '100%',
    height: '100%',
  },
  darkenedImage: {
    opacity: 0.35,
  },
  darkDimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 11, 20, 0.65)',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 11, 20, 0.25)',
  },
  bookedBadgeOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  bookedBadgeText: {
    color: '#22C55E',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ownerBadgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ownerBookedTagBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
  },
  ownerBookedTag: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ownerFleetBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  ownerFleetBadgeText: {
    color: '#38BDF8',
    fontSize: 9.5,
    fontWeight: '700',
  },
  content: {
    padding: 14,
  },
  contentCompact: {
    padding: 10,
  },
  contentDarkBooked: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  bikeName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flex: 1,
  },
  bikeNameDimmed: {
    color: '#E2E8F0',
  },
  bikeNameCompact: {
    fontSize: 14,
  },
  bikeModel: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  bikeModelDimmed: {
    color: '#94A3B8',
    marginBottom: 10,
  },
  bikeModelCompact: {
    fontSize: 11,
    marginBottom: 6,
  },
  bookedInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  bookedPromptText: {
    fontSize: 11,
    color: '#CBD5E1',
    flex: 1,
    lineHeight: 16,
  },
  voucherActionRow: {
    alignItems: 'flex-end',
    paddingTop: 4,
  },
  voucherActionText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  renterSnippetBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  renterSnippetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  renterSnippetTitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  renterNameSnippet: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    flex: 1,
  },
  renterPhoneSnippet: {
    fontSize: 11,
    color: '#38BDF8',
    marginTop: 4,
    marginLeft: 18,
  },
  viewRenterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    borderRadius: RADIUS.full,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  viewRenterBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  badgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  primaryBadge: {
    backgroundColor: 'rgba(11, 20, 38, 0.88)',
    borderWidth: 1,
    borderColor: COLORS.accentCyan,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  primaryBadgeText: {
    color: COLORS.accentCyan,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeTextCompact: {
    fontSize: 8.5,
  },
  statusBadge: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: {
    color: '#050B14',
    fontSize: 9.5,
    fontWeight: '800',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  ratingRowCompact: {
    marginBottom: 6,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: 2,
  },
  ratingTextCompact: {
    fontSize: 10.5,
  },
  reviewCount: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  reviewCountCompact: {
    fontSize: 10,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  specsRowCompact: {
    marginBottom: 8,
    gap: 4,
  },
  specPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  specText: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  specTextCompact: {
    fontSize: 9.5,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
    gap: 8,
  },
  footerRowCompact: {
    paddingTop: 8,
  },
  priceBlock: {
    flex: 1,
  },
  priceBlockCompact: {},
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  fromLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginRight: 2,
  },
  fromLabelCompact: {
    fontSize: 10,
  },
  priceValue: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#38BDF8',
  },
  priceValueCompact: {
    fontSize: 15,
  },
  perDayLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: 1,
  },
  perDayLabelCompact: {
    fontSize: 10,
  },
  inrSubtext: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  inrSubtextCompact: {
    fontSize: 9,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardWhatsAppBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingHorizontal: 13,
    paddingVertical: 6.5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  bookBtnCompact: {
    paddingHorizontal: 10,
    paddingVertical: 5.5,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bookBtnTextCompact: {
    fontSize: 11,
  },
});
