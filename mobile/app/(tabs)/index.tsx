/**
 * MonthScreen — month calendar view matching the Cadence mobile UI kit design.
 *
 * Layout:
 *   TopBar (year micro label + serif month + nav + search/bell icons)
 *   DOW labels (Mon-first: M T W T F S S)
 *   6-row calendar grid (day number + event dots, no text pills)
 *   Separator
 *   Selected-day event preview (compact EventCards + FAB)
 */

import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DeleteConfirmModal } from '../../src/components/DeleteConfirmModal';
import { EventCard } from '../../src/components/EventCard';
import { EventFormModal } from '../../src/components/EventFormModal';
import { Icon } from '../../src/components/Icon';
import { useNotifications } from '../../src/context/NotificationContext';
import { CalendarEvent, CreateEventPayload, eventsApi } from '../../src/api/events';
import { MONTH_NAMES, MONTHS_LOOKBACK } from '../../src/constants/calendar.constants';
import { useTheme } from '../../src/theme';
import { fonts, radii, spacing, textStyles } from '../../src/theme/tokens';

// ─── Constants ────────────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_W = SCREEN_WIDTH / 7;
const CELL_H = 56;
const DOW_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// ─── Types ────────────────────────────────────────────────────

type FormModalState =
  | null
  | { mode: 'create'; date: Date }
  | { mode: 'edit'; event: CalendarEvent };

