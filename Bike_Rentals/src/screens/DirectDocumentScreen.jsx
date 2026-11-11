import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import {
  FileText,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Download,
  Eye,
  RefreshCw,
  Lock,
} from 'lucide-react-native';
import { COLORS, RADIUS } from '../theme/colors';
import { documentsAPI, API_BASE_URL } from '../services/api';

export default function DirectDocumentScreen({
  documentKey,
  onGoHome,
}) {
  const [signedUrl, setSignedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const cleanDocKey = React.useMemo(() => {
    if (!documentKey) return '';
    let decoded = documentKey;
    try {
      decoded = decodeURIComponent(documentKey);
    } catch (e) {}
    return decoded.replace(/^\/+/, '');
  }, [documentKey]);

  const rawFilename = React.useMemo(() => {
    if (!cleanDocKey) return 'Document';
    const parts = cleanDocKey.split('/');
    return parts[parts.length - 1] || cleanDocKey;
  }, [cleanDocKey]);

  const isPdf = React.useMemo(() => {
    return (
      rawFilename.toLowerCase().endsWith('.pdf') ||
      (signedUrl && signedUrl.toLowerCase().includes('.pdf'))
    );
  }, [rawFilename, signedUrl]);

  useEffect(() => {
    let isMounted = true;

    async function loadDocumentUrl() {
      if (!cleanDocKey) {
        setError('No document path specified.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 1. Fetch live Cloudflare R2 presigned URL
        const res = await documentsAPI.getSignedUrl(cleanDocKey);
        if (res && res.data && res.data.signedUrl) {
          if (isMounted) {
            setSignedUrl(res.data.signedUrl);
            setLoading(false);
          }
          return;
        }

        // 2. Direct streaming fallback endpoint
        const directUrl = documentsAPI.getDirectViewUrl(cleanDocKey);
        if (isMounted) {
          setSignedUrl(directUrl);
          setLoading(false);
        }
      } catch (err) {
        console.warn('[DirectDocViewer] Error resolving signed URL:', err.message);
        // Fallback to backend redirect endpoint
        const directUrl = documentsAPI.getDirectViewUrl(cleanDocKey);
        if (isMounted) {
          setSignedUrl(directUrl);
          setLoading(false);
        }
      }
    }

    loadDocumentUrl();

    return () => {
      isMounted = false;
    };
  }, [cleanDocKey]);

  const handleOpenRawNewTab = () => {
    if (typeof window !== 'undefined' && window.open) {
      const target = signedUrl || documentsAPI.getDirectViewUrl(cleanDocKey);
      window.open(target, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = () => {
    if (typeof window !== 'undefined' && window.open) {
      const target = signedUrl || documentsAPI.getDirectViewUrl(cleanDocKey);
      const link = document.createElement('a');
      link.href = target;
      link.download = rawFilename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onGoHome}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color="#FFFFFF" />
            <Text style={styles.backBtnText}>Fleet Home</Text>
          </TouchableOpacity>

          <View style={styles.titleGroup}>
            <View style={styles.docIconPill}>
              <FileText size={16} color="#38BDF8" />
            </View>
            <View>
              <Text style={styles.docTitle} numberOfLines={1}>
                {rawFilename}
              </Text>
              <View style={styles.metaRow}>
                <ShieldCheck size={12} color="#10B981" />
                <Text style={styles.metaText}>Cloudflare R2 Vault • Encrypted & Verified</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          {signedUrl ? (
            <>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleOpenRawNewTab}
                activeOpacity={0.8}
              >
                <ExternalLink size={14} color="#38BDF8" />
                <Text style={styles.actionBtnText}>Open Raw</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.downloadBtn]}
                onPress={handleDownload}
                activeOpacity={0.8}
              >
                <Download size={14} color="#FFFFFF" />
                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Download</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>

      {/* Main Document Body */}
      <View style={styles.body}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#38BDF8" />
            <Text style={styles.loadingTitle}>Opening Secure Document...</Text>
            <Text style={styles.loadingSub}>
              Connecting to Cloudflare R2 Vault and generating expiring download access.
            </Text>
            <Text style={styles.loadingKey}>{cleanDocKey}</Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <AlertTriangle size={42} color="#F43F5E" />
            <Text style={styles.errorTitle}>Document Not Found</Text>
            <Text style={styles.errorSub}>
              Could not locate "{rawFilename}" in the secure Cloudflare R2 storage vault.
            </Text>
            <TouchableOpacity style={styles.goHomeBtn} onPress={onGoHome} activeOpacity={0.8}>
              <Text style={styles.goHomeBtnText}>Return to The Road Eagle</Text>
            </TouchableOpacity>
          </View>
        ) : isPdf ? (
          /* PDF Viewer */
          Platform.OS === 'web' ? (
            <iframe
              src={signedUrl}
              title={rawFilename}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: '#0F172A',
              }}
            />
          ) : (
            <View style={styles.nativePdfBox}>
              <FileText size={54} color="#38BDF8" />
              <Text style={styles.nativePdfTitle}>{rawFilename}</Text>
              <TouchableOpacity style={styles.goHomeBtn} onPress={handleOpenRawNewTab}>
                <Text style={styles.goHomeBtnText}>Open PDF in Browser</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          /* Image Viewer with Zoom */
          <ScrollView
            contentContainerStyle={styles.imageScrollContainer}
            maximumZoomScale={3}
            minimumZoomScale={1}
          >
            <Image
              source={{ uri: signedUrl }}
              style={[
                styles.docImage,
                {
                  transform: [{ scale: zoomLevel }],
                },
              ]}
              resizeMode="contain"
            />
          </ScrollView>
        )}
      </View>

      {/* Footer Info Strip */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Lock size={13} color="#94A3B8" />
          <Text style={styles.footerText}>
            Protected R2 Object Access • Expiring signed URL expires in 15 minutes
          </Text>
        </View>

        {!loading && !error && !isPdf && (
          <View style={styles.zoomControls}>
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
            >
              <Text style={styles.zoomBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.zoomText}>{Math.round(zoomLevel * 100)}%</Text>
            <TouchableOpacity
              style={styles.zoomBtn}
              onPress={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
            >
              <Text style={styles.zoomBtnText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.zoomBtn, { width: 'auto', paddingHorizontal: 10 }]}
              onPress={() => setZoomLevel(1)}
            >
              <Text style={styles.zoomBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050B14',
    height: '100%',
    width: '100%',
  },
  header: {
    height: 64,
    backgroundColor: '#0B1528',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  docIconPill: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  downloadBtn: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  body: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    maxWidth: 440,
  },
  loadingTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
  },
  loadingSub: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  loadingKey: {
    color: '#38BDF8',
    fontSize: 11,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  errorBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
    maxWidth: 460,
    backgroundColor: '#0B1528',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
  },
  errorTitle: {
    color: '#F43F5E',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 8,
  },
  errorSub: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  goHomeBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  goHomeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  imageScrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  docImage: {
    width: Platform.OS === 'web' ? '88vw' : 340,
    height: Platform.OS === 'web' ? '78vh' : 480,
  },
  nativePdfBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  nativePdfTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 16,
  },
  footer: {
    height: 44,
    backgroundColor: '#0B1528',
    borderTopWidth: 1,
    borderTopColor: 'rgba(56, 189, 248, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  zoomBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  zoomText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'center',
  },
});

