import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Platform,
  ScrollView,
} from 'react-native';
import { X, ExternalLink, ShieldCheck, FileText, Download } from 'lucide-react-native';
import { COLORS, RADIUS } from '../theme/colors';

export default function DocumentPreviewModal({
  visible,
  onClose,
  title = 'Document Preview',
  documentUrl,
  fileName,
  docType,
}) {
  if (!visible) return null;

  const isPdf =
    (fileName && fileName.toLowerCase().endsWith('.pdf')) ||
    (typeof documentUrl === 'string' && documentUrl.toLowerCase().includes('.pdf'));

  const handleOpenExternal = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && documentUrl) {
      window.open(documentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <FileText size={18} color={COLORS.accentCyan} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
                {fileName ? (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {fileName}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={styles.headerRight}>
              {documentUrl && Platform.OS === 'web' ? (
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={handleOpenExternal}
                  accessibilityLabel="Open document in new tab"
                >
                  <ExternalLink size={16} color="#38BDF8" />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={onClose}
                accessibilityLabel="Close document preview"
              >
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Document Content View */}
          <ScrollView
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {isPdf ? (
              <View style={styles.pdfCard}>
                <FileText size={48} color={COLORS.accentCyan} />
                <Text style={styles.pdfTitle}>{fileName || 'PDF Document'}</Text>
                <Text style={styles.pdfNotice}>
                  Protected PDF document view.
                </Text>
                {documentUrl ? (
                  <TouchableOpacity
                    style={styles.openExternalBtn}
                    onPress={handleOpenExternal}
                    activeOpacity={0.8}
                  >
                    <Download size={15} color="#FFFFFF" />
                    <Text style={styles.openExternalBtnText}>
                      Open PDF in Viewer
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : documentUrl ? (
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: documentUrl }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Document preview not available.</Text>
              </View>
            )}

            <View style={styles.securityBadge}>
              <ShieldCheck size={14} color={COLORS.statusAvailable} />
              <Text style={styles.securityText}>
                End-to-End Encrypted Document Vault (Cloudflare R2)
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
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
    zIndex: 9999,
  },
  modalCard: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    backgroundColor: '#0A1322',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  contentContainer: {
    padding: 18,
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: 360,
    backgroundColor: '#020617',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  pdfCard: {
    width: '100%',
    padding: 36,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  pdfTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  pdfNotice: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
  },
  openExternalBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  openExternalBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  securityText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '600',
  },
});

