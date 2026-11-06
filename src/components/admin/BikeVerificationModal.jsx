import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Bike,
  User,
  MapPin,
  Calendar,
  Eye,
  Check,
  RotateCcw,
  Flag,
  Ban,
  Info,
  Lock,
} from 'lucide-react-native';
import { COLORS, RADIUS } from '../../theme/colors';

const { width } = Dimensions.get('window');

export default function BikeVerificationModal({
  visible,
  bike,
  onClose,
  onUpdateStatus,
  onShowToast,
}) {
  if (!visible || !bike) return null;

  const [confirmAction, setConfirmAction] = useState(null); // 'Approved' | 'Rejected' | 'Needs Correction' | 'Suspended' | 'Physical Inspection'
  const [adminRemark, setAdminRemark] = useState('');
  const [remarkError, setRemarkError] = useState('');
  const [selectedPhotoKey, setSelectedPhotoKey] = useState('front');

  const comparison = bike.comparison || [
    { field: 'Owner Name', submitted: bike.ownerName, extracted: bike.documents?.rc?.extracted?.ownerName || bike.ownerName, match: true },
    { field: 'Registration Number', submitted: bike.registrationNumber, extracted: bike.documents?.rc?.extracted?.regNo || bike.registrationNumber, match: true },
    { field: 'Bike Model', submitted: `${bike.brand} ${bike.model}`, extracted: bike.documents?.rc?.extracted?.model || `${bike.brand} ${bike.model}`, match: true },
    { field: 'Chassis Number', submitted: bike.chassisNumber || 'ME3H450XXXX88291', extracted: bike.documents?.rc?.extracted?.chassis || bike.chassisNumber, match: true },
  ];

  const handleActionClick = (action) => {
    setConfirmAction(action);
    setAdminRemark('');
    setRemarkError('');
  };

  const handleConfirmSubmit = () => {
    if ((confirmAction === 'Rejected' || confirmAction === 'Needs Correction') && !adminRemark.trim()) {
      setRemarkError('Admin remarks/reasons are mandatory when rejecting or requesting corrections.');
      return;
    }

    if (onUpdateStatus) {
      onUpdateStatus(bike.id, confirmAction, adminRemark);
    }
    if (onShowToast) {
      onShowToast(`Bike listing ${bike.id} status updated to "${confirmAction}".`);
    }
    setConfirmAction(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <View style={styles.bikeIconBox}>
                <Bike size={20} color="#FFFFFF" />
              </View>
              <View>
                <View style={styles.titleRow}>
                  <Text style={styles.modalTitle}>
                    {bike.brand} {bike.model}
                  </Text>
                  <View style={[styles.statusBadge, styles[`statusBadge_${(bike.status || '').replace(/\s+/g, '')}`]]}>
                    <Text style={styles.statusBadgeText}>{bike.status || 'Pending Verification'}</Text>
                  </View>
                </View>
                <Text style={styles.modalSub}>
                  Listing ID: <Text style={styles.mono}>{bike.id}</Text> • Reg: <Text style={styles.mono}>{bike.registrationNumber}</Text> • Owner: {bike.ownerName}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close modal">
              <X size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Simulated Notice Banner */}
          <View style={styles.simulatedBanner}>
            <Info size={16} color="#38BDF8" style={{ marginTop: 2 }} />
            <Text style={styles.simulatedBannerText}>
              <Text style={styles.simulatedBold}>Simulated Document OCR Verification:</Text> Non-government sandbox mode. Extracted document details and image matching are simulated for platform verification workflow testing.
            </Text>
          </View>

          {/* Two-Column Scrollable Body */}
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <View style={styles.twoColumnWrapper}>
              {/* Left Column: Bike & Owner Details */}
              <View style={styles.leftColumn}>
                {/* Bike Photographs Gallery */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeading}>Vehicle Photographs (4 Angles)</Text>
                  {bike.images ? (
                    <View style={styles.galleryWrapper}>
                      <View style={styles.mainPhotoBox}>
                        <Image
                          source={{ uri: bike.images[selectedPhotoKey] || bike.images.front }}
                          style={styles.mainPhoto}
                        />
                        <View style={styles.photoAngleBadge}>
                          <Text style={styles.photoAngleText}>{selectedPhotoKey.toUpperCase()} VIEW</Text>
                        </View>
                      </View>

                      <View style={styles.thumbnailsRow}>
                        {['front', 'rear', 'left', 'right'].map((angle) => (
                          <TouchableOpacity
                            key={angle}
                            style={[
                              styles.thumbBtn,
                              selectedPhotoKey === angle && styles.thumbBtnActive,
                            ]}
                            onPress={() => setSelectedPhotoKey(angle)}
                          >
                            <Image
                              source={{ uri: bike.images[angle] || bike.images.front }}
                              style={styles.thumbImage}
                            />
                            <Text style={styles.thumbLabel}>{angle.slice(0, 1).toUpperCase()}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.emptyText}>No photos provided.</Text>
                  )}
                </View>

                {/* Bike Specs Card */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeading}>Vehicle Specifications</Text>
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailRow}>
                      <Text style={styles.dLabel}>Brand & Model:</Text>
                      <Text style={styles.dValue}>{bike.brand} {bike.model}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.dLabel}>Manufacturing Year:</Text>
                      <Text style={styles.dValue}>{bike.year || '2024'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.dLabel}>Category:</Text>
                      <Text style={styles.dValue}>{bike.category || 'Cruiser'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.dLabel}>Registration No:</Text>
                      <Text style={[styles.dValue, styles.monoBold]}>{bike.registrationNumber}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.dLabel}>Chassis (VIN):</Text>
                      <Text style={[styles.dValue, styles.mono]}>{bike.chassisNumber || '—'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.dLabel}>Engine Number:</Text>
                      <Text style={[styles.dValue, styles.mono]}>{bike.engineNumber || '—'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.dLabel}>Daily Rental Price:</Text>
                      <Text style={[styles.dValue, { color: '#10B981', fontWeight: '800' }]}>
                        ₹{bike.dailyPrice || 1500} / day
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.dLabel}>Security Deposit:</Text>
                      <Text style={styles.dValue}>₹{bike.deposit || 3000}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.dLabel}>Pickup Location:</Text>
                      <Text style={styles.dValue}>{bike.pickupLocation || 'Bandra West'}</Text>
                    </View>
                  </View>

                  {bike.rules && (
                    <View style={styles.rulesBox}>
                      <Text style={styles.rulesHeading}>Listing Rules & Guidelines:</Text>
                      <Text style={styles.rulesContent}>{bike.rules}</Text>
                    </View>
                  )}
                </View>

                {/* Owner Information Card */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionHeading}>Owner Details</Text>
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailRow}>
                      <Text style={styles.dLabel}>Owner ID:</Text>
                      <Text style={[styles.dValue, styles.mono]}>{bike.ownerId || 'OWN-1001'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.dLabel}>Name:</Text>
                      <Text style={[styles.dValue, { fontWeight: '700' }]}>{bike.ownerName}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.dLabel}>Mobile:</Text>
                      <Text style={styles.dValue}>{bike.ownerPhone || '+91 98201 44521'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.dLabel}>Email:</Text>
                      <Text style={styles.dValue}>{bike.ownerEmail || 'owner@gmail.com'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Right Column: Document Verification & Comparison */}
              <View style={styles.rightColumn}>
                {/* Comparison Section (Requirement: Submitted vs Extracted) */}
                <View style={styles.sectionCard}>
                  <View style={styles.comparisonHeader}>
                    <Text style={styles.sectionHeading}>Data Consistency Check (OCR Match)</Text>
                    <View style={styles.outcomeBadge}>
                      <Text style={styles.outcomeBadgeText}>
                        Outcome: {bike.verificationOutcome || 'Passed'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.compTable}>
                    <View style={styles.compTableHeader}>
                      <Text style={[styles.compCol, styles.compColHeader, { flex: 1.2 }]}>Field</Text>
                      <Text style={[styles.compCol, styles.compColHeader, { flex: 1.6 }]}>Submitted Details</Text>
                      <Text style={[styles.compCol, styles.compColHeader, { flex: 1.6 }]}>Extracted OCR Details</Text>
                      <Text style={[styles.compCol, styles.compColHeader, { width: 50, textAlign: 'center' }]}>Match</Text>
                    </View>

                    {comparison.map((row, idx) => (
                      <View key={idx} style={[styles.compTableRow, idx % 2 === 1 && styles.compTableRowAlt]}>
                        <Text style={[styles.compCol, { flex: 1.2, fontWeight: '700', color: '#CBD5E1' }]}>
                          {row.field}
                        </Text>
                        <Text style={[styles.compCol, { flex: 1.6, color: '#FFFFFF' }]}>
                          {row.submitted}
                        </Text>
                        <Text style={[styles.compCol, { flex: 1.6, color: row.match ? '#FFFFFF' : '#EF4444' }]}>
                          {row.extracted}
                        </Text>
                        <View style={{ width: 50, alignItems: 'center' }}>
                          {row.match ? (
                            <CheckCircle2 size={16} color="#10B981" />
                          ) : (
                            <XCircle size={16} color="#EF4444" />
                          )}
                        </View>
                      </View>
                    ))}
                  </View>

                  {comparison.some((c) => !c.match) && (
                    <View style={styles.mismatchAlert}>
                      <AlertTriangle size={15} color="#EF4444" />
                      <Text style={styles.mismatchAlertText}>
                        Mismatch detected! RC owner name does not match the applicant identity without authorization deed.
                      </Text>
                    </View>
                  )}
                </View>

                {/* Document Verification Cards (5 sections) */}
                <Text style={[styles.sectionHeading, { marginTop: 8, marginBottom: 8 }]}>
                  Submitted Compliance Documents
                </Text>

                {/* 1. RC Card */}
                <View style={styles.docCheckCard}>
                  <View style={styles.docCheckTop}>
                    <FileText size={18} color="#38BDF8" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docCheckTitle}>1. Registration Certificate (RC)</Text>
                      <Text style={styles.docCheckMeta}>
                        File: {bike.documents?.rc?.fileName || 'RC_SmartCard.pdf'} • Size: {bike.documents?.rc?.fileSize || '1.8 MB'}
                      </Text>
                    </View>
                    <View style={[styles.miniStatusBadge, styles[`miniStatus_${(bike.rcStatus || 'Verified').replace(/\s+/g, '')}`]]}>
                      <Text style={styles.miniStatusText}>{bike.rcStatus || 'Verified'}</Text>
                    </View>
                  </View>
                  <View style={styles.docExtractedDetails}>
                    <Text style={styles.extractedText}>
                      <Text style={styles.extractedLabel}>Extracted Reg:</Text> {bike.documents?.rc?.extracted?.regNo || bike.registrationNumber}
                    </Text>
                    <Text style={styles.extractedText}>
                      <Text style={styles.extractedLabel}>Registered Name:</Text> {bike.documents?.rc?.extracted?.ownerName || bike.ownerName}
                    </Text>
                    <Text style={styles.extractedText}>
                      <Text style={styles.extractedLabel}>Extracted Model:</Text> {bike.documents?.rc?.extracted?.model || `${bike.brand} ${bike.model}`}
                    </Text>
                  </View>
                </View>

                {/* 2. Insurance Certificate */}
                <View style={styles.docCheckCard}>
                  <View style={styles.docCheckTop}>
                    <ShieldCheck size={18} color="#38BDF8" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docCheckTitle}>2. Insurance Certificate</Text>
                      <Text style={styles.docCheckMeta}>
                        Policy: {bike.documents?.insurance?.policyNumber || '3005/2024/9812401'} • Exp: {bike.documents?.insurance?.expiryDate || '2027-05-18'}
                      </Text>
                    </View>
                    <View style={[styles.miniStatusBadge, styles[`miniStatus_${(bike.insuranceStatus || 'Verified').replace(/\s+/g, '')}`]]}>
                      <Text style={styles.miniStatusText}>{bike.insuranceStatus || 'Verified'}</Text>
                    </View>
                  </View>
                  <View style={styles.docExtractedDetails}>
                    <Text style={styles.extractedText}>
                      <Text style={styles.extractedLabel}>Insurer:</Text> {bike.documents?.insurance?.extracted?.insurer || 'ICICI Lombard GIC Ltd'}
                    </Text>
                    <Text style={styles.extractedText}>
                      <Text style={styles.extractedLabel}>Vehicle No:</Text> {bike.documents?.insurance?.extracted?.vehicleNo || bike.registrationNumber}
                    </Text>
                  </View>
                </View>

                {/* 3. PUC Certificate */}
                <View style={styles.docCheckCard}>
                  <View style={styles.docCheckTop}>
                    <FileText size={18} color="#38BDF8" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docCheckTitle}>3. Pollution Under Control (PUC)</Text>
                      <Text style={styles.docCheckMeta}>
                        Expiry: {bike.documents?.puc?.expiryDate || '2027-04-10'}
                      </Text>
                    </View>
                    <View style={[styles.miniStatusBadge, styles[`miniStatus_${(bike.pucStatus || 'Verified').replace(/\s+/g, '')}`]]}>
                      <Text style={styles.miniStatusText}>{bike.pucStatus || 'Verified'}</Text>
                    </View>
                  </View>
                </View>

                {/* 4. Owner Identity */}
                <View style={styles.docCheckCard}>
                  <View style={styles.docCheckTop}>
                    <User size={18} color="#38BDF8" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docCheckTitle}>4. Owner Identity (Aadhaar / Passport)</Text>
                      <Text style={styles.docCheckMeta}>
                        Document: {bike.documents?.ownerIdentity?.fileName || 'Aadhaar_Front_Back.pdf'}
                      </Text>
                    </View>
                    <View style={[styles.miniStatusBadge, styles.miniStatus_Verified]}>
                      <Text style={styles.miniStatusText}>Verified Identity</Text>
                    </View>
                  </View>
                </View>

                {/* 5. Authorization Deed (if applicable) */}
                <View style={styles.docCheckCard}>
                  <View style={styles.docCheckTop}>
                    <FileText size={18} color="#38BDF8" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docCheckTitle}>5. Ownership Authorization Declaration</Text>
                      <Text style={styles.docCheckMeta}>
                        Declared as: {bike.documents?.authorization?.type || 'Registered Vehicle Owner'}
                      </Text>
                    </View>
                    <View style={[styles.miniStatusBadge, bike.documents?.authorization?.declared ? styles.miniStatus_Verified : styles.miniStatus_Rejected]}>
                      <Text style={styles.miniStatusText}>
                        {bike.documents?.authorization?.declared ? 'Authorized' : 'Missing Authorization'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Fixed Admin Action Bar */}
          <View style={styles.adminActionBar}>
            <View style={styles.actionBarLeft}>
              <Text style={styles.actionPromptText}>Select Verification Action:</Text>
            </View>

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.actBtn, styles.actBtnApprove]}
                onPress={() => handleActionClick('Approved')}
                activeOpacity={0.8}
              >
                <Check size={16} color="#FFFFFF" />
                <Text style={styles.actBtnText}>Approve Bike</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actBtn, styles.actBtnCorrection]}
                onPress={() => handleActionClick('Needs Correction')}
                activeOpacity={0.8}
              >
                <RotateCcw size={15} color="#FFFFFF" />
                <Text style={styles.actBtnText}>Request Correction</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actBtn, styles.actBtnFlag]}
                onPress={() => handleActionClick('Physical Inspection')}
                activeOpacity={0.8}
              >
                <Flag size={15} color="#FFFFFF" />
                <Text style={styles.actBtnText}>Physical Inspection</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actBtn, styles.actBtnReject]}
                onPress={() => handleActionClick('Rejected')}
                activeOpacity={0.8}
              >
                <Ban size={15} color="#FFFFFF" />
                <Text style={styles.actBtnText}>Reject Listing</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Confirmation & Remarks Dialog */}
      {confirmAction && (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>
                Confirm Action: {confirmAction}
              </Text>
              <Text style={styles.confirmDesc}>
                {confirmAction === 'Approved'
                  ? `Are you sure you want to approve "${bike.brand} ${bike.model}"? It will become visible on the public rental fleet.`
                  : confirmAction === 'Rejected'
                  ? 'Please specify the exact reason for rejecting this listing (visible to owner).'
                  : `Please specify the details for action "${confirmAction}":`}
              </Text>

              {(confirmAction === 'Rejected' || confirmAction === 'Needs Correction' || confirmAction === 'Physical Inspection') && (
                <View style={styles.remarkBox}>
                  <Text style={styles.remarkLabel}>
                    Admin Remark / Reason <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.remarkInput}
                    value={adminRemark}
                    onChangeText={setAdminRemark}
                    placeholder="e.g. RC owner name mismatch with submitted applicant; re-upload required."
                    placeholderTextColor={COLORS.textMuted}
                    multiline
                    numberOfLines={3}
                  />
                  {remarkError ? <Text style={styles.errorText}>{remarkError}</Text> : null}
                </View>
              )}

              <View style={styles.confirmBtnsRow}>
                <TouchableOpacity
                  style={styles.confirmCancelBtn}
                  onPress={() => setConfirmAction(null)}
                >
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmSubmitBtn,
                    confirmAction === 'Rejected' ? styles.btnRed : styles.btnBlue,
                  ]}
                  onPress={handleConfirmSubmit}
                >
                  <Text style={styles.confirmSubmitText}>Confirm & Apply</Text>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 20, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 1140,
    height: '92%',
    backgroundColor: '#0D1526',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#0A1222',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCard,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bikeIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#38BDF8',
  },
  monoBold: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#38BDF8',
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  simulatedBanner: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.2)',
  },
  simulatedBannerText: {
    fontSize: 11.5,
    color: '#CBD5E1',
    lineHeight: 16,
    flex: 1,
  },
  simulatedBold: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  twoColumnWrapper: {
    flexDirection: width < 860 ? 'column' : 'row',
    gap: 16,
  },
  leftColumn: {
    flex: 1,
    gap: 16,
  },
  rightColumn: {
    flex: 1.2,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#070E1B',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  galleryWrapper: {
    gap: 10,
  },
  mainPhotoBox: {
    height: 180,
    width: '100%',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.bgDark,
  },
  mainPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoAngleBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  photoAngleText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
  },
  thumbnailsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  thumbBtn: {
    flex: 1,
    height: 52,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
    position: 'relative',
  },
  thumbBtnActive: {
    borderColor: '#38BDF8',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbLabel: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  detailsGrid: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  dValue: {
    fontSize: 12.5,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  rulesBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: COLORS.bgDark,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  rulesHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  rulesContent: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  outcomeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  outcomeBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  compTable: {
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  compTableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCard,
  },
  compTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  compTableRowAlt: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  compCol: {
    fontSize: 11.5,
    paddingRight: 6,
  },
  compColHeader: {
    color: '#94A3B8',
    fontWeight: '800',
    fontSize: 10.5,
    textTransform: 'uppercase',
  },
  mismatchAlert: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: RADIUS.sm,
    padding: 10,
    marginTop: 10,
  },
  mismatchAlertText: {
    fontSize: 11.5,
    color: '#EF4444',
    lineHeight: 16,
    flex: 1,
  },
  docCheckCard: {
    backgroundColor: '#070E1B',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 8,
  },
  docCheckTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  docCheckTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  docCheckMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  docExtractedDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 3,
  },
  extractedText: {
    fontSize: 11.5,
    color: '#E2E8F0',
  },
  extractedLabel: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  miniStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  miniStatus_Verified: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  miniStatus_PendingReview: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  miniStatus_NeedsManualReview: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  miniStatus_Rejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  miniStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
  },
  adminActionBar: {
    backgroundColor: '#0A1222',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBarLeft: {
    justifyContent: 'center',
  },
  actionPromptText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  actBtnApprove: {
    backgroundColor: '#10B981',
  },
  actBtnCorrection: {
    backgroundColor: '#D97706',
  },
  actBtnFlag: {
    backgroundColor: '#0284C7',
  },
  actBtnReject: {
    backgroundColor: '#E11D48',
  },
  actBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  statusBadge_Approved: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusBadge_PendingVerification: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  statusBadge_NeedsCorrection: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  statusBadge_Rejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusBadge_Suspended: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmCard: {
    backgroundColor: '#0D1526',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: RADIUS.lg,
    padding: 22,
    width: '100%',
    maxWidth: 460,
  },
  confirmTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  confirmDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  remarkBox: {
    marginBottom: 16,
  },
  remarkLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  remarkInput: {
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.sm,
    padding: 10,
    color: '#FFFFFF',
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11.5,
    marginTop: 4,
  },
  confirmBtnsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  confirmCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCardAlt,
  },
  confirmCancelText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  confirmSubmitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  btnBlue: {
    backgroundColor: '#0284C7',
  },
  btnRed: {
    backgroundColor: '#E11D48',
  },
  confirmSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
});

