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
import { X, Compass, Share2, ShieldCheck, User, Phone, Mail, FileCheck } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';

export default function QuoteModal({
  visible,
  onClose,
  bookingData,
  bike,
  data,
  isOwner = false,
}) {
  const activeData = data || bookingData;
  if (!activeData && !bike) return null;

  // Resolve target bike
  const targetBike =
    bike ||
    activeData?.bike ||
    (typeof activeData?.bikeId === 'object' ? activeData.bikeId : null) ||
    {};

  const bookingRef =
    activeData?.refId ||
    activeData?.bookingCode ||
    targetBike?.listingCode ||
    'RDE-891024';

  const bikeName = targetBike.name || `${targetBike.brand || ''} ${targetBike.model || 'Motorcycle'}`.trim() || 'Motorcycle';
  const bikeModel = targetBike.model || '';
  const displacement = targetBike.specs?.displacement || 'Standard';

  const pickupDate =
    activeData?.pickupDate ||
    (activeData?.pickupDatetime ? new Date(activeData.pickupDatetime).toLocaleDateString() : 'Scheduled');
  const pickupTime = activeData?.pickupTime || '09:00 AM';
  const returnDate =
    activeData?.returnDate ||
    (activeData?.returnDatetime ? new Date(activeData.returnDatetime).toLocaleDateString() : 'Scheduled');
  const returnTime = activeData?.returnTime || '09:00 PM';
  const days = activeData?.days || activeData?.durationDays || 1;

  const dailyPrice = targetBike.pricePerDay || targetBike.dailyPrice || activeData?.pricing?.dailyRate || 1500;
  const rentalFee = activeData?.rentalFee ?? activeData?.rentalCharge ?? activeData?.pricing?.rentalTotal ?? (dailyPrice * days);
  const deposit = activeData?.deposit ?? targetBike.deposit ?? targetBike.securityDeposit ?? activeData?.pricing?.securityDeposit ?? 3000;
  const deliveryFee = activeData?.deliveryFee ?? activeData?.pricing?.deliveryFee ?? 0;
  const total = activeData?.total ?? activeData?.pricing?.totalPayable ?? (rentalFee + deposit + deliveryFee);

  // Rider / Renter info
  const riderName =
    activeData?.riderName ||
    activeData?.riderDetails?.fullName ||
    activeData?.renterId?.fullName ||
    'Registered Rider';
  const riderPhone =
    activeData?.riderPhone ||
    activeData?.riderDetails?.phoneNumber ||
    activeData?.renterId?.phoneNumber ||
    '';
  const riderEmail =
    activeData?.riderEmail ||
    activeData?.riderDetails?.email ||
    activeData?.renterId?.email ||
    '';
  const drivingLicense =
    activeData?.renterId?.drivingLicense?.dlNumber ||
    activeData?.drivingLicense ||
    'Verified at Pickup';

  const imageSource =
    targetBike.imageSource ||
    (typeof targetBike.image === 'string' ? { uri: targetBike.image } : targetBike.image) ||
    (targetBike.photos?.front ? { uri: targetBike.photos.front } : null) ||
    (targetBike.images?.front ? { uri: targetBike.images.front } : null) ||
    require('../assets/hero.png');

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          `THE ROAD EAGLE - Booking Voucher\n` +
          `Ref: #${bookingRef}\n` +
          `Vehicle: ${bikeName} (${bikeModel})\n` +
          `Pickup: ${pickupDate} (${pickupTime})\n` +
          `Return: ${returnDate} (${returnTime})\n` +
          `Rental Duration: ${days} Days\n` +
          `Total Payable: ₹${total.toLocaleString('en-IN')}\n` +
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
                      <Text style={styles.brandTagline}>Single-Owner Direct Fleet Rentals</Text>
                      <Text style={styles.brandTagline}>123 Rider Avenue, Sector 5, Bandra West</Text>
                    </View>
                    <View style={styles.voucherRefBox}>
                      <Text style={styles.refBadge}>CONFIRMED VOUCHER</Text>
                      <Text style={styles.refText}>Ref: #{bookingRef}</Text>
                      <Text style={styles.dateText}>{new Date().toLocaleDateString('en-IN')}</Text>
                    </View>
                  </View>

                  {/* Customer / Rider Details if viewing as owner or customer details available */}
                  {(isOwner || riderName !== 'Registered Rider' || riderPhone) && (
                    <View style={styles.renterDetailCard}>
                      <View style={styles.renterDetailHeader}>
                        <User size={15} color="#0284C7" />
                        <Text style={styles.renterDetailTitle}>Renter / Customer Details</Text>
                      </View>
                      <View style={styles.renterGrid}>
                        <View style={styles.renterField}>
                          <Text style={styles.renterFieldLabel}>Full Name</Text>
                          <Text style={styles.renterFieldValue}>{riderName}</Text>
                        </View>
                        {riderPhone ? (
                          <View style={styles.renterField}>
                            <Text style={styles.renterFieldLabel}>Phone Number</Text>
                            <Text style={styles.renterFieldValue}>{riderPhone}</Text>
                          </View>
                        ) : null}
                        {riderEmail ? (
                          <View style={styles.renterField}>
                            <Text style={styles.renterFieldLabel}>Email</Text>
                            <Text style={styles.renterFieldValue}>{riderEmail}</Text>
                          </View>
                        ) : null}
                        <View style={styles.renterField}>
                          <Text style={styles.renterFieldLabel}>Driving Licence</Text>
                          <Text style={styles.renterFieldValue}>{drivingLicense}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Vehicle summary */}
                  <View style={styles.vehicleCard}>
                    <Image
                      source={imageSource}
                      style={styles.vehicleImg}
                      resizeMode="cover"
                    />
                    <View style={styles.vehicleDetails}>
                      <Text style={styles.vehicleName}>{bikeName}</Text>
                      <Text style={styles.vehicleModel}>
                        {bikeModel} • {displacement}
                      </Text>
                      <Text style={styles.scheduleText}>
                        Pickup: {pickupDate} ({pickupTime})
                      </Text>
                      <Text style={styles.scheduleText}>
                        Return: {returnDate} ({returnTime})
                      </Text>
                      <Text style={styles.hubText}>
                        Pickup Hub: {targetBike.pickupAddress || '123 Rider Avenue, Sector 5, Bandra West'}
                      </Text>
                    </View>
                  </View>

                  {/* Price breakdown (100% Direct merchant to fleet owner) */}
                  <View style={styles.breakdownTable}>
                    <View style={styles.tableRow}>
                      <Text style={styles.colDesc}>
                        Base Fleet Rental ({days} Days @ ₹{dailyPrice.toLocaleString('en-IN')})
                      </Text>
                      <Text style={styles.colAmount}>
                        ₹{rentalFee.toLocaleString('en-IN')}
                      </Text>
                    </View>

                    {deliveryFee > 0 ? (
                      <View style={styles.tableRow}>
                        <Text style={styles.colDesc}>Doorstep Delivery Fee</Text>
                        <Text style={styles.colAmount}>₹{deliveryFee.toLocaleString('en-IN')}</Text>
                      </View>
                    ) : null}

                    <View style={styles.tableRow}>
                      <Text style={styles.colDesc}>Refundable Security Deposit*</Text>
                      <Text style={[styles.colAmount, { color: '#0284C7' }]}>
                        ₹{deposit.toLocaleString('en-IN')}
                      </Text>
                    </View>

                    <View style={[styles.tableRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Total Payable (100% to Fleet Owner)</Text>
                      <Text style={styles.totalAmount}>
                        ₹{total.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {/* Checklist banner */}
                  <View style={styles.checklistBanner}>
                    <ShieldCheck size={16} color="#1D4ED8" />
                    <Text style={styles.checklistText}>
                      <Text style={{ fontWeight: '700' }}>Mandatory at pickup: </Text>
                      Original Driving Licence, Govt ID (Aadhaar/Passport), 2 Photos. 1 Complimentary helmet included.
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
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: 10,
    fontWeight: '800',
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
  renterDetailCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  renterDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  renterDetailTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0369A1',
  },
  renterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  renterField: {
    minWidth: '45%',
  },
  renterFieldLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  renterFieldValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
    marginTop: 1,
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
  hubText: {
    fontSize: 10.5,
    color: '#0284C7',
    marginTop: 2,
    fontWeight: '600',
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
