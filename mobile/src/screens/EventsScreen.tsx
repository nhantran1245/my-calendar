/**
 * DayScreen — scrollable day timeline view matching the Cadence mobile UI kit.
 *
 * Layout:
 *   TopBar  (month micro label · "Weekday DD" serif title · search + bell)
 *   ScrollView time grid  (6am – 10pm, 64px/hour)
 *     Hour rows  — time label in left gutter + hairline separator
 *     Events     — absolutely positioned EventCard blocks
 *     Now line   — ember dot + full-width line at current time
 *   FAB  — ember circle, bottom-right, opens EventFormModal
 */

import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarEvent, CreateEventPayload, eventsApi } from '../api/events';
import { EventCard } from '../components/EventCard';
import { EventFormModal } from '../components/EventFormModal';
import { Icon } from '../components/Icon';
import { TopBar } from '../components/TopBar';
import {
  DAY_VIEW_END_HOUR,
  DAY_VIEW_GUTTER_WIDTH,
  DAY_VIEW_HOUR_HEIGHT,
  DAY_VIEW_START_HOUR,
  MONTH_NAMES_SHORT,
  WEEKDAY_NAMES_FULL,
} from '../constants/calendar.constants';
import { useTheme } from '../theme';
import { palette, radii, spacing } from '../theme/tokens';

// ─── Helpers ──────────────────────────────────────────────────

function formatHourLabel(hour: number): string {
  if (hour === 0 || hour === 24) return '12am';
  if (hour === 12) return '12pm';
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
}

function formatEventTime(startAt: string, endAt: string | null): string {
  const start = new Date(startAt);
  const startH = start.getHours();
  const startM = start.getMinutes();
  const startAmPm = startH < 12 ? 'am' : 'pm';
  const startH12 = startH % 12 || 12;
  const startStr = startM === 0
    ? `${startH12}`
    : `${startH12}:${String(startM).padStart(2, '0')}`;

  if (!endAt) return `${startStr}${startAmPm}`;

  const end = new Date(endAt);
  const endH = end.getHours();
  const endM = end.getMinutes();
  const endAmPm = endH < 12 ? 'am' : 'pm';
  const endH12 = endH % 12 || 12;
  const endStr = endM === 0
    ? `${endH12}`
    : `${endH12}:${String(endM).padStart(2, '0')}`;

  return `${startStr} \u2013 ${endStr}${endAmPm}`;
}

