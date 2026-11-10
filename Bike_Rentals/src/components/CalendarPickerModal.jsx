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
  // activePicker: null | 'month' | 'year'
  const [activePicker, setActivePicker] = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If in 'past' mode (e.g. Date of Birth) and maxDate not explicitly provided,
  // enforce strict 18+ restriction (18 years ago from today)
  const defaultPastMax = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

  const effectiveMin = minDate ? parseDate(minDate) : (mode === 'future' ? today : null);
  if (effectiveMin) effectiveMin.setHours(0, 0, 0, 0);

  const effectiveMax = maxDate ? parseDate(maxDate) : (mode === 'past' ? defaultPastMax : null);
  if (effectiveMax) effectiveMax.setHours(23, 59, 59, 999);

  const maxAllowedYear = effectiveMax
    ? effectiveMax.getFullYear()
    : mode === 'past'
    ? defaultPastMax.getFullYear()
    : today.getFullYear() + 15;
  const minAllowedYear = mode === 'future' ? today.getFullYear() - 1 : 1930;

  useEffect(() => {
    if (visible) {
      setActivePicker(null);
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
  const weekdaysFullEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekdaysFullHi = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

  const monthNames = isHindi ? monthsHi : monthsEn;
  const weekdays = isHindi ? weekdaysHi : weekdaysEn;
  const weekdaysFull = isHindi ? weekdaysFullHi : weekdaysFullEn;

  // Strict boundary checks to prevent navigating out of bounds
  const isNextMonthDisabled = Boolean(
    effectiveMax && (
      year > effectiveMax.getFullYear() ||
      (year === effectiveMax.getFullYear() && month >= effectiveMax.getMonth())
    )
  );

  const isPrevMonthDisabled = Boolean(
    effectiveMin && (
      year < effectiveMin.getFullYear() ||
      (year === effectiveMin.getFullYear() && month <= effectiveMin.getMonth())
    )
  );

  const isNextYearDisabled = Boolean(
    effectiveMax && (year >= effectiveMax.getFullYear())
  );

  const isNext5YearsDisabled = Boolean(
    effectiveMax && (year >= effectiveMax.getFullYear())
  );

  // Month and Year selection handlers
  const handleSelectMonth = (newMonthIdx) => {
    const newMonthDate = new Date(year, newMonthIdx, 1);
    setCurrentMonth(newMonthDate);
    if (selectedDate) {
      const maxDay = new Date(year, newMonthIdx + 1, 0).getDate();
      const clampedDay = Math.min(selectedDate.getDate(), maxDay);
      const newSelected = new Date(year, newMonthIdx, clampedDay);
      newSelected.setHours(0, 0, 0, 0);
      let isValid = true;
      if (effectiveMin && newSelected < effectiveMin) isValid = false;
      if (effectiveMax && newSelected > effectiveMax) isValid = false;
      if (isValid) {
        setSelectedDate(newSelected);
      }
    }
    setActivePicker(null);
  };

  const handleSelectYear = (newYear) => {
    let targetMonth = month;
    if (effectiveMax && (newYear > effectiveMax.getFullYear() || (newYear === effectiveMax.getFullYear() && targetMonth > effectiveMax.getMonth()))) {
      targetMonth = effectiveMax.getMonth();
    }
    if (effectiveMin && (newYear < effectiveMin.getFullYear() || (newYear === effectiveMin.getFullYear() && targetMonth < effectiveMin.getMonth()))) {
      targetMonth = effectiveMin.getMonth();
    }
    setCurrentMonth(new Date(newYear, targetMonth, 1));
    if (selectedDate) {
      const maxDay = new Date(newYear, targetMonth + 1, 0).getDate();
      const clampedDay = Math.min(selectedDate.getDate(), maxDay);
      const newSelected = new Date(newYear, targetMonth, clampedDay);
      newSelected.setHours(0, 0, 0, 0);
      let isValid = true;
      if (effectiveMin && newSelected < effectiveMin) isValid = false;
      if (effectiveMax && newSelected > effectiveMax) isValid = false;
      if (isValid) {
        setSelectedDate(newSelected);
      }
    }
    setActivePicker(null);
  };

  // Navigation handlers
  const handlePrevMonth = () => {
    if (isPrevMonthDisabled) return;
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    if (isNextMonthDisabled) return;
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handlePrev5Years = () => {
    const targetYear = Math.max(year - 5, minAllowedYear);
    setCurrentMonth(new Date(targetYear, month, 1));
  };

  const handleNext5Years = () => {
    if (isNext5YearsDisabled) return;
    const targetYear = Math.min(year + 5, maxAllowedYear);
    setCurrentMonth(new Date(targetYear, month, 1));
  };

  // Accurate calendar date math
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

  // Build grid slots strictly partitioned into 7-column weeks
  // This guarantees Sunday is col 0, Monday is col 1, Tuesday is col 2, etc. with zero horizontal drift
  const slots = [];
  // Empty leading days before month start
  for (let i = 0; i < firstDayIndex; i++) {
    slots.push({ empty: true, id: `empty-${i}` });
  }
  // Days of the current month
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
  // Trailing empty days to complete the final 7-day row
  const remainder = slots.length % 7;
  if (remainder !== 0) {
    const trailingCount = 7 - remainder;
    for (let i = 0; i < trailingCount; i++) {
      slots.push({ empty: true, id: `trailing-${i}` });
    }
  }

  // Chunk into weeks of exactly 7 items
  const weeks = [];
  for (let i = 0; i < slots.length; i += 7) {
    weeks.push(slots.slice(i, i + 7));
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

          {/* Quick Direct Month & Year Selectors for Birth Date Mode */}
          {mode === 'past' && (
            <View style={styles.dobSelectorsRow}>
              <TouchableOpacity
                style={[styles.dobSelectPill, activePicker === 'month' && styles.dobSelectPillActive]}
                onPress={() => setActivePicker(activePicker === 'month' ? null : 'month')}
                activeOpacity={0.8}
              >
                <Text style={styles.dobSelectLabel}>{isHindi ? 'महीना' : 'Month'}:</Text>
                <Text style={styles.dobSelectValue} numberOfLines={1}>{monthNames[month]}</Text>
                <ChevronDown size={13} color="#38BDF8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dobSelectPill, activePicker === 'year' && styles.dobSelectPillActive]}
                onPress={() => setActivePicker(activePicker === 'year' ? null : 'year')}
                activeOpacity={0.8}
              >
                <Text style={styles.dobSelectLabel}>{isHindi ? 'वर्ष' : 'Year'}:</Text>
                <Text style={styles.dobSelectValue}>{year}</Text>
                <ChevronDown size={13} color="#38BDF8" />
              </TouchableOpacity>

              <View style={styles.dobQuickYearGroup}>
                <TouchableOpacity
                  style={styles.dobQuickShiftBtn}
                  onPress={handlePrev5Years}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dobQuickShiftText}>-5Y</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dobQuickShiftBtn, isNext5YearsDisabled && styles.dobQuickShiftBtnDisabled]}
                  onPress={handleNext5Years}
                  disabled={isNext5YearsDisabled}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dobQuickShiftText, isNext5YearsDisabled && styles.dobQuickShiftTextDisabled]}>+5Y</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Direct Month / Year Picker View (when toggled) */}
          {activePicker !== null ? (
            <View style={styles.pickerContainer}>
              <View style={styles.pickerTabsRow}>
                <TouchableOpacity
                  style={[styles.pickerTab, activePicker === 'month' && styles.pickerTabActive]}
                  onPress={() => setActivePicker('month')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pickerTabText, activePicker === 'month' && styles.pickerTabTextActive]}>
                    {isHindi ? 'महीना' : 'Month'}: {monthNames[month]}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pickerTab, activePicker === 'year' && styles.pickerTabActive]}
                  onPress={() => setActivePicker('year')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pickerTabText, activePicker === 'year' && styles.pickerTabTextActive]}>
                    {isHindi ? 'वर्ष' : 'Year'}: {year}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.pickerCloseBtn}
                  onPress={() => setActivePicker(null)}
                  activeOpacity={0.7}
                >
                  <X size={15} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {activePicker === 'month' ? (
                <View style={styles.monthGridWrap}>
                  {monthNames.map((mName, mIdx) => {
                    const isSelected = month === mIdx;
                    const isCurrent = today.getFullYear() === year && today.getMonth() === mIdx;
                    const isMonthDisabled = (
                      (effectiveMax && (
                        year > effectiveMax.getFullYear() ||
                        (year === effectiveMax.getFullYear() && mIdx > effectiveMax.getMonth())
                      )) ||
                      (effectiveMin && (
                        year < effectiveMin.getFullYear() ||
                        (year === effectiveMin.getFullYear() && mIdx < effectiveMin.getMonth())
                      ))
                    );

                    return (
                      <TouchableOpacity
                        key={mIdx}
                        style={[
                          styles.monthChip,
                          isSelected && styles.monthChipActive,
                          isCurrent && !isSelected && styles.monthChipCurrent,
                          isMonthDisabled && styles.monthChipDisabled,
                        ]}
                        disabled={isMonthDisabled}
                        onPress={() => handleSelectMonth(mIdx)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.monthChipText,
                            isSelected && styles.monthChipTextActive,
                            isCurrent && !isSelected && styles.monthChipTextCurrent,
                            isMonthDisabled && styles.monthChipTextDisabled,
                          ]}
                          numberOfLines={1}
                        >
                          {mName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <ScrollView
                  style={{ maxHeight: 220 }}
                  contentContainerStyle={styles.yearGridWrap}
                  showsVerticalScrollIndicator={true}
                >
                  {Array.from({ length: Math.max(1, maxAllowedYear - minAllowedYear + 1) }, (_, i) => maxAllowedYear - i).map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[styles.yearChip, year === y && styles.yearChipActive]}
                      onPress={() => handleSelectYear(y)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.yearChipText, year === y && styles.yearChipTextActive]}>
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : (
            <>
              {/* Month / Year Navigator Bar */}
              <View style={styles.monthNavRow}>
                <TouchableOpacity
                  style={[styles.navArrowBtn, isPrevMonthDisabled && styles.navArrowBtnDisabled]}
                  onPress={handlePrevMonth}
                  disabled={isPrevMonthDisabled}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={18} color={isPrevMonthDisabled ? '#475569' : '#CBD5E1'} />
                </TouchableOpacity>

                <View style={styles.navCenterGroup}>
                  <TouchableOpacity
                    onPress={() => setActivePicker(activePicker === 'month' ? null : 'month')}
                    activeOpacity={0.7}
                    style={[styles.navPill, activePicker === 'month' && styles.navPillActive]}
                  >
                    <Text style={[styles.monthYearTitle, activePicker === 'month' && styles.navPillTextActive]}>
                      {monthNames[month]}
                    </Text>
                    <ChevronDown size={13} color="#38BDF8" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setActivePicker(activePicker === 'year' ? null : 'year')}
                    activeOpacity={0.7}
                    style={[styles.navPill, activePicker === 'year' && styles.navPillActive]}
                  >
                    <Text style={[styles.monthYearTitle, activePicker === 'year' && styles.navPillTextActive]}>
                      {year}
                    </Text>
                    <ChevronDown size={13} color="#38BDF8" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.navArrowBtn, isNextMonthDisabled && styles.navArrowBtnDisabled]}
                  onPress={handleNextMonth}
                  disabled={isNextMonthDisabled}
                  activeOpacity={0.7}
                >
                  <ChevronRight size={18} color={isNextMonthDisabled ? '#475569' : '#CBD5E1'} />
                </TouchableOpacity>
              </View>

              {/* Weekday Labels (7 Equal Columns) */}
              <View style={styles.weekdaysRow}>
                {weekdays.map((w, idx) => (
                  <View key={idx} style={styles.colWrap}>
                    <Text style={[styles.weekdayLabel, (idx === 0 || idx === 6) && styles.weekendLabel]}>
                      {w}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Calendar Grid (Week by Week with 7 Equal Columns) */}
              <View style={styles.gridContainer}>
                {weeks.map((week, wIdx) => (
                  <View key={`week-${wIdx}`} style={styles.weekRow}>
                    {week.map((slot) => {
                      if (slot.empty) {
                        return <View key={slot.id} style={styles.colWrap} />;
                      }

                      return (
                        <View key={slot.id} style={styles.colWrap}>
                          <TouchableOpacity
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
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Selected Date Summary & Confirm Button */}
          <View style={styles.footerRow}>
            <View style={styles.selectedDisplayWrap}>
              <Text style={styles.selectedLabel}>
                {isHindi ? 'चयनित तारीख:' : 'Selected Date:'}
              </Text>
              <Text style={styles.selectedValueText} numberOfLines={1}>
                {selectedDate
                  ? `${weekdaysFull[selectedDate.getDay()]}, ${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
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
    backgroundColor: 'rgba(5, 11, 20, 0.85)',
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
    padding: 18,
    width: '100%',
    maxWidth: 390,
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
    marginBottom: 12,
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
    marginBottom: 12,
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
  dobSelectorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  dobSelectPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  dobSelectPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderColor: '#38BDF8',
  },
  dobSelectLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  dobSelectValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
    marginHorizontal: 3,
    flexShrink: 1,
  },
  dobQuickYearGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  dobQuickShiftBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  dobQuickShiftBtnDisabled: {
    opacity: 0.25,
  },
  dobQuickShiftText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  dobQuickShiftTextDisabled: {
    color: '#475569',
  },
  pickerContainer: {
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    padding: 12,
    marginBottom: 12,
  },
  pickerTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  pickerTab: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  pickerTabActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  pickerTabText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  pickerTabTextActive: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  pickerCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  monthChip: {
    width: '31%',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  monthChipCurrent: {
    borderColor: 'rgba(56, 189, 248, 0.5)',
  },
  monthChipDisabled: {
    opacity: 0.25,
  },
  monthChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    textAlign: 'center',
  },
  monthChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  monthChipTextCurrent: {
    color: '#38BDF8',
  },
  monthChipTextDisabled: {
    color: '#475569',
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
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111A2E',
    borderRadius: RADIUS.md,
    paddingHorizontal: 8,
    paddingVertical: 7,
    marginBottom: 10,
  },
  navCenterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  navPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  navPillTextActive: {
    color: '#38BDF8',
  },
  navArrowBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowBtnDisabled: {
    opacity: 0.25,
  },
  monthYearTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  weekdaysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    width: '100%',
  },
  colWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  weekdayLabel: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  weekendLabel: {
    color: '#94A3B8',
  },
  gridContainer: {
    width: '100%',
    rowGap: 4,
    marginBottom: 14,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  daySlot: {
    width: 38,
    height: 36,
    borderRadius: 10,
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
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  daySlotDisabled: {
    opacity: 0.22,
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
