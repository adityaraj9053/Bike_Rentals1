import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import {
  IndianRupee,
  Shield,
  Clock,
  Calendar,
  MapPin,
  Truck,
  Check,
  Plus,
  Trash2,
  HelpCircle,
  FileCheck,
} from 'lucide-react-native';
import { COLORS, RADIUS } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

const PRESET_RULES = [
  'Complimentary helmet included with bike',
  'Return vehicle with full tank of fuel',
  'Original driving licence MCWG inspection at pickup',
  'Speed monitoring above 100 km/h via platform telematics',
  'Strictly within state/city boundary limits',
  'No race track or stunt riding permitted',
  'Clean vehicle return expected',
];

export default function StepRentalInfo({
  data,
  onChange,
  errors,
  onShowToast,
}) {
  const { t, isHindi } = useLanguage();
  const [customRuleInput, setCustomRuleInput] = useState('');

  const togglePresetRule = (ruleText) => {
    const currentRules = Array.isArray(data.rulesList) ? [...data.rulesList] : [];
    if (currentRules.includes(ruleText)) {
      onChange(
        'rulesList',
        currentRules.filter((r) => r !== ruleText)
      );
    } else {
      onChange('rulesList', [...currentRules, ruleText]);
    }
  };

  const handleAddCustomRule = () => {
    if (!customRuleInput.trim()) return;
    const currentRules = Array.isArray(data.rulesList) ? [...data.rulesList] : [];
    onChange('rulesList', [...currentRules, customRuleInput.trim()]);
    setCustomRuleInput('');
    if (onShowToast) onShowToast('Custom rental rule added.');
  };

  const handleRemoveRule = (index) => {
    const currentRules = Array.isArray(data.rulesList) ? [...data.rulesList] : [];
    currentRules.splice(index, 1);
    onChange('rulesList', currentRules);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>{t('rentBike.rentalStepBadge', 'STEP 4 OF 5')}</Text>
        </View>
        <Text style={styles.sectionTitle}>{t('rentBike.rentalTitle', 'Rental Pricing & Availability')}</Text>
        <Text style={styles.sectionSub}>
          {t('rentBike.rentalSub', 'Set transparent daily rental rates, security deposits, pickup hub locations, and rider guidelines.')}
        </Text>
      </View>

      {/* Pricing & Deposit */}
      <View style={styles.gridTwo}>
        <View style={styles.gridItem}>
          <Text style={styles.label}>
            {t('rentBike.dailyPriceLabel', 'Daily Rental Price (₹ / day)')} <Text style={styles.req}>*</Text>
          </Text>
          <View style={[styles.inputBox, errors.dailyPrice && styles.inputError]}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={[styles.textInput, styles.boldAmountInput]}
              value={data.dailyPrice ? String(data.dailyPrice) : ''}
              onChangeText={(val) => onChange('dailyPrice', val.replace(/\D/g, ''))}
              placeholder="e.g. 1500"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              selectTextOnFocus={true}
            />
          </View>
          <Text style={styles.fieldHelper}>Recommended: ₹1,200 - ₹2,200 depending on CC & model</Text>
          {errors.dailyPrice && <Text style={styles.errorText}>{errors.dailyPrice}</Text>}
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.label}>
            {t('rentBike.securityDepositLabel', 'Refundable Security Deposit (₹)')} <Text style={styles.req}>*</Text>
          </Text>
          <View style={[styles.inputBox, errors.securityDeposit && styles.inputError]}>
            <Shield size={18} color="#38BDF8" style={styles.inputIcon} />
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={[styles.textInput, styles.boldAmountInput]}
              value={data.securityDeposit ? String(data.securityDeposit) : ''}
              onChangeText={(val) => onChange('securityDeposit', val.replace(/\D/g, ''))}
              placeholder="e.g. 3500"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              selectTextOnFocus={true}
            />
          </View>
          <Text style={styles.fieldHelper}>Held safely in escrow by platform during rental trip</Text>
          {errors.securityDeposit && <Text style={styles.errorText}>{errors.securityDeposit}</Text>}
        </View>
      </View>

      {/* Rental Durations */}
      <View style={styles.gridTwo}>
        <View style={styles.gridItem}>
          <Text style={styles.label}>
            {t('rentBike.minDurationLabel', 'Minimum Rental Duration')} <Text style={styles.req}>*</Text>
          </Text>
          <View style={styles.pillSelectorRow}>
            {['1 Day', '2 Days', '3 Days'].map((opt, idx) => {
              const numDays = idx + 1;
              const isSelected = Number(data.minDuration) === numDays;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.smallPill, isSelected && styles.smallPillSelected]}
                  onPress={() => onChange('minDuration', numDays)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.smallPillText, isSelected && styles.smallPillTextSelected]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.label}>
            {t('rentBike.maxDurationLabel', 'Maximum Rental Duration')} <Text style={styles.req}>*</Text>
          </Text>
          <View style={styles.pillSelectorRow}>
            {['7 Days', '14 Days', '30 Days'].map((opt) => {
              const numDays = parseInt(opt);
              const isSelected = Number(data.maxDuration) === numDays;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.smallPill, isSelected && styles.smallPillSelected]}
                  onPress={() => onChange('maxDuration', numDays)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.smallPillText, isSelected && styles.smallPillTextSelected]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Available Rental Dates Selection */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          {t('rentBike.availabilityTitle', 'Listing Availability Calendar')} <Text style={styles.req}>*</Text>
        </Text>
        <View style={styles.dateSelectorCard}>
          <View style={styles.dateSelectorLeft}>
            <Calendar size={20} color="#38BDF8" />
            <View>
              <Text style={styles.dateSelectorTitle}>{t('rentBike.availabilityTitle', 'Listing Availability Calendar')}</Text>
              <Text style={styles.dateSelectorSub}>
                {data.availableFrom && data.availableTo
                  ? `Active from ${data.availableFrom} to ${data.availableTo}`
                  : 'Open availability for immediate bookings and advance bookings'}
              </Text>
            </View>
          </View>

          <View style={styles.quickPresetRow}>
            {[
              { label: 'Next 30 Days', from: 'Immediate', to: '+30 Days' },
              { label: 'Next 3 Months', from: 'Immediate', to: '+90 Days' },
              { label: 'Weekends Only', from: 'Every Fri-Sun', to: 'Ongoing' },
            ].map((p) => {
              const isCurrent = data.availabilityPreset === p.label;
              return (
                <TouchableOpacity
                  key={p.label}
                  style={[styles.presetDatePill, isCurrent && styles.presetDatePillActive]}
                  onPress={() => {
                    onChange('availabilityPreset', p.label);
                    onChange('availableFrom', p.from);
                    onChange('availableTo', p.to);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.presetDatePillText, isCurrent && styles.presetDatePillTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Pickup Location & Address */}
      <View style={styles.gridTwo}>
        <View style={styles.gridItem}>
          <Text style={styles.label}>
            {t('rentBike.pickupAreaLabel', 'Pickup Area / Locality')} <Text style={styles.req}>*</Text>
          </Text>
          <View style={[styles.inputBox, errors.pickupLocation && styles.inputError]}>
            <MapPin size={18} color={COLORS.accentCyanLight} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={data.pickupLocation}
              onChangeText={(val) => onChange('pickupLocation', val)}
              placeholder={t('rentBike.pickupAreaPlaceholder', 'e.g. Bandra West, Mumbai')}
              placeholderTextColor={COLORS.textMuted}
              selectTextOnFocus={true}
            />
          </View>
          {errors.pickupLocation && <Text style={styles.errorText}>{errors.pickupLocation}</Text>}
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.label}>
            {t('rentBike.pickupTimingsLabel', 'Pickup Timings')} <Text style={styles.req}>*</Text>
          </Text>
          <View style={[styles.inputBox, errors.pickupTimings && styles.inputError]}>
            <Clock size={18} color={COLORS.accentCyanLight} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              value={data.pickupTimings}
              onChangeText={(val) => onChange('pickupTimings', val)}
              placeholder={t('rentBike.pickupTimingsPlaceholder', 'e.g. 08:00 AM - 08:00 PM')}
              placeholderTextColor={COLORS.textMuted}
              selectTextOnFocus={true}
            />
          </View>
          {errors.pickupTimings && <Text style={styles.errorText}>{errors.pickupTimings}</Text>}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>
          {t('rentBike.detailedAddressLabel', 'Detailed Pickup Address & Landmark')} <Text style={styles.req}>*</Text>
        </Text>
        <View style={[styles.inputBox, styles.textAreaBox, errors.pickupAddress && styles.inputError]}>
          <TextInput
            style={[styles.textInput, styles.textAreaInput]}
            value={data.pickupAddress}
            onChangeText={(val) => onChange('pickupAddress', val)}
            placeholder={t('rentBike.detailedAddressPlaceholder', 'Complete address for key handover and vehicle inspection (revealed to renter only after booking is paid and verified)')}
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={2}
            selectTextOnFocus={true}
          />
        </View>
        {errors.pickupAddress && <Text style={styles.errorText}>{errors.pickupAddress}</Text>}
      </View>

      {/* Doorstep Delivery Toggle */}
      <View style={styles.deliveryCard}>
        <View style={styles.deliveryLeft}>
          <View style={styles.deliveryIconBox}>
            <Truck size={20} color="#38BDF8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.deliveryTitle}>{t('rentBike.deliveryLabel', 'Doorstep Delivery to Renter Available?')}</Text>
            <Text style={styles.deliverySub}>
              Offer convenient doorstep delivery & pickup within 15 km radius for an extra fee.
            </Text>
          </View>
        </View>

        <Switch
          value={!!data.deliveryAvailable}
          onValueChange={(val) => onChange('deliveryAvailable', val)}
          trackColor={{ false: '#1E293B', true: '#0284C7' }}
          thumbColor={data.deliveryAvailable ? '#38BDF8' : '#94A3B8'}
        />
      </View>

      {/* Rental Rules & Conditions */}
      <View style={styles.rulesSection}>
        <Text style={styles.label}>{t('rentBike.rulesTitle', 'Rental Rules & Policies')}</Text>
        <Text style={styles.rulesSectionSub}>
          Select pre-defined platform guidelines and add your vehicle-specific instructions:
        </Text>

        <View style={styles.rulesChipsGrid}>
          {PRESET_RULES.map((rule) => {
            const isChecked = Array.isArray(data.rulesList) && data.rulesList.includes(rule);
            return (
              <TouchableOpacity
                key={rule}
                style={[styles.ruleChip, isChecked && styles.ruleChipSelected]}
                onPress={() => togglePresetRule(rule)}
                activeOpacity={0.8}
              >
                <View style={[styles.ruleCheckSquare, isChecked && styles.ruleCheckSquareSelected]}>
                  {isChecked && <Check size={12} color="#FFFFFF" />}
                </View>
                <Text style={[styles.ruleChipText, isChecked && styles.ruleChipTextSelected]}>
                  {rule}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom Rule Input */}
        <View style={styles.customRuleRow}>
          <View style={[styles.inputBox, { flex: 1 }]}>
            <TextInput
              style={styles.textInput}
              value={customRuleInput}
              onChangeText={setCustomRuleInput}
              placeholder="Add your own custom rule (e.g. Premium fuel 95 octane only)"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          <TouchableOpacity
            style={styles.addRuleBtn}
            onPress={handleAddCustomRule}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addRuleBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Selected Rules List */}
        {Array.isArray(data.rulesList) && data.rulesList.length > 0 && (
          <View style={styles.activeRulesBox}>
            <Text style={styles.activeRulesTitle}>Active Rules Applied to Listing ({data.rulesList.length}):</Text>
            {data.rulesList.map((rule, idx) => (
              <View key={idx} style={styles.activeRuleItem}>
                <FileCheck size={14} color="#10B981" />
                <Text style={styles.activeRuleText}>{rule}</Text>
                <TouchableOpacity onPress={() => handleRemoveRule(idx)}>
                  <Trash2 size={13} color="#F43F5E" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
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
  gridTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  gridItem: {
    flex: 1,
    minWidth: 180,
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
    height: 80,
    alignItems: 'flex-start',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 8,
  },
  currencyPrefix: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: '800',
    marginRight: 8,
  },
  boldAmountInput: {
    fontSize: 16,
    fontWeight: '700',
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
  pillSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  smallPill: {
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  smallPillSelected: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  smallPillText: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  smallPillTextSelected: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  dateSelectorCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.md,
    padding: 14,
    gap: 12,
  },
  dateSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateSelectorTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dateSelectorSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  quickPresetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetDatePill: {
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  presetDatePillActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  presetDatePillText: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  presetDatePillTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  deliveryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  deliveryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  deliveryIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliveryTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deliverySub: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  rulesSection: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 18,
  },
  rulesSectionSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  rulesChipsGrid: {
    gap: 8,
    marginBottom: 14,
  },
  ruleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  ruleChipSelected: {
    borderColor: 'rgba(56, 189, 248, 0.5)',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  ruleCheckSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ruleCheckSquareSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  ruleChipText: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    flex: 1,
  },
  ruleChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  customRuleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  addRuleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
  },
  addRuleBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  activeRulesBox: {
    backgroundColor: COLORS.bgDark,
    borderRadius: RADIUS.md,
    padding: 12,
    gap: 8,
  },
  activeRulesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 4,
  },
  activeRuleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
  },
  activeRuleText: {
    fontSize: 12,
    color: '#E2E8F0',
    flex: 1,
  },
});

