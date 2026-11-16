import React, { useState, useRef, Component, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';

// Allow auth session redirect completion on web
WebBrowser.maybeCompleteAuthSession();

import { LanguageProvider } from './src/i18n/LanguageContext';
import RootNavigator from './src/navigation/RootNavigator';
import BookDropdownModal from './src/components/BookDropdownModal';
import EnquiryModal from './src/components/EnquiryModal';
import AuthModal from './src/components/AuthModal';
import NavigationSidebar from './src/components/NavigationSidebar';
import QuoteModal from './src/components/QuoteModal';
import FloatingWhatsApp from './src/components/FloatingWhatsApp';
import Toast from './src/components/Toast';
import DirectDocumentScreen from './src/screens/DirectDocumentScreen';

import { BIKES_DATA } from './src/data/bikes';
import { INITIAL_BIKE_LISTINGS } from './src/data/marketplaceData';
import { COLORS } from './src/theme/colors';
import { authStorage, authAPI, bikesAPI, ownerAPI } from './src/services/api';
import { isOwnerUser } from './src/utils/authUtils';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>The Road Eagle</Text>
          <Text style={errorStyles.sub}>Something went wrong while loading this screen.</Text>
          <TouchableOpacity
            style={errorStyles.reloadBtn}
            onPress={() => {
              this.setState({ hasError: false });
              if (typeof window !== 'undefined') window.location.reload();
            }}
          >
            <Text style={errorStyles.reloadText}>Reload App</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050B14',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#38BDF8',
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
    textAlign: 'center',
  },
  reloadBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
  },
  reloadText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default function App() {
  const navigationRef = useRef(null);

  // Direct Document Viewer Interception (for paths like http://localhost:8081/Screenshot%202026-11-11%20120511.png)
  const [documentPath, setDocumentPath] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
      let p = '';
      try {
        p = decodeURIComponent(window.location.pathname || '').replace(/^\/+/, '');
      } catch (e) {
        p = (window.location.pathname || '').replace(/^\/+/, '');
      }
      if (
        p &&
        (/\.(png|jpe?g|pdf|webp)$/i.test(p) ||
          p.startsWith('documents/') ||
          p.startsWith('api/documents/') ||
          p.includes('Screenshot') ||
          p.includes('Aadhaar') ||
          p.includes('Licence') ||
          p.includes('SmartCard'))
      ) {
        return p;
      }
    }
    return null;
  });

  // User State
  const [user, setUser] = useState(null);
  const [pendingBookingBike, setPendingBookingBike] = useState(null);

  // Modals & Sheets
  const [selectedBike, setSelectedBike] = useState(BIKES_DATA[0]);
  const [bookModalBike, setBookModalBike] = useState(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [enquiryBike, setEnquiryBike] = useState(null);

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quoteData, setQuoteData] = useState(null);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const showToast = (message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Shared Marketplace State for listings submitted via "Rent Your Bike"
  const [sharedBikes, setSharedBikes] = useState(BIKES_DATA);

  // Shared Contact & Hub Settings
  const DEFAULT_CONTACT_SETTINGS = {
    contactPhone: '+91 98765 43210',
    whatsappNumber: '+91 98765 43210',
    hubName: 'Central Rental Hub',
    hubAddress: 'Plot 42, Metro Ring Road, South City, Bangalore, 560034',
    mapUrl: 'https://maps.google.com/?q=Plot+42+Metro+Ring+Road+South+City+Bangalore',
    contactEmail: 'rentals@theroadeagle.com',
    operatingHoursText: 'Monday – Sunday: 08:00 AM – 09:30 PM',
    operatingHoursSubtext: '24/7 emergency roadside support active',
    emailResponseTime: 'Within 2 business hours',
  };

  const [contactSettings, setContactSettings] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cached = window.localStorage.getItem('the_road_eagle_contact_settings');
        if (cached) return JSON.parse(cached);
      } catch (e) {}
    }
    return DEFAULT_CONTACT_SETTINGS;
  });

  useEffect(() => {
    ownerAPI
      .getSettings()
      .then((res) => {
        if (res && res.data) {
          setContactSettings((prev) => {
            const merged = { ...prev, ...res.data };
            if (typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.setItem('the_road_eagle_contact_settings', JSON.stringify(merged));
            }
            return merged;
          });
        }
      })
      .catch((err) => {
        console.warn('[App] Contact settings load notice:', err.message);
      });

    // Cross-tab and same-tab real-time sync for all riders and users
    const handleStorageChange = (e) => {
      if (e.key === 'the_road_eagle_contact_settings' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setContactSettings(parsed);
        } catch (err) {}
      }
    };

    const handleCustomChange = (e) => {
      if (e.detail) {
        setContactSettings((prev) => ({ ...prev, ...e.detail }));
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('the_road_eagle_contact_updated', handleCustomChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('the_road_eagle_contact_updated', handleCustomChange);
      };
    }
  }, []);

  const handleContactSettingsUpdated = (newSettings) => {
    setContactSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('the_road_eagle_contact_settings', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('the_road_eagle_contact_updated', { detail: updated }));
      }
      return updated;
    });
  };

  const formatDbBike = (b) => {
    const c = (b.category || '').toLowerCase();
    const categoryKey =
      c.includes('scooter') || c.includes('ev')
        ? 'scooters'
        : c.includes('cruiser') || c.includes('tourer')
        ? 'cruiser'
        : c.includes('premium') || c.includes('superbike')
        ? 'premium'
        : 'commuter';

    const currentUserIdStr = user?.id || user?._id;
    const bookedUserIdStr = b.currentBookedByUserId?._id || b.currentBookedByUserId;
    const bookedEmail = (
      b.currentBookedByEmail ||
      b.currentBookingId?.riderDetails?.email ||
      b.currentBookingId?.renterId?.email
    )?.toLowerCase();
    const userEmail = user?.email?.toLowerCase();

    const hasActiveBooking = Boolean(
      b.currentBookingId &&
      (typeof b.currentBookingId === 'object'
        ? Boolean(b.currentBookingId._id || Object.keys(b.currentBookingId).length > 0)
        : Boolean(b.currentBookingId))
    );

    const isBooked = Boolean(b.isBooked && hasActiveBooking);

    let userHasLocalBooking = false;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cached = JSON.parse(window.localStorage.getItem('my_user_bookings') || '[]');
        userHasLocalBooking = cached.some((cb) => {
          const cbBikeId = cb.bikeId?._id || cb.bikeId?.id || cb.bike?._id || cb.bike?.id || cb.bikeListingCode;
          const currentBikeId = b._id || b.id || b.listingCode;
          return cbBikeId && currentBikeId && String(cbBikeId) === String(currentBikeId);
        });
      } catch (e) {}
    }

    // isMyBooking is strictly true ONLY if bike has active booking matching current user!
    const isMyBooking = Boolean(
      isBooked && (
        (currentUserIdStr && bookedUserIdStr && String(bookedUserIdStr) === String(currentUserIdStr)) ||
        (userEmail && bookedEmail && userEmail === bookedEmail) ||
        b.isMyBooking ||
        userHasLocalBooking
      )
    );

    const frontImg = b.images?.front || b.photos?.front || b.images?.thumbnail || b.photos?.thumbnail;
    const rearImg = b.images?.rear || b.photos?.rear || b.images?.back || b.photos?.back;
    const leftImg = b.images?.left || b.photos?.left;
    const rightImg = b.images?.right || b.photos?.right;
    const mainImg = frontImg || b.image || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800';

    const rawGallery = [frontImg, rearImg, leftImg, rightImg].filter((url) => typeof url === 'string' && url.trim().length > 0);
    const finalGallery = rawGallery.length > 0 ? rawGallery : (Array.isArray(b.gallery) && b.gallery.length > 0 ? b.gallery : [mainImg]);

    const galleryItems = [];
    if (frontImg) galleryItems.push({ key: 'front', label: 'Front', source: { uri: frontImg }, url: frontImg });
    if (rearImg) galleryItems.push({ key: 'rear', label: 'Back', source: { uri: rearImg }, url: rearImg });
    if (leftImg) galleryItems.push({ key: 'left', label: 'Left', source: { uri: leftImg }, url: leftImg });
    if (rightImg) galleryItems.push({ key: 'right', label: 'Right', source: { uri: rightImg }, url: rightImg });

    if (galleryItems.length === 0) {
      finalGallery.forEach((url, i) => {
        galleryItems.push({
          key: `view-${i}`,
          label: i === 0 ? 'Front' : `View ${i + 1}`,
          source: typeof url === 'string' ? { uri: url } : url,
          url,
        });
      });
    }

    return {
      id: b.listingCode || b._id,
      name: b.name || `${b.brand} ${b.model}`,
      model: b.model,
      brand: b.brand,
      category: b.category,
      categoryKey,
      tagline: b.tagline || b.description || 'Verified Machine with full inspection',
      pricePerDay: b.dailyPrice || 1500,
      dailyPrice: b.dailyPrice || 1500,
      deposit: b.securityDeposit || 3000,
      securityDeposit: b.securityDeposit || 3000,
      rating: b.rating || 4.9,
      reviewsCount: b.reviewsCount || 124,
      badge: b.status === 'APPROVED' ? 'VERIFIED' : 'FLEET',
      badgeType: 'premium',
      availability: isBooked ? 'Currently Booked' : 'Available for immediate booking',
      statusBadge: isBooked ? 'BOOKED' : 'AVAILABLE',
      isBooked: isBooked,
      currentBookingId: b.currentBookingId,
      currentBookedByUserId: b.currentBookedByUserId,
      currentBookedByEmail: bookedEmail,
      isMyBooking,
      isFeatured: true,
      image: mainImg,
      imageSource: { uri: mainImg },
      images: b.images || { front: frontImg, rear: rearImg, left: leftImg, right: rightImg, thumbnail: frontImg },
      photos: b.photos || { front: frontImg, rear: rearImg, left: leftImg, right: rightImg, thumbnail: frontImg },
      gallery: finalGallery,
      gallerySources: galleryItems.map((g) => g.source),
      galleryItems,
      specs: b.specs || {},
      features: b.features || [],
      guidelines: b.guidelines || {},
      registrationNumber: b.registrationNumber,
      pickupAddress: b.pickupAddress,
      documents: b.documents || {
        rcSmartCardUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800',
        pucCertificateUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800',
        insurancePolicyUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800',
      },
      _id: b._id,
    };
  };

  const fetchFleet = () => {
    bikesAPI
      .getAll()
      .then((res) => {
        if (res?.data && res.data.length > 0) {
          const formatted = res.data.map(formatDbBike);
          setSharedBikes((prev) => {
            const dbIds = new Set(formatted.map((f) => String(f.id || f._id)));
            const pending = prev.filter((p) => !dbIds.has(String(p.id || p._id)));
            return [...pending, ...formatted];
          });
          if (formatted.length > 0) {
            setSelectedBike(formatted[0]);
          }
        }
      })
      .catch((err) => {
        console.log('[App] Using initial fleet data:', err.message);
      });
  };

  // 1. Restore auth user once on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('my_booked_bike_ids');
    }
    const cachedUser = authStorage.getUser();
    if (cachedUser) {
      if (isOwnerUser(cachedUser) && cachedUser.role !== 'OWNER') {
        cachedUser.role = 'OWNER';
      }
      setUser(cachedUser);
    }
    const token = authStorage.getToken();
    if (token) {
      authAPI
        .getMe()
        .then((res) => {
          if (res?.user) {
            const isOwner = isOwnerUser(res.user);
            const phoneVal = res.user.phoneNumber || res.user.phone || res.user.phone_number || cachedUser?.phone || cachedUser?.phoneNumber || '';
            const updated = {
              ...(cachedUser || {}),
              id: res.user.id || res.user._id,
              name: res.user.fullName || res.user.name,
              fullName: res.user.fullName,
              email: res.user.email,
              phone: phoneVal,
              phoneNumber: phoneVal,
              phone_number: phoneVal,
              role: isOwner ? 'OWNER' : res.user.role,
              avatar: res.user.avatarUrl || cachedUser?.avatar,
            };
            setUser(updated);
            authStorage.setUser(updated);
          }
        })
        .catch(() => {});
    }
  }, []);

  // 2. Fetch fleet on mount and when authenticated userId changes
  const userId = user?.id || user?._id || null;
  useEffect(() => {
    fetchFleet();
  }, [userId]);

  const handleBikeSubmitted = (newBike) => {
    setSharedBikes((prev) => {
      const filtered = prev.filter((b) => b.id !== newBike.id && b._id !== newBike._id);
      return [newBike, ...filtered];
    });
    fetchFleet();
    showToast(`Motorcycle ${newBike.registrationNumber || newBike.name || newBike.model} added to fleet!`);
  };

  const handleBikeUpdated = (updatedBike) => {
    setSharedBikes((prev) =>
      prev.map((b) => {
        const matches =
          (updatedBike._id && (b._id === updatedBike._id || b.id === updatedBike._id)) ||
          (updatedBike.id && (b.id === updatedBike.id || b._id === updatedBike.id)) ||
          (updatedBike.listingCode && (b.id === updatedBike.listingCode || b.listingCode === updatedBike.listingCode)) ||
          (updatedBike.registrationNumber && b.registrationNumber === updatedBike.registrationNumber);
        return matches ? { ...b, ...updatedBike } : b;
      })
    );
    fetchFleet();
    showToast(`Motorcycle ${updatedBike.registrationNumber || updatedBike.name || updatedBike.model} updated successfully!`);
  };

  const handleBikeDeleted = (deletedBikeOrId) => {
    const targetId = typeof deletedBikeOrId === 'object'
      ? (deletedBikeOrId._id || deletedBikeOrId.id || deletedBikeOrId.listingCode || deletedBikeOrId.registrationNumber)
      : deletedBikeOrId;

    setSharedBikes((prev) =>
      prev.filter((b) => {
        if (b._id && (b._id === targetId || b.id === targetId)) return false;
        if (b.id && (b.id === targetId || b._id === targetId)) return false;
        if (b.listingCode && b.listingCode === targetId) return false;
        if (b.registrationNumber && b.registrationNumber === targetId) return false;
        return true;
      })
    );
    fetchFleet();
    showToast('Motorcycle completely deleted from database.');
  };

  const handleBookingConfirmed = (bookingData, targetBike) => {
    const bikeId = targetBike?._id || targetBike?.id || targetBike?.listingCode;
    const bookedUserId = user?.id || user?._id || bookingData?.renterId?._id || bookingData?.renterId;
    const bookedEmail = (bookingData?.riderDetails?.email || user?.email || '').trim().toLowerCase();

    setSharedBikes((prev) =>
      prev.map((b) => {
        const matches =
          (bikeId && (b._id === bikeId || b.id === bikeId)) ||
          (targetBike?.listingCode && b.id === targetBike.listingCode) ||
          (targetBike?.registrationNumber && b.registrationNumber === targetBike.registrationNumber);

        if (matches) {
          return {
            ...b,
            isBooked: true,
            currentBookedByUserId: bookedUserId,
            currentBookedByEmail: bookedEmail,
            currentBookingId: bookingData,
            statusBadge: 'BOOKED',
            isMyBooking: true,
          };
        }
        return b;
      })
    );

    // Cache in local storage for instant dashboard updates
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const fullBookingRecord = {
          ...bookingData,
          bookingCode: bookingData.bookingCode || `RDE-${Math.floor(100000 + Math.random() * 900000)}`,
          bikeId: targetBike,
          bike: targetBike,
          renterId: user,
          riderDetails: bookingData.riderDetails || {
            fullName: user?.name,
            email: user?.email,
            phoneNumber: user?.phone,
          },
          riderDocuments: bookingData.riderDocuments || bookingData.riderDetails?.documents,
          pickupDatetime: bookingData.pickupDatetime || bookingData.pickupDate,
          returnDatetime: bookingData.returnDatetime || bookingData.returnDate,
          pricing: bookingData.pricing || { totalPayable: targetBike?.dailyPrice || 1500 },
          bookingStatus: 'CONFIRMED',
          paymentStatus: 'PAID',
        };

        const userCacheKey = 'my_user_bookings';
        const existingUserBookings = JSON.parse(window.localStorage.getItem(userCacheKey) || '[]');
        window.localStorage.setItem(
          userCacheKey,
          JSON.stringify([fullBookingRecord, ...existingUserBookings.filter(b => (b.bookingCode || b.id) !== (fullBookingRecord.bookingCode || fullBookingRecord.id))])
        );

        const ownerCacheKey = 'owner_dashboard_bookings';
        const existingOwnerBookings = JSON.parse(window.localStorage.getItem(ownerCacheKey) || '[]');
        window.localStorage.setItem(
          ownerCacheKey,
          JSON.stringify([fullBookingRecord, ...existingOwnerBookings.filter(b => (b.bookingCode || b.id) !== (fullBookingRecord.bookingCode || fullBookingRecord.id))])
        );
      } catch (cacheErr) {
        console.warn('Booking cache notice:', cacheErr.message);
      }
    }

    fetchFleet();
  };

  const handleSelectBike = (bike) => {
    setSelectedBike(bike);
  };

  const handleOpenBookModal = (bike) => {
    handleStartBooking(bike);
  };

  // Requirement: Login check before booking!
  const handleStartBooking = (bike) => {
    const target = bike || selectedBike || BIKES_DATA[0];
    setSelectedBike(target);

    if (isOwnerUser(user)) {
      showToast('Owners cannot book motorcycles. Please use the owner portal to manage listings.');
      return;
    }

    if (!user) {
      setPendingBookingBike(target);
      setIsAuthOpen(true);
      showToast('Please log in or sign up first to proceed with booking.');
      return;
    }

    if (navigationRef.current) {
      navigationRef.current.navigate('Booking', { bike: target });
    }
  };

  const handleOpenUserMenu = () => {
    if (user) {
      setIsSidebarOpen(true);
    } else {
      setIsAuthOpen(true);
    }
  };

  const handleSignOut = () => {
    authStorage.clear();
    setUser(null);
    setIsSidebarOpen(false);
    setIsAuthOpen(false);
    showToast('Signed out successfully.');
    if (navigationRef.current) {
      navigationRef.current.navigate('Home');
    }
  };

  const handleUserUpdate = (userData) => {
    setUser(userData);
    if (userData) {
      setIsAuthOpen(false);
      showToast(`Welcome back, ${userData.name}!`);
      // Display navigation sidebar after signing in
      setIsSidebarOpen(true);
      if (pendingBookingBike) {
        const target = pendingBookingBike;
        setPendingBookingBike(null);
        if (navigationRef.current) {
          navigationRef.current.navigate('Booking', { bike: target });
        }
      }
    } else {
      setPendingBookingBike(null);
      setIsSidebarOpen(false);
      showToast('Signed out successfully.');
    }
  };

  const handleOpenWhatsApp = (bike = null) => {
    setEnquiryBike(bike || selectedBike || BIKES_DATA[0]);
    setIsEnquiryOpen(true);
  };

  const handleOpenQuote = (data) => {
    setQuoteData(data);
    setIsQuoteOpen(true);
  };

  const handleOpenBookingDetails = (bookingOrBike) => {
    if (!bookingOrBike) return;

    let bike = null;
    let bData = null;

    if (bookingOrBike.bookingCode || bookingOrBike.booking_code || bookingOrBike.pricing || bookingOrBike.riderDetails) {
      bData = bookingOrBike;
      bike =
        (bookingOrBike.bike && typeof bookingOrBike.bike === 'object' && bookingOrBike.bike) ||
        (bookingOrBike.bikeId && typeof bookingOrBike.bikeId === 'object' && bookingOrBike.bikeId) ||
        selectedBike;
    } else if (bookingOrBike.currentBookingId && typeof bookingOrBike.currentBookingId === 'object') {
      bike = bookingOrBike;
      bData = {
        ...bookingOrBike.currentBookingId,
        bike: bookingOrBike,
      };
    } else {
      bike = bookingOrBike;
      const bId =
        typeof bookingOrBike.currentBookingId === 'string'
          ? bookingOrBike.currentBookingId
          : bookingOrBike.currentBookingId?._id;

      bData = {
        _id: bId,
        bookingId: bId,
        bookingCode: bookingOrBike.bookingCode || bookingOrBike.booking_code || bookingOrBike.listingCode,
        booking_code: bookingOrBike.booking_code || bookingOrBike.bookingCode || bookingOrBike.listingCode,
        bike: bookingOrBike,
      };
    }

    setQuoteData({
      ...bData,
      bike: bike || selectedBike,
    });
    setIsQuoteOpen(true);
  };

  const handleRentBikePress = () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    if (navigationRef.current) {
      navigationRef.current.navigate('RentBike');
    }
  };

  if (documentPath) {
    return (
      <ErrorBoundary>
        <SafeAreaProvider style={styles.root}>
          <StatusBar style="light" backgroundColor={COLORS.bgDark} />
          <DirectDocumentScreen
            documentKey={documentPath}
            onGoHome={() => {
              if (typeof window !== 'undefined' && window.history) {
                window.history.pushState({}, '', '/');
              }
              setDocumentPath(null);
            }}
          />
        </SafeAreaProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <SafeAreaProvider style={styles.root}>
          <StatusBar style="light" backgroundColor={COLORS.bgDark} />
          <NavigationContainer ref={navigationRef}>
            <View style={styles.appContainer}>
              <RootNavigator
                user={user}
                onOpenAuth={handleOpenUserMenu}
                onOpenWhatsApp={handleOpenWhatsApp}
                onOpenQuote={handleOpenQuote}
                onOpenBookingDetails={handleOpenBookingDetails}
                onSelectBike={handleSelectBike}
                onStartBooking={handleStartBooking}
                onOpenBookModal={handleOpenBookModal}
                onShowToast={showToast}
                sharedBikes={sharedBikes}
                contactSettings={contactSettings}
                onContactSettingsUpdated={handleContactSettingsUpdated}
                onBikeSubmitted={handleBikeSubmitted}
                onBikeUpdated={handleBikeUpdated}
                onBikeDeleted={handleBikeDeleted}
                onRentBikePress={handleRentBikePress}
                onBookingConfirmed={handleBookingConfirmed}
                onSignOut={handleSignOut}
              />

              {/* Floating WhatsApp Quick Action Button */}
              <FloatingWhatsApp
                onPress={() => handleOpenWhatsApp()}
                phone={(contactSettings?.whatsappNumber || contactSettings?.contactPhone || '919304618599').replace(/[^0-9]/g, '')}
              />

              {/* Action Modals */}
              <BookDropdownModal
                visible={isBookModalOpen}
                onClose={() => setIsBookModalOpen(false)}
                bike={bookModalBike}
                onStartBooking={handleStartBooking}
                onShowToast={showToast}
                contactSettings={contactSettings}
              />

              <EnquiryModal
                visible={isEnquiryOpen}
                onClose={() => setIsEnquiryOpen(false)}
                selectedBike={enquiryBike}
                onShowToast={showToast}
                contactSettings={contactSettings}
              />

              <AuthModal
                visible={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                onLogin={handleUserUpdate}
                user={user}
                onShowToast={showToast}
                onNavigateToRentBike={() => {
                  setIsAuthOpen(false);
                  if (navigationRef.current) {
                    navigationRef.current.navigate('RentBike');
                  }
                }}
                onExploreBikes={() => {
                  setIsAuthOpen(false);
                  if (navigationRef.current) {
                    navigationRef.current.navigate('Motorbikes');
                  }
                }}
              />

              {/* Navigation Sidebar Drawer for Authenticated Users */}
              <NavigationSidebar
                visible={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                user={user}
                sharedBikes={sharedBikes}
                onNavigate={(screen, params) => {
                  setIsSidebarOpen(false);
                  if (navigationRef.current) {
                    navigationRef.current.navigate(screen, params);
                  }
                }}
                onSignOut={handleSignOut}
              />

              <QuoteModal
                visible={isQuoteOpen}
                onClose={() => setIsQuoteOpen(false)}
                data={quoteData}
                isOwner={user?.role === 'OWNER'}
                onShowToast={showToast}
              />

              {/* Toast Alerts */}
              <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
            </View>
          </NavigationContainer>
        </SafeAreaProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  appContainer: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    position: 'relative',
  },
});
