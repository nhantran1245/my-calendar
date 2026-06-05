/**
 * EventFormModal — bottom sheet for creating or editing a calendar event.
 * Design follows the Cadence mobile UI kit NewEventSheet spec:
 *   drag handle · Cancel | New event | Save · serif title input ·
 *   icon form rows (clock / bell / repeat / notes) · calendar color chips
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAX_TITLE_LENGTH, REMINDER_OPTIONS } from '../constants/calendar.constants';
import {
  CalendarEvent,
  CreateEventPayload,
  CreateRecurringEventPayload,
  EventTag,
  RecurrenceEndType,
  RecurrenceFrequency,
  RecurrenceRule,
  recurringApi,
} from '../api/events';
import { useTheme } from '../theme';
import { fonts, palette, radii, spacing, textStyles } from '../theme/tokens';
import { Icon } from './Icon';

// ─── Types ────────────────────────────────────────────────────

interface EventFormModalProps {
  visible: boolean;
  mode: 'create' | 'edit';
  initialDate?: Date;
  event?: CalendarEvent;
  onSave: (payload: CreateEventPayload) => Promise<void>;
  onRecurringSave?: (result: { instancesCreated: number }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

type ReminderValue = number | null;

// ─── Constants ────────────────────────────────────────────────

const CAL_CHIPS: { id: EventTag; label: string; color: string }[] = [
  { id: 'personal', label: 'Personal', color: palette.ember500 },
  { id: 'work',     label: 'Work',     color: palette.steel500 },
  { id: 'health',   label: 'Health',   color: palette.sage500 },
  { id: 'deadline', label: 'Deadlines',color: palette.amber500 },
];

const WEEKDAYS: { key: string; label: string }[] = [
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'T' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'S' },
  { key: 'sun', label: 'S' },
];

const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly' },
];

const MONTHLY_ORDINALS = ['1st', '2nd', '3rd', '4th', 'last'];
const WEEKDAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// ─── Helpers ──────────────────────────────────────────────────

function pad(n: number) { return String(n).padStart(2, '0'); }

function formatLocalIso(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function parseIsoToDate(iso: string): Date | null {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function formatDisplayTime(startIso: string, endIso: string, allDay: boolean): string {
  const start = parseIsoToDate(startIso);
  if (!start) return 'Set date & time';

  const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dow = DOW[start.getDay()];
  const day = start.getDate();

  if (allDay) return `${dow} ${day} · All day`;

  const fmt = (d: Date) => {
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'pm' : 'am';
    const hour = h % 12 || 12;
    const min = m > 0 ? `:${pad(m)}` : '';
    return `${hour}${min}${ampm}`;
  };

  const end = parseIsoToDate(endIso);
  return end ? `${dow} ${day}, ${fmt(start)} – ${fmt(end)}` : `${dow} ${day}, ${fmt(start)}`;
}

function dayShortFromDate(d: Date): string {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d.getDay()];
}

function buildRecurrenceRule(
  frequency: RecurrenceFrequency,
  weeklyDays: string[],
  monthlyType: 'date' | 'relative',
  monthlyDate: number,
  monthlyOrdinal: string,
  monthlyWeekday: string,
  startIso: string,
  endType: RecurrenceEndType,
  endCount: string,
  endDateValue: string,
): RecurrenceRule {
  let pattern: Record<string, unknown> | undefined;

  if (frequency === 'weekly') {
    pattern = { days: weeklyDays };
  } else if (frequency === 'monthly') {
    pattern = monthlyType === 'date'
      ? { type: 'date', value: monthlyDate }
      : { type: 'relative', value: `${monthlyOrdinal}_${monthlyWeekday}` };
  } else if (frequency === 'yearly') {
    const d = parseIsoToDate(startIso) ?? new Date();
    pattern = { month: d.getMonth() + 1, day: d.getDate() };
  }

  let endValue: string | undefined;
  if (endType === 'after_occurrences') endValue = endCount;
  else if (endType === 'on_date' && endDateValue) endValue = new Date(endDateValue).toISOString();

  return { frequency, pattern, endType, endValue };
}

function repeatSummary(
  frequency: RecurrenceFrequency,
  weeklyDays: string[],
  monthlyType: 'date' | 'relative',
  monthlyDate: number,
  monthlyOrdinal: string,
  monthlyWeekday: string,
  startIso: string,
): string {
  if (frequency === 'daily') return 'Every day';
  if (frequency === 'weekly') {
    const labels: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
    return `Every ${weeklyDays.map(d => labels[d]).join(', ')}`;
  }
  if (frequency === 'monthly') {
    return monthlyType === 'date'
      ? `Monthly on the ${monthlyDate}th`
      : `Monthly on the ${monthlyOrdinal} ${monthlyWeekday}`;
  }
  if (frequency === 'yearly') {
    const d = parseIsoToDate(startIso) ?? new Date();
    return `Every year on ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }
  return 'Repeating';
}

// ─── FormRow ──────────────────────────────────────────────────

interface FormRowProps {
  icon: Parameters<typeof Icon>[0]['name'];
  label: string;
  muted?: boolean;
  onPress?: () => void;
}

function FormRow({ icon, label, muted = false, onPress }: FormRowProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[rowStyles.row, { borderTopColor: colors.borderSubtle }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.65 : 1}
      disabled={!onPress}
    >
      <Icon name={icon} size={18} color={colors.fg2} />
      <Text style={[rowStyles.label, { color: muted ? colors.fg3 : colors.fg0 }]} numberOfLines={1}>
        {label}
      </Text>
      {onPress && <Text style={[rowStyles.chevron, { color: colors.fg3 }]}>›</Text>}
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  label: { flex: 1, fontSize: 14, lineHeight: 20 },
  chevron: { fontSize: 18, lineHeight: 20 },
});

// ─── EventFormModal ───────────────────────────────────────────

export function EventFormModal({
  visible,
  mode,
  initialDate,
  event,
  onSave,
  onRecurringSave,
  onDelete,
  onClose,
}: EventFormModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const defaultStart = initialDate ? formatLocalIso(initialDate) : formatLocalIso(new Date());

  // ─── Base fields ────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [startAt, setStartAt] = useState(defaultStart);
  const [endAt, setEndAt] = useState('');
  const [reminder, setReminder] = useState<ReminderValue>(null);
  const [calChip, setCalChip] = useState<EventTag>('personal');

  const [timeExpanded, setTimeExpanded] = useState(false);
  const [reminderExpanded, setReminderExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);

  // ─── Recurrence state ───────────────────────────────────────
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatExpanded, setRepeatExpanded] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('weekly');
  const [weeklyDays, setWeeklyDays] = useState<string[]>(['mon']);
  const [monthlyType, setMonthlyType] = useState<'date' | 'relative'>('date');
  const [monthlyDate, setMonthlyDate] = useState('15');
  const [monthlyOrdinal, setMonthlyOrdinal] = useState('1st');
  const [monthlyWeekday, setMonthlyWeekday] = useState('monday');
  const [endType, setEndType] = useState<RecurrenceEndType>('never');
  const [endCount, setEndCount] = useState('10');
  const [endDateValue, setEndDateValue] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Populate fields ────────────────────────────────────────

  useEffect(() => {
    if (!visible) return;
    if (mode === 'edit' && event) {
      setTitle(event.title);
      setDescription(event.description ?? '');
      setAllDay(event.allDay);
      setStartAt(formatLocalIso(new Date(event.startAt)));
      setEndAt(event.endAt ? formatLocalIso(new Date(event.endAt)) : '');
      setReminder(event.reminderMinutesBefore ?? null);
      setCalChip(event.tag ?? 'personal');
    } else {
      setTitle('');
      setDescription('');
      setAllDay(false);
      const start = initialDate ?? new Date();
      setStartAt(formatLocalIso(start));
      setEndAt('');
      setReminder(null);
      setCalChip('personal');
      setIsRecurring(false);
      setWeeklyDays([dayShortFromDate(start)]);
      setMonthlyDate(String(start.getDate()));
    }
    setTimeExpanded(false);
    setReminderExpanded(false);
    setNotesExpanded(false);
    setRepeatExpanded(false);
    setError(null);
    setSaving(false);
  }, [visible, mode, event, initialDate]);

  // ─── Derived ────────────────────────────────────────────────

  const isPastEvent = mode === 'edit' && event ? new Date(event.startAt) < new Date() : false;
  const canSave = title.trim().length > 0 && !isPastEvent && !saving;

  const reminderLabel = REMINDER_OPTIONS.find(o => o.value === reminder)?.label ?? 'No reminder';

  const repeatLabel = isRecurring
    ? repeatSummary(frequency, weeklyDays, monthlyType, Number(monthlyDate), monthlyOrdinal, monthlyWeekday, startAt)
    : 'No repeat';

  const toggleWeeklyDay = (day: string) => {
    setWeeklyDays(prev =>
      prev.includes(day)
        ? prev.length > 1 ? prev.filter(d => d !== day) : prev
        : [...prev, day],
    );
  };

  // ─── Save handler ───────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setError(null);
    setSaving(true);

    try {
      const startDate = parseIsoToDate(startAt);
      if (!startDate) {
        setError('Invalid start date/time.');
        setSaving(false);
        return;
      }

      const basePayload: CreateEventPayload = {
        title: title.trim(),
        description: description.trim() || null,
        startAt: startDate.toISOString(),
        allDay,
        reminderMinutesBefore: reminder,
        tag: calChip,
        endAt: null,
      };

      if (endAt.trim()) {
        const endDate = parseIsoToDate(endAt);
        if (!endDate) { setError('Invalid end date/time.'); setSaving(false); return; }
        basePayload.endAt = endDate.toISOString();
      }

      if (isRecurring && mode === 'create') {
        const rule = buildRecurrenceRule(
          frequency, weeklyDays, monthlyType, Number(monthlyDate),
          monthlyOrdinal, monthlyWeekday, startAt, endType, endCount, endDateValue,
        );
        const recurringPayload: CreateRecurringEventPayload = { ...basePayload, recurrenceRule: rule };
        const result = await recurringApi.create(recurringPayload);
        onRecurringSave?.({ instancesCreated: result.instancesCreated });
        onClose();
      } else {
        await onSave(basePayload);
        onClose();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [
    canSave, title, description, allDay, startAt, endAt, reminder, calChip,
    isRecurring, frequency, weeklyDays, monthlyType, monthlyDate,
    monthlyOrdinal, monthlyWeekday, endType, endCount, endDateValue,
    mode, onSave, onRecurringSave, onClose,
  ]);

  // ─── Render ─────────────────────────────────────────────────

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: colors.bg0, paddingBottom: insets.bottom + spacing[4] }]}>
          {/* Drag handle */}
          <View style={[styles.handle, { backgroundColor: colors.bg2 }]} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <TouchableOpacity onPress={onClose} hitSlop={8} style={styles.headerSideBtn}>
              <Text style={[styles.headerBtnText, { color: colors.fg2 }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.fg0 }]}>
              {mode === 'create' ? 'New event' : 'Edit event'}
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={!canSave} hitSlop={8} style={styles.headerSideBtn}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Text style={[styles.headerBtnText, styles.headerBtnSave, { color: canSave ? colors.accent : colors.fg3 }]}>
                  {isRecurring && mode === 'create' ? 'Create' : 'Save'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing[5] }]}>
            {/* Past-event warning */}
            {isPastEvent && (
              <View style={[styles.warningBox, { backgroundColor: colors.warningTint }]}>
                <Icon name="clock" size={14} color={colors.warning} />
                <Text style={[textStyles.bodySm, { color: colors.warning, flex: 1 }]}>
                  This event is in the past and cannot be edited.
                </Text>
              </View>
            )}

            {/* Title */}
            <TextInput
              style={[styles.titleInput, { color: colors.fg0 }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Event title"
              placeholderTextColor={colors.fg3}
              maxLength={MAX_TITLE_LENGTH}
              autoFocus={mode === 'create'}
              editable={!isPastEvent}
              returnKeyType="next"
            />

            {/* Clock row */}
            <FormRow icon="clock" label={formatDisplayTime(startAt, endAt, allDay)} onPress={() => setTimeExpanded(v => !v)} />
            {timeExpanded && (
              <View style={[styles.expanded, { borderTopColor: colors.borderSubtle }]}>
                <View style={styles.allDayRow}>
                  <Text style={[styles.expandLabel, { color: colors.fg1 }]}>All day</Text>
                  <Switch value={allDay} onValueChange={setAllDay} disabled={isPastEvent} trackColor={{ true: colors.accent }} />
                </View>
                <Text style={[styles.miniLabel, { color: colors.fg2 }]}>{allDay ? 'Date' : 'Start'}</Text>
                <TextInput
                  style={[styles.expandInput, { backgroundColor: colors.bg1, color: colors.fg0, borderColor: colors.borderSubtle }]}
                  value={startAt} onChangeText={setStartAt} placeholder="YYYY-MM-DDTHH:MM"
                  placeholderTextColor={colors.fg3} editable={!isPastEvent} autoCapitalize="none"
                />
                {!allDay && (
                  <>
                    <Text style={[styles.miniLabel, { color: colors.fg2 }]}>End (optional)</Text>
                    <TextInput
                      style={[styles.expandInput, { backgroundColor: colors.bg1, color: colors.fg0, borderColor: colors.borderSubtle }]}
                      value={endAt} onChangeText={setEndAt} placeholder="YYYY-MM-DDTHH:MM"
                      placeholderTextColor={colors.fg3} editable={!isPastEvent} autoCapitalize="none"
                    />
                  </>
                )}
              </View>
            )}

            {/* Bell row */}
            <FormRow icon="bell" label={reminderLabel} onPress={() => !isPastEvent && setReminderExpanded(v => !v)} />
            {reminderExpanded && (
              <View style={[styles.expanded, { borderTopColor: colors.borderSubtle }]}>
                {REMINDER_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={String(opt.value)}
                    style={[styles.reminderOpt, { borderBottomColor: colors.borderSubtle }, opt.value === reminder && { backgroundColor: colors.accentTint }]}
                    onPress={() => { setReminder(opt.value); setReminderExpanded(false); }}
                  >
                    <Text style={[styles.reminderOptText, { color: opt.value === reminder ? colors.accent : colors.fg1 }]}>{opt.label}</Text>
                    {opt.value === reminder && <Icon name="check" size={16} color={colors.accent} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Repeat row (create mode only) */}
            {mode === 'create' && !isPastEvent && (
              <>
                <FormRow
                  icon="repeat"
                  label={repeatLabel}
                  muted={!isRecurring}
                  onPress={() => setRepeatExpanded(v => !v)}
                />
                {repeatExpanded && (
                  <View style={[styles.expanded, { borderTopColor: colors.borderSubtle, gap: spacing[4] }]}>
                    {/* Repeat on/off */}
                    <View style={styles.allDayRow}>
                      <Text style={[styles.expandLabel, { color: colors.fg1 }]}>Repeat</Text>
                      <Switch
                        value={isRecurring}
                        onValueChange={setIsRecurring}
                        trackColor={{ true: colors.accent }}
                      />
                    </View>

                    {isRecurring && (
                      <>
                        {/* Frequency pills */}
                        <View style={{ gap: spacing[2] }}>
                          <Text style={[styles.miniLabel, { color: colors.fg2 }]}>FREQUENCY</Text>
                          <View style={styles.pillRow}>
                            {FREQUENCY_OPTIONS.map(f => {
                              const active = frequency === f.value;
                              return (
                                <TouchableOpacity
                                  key={f.value}
                                  onPress={() => setFrequency(f.value)}
                                  style={[styles.pill, { borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accentTint : 'transparent' }]}
                                >
                                  <Text style={[styles.pillText, { color: active ? colors.accent : colors.fg1 }]}>{f.label}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>

                        {/* Weekly day picker */}
                        {frequency === 'weekly' && (
                          <View style={{ gap: spacing[2] }}>
                            <Text style={[styles.miniLabel, { color: colors.fg2 }]}>REPEAT ON</Text>
                            <View style={styles.pillRow}>
                              {WEEKDAYS.map(d => {
                                const active = weeklyDays.includes(d.key);
                                return (
                                  <TouchableOpacity
                                    key={d.key}
                                    onPress={() => toggleWeeklyDay(d.key)}
                                    style={[styles.dayCircle, { backgroundColor: active ? colors.accent : colors.bg1 }]}
                                  >
                                    <Text style={[styles.dayCircleText, { color: active ? '#fff' : colors.fg2 }]}>{d.label}</Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </View>
                        )}

                        {/* Monthly picker */}
                        {frequency === 'monthly' && (
                          <View style={{ gap: spacing[2] }}>
                            <Text style={[styles.miniLabel, { color: colors.fg2 }]}>REPEAT ON</Text>
                            <View style={styles.pillRow}>
                              {(['date', 'relative'] as const).map(t => {
                                const active = monthlyType === t;
                                return (
                                  <TouchableOpacity key={t} onPress={() => setMonthlyType(t)}
                                    style={[styles.pill, { flex: 1, borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accentTint : 'transparent' }]}>
                                    <Text style={[styles.pillText, { color: active ? colors.accent : colors.fg1 }]}>
                                      {t === 'date' ? 'Day of month' : 'Day of week'}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                            {monthlyType === 'date' ? (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                                <Text style={[textStyles.bodySm, { color: colors.fg1 }]}>On the</Text>
                                <TextInput
                                  style={[styles.expandInput, { width: 60, backgroundColor: colors.bg1, color: colors.fg0, borderColor: colors.borderSubtle }]}
                                  value={monthlyDate} onChangeText={setMonthlyDate}
                                  keyboardType="number-pad" maxLength={2}
                                />
                                <Text style={[textStyles.bodySm, { color: colors.fg1 }]}>of each month</Text>
                              </View>
                            ) : (
                              <View style={{ gap: spacing[2] }}>
                                <Text style={[styles.miniLabel, { color: colors.fg2 }]}>ORDINAL</Text>
                                <View style={styles.pillRow}>
                                  {MONTHLY_ORDINALS.map(o => (
                                    <TouchableOpacity key={o} onPress={() => setMonthlyOrdinal(o)}
                                      style={[styles.pill, { borderColor: monthlyOrdinal === o ? colors.accent : colors.border, backgroundColor: monthlyOrdinal === o ? colors.accentTint : 'transparent' }]}>
                                      <Text style={[styles.pillText, { color: monthlyOrdinal === o ? colors.accent : colors.fg1 }]}>{o}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                                <Text style={[styles.miniLabel, { color: colors.fg2, marginTop: spacing[1] }]}>WEEKDAY</Text>
                                <View style={[styles.pillRow, { flexWrap: 'wrap' }]}>
                                  {WEEKDAY_NAMES.map(d => (
                                    <TouchableOpacity key={d} onPress={() => setMonthlyWeekday(d)}
                                      style={[styles.pill, { borderColor: monthlyWeekday === d ? colors.accent : colors.border, backgroundColor: monthlyWeekday === d ? colors.accentTint : 'transparent' }]}>
                                      <Text style={[styles.pillText, { color: monthlyWeekday === d ? colors.accent : colors.fg1 }]}>{d.charAt(0).toUpperCase() + d.slice(1)}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </View>
                              </View>
                            )}
                          </View>
                        )}

                        {/* Yearly (derived from startAt) */}
                        {frequency === 'yearly' && (
                          <View style={[styles.infoBox, { backgroundColor: colors.bg1 }]}>
                            <Text style={[textStyles.bodySm, { color: colors.fg2 }]}>
                              Repeats every year on{' '}
                              {(parseIsoToDate(startAt) ?? new Date()).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                            </Text>
                          </View>
                        )}

                        {/* End condition */}
                        <View style={{ gap: spacing[2] }}>
                          <Text style={[styles.miniLabel, { color: colors.fg2 }]}>ENDS</Text>
                          <View style={styles.pillRow}>
                            {([
                              { value: 'never', label: 'Never' },
                              { value: 'after_occurrences', label: 'After' },
                              { value: 'on_date', label: 'On date' },
                            ] as { value: RecurrenceEndType; label: string }[]).map(et => {
                              const active = endType === et.value;
                              return (
                                <TouchableOpacity key={et.value} onPress={() => setEndType(et.value)}
                                  style={[styles.pill, { flex: 1, borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accentTint : 'transparent' }]}>
                                  <Text style={[styles.pillText, { color: active ? colors.accent : colors.fg1 }]}>{et.label}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>

                          {endType === 'after_occurrences' && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                              <TextInput
                                style={[styles.expandInput, { width: 72, backgroundColor: colors.bg1, color: colors.fg0, borderColor: colors.borderSubtle }]}
                                value={endCount} onChangeText={setEndCount}
                                keyboardType="number-pad" maxLength={4}
                              />
                              <Text style={[textStyles.bodySm, { color: colors.fg1 }]}>occurrences</Text>
                            </View>
                          )}

                          {endType === 'on_date' && (
                            <TextInput
                              style={[styles.expandInput, { backgroundColor: colors.bg1, color: colors.fg0, borderColor: colors.borderSubtle }]}
                              value={endDateValue} onChangeText={setEndDateValue}
                              placeholder="YYYY-MM-DD" placeholderTextColor={colors.fg3}
                              autoCapitalize="none"
                            />
                          )}
                        </View>
                      </>
                    )}
                  </View>
                )}
              </>
            )}

            {/* Notes row */}
            <FormRow icon="inbox" label={description.trim() || 'Add notes'} muted={!description.trim()} onPress={() => !isPastEvent && setNotesExpanded(v => !v)} />
            {notesExpanded && (
              <View style={[styles.expanded, { borderTopColor: colors.borderSubtle }]}>
                <TextInput
                  style={[styles.notesInput, { color: colors.fg0 }]}
                  value={description} onChangeText={setDescription}
                  placeholder="Notes (optional)" placeholderTextColor={colors.fg3}
                  multiline editable={!isPastEvent} textAlignVertical="top" autoFocus
                />
              </View>
            )}

            {/* Calendar chips */}
            <View style={styles.chipsSection}>
              <Text style={[styles.chipsLabel, { color: colors.fg2 }]}>Calendar</Text>
              <View style={styles.chipsRow}>
                {CAL_CHIPS.map(c => {
                  const active = calChip === c.id;
                  return (
                    <TouchableOpacity key={c.id} onPress={() => setCalChip(c.id)}
                      style={[styles.chip, { borderColor: active ? colors.fg0 : colors.border, backgroundColor: active ? colors.bg1 : 'transparent' }]}
                      activeOpacity={0.7}>
                      <View style={[styles.chipDot, { backgroundColor: c.color }]} />
                      <Text style={[styles.chipText, { color: colors.fg0 }]}>{c.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Error */}
            {error && (
              <View style={[styles.errorBox, { backgroundColor: colors.dangerTint }]}>
                <Text style={[textStyles.bodySm, { color: colors.danger }]}>{error}</Text>
              </View>
            )}

            {/* Delete (edit mode) */}
            {mode === 'edit' && !isPastEvent && onDelete && (
              <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
                <Icon name="trash" size={16} color={colors.danger} />
                <Text style={[textStyles.ui, { color: colors.danger }]}>Delete event</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  kav: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  scrim: { ...StyleSheet.absoluteFillObject },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 16, maxHeight: '92%' },
  handle: { width: 36, height: 4, borderRadius: radii.full, alignSelf: 'center', marginTop: 12, marginBottom: 12 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], marginBottom: spacing[3] },
  headerSideBtn: { minWidth: 60 },
  headerBtnText: { fontSize: 15, lineHeight: 20 },
  headerBtnSave: { fontWeight: '500', textAlign: 'right' },
  headerTitle: { fontSize: 15, fontWeight: '500', lineHeight: 20 },
  scrollContent: { paddingBottom: spacing[4], gap: 0 },
  titleInput: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 34, paddingVertical: 0, marginBottom: spacing[1], includeFontPadding: false },
  expanded: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: spacing[3], gap: spacing[2] },
  allDayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: spacing[1] },
  expandLabel: { fontSize: 15, lineHeight: 20 },
  miniLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', marginTop: spacing[1] },
  expandInput: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radii.sm, paddingHorizontal: spacing[3], paddingVertical: spacing[2], fontSize: 14, lineHeight: 20, fontFamily: fonts.mono },
  reminderOpt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing[3], borderBottomWidth: StyleSheet.hairlineWidth },
  reminderOptText: { fontSize: 15, lineHeight: 20 },
  notesInput: { fontSize: 14, lineHeight: 21, minHeight: 72, paddingVertical: spacing[1] },
  chipsSection: { marginTop: spacing[4], gap: spacing[2] },
  chipsLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.full, borderWidth: 1 },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  warningBox: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2], padding: spacing[3], borderRadius: radii.md, marginBottom: spacing[3] },
  errorBox: { padding: spacing[3], borderRadius: radii.md, marginTop: spacing[3] },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: spacing[4], marginTop: spacing[2] },
  // Recurrence
  pillRow: { flexDirection: 'row', gap: spacing[2] },
  pill: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radii.full, borderWidth: 1, alignItems: 'center' },
  pillText: { fontSize: 12, fontWeight: '500' },
  dayCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayCircleText: { fontSize: 11, fontWeight: '600' },
  infoBox: { padding: spacing[3], borderRadius: radii.sm },
});
