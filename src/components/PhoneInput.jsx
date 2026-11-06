import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import { ChevronDown, Search, X, Check } from 'lucide-react-native';
import { COUNTRY_CODES } from '../data/countries';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { useLanguage } from '../i18n/LanguageContext';

export default function PhoneInput({
  countryCode = '+91',
  onCountryCodeChange,
  value = '',
  onChangeText,
  placeholder,
  error,
  style,
  autoFocus = false,
}) {
  const { isHindi } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Find active country item
  const selectedCountry = useMemo(() => {
    return (
      COUNTRY_CODES.find((c) => c.code === countryCode) || {
        code: countryCode,
        country: 'Select',
        flag: '🌐',
      }
    );
  }, [countryCode]);

  // Filtered country list
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRY_CODES;
    const q = searchQuery.toLowerCase().trim();
    return COUNTRY_CODES.filter(
      (c) =>
        c.country.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handlePhoneChange = (text) => {
    // Strictly numeric only, max 10 digits
    const clean = text.replace(/\D/g, '').slice(0, 10);
    if (onChangeText) {
      onChangeText(clean);
    }
  };

  const cleanDigits = (value || '').replace(/\D/g, '');
  const isComplete = cleanDigits.length === 10;

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.container,
          error ? styles.containerError : isComplete ? styles.containerComplete : null,
        ]}
      >
        {/* Country Code Selector Button */}
        <TouchableOpacity
          style={styles.countryBtn}
          onPress={() => {
            setSearchQuery('');
            setIsModalOpen(true);
          }}
          activeOpacity={0.8}
          accessibilityLabel="Select Country Code"
        >
          <Text style={styles.flagText}>{selectedCountry.flag}</Text>
          <Text style={styles.codeText}>{selectedCountry.code}</Text>
          <ChevronDown size={14} color="#94A3B8" />
        </TouchableOpacity>

        <View style={styles.separator} />

        {/* 10-Digit Phone Text Input */}
        <TextInput
          style={styles.input}
          value={cleanDigits}
          onChangeText={handlePhoneChange}
          placeholder={
            placeholder ||
            (isHindi ? '10 अंकों का मोबाइल नंबर' : '10-digit mobile number')
          }
          placeholderTextColor="#64748B"
          keyboardType="phone-pad"
          maxLength={10}
          autoFocus={autoFocus}
          selectTextOnFocus={true}
        />

        {/* Clear Button when digits exist */}
        {cleanDigits.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => onChangeText && onChangeText('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Clear phone number"
          >
            <X size={14} color="#64748B" />
          </TouchableOpacity>
        )}

        {/* 10 Digits Completion Indicator */}
        {isComplete ? (
          <View style={styles.checkBadge}>
            <Check size={14} color="#10B981" strokeWidth={2.5} />
          </View>
        ) : cleanDigits.length > 0 ? (
          <Text style={styles.digitCounter}>{cleanDigits.length}/10</Text>
        ) : null}
      </View>

      {/* Error Message */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Country Selection Dropdown Modal */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsModalOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalCard, SHADOWS.card]}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {isHindi ? 'देश का कोड चुनें' : 'Select Country Code'}
                  </Text>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setIsModalOpen(false)}
                    activeOpacity={0.7}
                  >
                    <X size={16} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchRow}>
                  <Search size={15} color="#64748B" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={
                      isHindi
                        ? 'देश या डायलिंग कोड खोजें...'
                        : 'Search country or code...'
                    }
                    placeholderTextColor="#475569"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                  />
                  {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <X size={14} color="#94A3B8" />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Country List */}
                <FlatList
                  data={filteredCountries}
                  keyExtractor={(item) => `${item.code}-${item.country}`}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 4 }}
                  renderItem={({ item }) => {
                    const isSelected = item.code === countryCode;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.countryItem,
                          isSelected && styles.countryItemActive,
                        ]}
                        onPress={() => {
                          if (onCountryCodeChange) {
                            onCountryCodeChange(item.code);
                          }
                          setIsModalOpen(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.itemFlag}>{item.flag}</Text>
                        <Text style={styles.itemCountry} numberOfLines={1}>
                          {item.country}
                        </Text>
                        <Text style={styles.itemCode}>{item.code}</Text>
                        {isSelected && (
                          <Check size={16} color="#38BDF8" style={{ marginLeft: 8 }} />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        {isHindi
                          ? 'कोई देश नहीं मिला'
                          : 'No matching countries found'}
                      </Text>
                    </View>
                  }
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.md,
    height: 44,
    paddingHorizontal: 10,
  },
  containerError: {
    borderColor: 'rgba(225, 29, 72, 0.6)',
    backgroundColor: 'rgba(225, 29, 72, 0.05)',
  },
  containerComplete: {
    borderColor: 'rgba(16, 185, 129, 0.45)',
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingRight: 8,
  },
  flagText: {
    fontSize: 16,
  },
  codeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  separator: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13.5,
    paddingHorizontal: 8,
    height: '100%',
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  clearBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  digitCounter: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    marginRight: 4,
  },
  errorText: {
    color: '#FDA4AF',
    fontSize: 11.5,
    marginTop: 4,
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 20, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '75%',
    backgroundColor: '#0F1A2E',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12.5,
    height: '100%',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  countryItemActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
  },
  itemFlag: {
    fontSize: 18,
    marginRight: 10,
  },
  itemCountry: {
    flex: 1,
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  itemCode: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12.5,
    color: '#64748B',
  },
});
