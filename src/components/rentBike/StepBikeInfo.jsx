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
} from 'lucide-react-native';
import { COLORS, RADIUS } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

const BRANDS = [
  'Royal Enfield',
  'Yamaha',
  'KTM',
  'Honda',
  'Bajaj',
  'TVS',
  'Harley-Davidson',
  'BMW Motorrad',
  'Kawasaki',
  'Triumph',
  'Suzuki',
  'Hero MotoCorp',
  'Ather Energy',
  'Ola Electric',
];

const CATEGORIES = [
  'Cruiser Bikes',
  'Sports & Track',
  'Adventure Tourer',
  'Commuter Bikes',
  'Scooters',
  'Electric (EV)',
];

const YEARS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018'];

const SAMPLE_PHOTOS = {
  front: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
  rear: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
  left: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
  right: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80',
};

export default function StepBikeInfo({
  data,
  onChange,
  errors,
  onShowToast,
}) {
  const { t, isHindi } = useLanguage();
  const [uploadingSlot, setUploadingSlot] = useState(null);

  const handleSimulatePhotoUpload = (slotKey) => {
    setUploadingSlot(slotKey);
    setTimeout(() => {
      const updatedImages = {
        ...(data.images || {}),
        [slotKey]: SAMPLE_PHOTOS[slotKey],
      };
      onChange('images', updatedImages);
      setUploadingSlot(null);
      if (onShowToast) onShowToast(`${slotKey.toUpperCase()} view photo uploaded successfully!`);
    }, 600);
  };

  const handleRemovePhoto = (slotKey) => {
    const updatedImages = { ...(data.images || {}) };
    delete updatedImages[slotKey];
    onChange('images', updatedImages);
    if (onShowToast) onShowToast(`${slotKey.toUpperCase()} view photo removed.`);
  };

  const handleSelectAllSamplePhotos = () => {
    onChange('images', SAMPLE_PHOTOS);
    if (onShowToast) onShowToast('All 4 required sample photos loaded!');
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
          <View style={styles.pillSelectorRow}>
            {BRANDS.slice(0, 6).map((brand) => {
              const isSelected = data.brand === brand;
              return (
                <TouchableOpacity
                  key={brand}
                  style={[styles.smallPill, isSelected && styles.smallPillSelected]}
                  onPress={() => onChange('brand', brand)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.smallPillText, isSelected && styles.smallPillTextSelected]}>
                    {brand}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={[styles.inputBox, errors.brand && styles.inputError]}>
            <TextInput
              style={styles.textInput}
              value={data.brand}
              onChangeText={(val) => onChange('brand', val)}
              placeholder="Or type brand name"
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
          <View style={styles.pillSelectorRow}>
            {YEARS.slice(0, 5).map((yr) => {
              const isSelected = data.manufacturingYear === yr;
              return (
                <TouchableOpacity
                  key={yr}
                  style={[styles.smallPill, isSelected && styles.smallPillSelected]}
                  onPress={() => onChange('manufacturingYear', yr)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.smallPillText, isSelected && styles.smallPillTextSelected]}>
                    {yr}
                  </Text>
                </TouchableOpacity>
              );
            })}
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

          <TouchableOpacity
            style={styles.sampleFillBtn}
            onPress={handleSelectAllSamplePhotos}
            activeOpacity={0.8}
          >
            <Sparkles size={14} color="#38BDF8" />
            <Text style={styles.sampleFillBtnText}>Load 4 HD Presets</Text>
          </TouchableOpacity>
        </View>

        {errors.images && <Text style={[styles.errorText, { marginBottom: 12 }]}>{errors.images}</Text>}

        {/* 4 Image Slots Grid */}
        <View style={styles.photosGrid}>
          {[
            { key: 'front', label: t('rentBike.frontView', 'Front View'), hint: 'Headlamp, handlebars, number plate' },
            { key: 'rear', label: t('rentBike.rearView', 'Rear View'), hint: 'Tail lamp, exhaust, rear tire' },
            { key: 'left', label: t('rentBike.leftView', 'Left-Side View'), hint: 'Full body profile, chain & saree guard' },
            { key: 'right', label: t('rentBike.rightView', 'Right-Side View'), hint: 'Silencer exhaust, foot pegs, brakes' },
          ].map((slot) => {
            const photoUrl = data.images?.[slot.key];
            const isUploading = uploadingSlot === slot.key;

            return (
              <View key={slot.key} style={styles.photoSlotCard}>
                <View style={styles.slotLabelBar}>
                  <Text style={styles.slotLabelText}>{slot.label}</Text>
                  {photoUrl ? (
                    <View style={styles.checkPill}>
                      <Check size={11} color="#10B981" />
                      <Text style={styles.checkPillText}>Ready</Text>
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
                        onPress={() => handleSimulatePhotoUpload(slot.key)}
                        accessibilityLabel="Replace photo"
                      >
                        <RefreshCw size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionCircleBtn, styles.actionDeleteBtn]}
                        onPress={() => handleRemovePhoto(slot.key)}
                        accessibilityLabel="Delete photo"
                      >
                        <Trash2 size={14} color="#F43F5E" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.emptySlotBox}
                    onPress={() => handleSimulatePhotoUpload(slot.key)}
                    activeOpacity={0.8}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <ActivityIndicator size="small" color="#38BDF8" />
                    ) : (
                      <>
                        <Camera size={26} color="#38BDF8" />
                        <Text style={styles.uploadPromptText}>Upload {slot.label}</Text>
                        <Text style={styles.uploadHintText}>{slot.hint}</Text>
                      </>
                    )}
                  </TouchableOpacity>
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
  sampleFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  sampleFillBtnText: {
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
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    gap: 6,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    margin: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  uploadPromptText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#38BDF8',
  },
  uploadHintText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
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

