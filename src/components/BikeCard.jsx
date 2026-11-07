import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Star, Zap, Fuel, Cog, ArrowRight } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { useLanguage } from '../i18n/LanguageContext';
import WhatsAppIcon from './WhatsAppIcon';

export default function BikeCard({
  bike,
  onSelectBike,
  onOpenBookModal,
  onStartBooking,
  onOpenWhatsApp,
  style,
  compact = false,
}) {
  const { t, isHindi } = useLanguage();
  if (!bike) return null;

  const isLimited = bike.statusBadge === 'LIMITED';
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
    require('../assets/hero.png');

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
              { backgroundColor: isLimited ? 'rgba(245, 158, 11, 0.9)' : 'rgba(16, 185, 129, 0.9)' },
            ]}
          >
            <Text style={[styles.statusBadgeText, compact && styles.badgeTextCompact]}>
              {isLimited
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

        {/* Pricing & Booking CTA Footer with WhatsApp button */}
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
              style={[styles.bookBtn, compact && styles.bookBtnCompact]}
              onPress={() => {
                if (onStartBooking) {
                  onStartBooking(bike);
                } else if (onSelectBike) {
                  onSelectBike(bike);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.bookBtnText, compact && styles.bookBtnTextCompact]}>
                {t('fleet.bookBtn', 'Book')}
              </Text>
              <ArrowRight size={compact ? 12 : 13} color="#FFFFFF" strokeWidth={2.2} />
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
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 11, 20, 0.25)',
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
  content: {
    padding: 14,
  },
  contentCompact: {
    padding: 10,
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
  bikeNameCompact: {
    fontSize: 14,
  },
  bikeModel: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  bikeModelCompact: {
    fontSize: 11,
    marginBottom: 6,
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
