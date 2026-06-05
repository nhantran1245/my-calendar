/**
 * CalendarCell — a single day cell in the month grid.
 */

import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarEvent } from '../api/events';
import {
  CELL_HEIGHT,
  EVENT_PILL_MAX_CHARS,
  MAX_VISIBLE_EVENTS_PER_CELL,
} from '../constants/calendar.constants';
import { useTheme } from '../theme';

const CELL_WIDTH = Dimensions.get('window').width / 7;

export interface CalendarCellData {
  date: Date | null;
  dayNumber: number | null;
  events: CalendarEvent[];
  isToday: boolean;
  isCurrentMonth: boolean;
}

interface CalendarCellProps {
  cell: CalendarCellData;
  onPressDate: (date: Date) => void;
  onPressEvent: (event: CalendarEvent) => void;
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '…';
}

export function CalendarCell({ cell, onPressDate, onPressEvent }: CalendarCellProps) {
  const { colors } = useTheme();

  if (!cell.date || cell.dayNumber === null) {
    // Empty leading/trailing cell
    return (
      <View
        style={[
          styles.cell,
          {
            backgroundColor: colors.bg0,
            borderRightColor: colors.borderSubtle,
            borderBottomColor: colors.borderSubtle,
          },
        ]}
      />
    );
  }

  const visibleEvents = cell.events.slice(0, MAX_VISIBLE_EVENTS_PER_CELL);
  const overflow = cell.events.length - MAX_VISIBLE_EVENTS_PER_CELL;
  const date = cell.date;

  return (
    <TouchableOpacity
      style={[
        styles.cell,
        {
          backgroundColor: cell.isCurrentMonth ? colors.bgPage : colors.bg0,
          borderRightColor: colors.borderSubtle,
          borderBottomColor: colors.borderSubtle,
        },
      ]}
      onPress={() => onPressDate(date)}
      activeOpacity={0.7}
    >
      {/* Event indicator dot */}
      {cell.events.length > 0 && (
        <View style={styles.eventDot} />
      )}
      {/* Day number */}
      <View style={styles.dayNumberWrapper}>
        {cell.isToday ? (
          <View style={[styles.todayCircle, { backgroundColor: colors.accent }]}>
            <Text style={[styles.dayNumber, { color: colors.accentFg }]}>
              {cell.dayNumber}
            </Text>
          </View>
        ) : (
          <Text
            style={[
              styles.dayNumber,
              {
                color: cell.isCurrentMonth ? colors.fg0 : colors.fg3,
              },
            ]}
          >
            {cell.dayNumber}
          </Text>
        )}
      </View>

      {/* Event pills */}
      <View style={styles.events}>
        {visibleEvents.map((ev) => (
          <TouchableOpacity
            key={ev.id}
            onPress={(e) => {
              e.stopPropagation();
              onPressEvent(ev);
            }}
            style={[
              styles.pill,
              {
                backgroundColor: colors.accentTint,
                opacity: ev.isCompleted ? 0.5 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.pillText,
                {
                  color: colors.accent,
                  textDecorationLine: ev.isCompleted ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={1}
            >
              {truncate(ev.title, EVENT_PILL_MAX_CHARS)}
            </Text>
          </TouchableOpacity>
        ))}
        {overflow > 0 && (
          <Text style={[styles.overflow, { color: colors.fg3 }]}>+{overflow} more</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: CELL_WIDTH,
    height: CELL_HEIGHT,
    padding: 4,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    overflow: 'hidden',
  },
  dayNumberWrapper: {
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  todayCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 20,
    minWidth: 20,
    textAlign: 'center',
  },
  events: {
    flex: 1,
    gap: 1,
    overflow: 'hidden',
  },
  pill: {
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  pillText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '500',
  },
  overflow: {
    fontSize: 9,
    lineHeight: 12,
    paddingHorizontal: 3,
  },
  eventDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7C8B5C',
  },
});
