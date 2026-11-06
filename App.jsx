import React, { useState, useRef, Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
import QuoteModal from './src/components/QuoteModal';
import FloatingWhatsApp from './src/components/FloatingWhatsApp';
import Toast from './src/components/Toast';

import { BIKES_DATA } from './src/data/bikes';
import { INITIAL_BIKE_LISTINGS } from './src/data/marketplaceData';
import { COLORS } from './src/theme/colors';

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

  // User State
  const [user, setUser] = useState(null);
  const [pendingBookingBike, setPendingBookingBike] = useState(null);
  const [isPendingRentBike, setIsPendingRentBike] = useState(false);

  // Modals & Sheets
  const [selectedBike, setSelectedBike] = useState(BIKES_DATA[0]);
  const [bookModalBike, setBookModalBike] = useState(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [enquiryBike, setEnquiryBike] = useState(null);

  const [isAuthOpen, setIsAuthOpen] = useState(false);

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
  const [sharedBikes, setSharedBikes] = useState(INITIAL_BIKE_LISTINGS);

  const handleBikeSubmitted = (newBike) => {
    setSharedBikes((prev) => [newBike, ...prev]);
    showToast(`Listing ${newBike.registrationNumber || newBike.model} queued for admin verification!`);
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

  // Requirement: Login check before listing bike!
  const handleRentBikePress = () => {
    if (!user) {
      setIsPendingRentBike(true);
      setIsAuthOpen(true);
      showToast('Please log in or sign up first to list your bike.');
      return;
    }

    if (navigationRef.current) {
      navigationRef.current.navigate('RentBike');
    }
  };

  const handleUserUpdate = (userData) => {
    setUser(userData);
    if (userData) {
      showToast(`Welcome back, ${userData.name}!`);
      if (isPendingRentBike) {
        setIsPendingRentBike(false);
        if (navigationRef.current) {
          navigationRef.current.navigate('RentBike');
        }
      } else if (pendingBookingBike) {
        const target = pendingBookingBike;
        setPendingBookingBike(null);
        if (navigationRef.current) {
          navigationRef.current.navigate('Booking', { bike: target });
        }
      }
    } else {
      setIsPendingRentBike(false);
      setPendingBookingBike(null);
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

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <SafeAreaProvider style={styles.root}>
          <StatusBar style="light" backgroundColor={COLORS.bgDark} />
          <NavigationContainer ref={navigationRef}>
            <View style={styles.appContainer}>
              <RootNavigator
                user={user}
                onOpenAuth={() => setIsAuthOpen(true)}
                onOpenWhatsApp={handleOpenWhatsApp}
                onOpenQuote={handleOpenQuote}
                onSelectBike={handleSelectBike}
                onStartBooking={handleStartBooking}
                onOpenBookModal={handleOpenBookModal}
                onShowToast={showToast}
                sharedBikes={sharedBikes}
                onBikeSubmitted={handleBikeSubmitted}
                onRentBikePress={handleRentBikePress}
              />

              {/* Floating WhatsApp Quick Action Button */}
              <FloatingWhatsApp
                onPress={() => handleOpenWhatsApp()}
                phone="919876543210"
              />

              {/* Action Modals */}
              <BookDropdownModal
                visible={isBookModalOpen}
                onClose={() => setIsBookModalOpen(false)}
                bike={bookModalBike}
                onStartBooking={handleStartBooking}
                onShowToast={showToast}
              />

              <EnquiryModal
                visible={isEnquiryOpen}
                onClose={() => setIsEnquiryOpen(false)}
                selectedBike={enquiryBike}
                onShowToast={showToast}
              />

              <AuthModal
                visible={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                onLogin={handleUserUpdate}
                user={user}
                onShowToast={showToast}
              />

              <QuoteModal
                visible={isQuoteOpen}
                onClose={() => setIsQuoteOpen(false)}
                data={quoteData}
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
