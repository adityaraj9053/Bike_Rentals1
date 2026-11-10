import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  Bike,
  Camera,
  Trash2,
  RefreshCw,
  Check,
  AlertCircle,
  Sparkles,
  Info,
  Calendar,
  Layers,
  Fuel,
  Cpu,
  Palette,
  Upload,
  Link as LinkIcon,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import { COLORS, RADIUS } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';
import { uploadAPI } from '../../services/api';

const CATEGORIES = [
  'Cruiser Bikes',
  'Sports & Track',
  'Adventure Tourer',
  'Commuter Bikes',
  'Scooters',
  'Electric (EV)',
];

const YEARS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018'];

export default function StepBikeInfo({
  data,
  onChange,
  errors,
  onShowToast,
}) {
  const { t, isHindi } = useLanguage();
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [urlInputSlot, setUrlInputSlot] = useState(null);
  const [urlInputValue, setUrlInputValue] = useState('');
  const [previews, setPreviews] = useState({});

  // Local persistent dictionary of all 4 photo slots
  const [localImages, setLocalImages] = useState(() => ({
    front: data.images?.front || null,
    rear: data.images?.rear || null,
    left: data.images?.left || null,
    right: data.images?.right || null,
  }));

  const [localPublicIds, setLocalPublicIds] = useState(() => ({
    front: data.imagesPublicIds?.front || null,
    rear: data.imagesPublicIds?.rear || null,
    left: data.imagesPublicIds?.left || null,
    right: data.imagesPublicIds?.right || null,
  }));

  // Synchronize when data.images changes from parent
  React.useEffect(() => {
    if (data.images && typeof data.images === 'object') {
      setLocalImages((prev) => {
        const merged = { ...prev };
        ['front', 'rear', 'left', 'right'].forEach((k) => {
          if (data.images[k] !== undefined) {
            merged[k] = data.images[k];
          }
        });
        return merged;
      });
    }
  }, [data.images]);

  const PHOTO_SLOTS = [
    { key: 'front', label: t('rentBike.frontView', 'Front View'), hint: 'Headlamp, handlebars, number plate' },
    { key: 'rear', label: t('rentBike.rearView', 'Rear View'), hint: 'Tail lamp, exhaust, rear tire' },
    { key: 'left', label: t('rentBike.leftView', 'Left-Side View'), hint: 'Full body profile, chain & saree guard' },
    { key: 'right', label: t('rentBike.rightView', 'Right-Side View'), hint: 'Silencer exhaust, foot pegs, brakes' },
  ];

  const currentActiveImages = {
    ...localImages,
    ...(data.images || {}),
  };

  const readyCount = PHOTO_SLOTS.filter(
    (s) => Boolean(currentActiveImages[s.key]) && !String(currentActiveImages[s.key]).startsWith('blob:')
  ).length;

  /**
   * Helper to broadcast complete image dictionary to parent
   */
  const emitImagesChange = (updatedImages, updatedIds) => {
    setLocalImages(updatedImages);
    onChange('images', updatedImages);
    onChange('photos', updatedImages);

    if (updatedIds) {
      setLocalPublicIds(updatedIds);
      onChange('imagesPublicIds', updatedIds);
    }
  };

  /**
   * Upload single real image file for a given angle slot
   */
  const uploadFileForSlot = async (file, slotKey) => {
    const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';
    if (!allowedMime.includes(file.type) && !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      if (onShowToast) onShowToast('Only JPG, PNG, and WebP images are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      if (onShowToast) onShowToast('Image size exceeds 10MB limit.');
      return;
    }

    setUploadingSlot(slotKey);

    // Create local preview for immediate visual feedback
    if (typeof URL !== 'undefined' && URL.createObjectURL) {
      const localPreview = URL.createObjectURL(file);
      setPreviews((prev) => ({
        ...prev,
        [slotKey]: localPreview,
      }));
    }

    try {
      const formData = new FormData();
      formData.append('images', file);

      const res = await uploadAPI.uploadBikeImages(formData);
      const uploadedUrl = res.secure_url || res.data?.[0]?.secure_url;
      const publicId = res.public_id || res.data?.[0]?.public_id;

      if (!uploadedUrl) {
        throw new Error('No secure URL returned from Cloudinary upload.');
      }

      // Construct complete dictionary of all 4 slots atomically
      const updatedImages = {
        ...localImages,
        ...(data.images || {}),
        [slotKey]: uploadedUrl,
      };

      const updatedIds = {
        ...localPublicIds,
        ...(data.imagesPublicIds || {}),
        ...(publicId ? { [slotKey]: publicId } : {}),
      };

      emitImagesChange(updatedImages, updatedIds);

      // Clear local preview now that real URL is saved
      setPreviews((prev) => {
        const next = { ...prev };
        delete next[slotKey];
        return next;
      });

      if (onShowToast) {
        onShowToast(`${slotKey.toUpperCase()} view photo uploaded to Cloudinary!`);
      }
    } catch (err) {
      console.warn('[Cloudinary Upload Error]:', err.message);
      if (onShowToast) onShowToast(`Failed to upload ${slotKey} photo to Cloudinary. Please retry.`);
    } finally {
      setUploadingSlot(null);
    }
  };

  /**
   * Trigger native device file picker for a specific angle
   */
  const handlePickFile = (slotKey) => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
      input.onchange = async (e) => {
        const file = e.target?.files?.[0];
        if (file) {
          await uploadFileForSlot(file, slotKey);
        }
      };
      input.click();
    }
  };

  /**
   * Bulk upload multiple real photos across slots in a single multi-file Cloudinary request
   */
  const handleBulkPickFiles = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
      input.onchange = async (e) => {
        const files = Array.from(e.target?.files || []);
        if (!files.length) return;

        setUploadingSlot('bulk');
        const slotKeys = ['front', 'rear', 'left', 'right'];
        const selectedFiles = files.slice(0, 4);

        // Instant local previews
        if (typeof URL !== 'undefined' && URL.createObjectURL) {
          const newPreviews = {};
          selectedFiles.forEach((file, idx) => {
            const slot = slotKeys[idx];
            if (slot) newPreviews[slot] = URL.createObjectURL(file);
          });
          setPreviews((prev) => ({ ...prev, ...newPreviews }));
        }

        try {
          const formData = new FormData();
          selectedFiles.forEach((file) => {
            formData.append('images', file);
          });

          const res = await uploadAPI.uploadBikeImages(formData);
          const results = Array.isArray(res.data)
            ? res.data
            : res.secure_url
            ? [res]
            : [];

          if (results.length > 0) {
            const updatedImages = {
              ...localImages,
              ...(data.images || {}),
            };
            const updatedIds = {
              ...localPublicIds,
              ...(data.imagesPublicIds || {}),
            };

            results.forEach((item, idx) => {
              const slot = slotKeys[idx];
              if (slot && item.secure_url) {
                updatedImages[slot] = item.secure_url;
              }
              if (slot && item.public_id) {
                updatedIds[slot] = item.public_id;
              }
            });

            emitImagesChange(updatedImages, updatedIds);

            // Clear temporary previews
            setPreviews((prev) => {
              const next = { ...prev };
              slotKeys.forEach((k) => delete next[k]);
              return next;
            });

            if (onShowToast) {
              onShowToast(`${results.length} photos uploaded to Cloudinary!`);
            }
          } else {
            throw new Error('Upload returned no results.');
          }
        } catch (err) {
          console.error('[Bulk Cloudinary Upload Error]:', err);
          if (onShowToast) onShowToast('Failed to upload photos to Cloudinary. Please try again.');
        } finally {
          setUploadingSlot(null);
        }
      };
      input.click();
    }
  };

  /**
   * Open direct URL entry mode for a slot
   */
  const handleOpenUrlInput = (slotKey) => {
    setUrlInputSlot(slotKey);
    setUrlInputValue(currentActiveImages[slotKey] || '');
  };

  /**
   * Save a directly entered image URL
   */
  const handleSaveUrlInput = (slotKey) => {
    const trimmed = (urlInputValue || '').trim();
    if (!trimmed) {
      if (onShowToast) onShowToast('Please enter a valid image URL.');
      return;
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image/')) {
      if (onShowToast) onShowToast('Image URL must start with http:// or https://');
      return;
    }

    const updatedImages = {
      ...localImages,
      ...(data.images || {}),
      [slotKey]: trimmed,
    };

    emitImagesChange(updatedImages, null);

    setPreviews((prev) => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });
    setUrlInputSlot(null);
    setUrlInputValue('');
    if (onShowToast) onShowToast(`${slotKey.toUpperCase()} image URL saved!`);
  };

  /**
   * Remove a photo and clean up its Cloudinary asset if tracked
   */
  const handleRemovePhoto = (slotKey) => {
    const publicId = localPublicIds[slotKey] || data.imagesPublicIds?.[slotKey];
    if (publicId) {
      uploadAPI.deleteBikeImage(publicId).catch((err) => {
        console.warn('[Cloudinary Delete Notice]:', err.message);
      });
    }

    setPreviews((prev) => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });

    const updatedImages = {
      ...localImages,
      ...(data.images || {}),
    };
    delete updatedImages[slotKey];

    const updatedIds = {
      ...localPublicIds,
      ...(data.imagesPublicIds || {}),
    };
    delete updatedIds[slotKey];

    emitImagesChange(updatedImages, updatedIds);

    if (onShowToast) onShowToast(`${slotKey.toUpperCase()} view photo removed.`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>{t('rentBike.bikeStepBadge', 'STEP 2 OF 5')}</Text>
        </View>
        <Text style={styles.sectionTitle}>{t('rentBike.bikeTitle', 'Motorcycle Information')}</Text>
        <Text style={styles.sectionSub}>
          {t('rentBike.bikeSub', 'Accurate model details, manufacturing specifications, and high-definition exterior photographs.')}
        </Text>
      </View>

      {/* Brand & Model Row */}
      <View style={styles.gridTwo}>
        <View style={styles.gridItem}>
          <Text style={styles.label}>
            {t('rentBike.brandLabel', 'Bike Brand')} <Text style={styles.req}>*</Text>
          </Text>
          
          <View style={[styles.inputBox, errors.brand && styles.inputError]}>
            <TextInput
              style={styles.textInput}
              value={data.brand}
              onChangeText={(val) => onChange('brand', val)}
              placeholder="Or type brand name e.g. Royal Enfield"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          {errors.brand && <Text style={styles.errorText}>{errors.brand}</Text>}
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.label}>
            {t('rentBike.modelLabel', 'Bike Model')} <Text style={styles.req}>*</Text>
          </Text>
          <View style={[styles.inputBox, errors.model && styles.inputError]}>
            <Bike size={18} color={COLORS.accentCyanLight} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={data.model}
              onChangeText={(val) => onChange('model', val)}
              placeholder={t('rentBike.modelPlaceholder', 'e.g. Himalayan 450 / Duke 390')}
              placeholderTextColor={COLORS.textMuted}
              selectTextOnFocus={true}
            />
          </View>
          {errors.model && <Text style={styles.errorText}>{errors.model}</Text>}
        </View>
      </View>

      {/* Manufacturing Year & Registration Number */}
      <View style={styles.gridTwo}>
        <View style={styles.gridItem}>
          <Text style={styles.label}>
            {t('rentBike.yearLabel', 'Manufacturing Year')} <Text style={styles.req}>*</Text>
          </Text>
           <View style={[styles.inputBox, errors.manufacturingYear && styles.inputError]}>
            <TextInput
              style={styles.textInput}
              value={data.manufacturingYear}
              onChangeText={(val) => onChange('manufacturingYear', val)}
              placeholder="2026"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          {errors.manufacturingYear && (
            <Text style={styles.errorText}>{errors.manufacturingYear}</Text>
          )}
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.label}>
            {t('rentBike.regLabel', 'Registration Number (RTO)')} <Text style={styles.req}>*</Text>
          </Text>
          <View style={[styles.inputBox, errors.registrationNumber && styles.inputError]}>
            <TextInput
              style={[styles.textInput, { fontWeight: '700', letterSpacing: 1.2 }]}
              value={data.registrationNumber}
              onChangeText={(val) => onChange('registrationNumber', val.toUpperCase())}
              placeholder={t('rentBike.regPlaceholder', 'e.g. MH 02 FJ 9042')}
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
              selectTextOnFocus={true}
            />
          </View>
          <Text style={styles.fieldHelper}>Enter state code, RTO district code, and 4-digit number</Text>
          {errors.registrationNumber && (
            <Text style={styles.errorText}>{errors.registrationNumber}</Text>
          )}
        </View>
      </View>

      {/* Vehicle Category */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          {t('rentBike.categoryLabel', 'Vehicle Category')} <Text style={styles.req}>*</Text>
        </Text>
        <View style={styles.pillSelectorRow}>
          {CATEGORIES.map((cat) => {
            const isSelected = data.category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
                onPress={() => onChange('category', cat)}
                activeOpacity={0.8}
              >
                <Layers size={14} color={isSelected ? '#38BDF8' : COLORS.textMuted} />
                <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextSelected]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
      </View>

      {/* Engine Capacity, Fuel Type, Transmission, Colour */}
      <View style={styles.gridFour}>
        <View style={styles.gridItem}>
          <Text style={styles.label}>
            {t('rentBike.ccLabel', 'Engine (CC)')} <Text style={styles.req}>*</Text>
          </Text>
          <View style={[styles.inputBox, errors.engineCapacity && styles.inputError]}>
            <Cpu size={16} color={COLORS.accentCyanLight} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={data.engineCapacity}
              onChangeText={(val) => onChange('engineCapacity', val.replace(/\D/g, ''))}
              placeholder="e.g. 350"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              selectTextOnFocus={true}
            />
          </View>
          {errors.engineCapacity && <Text style={styles.errorText}>{errors.engineCapacity}</Text>}
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.label}>{t('rentBike.fuelLabel', 'Fuel Type')}</Text>
          <View style={styles.pillSelectorRow}>
            {['Petrol', 'Electric'].map((fuel) => {
              const isSelected = data.fuelType === fuel;
              return (
                <TouchableOpacity
                  key={fuel}
                  style={[styles.smallPill, isSelected && styles.smallPillSelected]}
                  onPress={() => onChange('fuelType', fuel)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.smallPillText, isSelected && styles.smallPillTextSelected]}>
                    {fuel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.label}>{t('rentBike.transLabel', 'Transmission')}</Text>
          <View style={styles.pillSelectorRow}>
            {['Manual', 'Automatic'].map((trans) => {
              const isSelected = data.transmission === trans;
              return (
                <TouchableOpacity
                  key={trans}
                  style={[styles.smallPill, isSelected && styles.smallPillSelected]}
                  onPress={() => onChange('transmission', trans)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.smallPillText, isSelected && styles.smallPillTextSelected]}>
                    {trans}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.label}>
            {t('rentBike.colorLabel', 'Bike Colour')} <Text style={styles.req}>*</Text>
          </Text>
          <View style={[styles.inputBox, errors.colour && styles.inputError]}>
            <Palette size={16} color={COLORS.accentCyanLight} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={data.colour}
              onChangeText={(val) => onChange('colour', val)}
              placeholder={t('rentBike.colorPlaceholder', 'e.g. Matte Black')}
              placeholderTextColor={COLORS.textMuted}
              selectTextOnFocus={true}
            />
          </View>
          {errors.colour && <Text style={styles.errorText}>{errors.colour}</Text>}
        </View>
      </View>

      {/* Bike Description */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          {t('rentBike.descLabel', 'Bike Description & Condition Notes')} <Text style={styles.req}>*</Text>
        </Text>
        <View style={[styles.inputBox, styles.textAreaBox, errors.description && styles.inputError]}>
          <TextInput
            style={[styles.textInput, styles.textAreaInput]}
            value={data.description}
            onChangeText={(val) => onChange('description', val)}
            placeholder={t('rentBike.descPlaceholder', 'Highlight vehicle condition, modifications, recent servicing, included accessories (touring visor, crash guard, saddle stays), and ideal rider profile...')}
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={3}
            selectTextOnFocus={true}
          />
        </View>
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
      </View>

      {/* Required Photographs Section */}
      <View style={styles.photoUploadSection}>
        <View style={styles.photoHeader}>
          <View>
            <Text style={styles.photoSectionTitle}>
              {t('rentBike.photosTitle', 'Required Bike Photographs')} <Text style={styles.req}>*</Text>
            </Text>
            <Text style={styles.photoSectionSub}>
              {t('rentBike.photosSub', 'All 4 high-definition exterior angles are mandatory for verification and listing approval.')}
            </Text>
          </View>

          <View style={styles.headerRightGroup}>
            <View style={[styles.progressPill, readyCount === 4 && styles.progressPillComplete]}>
              <CheckCircle2 size={13} color={readyCount === 4 ? '#10B981' : '#38BDF8'} />
              <Text style={[styles.progressPillText, readyCount === 4 && styles.progressPillTextComplete]}>
                {readyCount === 4 ? 'All 4 Photos Ready' : `${readyCount} / 4 Uploaded`}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.bulkUploadBtn}
              onPress={handleBulkPickFiles}
              activeOpacity={0.8}
              disabled={uploadingSlot === 'bulk'}
            >
              <Upload size={14} color="#38BDF8" />
              <Text style={styles.bulkUploadBtnText}>
                {uploadingSlot === 'bulk' ? 'Uploading...' : 'Upload Multiple'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {errors.images && <Text style={[styles.errorText, { marginBottom: 12 }]}>{errors.images}</Text>}

        {/* 4 Image Slots Grid */}
        <View style={styles.photosGrid}>
          {PHOTO_SLOTS.map((slot) => {
            const photoUrl = previews[slot.key] || currentActiveImages[slot.key];
            const isReady = Boolean(currentActiveImages[slot.key]) && !String(currentActiveImages[slot.key]).startsWith('blob:');
            const isUploading = uploadingSlot === slot.key || (uploadingSlot === 'bulk' && !isReady);
            const isUrlInputOpen = urlInputSlot === slot.key;

            return (
              <View key={slot.key} style={styles.photoSlotCard}>
                <View style={styles.slotLabelBar}>
                  <Text style={styles.slotLabelText}>{slot.label}</Text>
                  {isReady ? (
                    <View style={styles.checkPill}>
                      <Check size={11} color="#10B981" />
                      <Text style={styles.checkPillText}>Ready</Text>
                    </View>
                  ) : isUploading ? (
                    <View style={[styles.checkPill, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                      <ActivityIndicator size={10} color="#38BDF8" style={{ marginRight: 3 }} />
                      <Text style={[styles.checkPillText, { color: '#38BDF8' }]}>Uploading</Text>
                    </View>
                  ) : (
                    <Text style={styles.requiredSmall}>Mandatory</Text>
                  )}
                </View>

                {photoUrl ? (
                  <View style={styles.photoPreviewWrap}>
                    <Image source={{ uri: photoUrl }} style={styles.photoPreviewImg} />
                    <View style={styles.photoActionsOverlay}>
                      <TouchableOpacity
                        style={styles.actionCircleBtn}
                        onPress={() => handlePickFile(slot.key)}
                        accessibilityLabel="Replace photo from file"
                        title="Upload new file"
                      >
                        <RefreshCw size={13} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionCircleBtn}
                        onPress={() => handleOpenUrlInput(slot.key)}
                        accessibilityLabel="Edit image URL"
                        title="Enter URL"
                      >
                        <LinkIcon size={13} color="#38BDF8" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionCircleBtn, styles.actionDeleteBtn]}
                        onPress={() => handleRemovePhoto(slot.key)}
                        accessibilityLabel="Delete photo"
                        title="Remove photo"
                      >
                        <Trash2 size={13} color="#F43F5E" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : isUrlInputOpen ? (
                  <View style={styles.urlInputBox}>
                    <Text style={styles.urlInputLabel}>Enter direct image URL:</Text>
                    <TextInput
                      style={styles.urlTextInput}
                      value={urlInputValue}
                      onChangeText={setUrlInputValue}
                      placeholder="https://example.com/bike.jpg"
                      placeholderTextColor={COLORS.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <View style={styles.urlActionRow}>
                      <TouchableOpacity
                        style={styles.urlSaveBtn}
                        onPress={() => handleSaveUrlInput(slot.key)}
                      >
                        <Check size={12} color="#FFFFFF" />
                        <Text style={styles.urlSaveBtnText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.urlCancelBtn}
                        onPress={() => setUrlInputSlot(null)}
                      >
                        <X size={12} color={COLORS.textMuted} />
                        <Text style={styles.urlCancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptySlotBox}>
                    {isUploading ? (
                      <View style={styles.uploadingBox}>
                        <ActivityIndicator size="small" color="#38BDF8" />
                        <Text style={styles.uploadingText}>Uploading to Cloudinary...</Text>
                      </View>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={styles.emptySlotBtn}
                          onPress={() => handlePickFile(slot.key)}
                          activeOpacity={0.8}
                        >
                          <Camera size={26} color="#38BDF8" />
                          <Text style={styles.uploadPromptText}>Upload {slot.label}</Text>
                          <Text style={styles.uploadHintText}>{slot.hint}</Text>
                          <View style={styles.browsePill}>
                            <Upload size={11} color="#38BDF8" />
                            <Text style={styles.browsePillText}>Browse File</Text>
                          </View>
                        </TouchableOpacity>

                        <View style={styles.orDividerRow}>
                          <View style={styles.orLine} />
                          <Text style={styles.orText}>OR</Text>
                          <View style={styles.orLine} />
                        </View>

                        <TouchableOpacity
                          style={styles.enterUrlToggleBtn}
                          onPress={() => handleOpenUrlInput(slot.key)}
                          activeOpacity={0.7}
                        >
                          <LinkIcon size={12} color="#94A3B8" />
                          <Text style={styles.enterUrlToggleText}>Paste Image URL</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}
              </View>
            );
          })}
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
    marginBottom: 24,
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
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  req: {
    color: '#F43F5E',
  },
  fieldHelper: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
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
  textAreaBox: {
    height: 90,
    alignItems: 'flex-start',
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
  textAreaInput: {
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '500',
  },
  gridTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  gridFour: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  gridItem: {
    flex: 1,
    minWidth: 160,
  },
  pillSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  smallPill: {
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  smallPillSelected: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  smallPillText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  smallPillTextSelected: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  categoryPillSelected: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  categoryPillText: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  categoryPillTextSelected: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  photoUploadSection: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 18,
    marginTop: 10,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  photoSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  photoSectionSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    maxWidth: 480,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  progressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  progressPillComplete: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  progressPillText: {
    color: '#38BDF8',
    fontSize: 11.5,
    fontWeight: '700',
  },
  progressPillTextComplete: {
    color: '#10B981',
  },
  bulkUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  bulkUploadBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  photoSlotCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  slotLabelBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCard,
  },
  slotLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  checkPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#10B981',
  },
  requiredSmall: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#F43F5E',
  },
  emptySlotBox: {
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    margin: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  emptySlotBtn: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 4,
    gap: 4,
  },
  uploadPromptText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#38BDF8',
    marginTop: 2,
  },
  uploadHintText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  browsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginTop: 4,
  },
  browsePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '75%',
    marginVertical: 8,
    gap: 8,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  orText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  enterUrlToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  enterUrlToggleText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  uploadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  uploadingText: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
  },
  urlInputBox: {
    padding: 12,
    gap: 8,
    minHeight: 160,
    justifyContent: 'center',
    margin: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  urlInputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#38BDF8',
  },
  urlTextInput: {
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: COLORS.textPrimary,
    fontSize: 12,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  urlActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  urlSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  urlSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  urlCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  urlCancelBtnText: {
    color: COLORS.textMuted,
    fontSize: 11.5,
    fontWeight: '600',
  },
  photoPreviewWrap: {
    position: 'relative',
    height: 150,
    width: '100%',
  },
  photoPreviewImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoActionsOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  actionCircleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionDeleteBtn: {
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
});

