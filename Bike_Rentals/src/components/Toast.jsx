import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';

export default function Toast({ toasts = [] }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <View style={styles.toastContainer} pointerEvents="none">
      {toasts.map((toast) => (
        <View key={toast.id} style={[styles.toastItem, SHADOWS.card]}>
          <CheckCircle2 size={18} color={COLORS.accentCyan} />
          <Text style={styles.toastText} numberOfLines={2}>
            {toast.message}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 25,
    left: 20,
    right: 20,
    zIndex: 9999,
    gap: 10,
    alignItems: 'center',
  },
  toastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0F172A',
    borderColor: COLORS.accentCyan,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxWidth: '92%',
  },
  toastText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
});
