import React from 'react';
import { StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import WhatsAppIcon from './WhatsAppIcon';
import { COLORS } from '../theme/colors';

export default function FloatingWhatsApp({ onPress, phone = '919876543210' }) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      const url = `https://wa.me/${phone}?text=${encodeURIComponent('Hello The Road Eagle! I would like to enquire about renting a motorbike.')}`;
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <TouchableOpacity
      style={styles.floatingButton}
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityLabel="Chat on WhatsApp"
    >
      <WhatsAppIcon size={30} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 88,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
});
