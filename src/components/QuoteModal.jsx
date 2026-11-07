import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Share,
} from 'react-native';
import { X, Compass, Share2, ShieldCheck } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';

export default function QuoteModal({
  visible,
  onClose,
  bookingData,
  bike,
}) {
  if (!bike || !bookingData) return null;

  const bookingRef = bookingData.refId || 'RDE-784920';

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          `THE ROAD EAGLE - Booking Voucher\n` +
          `Ref: #${bookingRef}\n` +
          `Vehicle: ${bike.name} (${bike.model})\n` +
          `Pickup: ${bookingData.pickupDate} (${bookingData.pickupTime})\n` +
          `Return: ${bookingData.returnDate} (${bookingData.returnTime})\n` +
          `Rental Duration: ${bookingData.days} Days\n` +
          `Total Payable: ₹${(bookingData.rentalCharge + (bike.deposit || bike.securityDeposit || 0)).toLocaleString()}\n` +
          `Mandatory at pickup: Driving licence, ID proof, 2 photos.`,
      });
    } catch {}
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
            <View style={[styles.modalCard, SHADOWS.card]}>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <X size={18} color="#0F172A" />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Printable Light Theme Invoice Card */}
                <View style={styles.voucherContainer}>
                  {/* Brand header */}
                  <View style={styles.voucherHeader}>
                    <View>
                      <View style={styles.brandRow}>
                        <Compass size={20} color="#0284C7" />
                        <Text style={styles.brandName}>THE ROAD EAGLE</Text>
                      </View>
                      <Text style={styles.brandTagline}>Premium Motorcycle Rentals</Text>
                      <Text style={styles.brandTagline}>123 Rider Avenue, Sector 5</Text>
                    </View>
                    <View style={styles.voucherRefBox}>
                      <Text style={styles.refBadge}>OFFICIAL VOUCHER</Text>
                      <Text style={styles.refText}>Ref: #{bookingRef}</Text>
                      <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
                    </View>
                  </View>

                  {/* Vehicle summary */}
                  <View style={styles.vehicleCard}>
                    <Image
                      source={bike.imageSource}
                      style={styles.vehicleImg}
                      resizeMode="cover"
                    />
                    <View style={styles.vehicleDetails}>
                      <Text style={styles.vehicleName}>{bike.name}</Text>
                      <Text style={styles.vehicleModel}>
                        {bike.model} • {bike.specs?.displacement}
                      </Text>
                      <Text style={styles.scheduleText}>
                        Pickup: {bookingData.pickupDate} ({bookingData.pickupTime})
                      </Text>
                      <Text style={styles.scheduleText}>
                        Return: {bookingData.returnDate} ({bookingData.returnTime})
                      </Text>
                    </View>
                  </View>

                  {/* Price breakdown */}
                  <View style={styles.breakdownTable}>
                    <View style={styles.tableRow}>
                      <Text style={styles.colDesc}>
                        Base Rental ({bookingData.days} Days @ ₹{bike.pricePerDay || bike.dailyPrice || 1500})
                      </Text>
                      <Text style={styles.colAmount}>
                        ₹{bookingData.rentalCharge?.toLocaleString()}
                      </Text>
                    </View>

                    <View style={styles.tableRow}>
                      <Text style={styles.colDesc}>Refundable Security Deposit*</Text>
                      <Text style={[styles.colAmount, { color: '#0284C7' }]}>
                        ₹{(bike.deposit || bike.securityDeposit || 3000)?.toLocaleString()}
                      </Text>
                    </View>

                    <View style={[styles.tableRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Total Estimated Payable</Text>
                      <Text style={styles.totalAmount}>
                        ₹{(bookingData.rentalCharge + (bike.deposit || bike.securityDeposit || 0)).toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* Checklist banner */}
                  <View style={styles.checklistBanner}>
                    <ShieldCheck size={16} color="#1D4ED8" />
                    <Text style={styles.checklistText}>
                      <Text style={{ fontWeight: '700' }}>Mandatory at pickup: </Text>
                      Original Driving Licence, Govt ID (Aadhaar/Passport), 2 Photos. 1 Helmet included free.
                    </Text>
                  </View>

                  {/* Action buttons */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.shareBtn}
                      onPress={handleShare}
                      activeOpacity={0.8}
                    >
                      <Share2 size={16} color="#FFFFFF" />
                      <Text style={styles.shareBtnText}>Share Voucher</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.doneBtn}
                      onPress={onClose}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.doneBtnText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
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
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    padding: 18,
    maxHeight: '92%',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  voucherContainer: {
    paddingTop: 8,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#00A3FF',
    paddingBottom: 14,
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0284C7',
  },
  brandTagline: {
    fontSize: 11,
    color: '#64748B',
  },
  voucherRefBox: {
    alignItems: 'flex-end',
  },
  refBadge: {
    backgroundColor: '#E0F2FE',
    color: '#0369A1',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 4,
  },
  refText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  dateText: {
    fontSize: 10,
    color: '#64748B',
  },
  vehicleCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    padding: 12,
    gap: 12,
    marginBottom: 16,
  },
  vehicleImg: {
    width: 80,
    height: 60,
    borderRadius: RADIUS.sm,
  },
  vehicleDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  vehicleModel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  scheduleText: {
    fontSize: 11,
    color: '#334155',
  },
  breakdownTable: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  totalRow: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#0F172A',
    paddingVertical: 12,
  },
  colDesc: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
  },
  colAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0284C7',
  },
  checklistBanner: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: RADIUS.sm,
    padding: 10,
    marginBottom: 16,
  },
  checklistText: {
    fontSize: 11,
    color: '#1E40AF',
    flex: 1,
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  shareBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  doneBtnText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
});