interface CellData {
  date: Date | null;
  num: number | null;
  events: CalendarEvent[];
  isToday: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isTempId(id: string) {
  return id.startsWith('__temp__');
}

function buildGrid(year: number, month: number, events: CalendarEvent[]): CellData[][] {
  const today = new Date();
  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  // Mon-first: (getDay() + 6) % 7 → 0=Mon … 6=Sun
  const startBlank = (first.getDay() + 6) % 7;

  const byDate: Record<string, CalendarEvent[]> = {};
  for (const ev of events) {
    const d = new Date(ev.startAt);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    (byDate[key] ??= []).push(ev);
  }

  const cells: CellData[] = [];
  for (let i = 0; i < startBlank; i++) cells.push({ date: null, num: null, events: [], isToday: false });
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const key = `${year}-${month}-${day}`;
    cells.push({
      date,
      num: day,
      events: byDate[key] ?? [],
      isToday: isSameDay(date, today),
    });
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, num: null, events: [], isToday: false });

  const rows: CellData[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

function formatTime(ev: CalendarEvent): string {
  if (ev.allDay) return 'All day';
  const fmt = (d: Date) => {
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'pm' : 'am';
    const hour = h % 12 || 12;
    const min = m > 0 ? `:${String(m).padStart(2, '0')}` : '';
    return `${hour}${min}${ampm}`;
  };
  const start = new Date(ev.startAt);
  return ev.endAt ? `${fmt(start)} – ${fmt(new Date(ev.endAt))}` : fmt(start);
}

// ─── DayCell ──────────────────────────────────────────────────

interface DayCellProps {
  cell: CellData;
  isSelected: boolean;
  onPress: (date: Date) => void;
}

function DayCell({ cell, isSelected, onPress }: DayCellProps) {
  const { colors } = useTheme();

  if (!cell.date || cell.num === null) {
    return <View style={cellStyles.empty} />;
  }

  const dotCount = Math.min(cell.events.length, 3);

  return (
    <TouchableOpacity
      style={cellStyles.cell}
      onPress={() => onPress(cell.date!)}
      activeOpacity={0.7}
    >
      <View
        style={[
          cellStyles.circle,
          cell.isToday && { backgroundColor: colors.accent },
          isSelected && !cell.isToday && { backgroundColor: colors.bg2 },
        ]}
      >
        <Text
          style={[
            cellStyles.num,
            { color: cell.isToday ? colors.accentFg : colors.fg0 },
          ]}
        >
          {cell.num}
        </Text>
      </View>

      <View style={cellStyles.dots}>
        {Array.from({ length: dotCount }).map((_, k) => (
          <View
            key={k}
            style={[
              cellStyles.dot,
              { backgroundColor: cell.isToday ? colors.accent : colors.fg3 },
              cell.isToday && { opacity: 0.85 },
            ]}
          />
        ))}
      </View>
    </TouchableOpacity>
  );
}

const cellStyles = StyleSheet.create({
  empty: { width: CELL_W, height: CELL_H },
  cell: {
    width: CELL_W,
    height: CELL_H,
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 6,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: {
    fontFamily: fonts.serif,
    fontSize: 17,
    lineHeight: 17,
  },
  dots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
    height: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

// ─── MonthScreen ──────────────────────────────────────────────

export default function MonthScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formModal, setFormModal] = useState<FormModalState>(null);
  const [deleteModal, setDeleteModal] = useState<CalendarEvent | null>(null);
  const { unreadCount } = useNotifications();

  // ─── Data ──────────────────────────────────────────────────

  const loadEvents = useCallback(async (year: number, month: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await eventsApi.listByMonth(year, month);
      setEvents(result.data);
    } catch {
      setError('Failed to load events. Tap to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents(currentYear, currentMonth);
  }, [currentYear, currentMonth, loadEvents]);

  // ─── Month navigation ──────────────────────────────────────

  const isPrevDisabled = (() => {
    const limit = new Date(today.getFullYear(), today.getMonth() - MONTHS_LOOKBACK, 1);
    return new Date(currentYear, currentMonth - 1, 1) <= limit;
  })();

  const goToPrev = () => {
    if (isPrevDisabled) return;
    if (currentMonth === 1) { setCurrentYear(y => y - 1); setCurrentMonth(12); }
    else setCurrentMonth(m => m - 1);
  };

  const goToNext = () => {
    if (currentMonth === 12) { setCurrentYear(y => y + 1); setCurrentMonth(1); }
    else setCurrentMonth(m => m + 1);
  };

  // ─── CRUD ──────────────────────────────────────────────────

  const tempIdRef = useRef(0);

  const handleCreate = useCallback(async (payload: CreateEventPayload) => {
    const tempId = `__temp__${++tempIdRef.current}`;
    const optimistic: CalendarEvent = {
      id: tempId, title: payload.title, description: payload.description ?? null,
      startAt: payload.startAt, endAt: payload.endAt ?? null,
      allDay: payload.allDay ?? false, reminderMinutesBefore: payload.reminderMinutesBefore ?? null,
      tag: payload.tag ?? 'personal',
      isCompleted: false,
      recurringEventId: null, isRecurrenceTemplate: false, isRecurrenceOverride: false,
      recurrenceFrequency: null, recurrencePattern: null, recurrenceEndType: null, recurrenceEndValue: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setEvents(prev => [...prev, optimistic]);
    try {
      const created = await eventsApi.create(payload);
      setEvents(prev => prev.map(ev => ev.id === tempId ? created : ev));
      loadEvents(currentYear, currentMonth);
    } catch (e) {
      setEvents(prev => prev.filter(ev => ev.id !== tempId));
      throw e;
    }
  }, [currentYear, currentMonth, loadEvents]);

  const handleUpdate = useCallback(async (id: string, payload: Partial<CreateEventPayload>) => {
    let previous: CalendarEvent | undefined;
    setEvents(prev => {
      previous = prev.find(ev => ev.id === id);
      return prev.map(ev => ev.id === id ? { ...ev, ...payload, updatedAt: new Date().toISOString() } : ev);
    });
    try {
      const result = await eventsApi.update(id, payload);
      const updated = result.event ?? result as unknown as CalendarEvent;
      setEvents(prev => prev.map(ev => ev.id === id ? updated : ev));
    } catch (e) {
      if (previous) setEvents(prev => prev.map(ev => ev.id === id ? previous! : ev));
      throw e;
    }
  }, []);

  const handleDelete = useCallback(async (event: CalendarEvent) => {
    const snapshot = event;
    setEvents(prev => prev.filter(ev => ev.id !== event.id));
    setDeleteModal(null);
    setFormModal(null);
    try {
      await eventsApi.remove(event.id);
    } catch {
      setEvents(prev => [...prev, snapshot]);
    }
  }, []);

  // ─── Derived data ──────────────────────────────────────────

  const rows = buildGrid(currentYear, currentMonth, events);

  const selectedEvents = events
    .filter(ev => ev.startAt && isSameDay(new Date(ev.startAt), selectedDate))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const isSelectedToday = isSameDay(selectedDate, today);
  const dayLabel = isSelectedToday
    ? 'Today'
    : `${DOW_LABELS[(selectedDate.getDay() + 6) % 7]} ${selectedDate.getDate()}`;
  const countLabel = `${selectedEvents.length} event${selectedEvents.length !== 1 ? 's' : ''}`;

  // ─── Render ────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPage }]}>

      {/* ── Top bar ── */}
      <View style={[
        styles.topBar,
        {
          paddingTop: insets.top + spacing[2],
          backgroundColor: colors.bgTranslucent,
          borderBottomColor: colors.borderSubtle,
        },
      ]}>
        <View style={styles.topBarInner}>
          {/* Left: year + month name + nav arrows */}
          <View>
            <Text style={[styles.yearLabel, { color: colors.fg2 }]}>
              {currentYear}
            </Text>
            <View style={styles.monthRow}>
              <TouchableOpacity
                onPress={goToPrev}
                disabled={isPrevDisabled}
                hitSlop={8}
                style={styles.navBtn}
              >
                <Icon
                  name="chevron-left"
                  size={18}
                  color={isPrevDisabled ? colors.fg3 : colors.fg2}
                />
              </TouchableOpacity>
              <Text style={[styles.monthName, { color: colors.fg0 }]}>
                {MONTH_NAMES[currentMonth - 1]}
              </Text>
              <TouchableOpacity onPress={goToNext} hitSlop={8} style={styles.navBtn}>
                <Icon name="chevron-right" size={18} color={colors.fg2} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Right: search + bell */}
          <View style={styles.topBarActions}>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.65}>
              <Icon name="search" size={20} color={colors.fg0} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.65}
              onPress={() => router.push('/(tabs)/notifications')}
            >
              <View>
                <Icon name="bell" size={20} color={colors.fg0} />
                {unreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.accent }]} />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── DOW header ── */}
      <View style={[styles.dowRow, { borderBottomColor: colors.borderSubtle }]}>
        {DOW_LABELS.map((d, i) => (
          <View key={i} style={styles.dowCell}>
            <Text style={[styles.dowText, { color: colors.fg3 }]}>{d}</Text>
          </View>
        ))}
      </View>

      {/* ── Grid ── */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <View>
          {rows.map((row, ri) => (
            <View key={ri} style={styles.gridRow}>
              {row.map((cell, ci) => (
                <DayCell
                  key={ci}
                  cell={cell}
                  isSelected={cell.date ? isSameDay(cell.date, selectedDate) : false}
                  onPress={date => setSelectedDate(date)}
                />
              ))}
            </View>
          ))}
        </View>
      )}

      {/* ── Separator ── */}
      <View style={[styles.separator, { borderTopColor: colors.borderSubtle }]} />

      {/* ── Selected-day event preview ── */}
      <ScrollView
        style={styles.eventScroll}
        contentContainerStyle={{
          paddingHorizontal: spacing[4],
          paddingTop: spacing[3],
          paddingBottom: insets.bottom + 90,
          gap: spacing[2],
        }}
      >
        <Text style={[styles.sectionLabel, { color: colors.fg2 }]}>
          {dayLabel} · {countLabel}
        </Text>

        {selectedEvents.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.fg3 }]}>No events</Text>
        ) : (
          selectedEvents.map(ev => (
            <EventCard
              key={ev.id}
              title={ev.title}
              time={formatTime(ev)}
              tag={ev.tag}
              compact
              onPress={() => !isTempId(ev.id) && setFormModal({ mode: 'edit', event: ev })}
            />
          ))
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.accent,
            bottom: insets.bottom + 72,
          },
        ]}
        onPress={() => setFormModal({ mode: 'create', date: selectedDate })}
        activeOpacity={0.85}
      >
        <Icon name="plus" size={24} color={colors.accentFg} />
      </TouchableOpacity>

      {/* ── Error banner ── */}
      {error && (
        <TouchableOpacity
          style={[styles.errorBanner, { backgroundColor: colors.dangerTint }]}
          onPress={() => loadEvents(currentYear, currentMonth)}
        >
          <Text style={[textStyles.bodySm, { color: colors.danger }]}>{error}</Text>
        </TouchableOpacity>
      )}

      {/* ── Modals ── */}
      <EventFormModal
        visible={formModal !== null}
        mode={formModal?.mode ?? 'create'}
        initialDate={formModal?.mode === 'create' ? formModal.date : undefined}
        event={formModal?.mode === 'edit' ? formModal.event : undefined}
        onSave={
          formModal?.mode === 'create'
            ? handleCreate
            : (p) => handleUpdate(
                (formModal as { mode: 'edit'; event: CalendarEvent }).event.id,
                p,
              )
        }
        onDelete={
          formModal?.mode === 'edit'
            ? () => setDeleteModal((formModal as { mode: 'edit'; event: CalendarEvent }).event)
            : undefined
        }
        onRecurringSave={() => loadEvents(currentYear, currentMonth)}
        onClose={() => setFormModal(null)}
      />

      <DeleteConfirmModal
        visible={deleteModal !== null}
        eventTitle={deleteModal?.title ?? ''}
        onConfirm={() => handleDelete(deleteModal!)}
        onCancel={() => setDeleteModal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Top bar
  topBar: { borderBottomWidth: StyleSheet.hairlineWidth },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
  },
  yearLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  navBtn: { padding: 2 },
  monthName: {
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 32,
    letterSpacing: -0.64,
  },
  topBarActions: { flexDirection: 'row', gap: spacing[1], alignItems: 'center' },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  // DOW row
  dowRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  dowCell: { width: CELL_W, paddingVertical: spacing[2], alignItems: 'center' },
  dowText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.4, lineHeight: 14 },

  // Grid
  gridRow: { flexDirection: 'row' },
  loadingBox: { paddingVertical: spacing[8], alignItems: 'center', justifyContent: 'center' },

  // Event preview
  separator: { borderTopWidth: StyleSheet.hairlineWidth, marginHorizontal: spacing[4] },
  eventScroll: { flex: 1 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing[1],
  },
  emptyText: { fontSize: 13, paddingVertical: spacing[3] },

  // FAB
  fab: {
    position: 'absolute',
    right: spacing[5],
    width: 56,
    height: 56,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },

  // Error
  errorBanner: {
    padding: spacing[3],
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    borderRadius: 8,
  },
});
