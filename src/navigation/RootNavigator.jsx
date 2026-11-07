import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Compass,
  Bike,
  HelpCircle,
  Users,
  PhoneCall,
  Sparkles,
} from 'lucide-react-native';

import HomeScreen from '../screens/HomeScreen';
import MotorbikesScreen from '../screens/MotorbikesScreen';
import HowItWorksScreen from '../screens/HowItWorksScreen';
import AboutUsScreen from '../screens/AboutUsScreen';
import ContactScreen from '../screens/ContactScreen';
import BikeDetailsScreen from '../screens/BikeDetailsScreen';
import BookingScreen from '../screens/BookingScreen';
import RentBikeScreen from '../screens/RentBikeScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import CustomHeader from '../components/CustomHeader';

import { COLORS } from '../theme/colors';
import { useLanguage } from '../i18n/LanguageContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BottomTabNavigator({
  user,
  onOpenAuth,
  onOpenWhatsApp,
  onSelectBike,
  onStartBooking,
  onOpenBookModal,
  onShowToast,
  onBikeSubmitted,
  onRentBikePress,
  sharedBikes,
}) {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={({ navigation }) => ({
        header: () => (
          <CustomHeader
            navigation={navigation}
            user={user}
            onOpenAuth={onOpenAuth}
            onOpenWhatsApp={() => onOpenWhatsApp()}
            onStartBooking={() => onStartBooking && onStartBooking()}
            onRentBikePress={onRentBikePress}
          />
        ),
        tabBarStyle: {
          backgroundColor: COLORS.bgDark,
          borderTopColor: COLORS.borderCard,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 74,
          paddingBottom: Platform.OS === 'ios' ? 28 : 14,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.accentCyan,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginBottom: 2,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarLabel: t('nav.home', 'Home'),
          tabBarIcon: ({ color }) => <Compass size={22} color={color} />,
        }}
      >
        {(props) => (
          <HomeScreen
            {...props}
            onSelectBike={onSelectBike}
            onStartBooking={onStartBooking}
            onOpenWhatsApp={onOpenWhatsApp}
            onOpenBookModal={onOpenBookModal}
            onRentBikePress={onRentBikePress}
            sharedBikes={sharedBikes}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Motorbikes"
        options={{
          tabBarLabel: t('nav.fleet', 'Fleet'),
          tabBarIcon: ({ color }) => <Bike size={22} color={color} />,
        }}
      >
        {(props) => (
          <MotorbikesScreen
            {...props}
            onSelectBike={onSelectBike}
            onStartBooking={onStartBooking}
            onOpenBookModal={onOpenBookModal}
            onOpenWhatsApp={onOpenWhatsApp}
            sharedBikes={sharedBikes}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="RentBikeTab"
        options={{
          tabBarLabel: 'Rent Bike',
          tabBarIcon: ({ color }) => <Sparkles size={22} color={color} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (!user) {
              e.preventDefault();
              if (onRentBikePress) {
                onRentBikePress();
              } else if (onOpenAuth) {
                onOpenAuth();
              }
            }
          },
        })}
      >
        {(props) => (
          <RentBikeScreen
            {...props}
            user={user}
            onOpenAuth={onOpenAuth}
            onShowToast={onShowToast}
            onBikeSubmitted={onBikeSubmitted}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="HowItWorks"
        options={{
          tabBarLabel: t('nav.guide', 'Guide'),
          tabBarIcon: ({ color }) => <HelpCircle size={22} color={color} />,
        }}
        component={HowItWorksScreen}
      />

      <Tab.Screen
        name="AboutUs"
        options={{
          tabBarLabel: t('nav.about', 'About'),
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
        }}
        component={AboutUsScreen}
      />

      <Tab.Screen
        name="Contact"
        options={{
          tabBarLabel: t('nav.contact', 'Contact'),
          tabBarIcon: ({ color }) => <PhoneCall size={22} color={color} />,
        }}
      >
        {(props) => (
          <ContactScreen
            {...props}
            onShowToast={onShowToast}
            onOpenWhatsApp={onOpenWhatsApp}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function RootNavigator({
  user,
  onOpenAuth,
  onOpenWhatsApp,
  onOpenQuote,
  onSelectBike,
  onStartBooking,
  onOpenBookModal,
  onShowToast,
  sharedBikes,
  onBikeSubmitted,
  onRentBikePress,
}) {
  const { t } = useLanguage();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: COLORS.bgDark },
      }}
    >
      <Stack.Screen name="MainTabs">
        {(props) => (
          <BottomTabNavigator
            {...props}
            user={user}
            onOpenAuth={onOpenAuth}
            onOpenWhatsApp={onOpenWhatsApp}
            onSelectBike={onSelectBike}
            onStartBooking={onStartBooking}
            onOpenBookModal={onOpenBookModal}
            onShowToast={onShowToast}
            onBikeSubmitted={onBikeSubmitted}
            onRentBikePress={onRentBikePress}
            sharedBikes={sharedBikes}
          />
        )}
      </Stack.Screen>

      <Stack.Screen
        name="RentBike"
        options={{
          headerShown: false,
        }}
      >
        {(props) => (
          <RentBikeScreen
            {...props}
            user={user}
            onOpenAuth={onOpenAuth}
            onShowToast={onShowToast}
            onBikeSubmitted={onBikeSubmitted}
          />
        )}
      </Stack.Screen>

      <Stack.Screen
        name="AdminDashboard"
        options={{
          headerShown: false,
        }}
      >
        {(props) => (
          <AdminDashboardScreen
            {...props}
            onShowToast={onShowToast}
            sharedBikes={sharedBikes}
          />
        )}
      </Stack.Screen>

      <Stack.Screen
        name="BikeDetails"
        options={({ navigation, route }) => ({
          headerShown: true,
          header: () => (
            <CustomHeader
              navigation={navigation}
              showBack
              user={user}
              onOpenAuth={onOpenAuth}
              onOpenWhatsApp={() => onOpenWhatsApp(route?.params?.bike)}
            />
          ),
        })}
      >
        {(props) => (
          <BikeDetailsScreen
            {...props}
            onStartBooking={onStartBooking}
            onOpenWhatsApp={onOpenWhatsApp}
            onOpenBookModal={onOpenBookModal}
          />
        )}
      </Stack.Screen>

      <Stack.Screen
        name="Booking"
        options={({ navigation }) => ({
          headerShown: true,
          header: () => (
            <CustomHeader
              navigation={navigation}
              showBack
              title={t('booking.reservationTitle', 'Reservation')}
              user={user}
              onOpenAuth={onOpenAuth}
              onOpenWhatsApp={() => onOpenWhatsApp()}
            />
          ),
        })}
      >
        {(props) => (
          <BookingScreen
            {...props}
            user={user}
            onOpenAuth={onOpenAuth}
            onOpenQuote={onOpenQuote}
            onShowToast={onShowToast}
            onOpenWhatsApp={onOpenWhatsApp}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
