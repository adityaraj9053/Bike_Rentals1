import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
  Check,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';

export default function CalendarPickerModal({
  visible,
  onClose,
  onSelectDate,
  initialDate,
  minDate,
  maxDate,
  title,
  mode = 'future', // 'future' for booking dates, 'past' for date of birth
}) {
  const { t, isHindi } = useLanguage();

  // Parse initial or default date
  const parseDate = (d) => {
    if (!d) return new Date();
    if (d instanceof Date && !isNaN(d.getTime())) return d;
    if (typeof d === 'string') {
      const parts = d.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
      const slashParts = d.split('/');
      if (slashParts.length === 3) {
        return new Date(parseInt(slashParts[2]), parseInt(slashParts[0]) - 1, parseInt(slashParts[1]));
      }
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  };

  const [currentMonth, setCurrentMonth] = useState(parseDate(initialDate));
  const [selectedDate, setSelectedDate] = useState(initialDate ? parseDate(initialDate) : null);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If in 'past' mode (e.g. Date of Birth) and maxDate not explicitly provided,
  // enforce strict 18+ restriction (18 years ago from today)
  const defaultPastMax = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

  const effectiveMin = minDate ? parseDate(minDate) : (mode === 'future' ? today : null);
  if (effectiveMin) effectiveMin.setHours(0, 0, 0, 0);

  const effectiveMax = maxDate ? parseDate(maxDate) : (mode === 'past' ? defaultPastMax : null);
  if (effectiveMax) effectiveMax.setHours(23, 59, 59, 999);

  const maxAllowedYear = effectiveMax ? effectiveMax.getFullYear() : today.getFullYear();
  const minAllowedYear = 1930;

  useEffect(() => {
    if (visible) {
      setShowYearPicker(false);
      if (initialDate) {
        const d = parseDate(initialDate);
        setSelectedDate(d);
        setCurrentMonth(d);
      } else {
        if (mode === 'past') {
          // Default DOB view around 2000 (or maxAllowedYear if earlier)
          const defaultYear = Math.min(2000, maxAllowedYear);
          const dobDef = new Date(defaultYear, 0, 1);
          setCurrentMonth(dobDef);
          setSelectedDate(null);
        } else {
          const now = new Date();
          setCurrentMonth(now);
          setSelectedDate(null);
        }
      }
    }
  }, [visible, initialDate, mode, maxAllowedYear]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0 to 11

  const monthsEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthsHi = [
    'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
    'जुलाई', 'अगस्त', 'सितम्बर', 'अक्टूबर', 'नवम्बर', 'दिसम्बर'
  ];
  const weekdaysEn = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const weekdaysHi = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];

  const monthNames = isHindi ? monthsHi : monthsEn;
  const weekdays = isHindi ? weekdaysHi : weekdaysEn;

  // Strict boundary checks to prevent navigating to underage birth years
  const isNextMonthDisabled = Boolean(
    effectiveMax && (
      year > effectiveMax.getFullYear() ||
      (year === effectiveMax.getFullYear() && month >= effectiveMax.getMonth())
    )
  );

  const isNextYearDisabled = Boolean(
    effectiveMax && (year >= effectiveMax.getFullYear())
  );

  const isNext5YearsDisabled = Boolean(
    effectiveMax && (year >= effectiveMax.getFullYear())
  );

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    if (isNextMonthDisabled) return;
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handlePrevYear = () => {
    setCurrentMonth(new Date(Math.max(year - 1, minAllowedYear), month, 1));
  };

  const handleNextYear = () => {
    if (isNextYearDisabled) return;
    setCurrentMonth(new Date(year + 1, month, 1));
  };

  const handlePrev5Years = () => {
    setCurrentMonth(new Date(Math.max(year - 5, minAllowedYear), month, 1));
  };

  const handleNext5Years = () => {
    if (isNext5YearsDisabled) return;
    const targetYear = Math.min(year + 5, maxAllowedYear);
    setCurrentMonth(new Date(targetYear, month, 1));
  };

  // Date math
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday

  const isDayDisabled = (dayNum) => {
    const d = new Date(year, month, dayNum);
    d.setHours(0, 0, 0, 0);
    if (effectiveMin && d < effectiveMin) return true;
    if (effectiveMax && d > effectiveMax) return true;
    return false;
  };

  const isDaySelected = (dayNum) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === dayNum
    );
  };

  const isDayToday = (dayNum) => {
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === dayNum
    );
  };

  const handleSelectDay = (dayNum) => {
    if (isDayDisabled(dayNum)) return;
    const newDate = new Date(year, month, dayNum);
    setSelectedDate(newDate);
  };

  const handleApplyPreset = (daysToAdd) => {
    const target = new Date();
    target.setDate(today.getDate() + daysToAdd);
    target.setHours(0, 0, 0, 0);
    setSelectedDate(target);
    setCurrentMonth(new Date(target.getFullYear(), target.getMonth(), 1));
  };

  const formatOutput = (d) => {
    if (!d) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleConfirm = () => {
    if (selectedDate && onSelectDate) {
      onSelectDate(formatOutput(selectedDate), selectedDate);
    }
    onClose();
  };

  // Build grid slots
  const slots = [];
  // Empty leading days
  for (let i = 0; i < firstDayIndex; i++) {
    slots.push({ empty: true, id: `empty-${i}` });
  }
  // Month days
  for (let d = 1; d <= daysInMonth; d++) {
    slots.push({
      empty: false,
      day: d,
      disabled: isDayDisabled(d),
      selected: isDaySelected(d),
      isToday: isDayToday(d),
      id: `day-${d}`,
    });
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={[styles.modalCard, SHADOWS.card]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <View style={styles.calendarIconCircle}>
                <CalendarIcon size={16} color="#38BDF8" />
              </View>
              <Text style={styles.titleText}>
                {title || t('calendar.selectDate', 'Select Date')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Quick Presets for Future Booking Mode */}
          {mode === 'future' && (
            <View style={styles.presetsRow}>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handleApplyPreset(0)}
                activeOpacity={0.8}
              >
                <Text style={styles.presetChipText}>{t('calendar.today', 'Today')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handleApplyPreset(1)}
                activeOpacity={0.8}
              >
                <Text style={styles.presetChipText}>{t('calendar.tomorrow', 'Tomorrow')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handleApplyPreset(3)}
                activeOpacity={0.8}
              >
                <Text style={styles.presetChipText}>{t('calendar.threeDays', '+3 Days')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => handleApplyPreset(7)}
                activeOpacity={0.8}
              >
                <Text style={styles.presetChipText}>{t('calendar.oneWeek', '+1 Week')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 18+ Age Restriction Header Banner */}
          {mode === 'past' && (
            <View style={styles.ageBanner}>
              <ShieldCheck size={14} color="#10B981" />
              <Text style={styles.ageBannerText}>
                {isHindi
                  ? `18+ अनिवार्य: केवल ${maxAllowedYear} या उससे पहले जन्मे व्यक्ति पात्र हैं`
                  : `18+ Mandatory: Restricted to riders born in ${maxAllowedYear} or earlier`}
              </Text>
            </View>
          )}

          {/* Quick Year Shift for Birth Date Mode */}
          {mode === 'past' && (
            <View style={styles.yearShiftRow}>
              <TouchableOpacity
                style={styles.yearShiftBtn}
                onPress={handlePrev5Years}
                activeOpacity={0.8}
              >
                <Text style={styles.yearShiftText}>-5 Yrs</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.yearShiftBtn}
                onPress={handlePrevYear}
                activeOpacity={0.8}
              >
                <Text style={styles.yearShiftText}>-1 Yr</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.yearBadgeBtn}
                onPress={() => setShowYearPicker(!showYearPicker)}
                activeOpacity={0.8}
              >
                <Text style={styles.yearDisplayBadge}>{year}</Text>
                <ChevronDown size={13} color="#38BDF8" style={{ marginLeft: 3 }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.yearShiftBtn, isNextYearDisabled && styles.yearShiftBtnDisabled]}
                onPress={handleNextYear}
                disabled={isNextYearDisabled}
                activeOpacity={0.8}
              >
                <Text style={[styles.yearShiftText, isNextYearDisabled && styles.yearShiftTextDisabled]}>+1 Yr</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.yearShiftBtn, isNext5YearsDisabled && styles.yearShiftBtnDisabled]}
                onPress={handleNext5Years}
                disabled={isNext5YearsDisabled}
                activeOpacity={0.8}
              >
                <Text style={[styles.yearShiftText, isNext5YearsDisabled && styles.yearShiftTextDisabled]}>+5 Yrs</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Direct Year Picker View (when toggled in past mode) */}
          {showYearPicker && mode === 'past' ? (
            <View style={styles.yearPickerContainer}>
              <View style={styles.yearPickerHeader}>
                <Text style={styles.yearPickerTitle}>
                  {isHindi ? `जन्म वर्ष चुनें (अधिकतम ${maxAllowedYear})` : `Select Birth Year (Max ${maxAllowedYear})`}
                </Text>
                <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                  <X size={15} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={{ maxHeight: 210 }}
                contentContainerStyle={styles.yearGridWrap}
                showsVerticalScrollIndicator={true}
              >
                {Array.from({ length: maxAllowedYear - minAllowedYear + 1 }, (_, i) => maxAllowedYear - i).map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.yearChip, year === y && styles.yearChipActive]}
                    onPress={() => {
                      setCurrentMonth(new Date(y, month, 1));
                      setShowYearPicker(false);
                    }}
                  >
                    <Text style={[styles.yearChipText, year === y && styles.yearChipTextActive]}>
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            <>
              {/* Month / Year Navigator Bar */}
              <View style={styles.monthNavRow}>
                <TouchableOpacity
                  style={styles.navArrowBtn}
                  onPress={handlePrevMonth}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={18} color="#CBD5E1" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => mode === 'past' && setShowYearPicker(true)}
                  activeOpacity={mode === 'past' ? 0.7 : 1}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Text style={styles.monthYearTitle}>
                    {monthNames[month]} {year}
                  </Text>
                  {mode === 'past' && <ChevronDown size={14} color="#38BDF8" />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.navArrowBtn, isNextMonthDisabled && styles.navArrowBtnDisabled]}
                  onPress={handleNextMonth}
                  disabled={isNextMonthDisabled}
                  activeOpacity={0.7}
                >
                  <ChevronRight size={18} color={isNextMonthDisabled ? '#475569' : '#CBD5E1'} />
                </TouchableOpacity>
              </View>

              {/* Weekday Labels */}
              <View style={styles.weekdaysRow}>
                {weekdays.map((w, idx) => (
                  <Text key={idx} style={styles.weekdayLabel}>
                    {w}
                  </Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.gridContainer}>
                {slots.map((slot) => {
                  if (slot.empty) {
                    return <View key={slot.id} style={styles.daySlotEmpty} />;
                  }

                  return (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.daySlot,
                        slot.selected && styles.daySlotSelected,
                        slot.isToday && !slot.selected && styles.daySlotToday,
                        slot.disabled && styles.daySlotDisabled,
                      ]}
                      onPress={() => handleSelectDay(slot.day)}
                      disabled={slot.disabled}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          slot.selected && styles.dayTextSelected,
                          slot.isToday && !slot.selected && styles.dayTextToday,
                          slot.disabled && styles.dayTextDisabled,
                        ]}
                      >
                        {slot.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Selected Date Summary & Confirm Button */}
          <View style={styles.footerRow}>
            <View style={styles.selectedDisplayWrap}>
              <Text style={styles.selectedLabel}>
                {isHindi ? 'चयनित तारीख:' : 'Selected:'}
              </Text>
              <Text style={styles.selectedValueText}>
                {selectedDate
                  ? `${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
                  : (isHindi ? 'कोई नहीं' : 'None')}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                !selectedDate && styles.confirmBtnDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!selectedDate}
              activeOpacity={0.85}
            >
              <Check size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.confirmBtnText}>
                {t('calendar.confirmDate', 'Confirm Date')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 20, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: '#0C1322',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    padding: 20,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 15,
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
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  presetChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  yearShiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.md,
    padding: 6,
    marginBottom: 10,
  },
  ageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  ageBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
    flex: 1,
  },
  yearBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  yearShiftBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  yearShiftBtnDisabled: {
    opacity: 0.25,
  },
  yearShiftText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  yearShiftTextDisabled: {
    color: '#475569',
  },
  yearDisplayBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
  },
  yearPickerContainer: {
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    padding: 10,
    marginBottom: 12,
  },
  yearPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 8,
  },
  yearPickerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38BDF8',
  },
  yearGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  yearChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minWidth: 54,
    alignItems: 'center',
  },
  yearChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  yearChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  yearChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  navArrowBtnDisabled: {
    opacity: 0.25,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111A2E',
    borderRadius: RADIUS.md,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 12,
  },
  navArrowBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  weekdayLabel: {
    width: 40,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 6,
    marginBottom: 16,
  },
  daySlotEmpty: {
    width: 40,
    height: 36,
  },
  daySlot: {
    width: 40,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  daySlotSelected: {
    backgroundColor: '#0284C7',
    borderWidth: 1,
    borderColor: '#38BDF8',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  daySlotToday: {
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
  },
  daySlotDisabled: {
    opacity: 0.25,
  },
  dayText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayTextToday: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  dayTextDisabled: {
    color: '#475569',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 12,
  },
  selectedDisplayWrap: {
    flex: 1,
  },
  selectedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  selectedValueText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38BDF8',
    marginTop: 1,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
