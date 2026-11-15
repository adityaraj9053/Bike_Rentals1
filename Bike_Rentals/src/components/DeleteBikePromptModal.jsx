import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Trash2, X, AlertTriangle } from 'lucide-react-native';
import { COLORS, RADIUS } from '../theme/colors';

export default function DeleteBikePromptModal({
  visible,
  bike,
  onClose,
  onConfirm,
  isDeleting = false,
  isHindi = false,
}) {
  if (!visible || !bike) return null;

  const bikeName = bike.name || `${bike.brand || ''} ${bike.model || 'Motorcycle'}`.trim();
  const regNo = bike.registrationNumber || bike.licensePlate || bike.listingCode;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isDeleting) onClose();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            disabled={isDeleting}
            activeOpacity={0.7}
            accessibilityLabel="Close delete confirmation"
          >
            <X size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Warning Icon Badge */}
          <View style={styles.iconWrap}>
            <Trash2 size={28} color="#EF4444" />
          </View>

          <Text style={styles.modalTitle}>
            {isHindi ? 'मोटरसाइकिल को डेटाबेस से हटाएं?' : 'Delete Motorcycle from Database?'}
          </Text>

          <Text style={styles.modalMessage}>
            {isHindi
              ? `क्या आप वाकई "${bikeName}" ${regNo ? `(${regNo})` : ''} को डेटाबेस से पूरी तरह हटाना चाहते हैं? यह क्रिया स्थायी है और इसे वापस नहीं लिया जा सकता।`
              : `Are you sure you want to permanently delete "${bikeName}" ${regNo ? `(${regNo})` : ''} from the database? This action is permanent and cannot be undone.`}
          </Text>

          {/* Trust warning pill */}
          <View style={styles.warningPill}>
            <AlertTriangle size={14} color="#F59E0B" />
            <Text style={styles.warningPillText}>
              {isHindi
                ? 'सभी संबंधित तस्वीरें और रिकॉर्ड हमेशा के लिए हटा दिए जाएंगे।'
                : 'All uploaded images and fleet records will be permanently erased.'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isDeleting}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>
                {isHindi ? 'रद्द करें' : 'Cancel'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmDeleteBtn, isDeleting && styles.confirmDeleteBtnDisabled]}
              onPress={onConfirm}
              disabled={isDeleting}
              activeOpacity={0.8}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Trash2 size={16} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={styles.confirmDeleteBtnText}>
                    {isHindi ? 'हां, हटाएं' : 'Yes, Delete Bike'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 20, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.xl,
    padding: 24,
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalMessage: {
    color: '#94A3B8',
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  warningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
    width: '100%',
  },
  warningPillText: {
    color: '#FCD34D',
    fontSize: 11.5,
    flex: 1,
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#E2E8F0',
    fontSize: 13.5,
    fontWeight: '700',
  },
  confirmDeleteBtn: {
    flex: 1.3,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    backgroundColor: '#DC2626',
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmDeleteBtnDisabled: {
    opacity: 0.6,
  },
  confirmDeleteBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
});