function timeToY(date: Date): number {
  const hours = date.getHours() + date.getMinutes() / 60;
  return (hours - DAY_VIEW_START_HOUR) * DAY_VIEW_HOUR_HEIGHT;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ─── Component ────────────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get('window').width;
const HOURS = Array.from(
  { length: DAY_VIEW_END_HOUR - DAY_VIEW_START_HOUR + 1 },
  (_, i) => DAY_VIEW_START_HOUR + i,
);
const GRID_HEIGHT = (DAY_VIEW_END_HOUR - DAY_VIEW_START_HOUR) * DAY_VIEW_HOUR_HEIGHT;

export default function EventsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const today = new Date();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nowY, setNowY] = useState(timeToY(today));
  const [formModal, setFormModal] = useState(false);

  // ── Load events ────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const now = new Date();
      const result = await eventsApi.listByMonth(now.getFullYear(), now.getMonth() + 1);
      const todayEvents = result.data.filter((e) =>
        isSameDay(new Date(e.startAt), now),
      );
      setEvents(todayEvents);
    } catch {
      // leave list empty; user can pull-to-refresh
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ── Tick now-line every minute ─────────────────────────────
  useEffect(() => {
    setNowY(timeToY(new Date()));
    const id = setInterval(() => setNowY(timeToY(new Date())), 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Scroll to current time on mount ───────────────────────
  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: Math.max(nowY - 120, 0), animated: true });
      }, 300);
    }
  }, [loading, nowY]);

  // ── Header strings ────────────────────────────────────────
  const monthLabel = MONTH_NAMES_SHORT[today.getMonth()].toUpperCase();
  const dayLabel = `${WEEKDAY_NAMES_FULL[today.getDay()]} ${today.getDate()}`;

  // ── Event positioning ─────────────────────────────────────
  const visibleEvents = events.filter((e) => {
    const h = new Date(e.startAt).getHours();
    return h >= DAY_VIEW_START_HOUR && h < DAY_VIEW_END_HOUR;
  });

  // ── Save handler ──────────────────────────────────────────
  const handleSave = useCallback(async (payload: CreateEventPayload) => {
    await eventsApi.create(payload);
    setFormModal(false);
    await load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgPage }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const nowInRange = nowY >= 0 && nowY <= GRID_HEIGHT;

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPage }]}>
      <TopBar
        title={dayLabel}
        subtitle={monthLabel}
        onSearch={() => {}}
        onNotifications={() => {}}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.gridContent, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Time grid ───────────────────────── */}
        <View style={[styles.grid, { height: GRID_HEIGHT }]}>

          {/* Hour rows */}
          {HOURS.map((hour) => (
            <View
              key={hour}
              style={[
                styles.hourRow,
                {
                  top: (hour - DAY_VIEW_START_HOUR) * DAY_VIEW_HOUR_HEIGHT,
                  borderTopColor: colors.borderSubtle,
                },
              ]}
            >
              <Text style={[styles.hourLabel, { color: colors.fg3, width: DAY_VIEW_GUTTER_WIDTH }]}>
                {hour === DAY_VIEW_START_HOUR ? '' : formatHourLabel(hour)}
              </Text>
            </View>
          ))}

          {/* Events */}
          {visibleEvents.map((event) => {
            const start = new Date(event.startAt);
            const end = event.endAt ? new Date(event.endAt) : null;
            const topPx = timeToY(start);
            const bottomPx = end ? timeToY(end) : topPx + DAY_VIEW_HOUR_HEIGHT;
            const heightPx = Math.max(bottomPx - topPx, 36);

            return (
              <View
                key={event.id}
                style={[
                  styles.eventWrapper,
                  {
                    top: topPx,
                    left: DAY_VIEW_GUTTER_WIDTH + spacing[2],
                    right: spacing[4],
                    height: heightPx,
                  },
                ]}
              >
                <EventCard
                  title={event.title}
                  time={formatEventTime(event.startAt, event.endAt)}
                  tag={event.tag as any}
                  compact={heightPx < 52}
                />
              </View>
            );
          })}

          {/* Now line */}
          {nowInRange && (
            <View style={[styles.nowLine, { top: nowY }]}>
              <View style={[styles.nowDot, { backgroundColor: colors.accent }]} />
              <View style={[styles.nowBar, { backgroundColor: colors.accent }]} />
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: colors.accent, bottom: insets.bottom + 80 },
        ]}
        onPress={() => setFormModal(true)}
        activeOpacity={0.85}
      >
        <Icon name="plus" size={24} color={palette.white} />
      </TouchableOpacity>

      {/* Create event modal */}
      <EventFormModal
        visible={formModal}
        mode="create"
        initialDate={today}
        onSave={handleSave}
        onClose={() => setFormModal(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  gridContent: {
    paddingTop: spacing[2],
  },
  grid: {
    position: 'relative',
    width: SCREEN_WIDTH,
  },
  hourRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: DAY_VIEW_HOUR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  hourLabel: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
    paddingRight: spacing[2],
    paddingTop: spacing[1],
    lineHeight: 14,
  },
  eventWrapper: {
    position: 'absolute',
  },
  nowLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nowDot: {
    width: 10,
    height: 10,
    borderRadius: radii.full,
    marginLeft: DAY_VIEW_GUTTER_WIDTH - 5,
  },
  nowBar: {
    flex: 1,
    height: 1.5,
  },
  fab: {
    position: 'absolute',
    right: spacing[4],
    width: 52,
    height: 52,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
});
