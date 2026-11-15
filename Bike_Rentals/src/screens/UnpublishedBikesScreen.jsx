import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import {
  ArrowLeft,
  Bike,
  ShieldCheck,
  EyeOff,
  Search,
  Sparkles,
  CheckCircle2,
} from 'lucide-react-native';
import { COLORS, RADIUS } from '../theme/colors';
import BikeCard from '../components/BikeCard';

export default function UnpublishedBikesScreen({
  navigation,
  user,
  sharedBikes = [],
  onSelectBike,
  onBikeUpdated,
  onBikeDeleted,
  onShowToast,
  onOpenWhatsApp,
  onRentBikePress,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const { width: windowWidth } = useWindowDimensions();

  // Responsive Grid
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

  // Filter bikes that are unpublished
  const unpublishedBikes = useMemo(() => {
    return (sharedBikes || []).filter((b) => {
      const isUnpublished = b.isPublished === false || b.status === 'UNPUBLISHED';
      if (!isUnpublished) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (b.name || '').toLowerCase().includes(q) ||
        (b.model || '').toLowerCase().includes(q) ||
        (b.brand || '').toLowerCase().includes(q) ||
        (b.registrationNumber || '').toLowerCase().includes(q) ||
        (b.category || '').toLowerCase().includes(q)
      );
    });
  }, [sharedBikes, searchQuery]);

  const handleEditBike = (bike) => {
    if (onSelectBike) {
      onSelectBike(bike);
    }
    if (navigation?.navigate) {
      navigation.navigate('RentBike', { bikeToEdit: bike });
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack?.() || navigation?.navigate?.('Motorbikes')}
          activeOpacity={0.7}
          accessibilityLabel="Back to Fleet"
        >
          <ArrowLeft size={18} color="#38BDF8" />
          <Text style={styles.backButtonText}>Back to Fleet</Text>
        </TouchableOpacity>

        <View style={styles.pageIndicator}>
          <ShieldCheck size={14} color="#34D399" />
          <Text style={styles.pageIndicatorText}>Owner Access</Text>
        </View>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            if (onRentBikePress) {
              onRentBikePress();
            } else if (navigation?.navigate) {
              navigation.navigate('RentBike');
            }
          }}
          activeOpacity={0.7}
          accessibilityLabel="Add New Motorcycle"
        >
          <Bike size={14} color="#38BDF8" />
          <Text style={styles.actionBtnText}>+ Add Bike</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centerContainer}>
          {/* Header Banner */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={styles.unpublishedBadge}>
                <EyeOff size={13} color="#FCA5A5" />
                <Text style={styles.unpublishedBadgeText}>
                  {unpublishedBikes.length} UNPUBLISHED
                </Text>
              </View>
              <View style={styles.ownerFleetBadge}>
                <Sparkles size={12} color="#38BDF8" />
                <Text style={styles.ownerFleetBadgeText}>Fleet Inventory</Text>
              </View>
            </View>

            <Text style={styles.title}>Unpublished Motorcycles</Text>
            <Text style={styles.subtitle}>
              These motorcycles are hidden from riders and will not appear in the public fleet
              catalogue. You can review specifications, edit details, delete them, or click{' '}
              <Text style={styles.highlightText}>Publish</Text> to make them live instantly.
            </Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <Search size={18} color={COLORS.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search unpublished bikes by name, model, reg no..."
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                  <Text style={styles.clearSearchText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Bikes Grid or Empty State */}
          {unpublishedBikes.length > 0 ? (
            <View style={styles.gridContainer}>
              {unpublishedBikes.map((bike) => {
                const bikeKey = bike._id || bike.id || bike.listingCode || bike.registrationNumber;
                return (
                  <View
                    key={bikeKey}
                    style={[
                      styles.cardWrapper,
                      { width: cardWidth, marginBottom: gap },
                    ]}
                  >
                    <BikeCard
                      bike={bike}
                      user={user}
                      onSelectBike={handleEditBike}
                      onBikeUpdated={onBikeUpdated}
                      onBikeDeleted={onBikeDeleted}
                      onShowToast={onShowToast}
                      onOpenWhatsApp={onOpenWhatsApp}
                      compact={isCompact}
                    />
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <CheckCircle2 size={36} color="#34D399" />
              </View>
              <Text style={styles.emptyTitle}>No Unpublished Bikes</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No unpublished motorcycles matched "${searchQuery}".`
                  : 'All your fleet motorcycles are currently published and visible to riders in the fleet catalogue.'}
              </Text>

              <TouchableOpacity
                style={styles.viewFleetBtn}
                onPress={() => navigation?.navigate?.('Motorbikes')}
                activeOpacity={0.8}
              >
                <Bike size={16} color="#050B14" />
                <Text style={styles.viewFleetBtnText}>Browse Published Fleet</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  backButtonText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  pageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  pageIndicatorText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  actionBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centerContainer: {
    maxWidth: 1240,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  unpublishedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  unpublishedBadgeText: {
    color: '#FCA5A5',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ownerFleetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  ownerFleetBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 19,
    maxWidth: 720,
  },
  highlightText: {
    color: '#34D399',
    fontWeight: '700',
  },
  searchRow: {
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  clearSearchText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 20,
  },
  cardWrapper: {
    // Width set dynamically in JSX
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 19,
    marginBottom: 20,
  },
  viewFleetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#38BDF8',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  viewFleetBtnText: {
    color: '#050B14',
    fontSize: 13,
    fontWeight: '800',
  },
});
