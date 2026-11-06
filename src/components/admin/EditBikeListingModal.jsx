import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import {
  X,
  Bike,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Ban,
  CheckCircle2,
  IndianRupee,
  Shield,
  Layers,
} from 'lucide-react-native';
import { COLORS, RADIUS } from '../../theme/colors';

export default function EditBikeListingModal({
  visible,
  bike,
  onClose,
  onSave,
  onDelete,
  onShowToast,
}) {
  if (!visible || !bike) return null;

  const [dailyPrice, setDailyPrice] = useState(String(bike.dailyPrice || 1500));
  const [deposit, setDeposit] = useState(String(bike.deposit || 3000));
  const [status, setStatus] = useState(bike.status || 'Approved');
  const [rules, setRules] = useState(bike.rules || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    if (onSave) {
      onSave(bike.id, {
        dailyPrice: Number(dailyPrice) || bike.dailyPrice,
        deposit: Number(deposit) || bike.deposit,
        status,
        rules,
      });
    }
    if (onShowToast) {
      onShowToast(`Listing ${bike.id} updated successfully.`);
    }
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(bike.id);
    }
    if (onShowToast) {
      onShowToast(`Listing ${bike.id} deleted from marketplace.`);
    }
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Edit Listing: {bike.brand} {bike.model}</Text>
              <Text style={styles.subTitle}>
                ID: {bike.id} • Reg: {bike.registrationNumber} • Owner: {bike.ownerName}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Status Selector */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Listing Status</Text>
              <View style={styles.statusRow}>
                {['Approved', 'Pending Verification', 'Suspended', 'Needs Correction'].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusPill, status === st && styles.statusPillActive]}
                    onPress={() => setStatus(st)}
                  >
                    <Text style={[styles.statusPillText, status === st && styles.statusPillTextActive]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pricing & Deposit */}
            <View style={styles.gridTwo}>
              <View style={styles.gridItem}>
                <Text style={styles.label}>Daily Rental Price (₹)</Text>
                <View style={styles.inputBox}>
                  <Text style={styles.curr}>₹</Text>
                  <TextInput
                    style={styles.textInput}
                    value={dailyPrice}
                    onChangeText={setDailyPrice}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.label}>Security Deposit (₹)</Text>
                <View style={styles.inputBox}>
                  <Text style={styles.curr}>₹</Text>
                  <TextInput
                    style={styles.textInput}
                    value={deposit}
                    onChangeText={setDeposit}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>

            {/* Rental Rules & Guidelines */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Rules & Usage Policies</Text>
              <TextInput
                style={styles.textArea}
                value={rules}
                onChangeText={setRules}
                multiline
                numberOfLines={3}
                placeholder="Listing rules..."
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={15} color="#EF4444" />
              <Text style={styles.deleteBtnText}>Delete Listing</Text>
            </TouchableOpacity>

            <View style={styles.saveGroup}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Save size={15} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmBox}>
              <Text style={styles.confirmTitle}>Delete Listing Permanently?</Text>
              <Text style={styles.confirmDesc}>
                This will delete "{bike.brand} {bike.model}" ({bike.id}) from the platform. Any ongoing dispute or booking records will be archived.
              </Text>

              <View style={styles.confirmBtns}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: '#E11D48' }]}
                  onPress={handleDelete}
                >
                  <Text style={styles.saveBtnText}>Yes, Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 20, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 620,
    backgroundColor: '#0D1526',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#0A1222',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCard,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subTitle: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 18,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  statusPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  statusPillText: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  statusPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  gridTwo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  gridItem: {
    flex: 1,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    height: 42,
  },
  curr: {
    color: '#38BDF8',
    fontSize: 15,
    fontWeight: '700',
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    height: '100%',
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  textArea: {
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.md,
    padding: 10,
    color: '#FFFFFF',
    fontSize: 12.5,
    minHeight: 70,
    textAlignVertical: 'top',
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  footer: {
    backgroundColor: '#0A1222',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 12.5,
    fontWeight: '700',
  },
  saveGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCardAlt,
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: '#0284C7',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmBox: {
    backgroundColor: '#0D1526',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  confirmTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  confirmDesc: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  confirmBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
});

