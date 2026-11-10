import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Linking,
  Platform,
} from 'react-native';
import { Phone, MessageCircle, Calendar, X, Zap } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';

export default function BookDropdownModal({
  visible,
  onClose,
  bike,
  onStartBooking,
  onShowToast,
}) {
  if (!bike) return null;

  const phoneNumber = '+919876543210';
  const displayPhone = '+91 98765 43210';

  const handlePhoneCall = () => {
    onClose();
    if (onShowToast) onShowToast(`Calling concierge at ${displayPhone}...`);
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {});
  };

  const handleWhatsApp = () => {
    onClose();
    const message = encodeURIComponent(
      `Hello The Road Eagle! I would like to book the ${bike.name} (${bike.model}). Please share availability and rental confirmation.`
    );
    if (onShowToast) onShowToast(`Opening WhatsApp for ${bike.name}...`);
    Linking.openURL(`https://wa.me/${phoneNumber.replace('+', '')}?text=${message}`).catch(() => {});
  };

  const handleZalo = () => {
    onClose();
    if (onShowToast) onShowToast(`Connecting to Zalo concierge...`);
    Linking.openURL(`https://zalo.me/${phoneNumber.replace('+', '')}`).catch(() => {});
  };

  const handleReserveOnline = () => {
    onClose();
    if (onStartBooking) {
      onStartBooking(bike);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheetContainer, SHADOWS.card]}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.sheetTitle}>Book This Bike</Text>
                  <Text style={styles.sheetSubtitle}>
                    {bike.name} • {bike.model}
                  </Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <X size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.actionsList}>
                {/* 1. Phone Call */}
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={handlePhoneCall}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                    <Phone size={20} color={COLORS.accentCyanLight} />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={styles.actionTitle}>Call Concierge</Text>
                    <Text style={styles.actionSubtitle}>{displayPhone} (Instant)</Text>
                  </View>
                </TouchableOpacity>

                {/* 2. WhatsApp Concierge */}
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={handleWhatsApp}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(37, 211, 102, 0.15)' }]}>
                    <MessageCircle size={20} color={COLORS.whatsappGreen} />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={styles.actionTitle}>WhatsApp Concierge</Text>
                    <Text style={styles.actionSubtitle}>Chat & verify documents instantly</Text>
                  </View>
                </TouchableOpacity>

                {/* 3. Zalo Concierge */}
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={handleZalo}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(0, 163, 255, 0.15)' }]}>
                    <Zap size={20} color={COLORS.accentCyan} />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={styles.actionTitle}>Zalo Concierge</Text>
                    <Text style={styles.actionSubtitle}>Direct messaging channel</Text>
                  </View>
                </TouchableOpacity>

                {/* 4. Select Dates & Reserve Online */}
                <TouchableOpacity
                  style={[styles.actionItem, styles.reserveOnlineItem]}
                  onPress={handleReserveOnline}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(255, 59, 48, 0.2)' }]}>
                    <Calendar size={20} color={COLORS.accentRed} />
                  </View>
                  <View style={styles.actionTextWrap}>
                    <Text style={[styles.actionTitle, { color: COLORS.accentRed }]}>
                      Select Dates & Reserve Online
                    </Text>
                    <Text style={styles.actionSubtitle}>Custom pickup dates & instant quote</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.bgOverlay,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderColor: COLORS.borderCard,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: COLORS.accentCyan,
    marginTop: 4,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsList: {
    gap: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCardAlt,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 14,
  },
  reserveOnlineItem: {
    borderColor: 'rgba(255, 59, 48, 0.4)',
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
