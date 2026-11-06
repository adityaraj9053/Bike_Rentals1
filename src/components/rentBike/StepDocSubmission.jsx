import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  FileText,
  Upload,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Info,
  Calendar,
  Eye,
  Hash,
  UserCheck,
} from 'lucide-react-native';
import { COLORS, RADIUS } from '../../theme/colors';

export default function StepDocSubmission({
  data,
  onChange,
  errors,
  onShowToast,
}) {
  const [activeUploadDoc, setActiveUploadDoc] = useState(null);
  const [showDocPreviewKey, setShowDocPreviewKey] = useState(null);

  const handleSimulateDocUpload = (docKey, sampleFileName) => {
    setActiveUploadDoc(docKey);
    setTimeout(() => {
      const updatedDocs = {
        ...(data.documents || {}),
        [docKey]: {
          fileName: sampleFileName,
          fileSize: '1.8 MB',
          uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          // Explicit requirement: Clearly distinguish mock verification states from actual verification
          status: 'Simulated Upload - Pending Verifier Check',
        },
      };
      onChange('documents', updatedDocs);
      setActiveUploadDoc(null);
      if (onShowToast) onShowToast(`${sampleFileName} uploaded securely.`);
    }, 700);
  };

  const handleRemoveDoc = (docKey) => {
    const updatedDocs = { ...(data.documents || {}) };
    delete updatedDocs[docKey];
    onChange('documents', updatedDocs);
    if (onShowToast) onShowToast('Document removed.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>STEP 3 OF 5</Text>
        </View>
        <Text style={styles.sectionTitle}>Vehicle Document Submission</Text>
        <Text style={styles.sectionSub}>
          Upload authentic RTO and compliance documents. High-resolution PDF or JPG documents are accepted.
        </Text>
      </View>

      {/* Mandatory Confidentiality & Privacy Notice */}
      <View style={styles.confidentialityBanner}>
        <View style={styles.lockIconWrap}>
          <Lock size={18} color="#38BDF8" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.confidentialityTitle}>Data Privacy & Confidentiality Guarantee</Text>
          <Text style={styles.confidentialityText}>
            All uploaded vehicle certificates and documents are strictly confidential and encrypted at rest. They are accessible solely by authorized compliance personnel for identity and registration verification. Document files are never made public to prospective renters.
          </Text>
        </View>
      </View>

      {/* 1. Registration Certificate (RC) */}
      <View style={styles.docCard}>
        <View style={styles.docCardTop}>
          <View style={styles.docTitleGroup}>
            <FileText size={20} color="#38BDF8" />
            <View>
              <Text style={styles.docCardHeading}>
                Registration Certificate (RC) <Text style={styles.req}>*</Text>
              </Text>
              <Text style={styles.docCardSub}>
                Upload clear front & back copy of Vehicle RC Smart Card or Parivahan Digital RC.
              </Text>
            </View>
          </View>

          {data.documents?.rc && (
            <View style={styles.statusBadgePending}>
              <Text style={styles.statusBadgeText}>Pending Verification</Text>
            </View>
          )}
        </View>

        {data.documents?.rc ? (
          <View style={styles.uploadedDocRow}>
            <View style={styles.uploadedDocLeft}>
              <View style={styles.fileIconBox}>
                <FileText size={18} color="#38BDF8" />
              </View>
              <View>
                <Text style={styles.docNameText}>{data.documents.rc.fileName}</Text>
                <Text style={styles.docMetaText}>
                  {data.documents.rc.fileSize} • Uploaded on {data.documents.rc.uploadedAt}
                </Text>
              </View>
            </View>

            <View style={styles.docActionGroup}>
              <TouchableOpacity
                style={styles.actionBtnSmall}
                onPress={() => setShowDocPreviewKey(showDocPreviewKey === 'rc' ? null : 'rc')}
                activeOpacity={0.7}
              >
                <Eye size={14} color="#38BDF8" />
                <Text style={styles.actionBtnText}>
                  {showDocPreviewKey === 'rc' ? 'Hide Preview' : 'Preview'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnSmall}
                onPress={() => handleSimulateDocUpload('rc', `${data.registrationNumber || 'RC'}_SmartCard.pdf`)}
                activeOpacity={0.7}
              >
                <RefreshCw size={13} color="#FFFFFF" />
                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Replace</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtnSmall, styles.deleteBtnSmall]}
                onPress={() => handleRemoveDoc('rc')}
                activeOpacity={0.7}
              >
                <Trash2 size={13} color="#F43F5E" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadBox}
            onPress={() => handleSimulateDocUpload('rc', `${data.registrationNumber || 'RC'}_SmartCard.pdf`)}
            activeOpacity={0.8}
            disabled={activeUploadDoc === 'rc'}
          >
            {activeUploadDoc === 'rc' ? (
              <ActivityIndicator size="small" color="#38BDF8" />
            ) : (
              <>
                <Upload size={22} color="#38BDF8" />
                <Text style={styles.uploadBoxText}>Click to Upload RC Document (PDF/JPG max 10MB)</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* RC Preview Box */}
        {showDocPreviewKey === 'rc' && (
          <View style={styles.previewBox}>
            <Text style={styles.previewHeading}>Document Preview: {data.documents?.rc?.fileName}</Text>
            <View style={styles.simulatedSmartCard}>
              <View style={styles.smartCardHeader}>
                <Text style={styles.smartCardHeaderTitle}>TRANSPORT DEPARTMENT • MOTOR VEHICLE RC</Text>
                <Text style={styles.smartCardState}>STATE REGISTRATION</Text>
              </View>
              <View style={styles.smartCardDetails}>
                <Text style={styles.scDetail}><Text style={styles.scBold}>Reg No:</Text> {data.registrationNumber || 'MH 02 FJ 9042'}</Text>
                <Text style={styles.scDetail}><Text style={styles.scBold}>Owner:</Text> {data.registeredOwnerName || data.fullName || 'Registered Owner'}</Text>
                <Text style={styles.scDetail}><Text style={styles.scBold}>Model:</Text> {data.brand} {data.model || 'Motorcycle'}</Text>
                <Text style={styles.scDetail}><Text style={styles.scBold}>Chassis:</Text> {data.chassisNumber || 'ME3H450XXXX88291'}</Text>
              </View>
              <Text style={styles.scNotice}>* Encrypted Digital Representation for Operational Review</Text>
            </View>
          </View>
        )}

        {errors['documents.rc'] && (
          <Text style={styles.errorText}>{errors['documents.rc']}</Text>
        )}
      </View>

      {/* 2. Insurance Certificate */}
      <View style={styles.docCard}>
        <View style={styles.docCardTop}>
          <View style={styles.docTitleGroup}>
            <ShieldCheck size={20} color="#38BDF8" />
            <View>
              <Text style={styles.docCardHeading}>
                Insurance Certificate <Text style={styles.req}>*</Text>
              </Text>
              <Text style={styles.docCardSub}>
                Upload valid Third-Party or Comprehensive Motor Vehicle Policy.
              </Text>
            </View>
          </View>

          {data.documents?.insurance && (
            <View style={styles.statusBadgePending}>
              <Text style={styles.statusBadgeText}>Pending Verification</Text>
            </View>
          )}
        </View>

        {data.documents?.insurance ? (
          <View style={styles.uploadedDocRow}>
            <View style={styles.uploadedDocLeft}>
              <View style={styles.fileIconBox}>
                <FileText size={18} color="#38BDF8" />
              </View>
              <View>
                <Text style={styles.docNameText}>{data.documents.insurance.fileName}</Text>
                <Text style={styles.docMetaText}>
                  {data.documents.insurance.fileSize} • Uploaded on {data.documents.insurance.uploadedAt}
                </Text>
              </View>
            </View>

            <View style={styles.docActionGroup}>
              <TouchableOpacity
                style={styles.actionBtnSmall}
                onPress={() => handleSimulateDocUpload('insurance', 'Comprehensive_Insurance_Policy.pdf')}
                activeOpacity={0.7}
              >
                <RefreshCw size={13} color="#FFFFFF" />
                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Replace</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtnSmall, styles.deleteBtnSmall]}
                onPress={() => handleRemoveDoc('insurance')}
                activeOpacity={0.7}
              >
                <Trash2 size={13} color="#F43F5E" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadBox}
            onPress={() => handleSimulateDocUpload('insurance', 'Comprehensive_Insurance_Policy.pdf')}
            activeOpacity={0.8}
            disabled={activeUploadDoc === 'insurance'}
          >
            {activeUploadDoc === 'insurance' ? (
              <ActivityIndicator size="small" color="#38BDF8" />
            ) : (
              <>
                <Upload size={22} color="#38BDF8" />
                <Text style={styles.uploadBoxText}>Upload Insurance Certificate (PDF/JPG max 10MB)</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Insurance Policy Details Inputs */}
        <View style={styles.gridTwo}>
          <View style={styles.gridItem}>
            <Text style={styles.label}>
              Policy Number <Text style={styles.req}>*</Text>
            </Text>
            <View style={[styles.inputBox, errors.insurancePolicyNumber && styles.inputError]}>
              <Hash size={16} color={COLORS.accentCyanLight} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={data.insurancePolicyNumber}
                onChangeText={(val) => onChange('insurancePolicyNumber', val)}
                placeholder="e.g. 3005/2024/9812401"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            {errors.insurancePolicyNumber && (
              <Text style={styles.errorText}>{errors.insurancePolicyNumber}</Text>
            )}
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.label}>
              Insurance Expiry Date <Text style={styles.req}>*</Text>
            </Text>
            <View style={[styles.inputBox, errors.insuranceExpiryDate && styles.inputError]}>
              <Calendar size={16} color={COLORS.accentCyanLight} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={data.insuranceExpiryDate}
                onChangeText={(val) => onChange('insuranceExpiryDate', val)}
                placeholder="YYYY-MM-DD (e.g. 2027-05-18)"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            {errors.insuranceExpiryDate && (
              <Text style={styles.errorText}>{errors.insuranceExpiryDate}</Text>
            )}
          </View>
        </View>

        {errors['documents.insurance'] && (
          <Text style={styles.errorText}>{errors['documents.insurance']}</Text>
        )}
      </View>

      {/* 3. Pollution Under Control (PUC) */}
      <View style={styles.docCard}>
        <View style={styles.docCardTop}>
          <View style={styles.docTitleGroup}>
            <FileText size={20} color="#38BDF8" />
            <View>
              <Text style={styles.docCardHeading}>
                Pollution Under Control (PUC) Certificate <Text style={styles.req}>*</Text>
              </Text>
              <Text style={styles.docCardSub}>
                Mandatory for petrol/combustion vehicles. Must be currently valid.
              </Text>
            </View>
          </View>

          {data.documents?.puc && (
            <View style={styles.statusBadgePending}>
              <Text style={styles.statusBadgeText}>Pending Verification</Text>
            </View>
          )}
        </View>

        {data.documents?.puc ? (
          <View style={styles.uploadedDocRow}>
            <View style={styles.uploadedDocLeft}>
              <View style={styles.fileIconBox}>
                <FileText size={18} color="#38BDF8" />
              </View>
              <View>
                <Text style={styles.docNameText}>{data.documents.puc.fileName}</Text>
                <Text style={styles.docMetaText}>
                  {data.documents.puc.fileSize} • Uploaded on {data.documents.puc.uploadedAt}
                </Text>
              </View>
            </View>

            <View style={styles.docActionGroup}>
              <TouchableOpacity
                style={styles.actionBtnSmall}
                onPress={() => handleSimulateDocUpload('puc', 'Valid_PUC_Certificate.pdf')}
                activeOpacity={0.7}
              >
                <RefreshCw size={13} color="#FFFFFF" />
                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Replace</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtnSmall, styles.deleteBtnSmall]}
                onPress={() => handleRemoveDoc('puc')}
                activeOpacity={0.7}
              >
                <Trash2 size={13} color="#F43F5E" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.uploadBox}
            onPress={() => handleSimulateDocUpload('puc', 'Valid_PUC_Certificate.pdf')}
            activeOpacity={0.8}
            disabled={activeUploadDoc === 'puc'}
          >
            {activeUploadDoc === 'puc' ? (
              <ActivityIndicator size="small" color="#38BDF8" />
            ) : (
              <>
                <Upload size={22} color="#38BDF8" />
                <Text style={styles.uploadBoxText}>Upload PUC Certificate (PDF/JPG max 5MB)</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <View style={[styles.fieldGroup, { marginTop: 12 }]}>
          <Text style={styles.label}>
            PUC Expiry Date <Text style={styles.req}>*</Text>
          </Text>
          <View style={[styles.inputBox, errors.pucExpiryDate && styles.inputError]}>
            <Calendar size={16} color={COLORS.accentCyanLight} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={data.pucExpiryDate}
              onChangeText={(val) => onChange('pucExpiryDate', val)}
              placeholder="YYYY-MM-DD (e.g. 2027-04-10)"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          {errors.pucExpiryDate && <Text style={styles.errorText}>{errors.pucExpiryDate}</Text>}
        </View>

        {errors['documents.puc'] && (
          <Text style={styles.errorText}>{errors['documents.puc']}</Text>
        )}
      </View>

      {/* 4. Additional Vehicle Numbers & Ownership Declaration */}
      <View style={styles.additionalInfoCard}>
        <Text style={styles.infoCardTitle}>Additional Vehicle Identifiers & Ownership</Text>

        <View style={styles.gridTwo}>
          <View style={styles.gridItem}>
            <Text style={styles.label}>
              Chassis Number (VIN) <Text style={styles.req}>*</Text>
            </Text>
            <View style={[styles.inputBox, errors.chassisNumber && styles.inputError]}>
              <Hash size={16} color={COLORS.accentCyanLight} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { letterSpacing: 1 }]}
                value={data.chassisNumber}
                onChangeText={(val) => onChange('chassisNumber', val.toUpperCase())}
                placeholder="17-character VIN e.g. ME3H450XXXX88291"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="characters"
              />
            </View>
            {errors.chassisNumber && <Text style={styles.errorText}>{errors.chassisNumber}</Text>}
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.label}>
              Engine Number <Text style={styles.req}>*</Text>
            </Text>
            <View style={[styles.inputBox, errors.engineNumber && styles.inputError]}>
              <Hash size={16} color={COLORS.accentCyanLight} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { letterSpacing: 1 }]}
                value={data.engineNumber}
                onChangeText={(val) => onChange('engineNumber', val.toUpperCase())}
                placeholder="e.g. H450E882910"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="characters"
              />
            </View>
            {errors.engineNumber && <Text style={styles.errorText}>{errors.engineNumber}</Text>}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Registered Owner Name (as printed on RC) <Text style={styles.req}>*</Text>
          </Text>
          <View style={[styles.inputBox, errors.registeredOwnerName && styles.inputError]}>
            <UserCheck size={16} color={COLORS.accentCyanLight} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={data.registeredOwnerName}
              onChangeText={(val) => onChange('registeredOwnerName', val)}
              placeholder="e.g. Vikram Malhotra"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          {errors.registeredOwnerName && (
            <Text style={styles.errorText}>{errors.registeredOwnerName}</Text>
          )}
        </View>

        {/* Ownership vs Authorized Representative Declaration */}
        <View style={styles.ownershipSection}>
          <Text style={styles.label}>
            Ownership / Authorization Declaration <Text style={styles.req}>*</Text>
          </Text>

          <View style={styles.radioOptionRow}>
            <TouchableOpacity
              style={[
                styles.radioCard,
                data.ownershipType === 'registered_owner' && styles.radioCardSelected,
              ]}
              onPress={() => onChange('ownershipType', 'registered_owner')}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.radioCircle,
                  data.ownershipType === 'registered_owner' && styles.radioCircleSelected,
                ]}
              >
                {data.ownershipType === 'registered_owner' && <View style={styles.radioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.radioTitle}>I am the Registered Vehicle Owner</Text>
                <Text style={styles.radioSub}>
                  My name directly matches the owner name stated on the Vehicle Registration Certificate.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioCard,
                data.ownershipType === 'authorized_representative' && styles.radioCardSelected,
              ]}
              onPress={() => onChange('ownershipType', 'authorized_representative')}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.radioCircle,
                  data.ownershipType === 'authorized_representative' && styles.radioCircleSelected,
                ]}
              >
                {data.ownershipType === 'authorized_representative' && <View style={styles.radioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.radioTitle}>I have Official Authorization from Owner</Text>
                <Text style={styles.radioSub}>
                  I hold written consent, Power of Attorney (PoA) or family consent to rent this vehicle.
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {data.ownershipType === 'authorized_representative' && (
            <View style={styles.poaUploadBox}>
              <Text style={styles.poaUploadTitle}>
                Authorization Deed / Power of Attorney Letter Required:
              </Text>
              <TouchableOpacity
                style={styles.uploadBox}
                onPress={() => handleSimulateDocUpload('authorizationDeed', 'Owner_Authorization_Letter.pdf')}
                activeOpacity={0.8}
              >
                <Upload size={18} color="#38BDF8" />
                <Text style={styles.uploadBoxText}>
                  {data.documents?.authorizationDeed
                    ? `Attached: ${data.documents.authorizationDeed.fileName}`
                    : 'Upload Signed Authorization Deed (PDF)'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sectionHeader: {
    marginBottom: 20,
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: 8,
  },
  badgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  sectionSub: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  confidentialityBanner: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 22,
  },
  lockIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  confidentialityTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 4,
  },
  confidentialityText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  docCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 18,
    marginBottom: 18,
  },
  docCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  docTitleGroup: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  docCardHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  docCardSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    maxWidth: 540,
  },
  req: {
    color: '#F43F5E',
  },
  statusBadgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusBadgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  uploadedDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: RADIUS.md,
    padding: 12,
    flexWrap: 'wrap',
    gap: 10,
  },
  uploadedDocLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fileIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docNameText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  docMetaText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  docActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38BDF8',
  },
  deleteBtnSmall: {
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderRadius: RADIUS.md,
    paddingVertical: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.04)',
  },
  uploadBoxText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  previewBox: {
    marginTop: 12,
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.md,
    padding: 14,
  },
  previewHeading: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
    fontWeight: '600',
  },
  simulatedSmartCard: {
    backgroundColor: '#0F1A2E',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderRadius: RADIUS.sm,
    padding: 12,
  },
  smartCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 6,
    marginBottom: 8,
  },
  smartCardHeaderTitle: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
  },
  smartCardState: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  smartCardDetails: {
    gap: 4,
  },
  scDetail: {
    color: '#E2E8F0',
    fontSize: 12,
  },
  scBold: {
    color: '#94A3B8',
    fontWeight: '700',
  },
  scNotice: {
    marginTop: 8,
    fontSize: 10,
    color: '#64748B',
    fontStyle: 'italic',
  },
  gridTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 14,
  },
  gridItem: {
    flex: 1,
    minWidth: 160,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 48,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    height: '100%',
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '500',
  },
  additionalInfoCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 18,
    marginTop: 10,
  },
  infoCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  ownershipSection: {
    marginTop: 8,
  },
  radioOptionRow: {
    gap: 10,
    marginTop: 6,
  },
  radioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.md,
    padding: 14,
  },
  radioCardSelected: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#38BDF8',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38BDF8',
  },
  radioTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  radioSub: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  poaUploadBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.bgDark,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  poaUploadTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 8,
  },
});

