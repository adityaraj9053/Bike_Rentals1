import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Search } from 'lucide-react-native';
import { BIKES_DATA } from '../data/bikes';
import { COLORS, RADIUS } from '../theme/colors';
import BikeCard from '../components/BikeCard';
import { useLanguage } from '../i18n/LanguageContext';

export default function MotorbikesScreen({
  navigation,
  route,
  user,
  onSelectBike,
  onStartBooking,
  onOpenBookModal,
  onOpenWhatsApp,
  onOpenBookingDetails,
  onBikeDeleted,
  sharedBikes,
}) {
  const { t, isHindi } = useLanguage();
  const initialCategory = route?.params?.initialCategory || 'all';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'price-asc', 'price-desc', 'rating'

  // Update selectedCategory if navigated with specific route params
  useEffect(() => {
    if (route?.params?.initialCategory) {
      setSelectedCategory(route?.params?.initialCategory);
    }
  }, [route?.params?.initialCategory, route?.params?.timestamp]);

  const activeFleet = useMemo(() => {
    return sharedBikes && sharedBikes.length > 0 ? sharedBikes : BIKES_DATA;
  }, [sharedBikes]);

  // Responsive Grid state & max-width container
  const { width: windowWidth } = useWindowDimensions();
  const maxContainerWidth = 1240;
  const effectiveWidth = Math.min(windowWidth, maxContainerWidth);
  const containerPadding = 48;
  const gap = 20;
  const availableWidth = Math.max(effectiveWidth - containerPadding, 280);

  const numColumns = useMemo(() => {
    if (availableWidth >= 1050) return 4;
    if (availableWidth >= 780) return 3;
    if (availableWidth >= 520) return 2;
    return 1;
  }, [availableWidth]);

  const cardWidth = Math.floor((availableWidth - (numColumns - 1) * gap) / numColumns);
  const isCompact = cardWidth < 250;

  const categories = [
    { id: 'all', label: t('fleet.allBikes', 'All Fleet') },
    { id: 'scooters', label: t('fleet.scooters', 'Scooters') },
    { id: 'commuter', label: t('fleet.commuters', 'Commuters') },
    { id: 'cruiser', label: t('fleet.cruisers', 'Cruisers') },
    { id: 'premium', label: t('fleet.premium', 'Premium') },
  ];

  const sortOptions = [
    { id: 'newest', label: t('fleet.featured', 'Featured') },
    { id: 'price-asc', label: t('fleet.priceLow', 'Price: Low to High') },
    { id: 'price-desc', label: t('fleet.priceHigh', 'Price: High to Low') },
    { id: 'rating', label: isHindi ? 'शीर्ष रेटेड' : 'Top Rated' },
  ];

  const isOwner = user?.role === 'OWNER';
  const currentUserId = user?.id || user?._id;

  const filteredBikes = useMemo(() => {
    let result = activeFleet.filter((b) => {
      const hasActiveBooking = Boolean(
        b.currentBookingId &&
        (typeof b.currentBookingId === 'object'
          ? Boolean(b.currentBookingId._id || Object.keys(b.currentBookingId).length > 0)
          : Boolean(b.currentBookingId))
      );

      // Visibility rule:
      if (!isOwner && b.isBooked && hasActiveBooking) {
        const bookedUserId = b.currentBookedByUserId?._id || b.currentBookedByUserId;
        const bookedUserEmail = (
          b.currentBookedByEmail ||
          b.currentBookingId?.riderDetails?.email ||
          b.currentBookingId?.renterId?.email
        )?.trim()?.toLowerCase();
        const userEmail = user?.email?.trim()?.toLowerCase();

        const isMyBike = Boolean(
          (currentUserId && bookedUserId && String(bookedUserId) === String(currentUserId)) ||
          (userEmail && bookedUserEmail && userEmail === bookedUserEmail) ||
          b.isMyBooking
        );

        if (!isMyBike) return false;
      }

      const catLower = (b.category || '').toLowerCase();
      const catKeyLower = (b.categoryKey || '').toLowerCase();
      const selCatLower = (selectedCategory || 'all').toLowerCase();

      const matchCategory =
        selCatLower === 'all' ||
        catKeyLower === selCatLower ||
        catLower.includes(selCatLower) ||
        (selCatLower === 'scooters' && (catKeyLower.includes('scooter') || catLower.includes('scooter') || catLower.includes('ev'))) ||
        (selCatLower === 'cruiser' && (catKeyLower.includes('cruiser') || catLower.includes('cruiser') || catLower.includes('tourer'))) ||
        (selCatLower === 'commuter' && (catKeyLower.includes('commuter') || catLower.includes('commuter') || catKeyLower === 'sports' || catLower.includes('sport') || catKeyLower === 'adventure')) ||
        (selCatLower === 'premium' && (Number(b.pricePerDay || b.dailyPrice || 0) >= 1200 || catLower.includes('premium') || catLower.includes('bmw') || catLower.includes('ducati') || catLower.includes('harley') || catLower.includes('kawasaki')));

      const matchSearch =
        !searchQuery.trim() ||
        (b.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.model || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.registrationNumber || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchCategory && matchSearch;
    });

    if (sortBy === 'price-asc') {
      result.sort((a, b) => (a.pricePerDay ?? a.dailyPrice ?? 0) - (b.pricePerDay ?? b.dailyPrice ?? 0));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => (b.pricePerDay ?? b.dailyPrice ?? 0) - (a.pricePerDay ?? a.dailyPrice ?? 0));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating ?? 4.9) - (a.rating ?? 4.9));
    }

    return result;
  }, [activeFleet, selectedCategory, searchQuery, sortBy, isOwner, currentUserId]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.centerContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pretitle}>{t('fleet.pretitle', 'EXPLORE FLEET')}</Text>
          <Text style={styles.title}>{t('fleet.title', 'All Motorbikes & Scooters')}</Text>
          <Text style={styles.subtitle}>
            {t('fleet.subtitle', 'Filter by riding style, engine capacity, or budget. 100% verified fleet with instant booking.')}
          </Text>
        </View>

        {/* Search Bar & Sort Row */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Search size={18} color={COLORS.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('fleet.searchPlaceholder', 'Search by model, brand, or cc...')}
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Category Pills & Sort Dropdown */}
        <View style={styles.controlsRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryPills}
          >
            {categories.map((c) => {
              const isActive = selectedCategory === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.catPill, isActive && styles.catPillActive]}
                  onPress={() => setSelectedCategory(c.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortPills}
          >
            {sortOptions.map((s) => {
              const isSelected = sortBy === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.sortPill, isSelected && styles.sortPillActive]}
                  onPress={() => setSortBy(s.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sortPillText, isSelected && styles.sortPillTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Count Bar */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {t('fleet.showing', 'Showing')}{' '}
            <Text style={styles.countHighlight}>{filteredBikes.length}</Text>{' '}
            {t('fleet.motorcycles', 'motorcycles')}
          </Text>
        </View>

        {/* Responsive FlexWrap Grid (Centered) */}
        <View style={styles.gridContainer}>
          {filteredBikes.map((bike) => (
            <View
              key={bike.id}
              style={{
                width: cardWidth,
                minWidth: 280,
                maxWidth: 360,
                flexGrow: 0,
                flexShrink: 0,
              }}
            >
              <BikeCard
                key={bike.id || bike._id}
                bike={bike}
                currentUser={user}
                compact={isCompact}
                onSelectBike={(b) => {
                  if (onSelectBike) onSelectBike(b);
                  navigation.navigate('BikeDetails', { bike: b });
                }}
                onStartBooking={onStartBooking}
                onOpenBookModal={onOpenBookModal}
                onOpenWhatsApp={onOpenWhatsApp}
                onOpenBookingDetails={onOpenBookingDetails}
                onBikeDeleted={onBikeDeleted}
              />
            </View>
          ))}

          {filteredBikes.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>
                {isHindi ? 'कोई मोटरसाइकिल नहीं मिली' : 'No Motorbikes Found'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isHindi
                  ? 'अपनी खोज या फ़िल्टर बदलकर दोबारा प्रयास करें।'
                  : 'Try adjusting your search criteria or resetting the category filter.'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  contentContainer: {
    paddingBottom: 50,
  },
  centerContainer: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  header: {
    marginBottom: 24,
  },
  pretitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1.4,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 21,
  },
  searchRow: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    height: '100%',
  },
  controlsRow: {
    gap: 12,
    marginBottom: 20,
  },
  categoryPills: {
    gap: 8,
  },
  catPill: {
    backgroundColor: COLORS.bgCardAlt,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  catPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  catPillText: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    fontWeight: '600',
  },
  catPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sortPills: {
    gap: 8,
  },
  sortPill: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  sortPillActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.18)',
    borderColor: '#0284C7',
  },
  sortPillText: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    fontWeight: '600',
  },
  sortPillTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  countRow: {
    marginBottom: 18,
  },
  countText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  countHighlight: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
    alignItems: 'stretch',
  },
  emptyContainer: {
    width: '100%',
    padding: 40,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
