/**
 * AgendaCard — list item card for an agenda in the Agenda List screen.
 *
 * Shows: title, date range, status badge, event count.
 *
 * Usage:
 *   <AgendaCard agenda={agenda} onPress={() => router.push(`/agenda/${agenda.id}`)} />
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';
import { fonts, radii, spacing, textStyles } from '../theme/tokens';
import { Agenda } from '../api/agendas';
import { StatusPill } from './StatusPill';
import { Icon } from './Icon';

function formatDateRange(startAt: string, endAt: string): string {
  const start = new Date(startAt);
  const end = new Date(endAt);

  const dayOpts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

  const startDay = start.toLocaleDateString(undefined, dayOpts);
  const startTime = start.toLocaleTimeString(undefined, timeOpts).replace(' ', '\u00a0').toLowerCase();
  const endTime = end.toLocaleTimeString(undefined, timeOpts).replace(' ', '\u00a0').toLowerCase();

  // Same calendar day?
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    return `${startDay}  ·  ${startTime} – ${endTime}`;
  }
  const endDay = end.toLocaleDateString(undefined, dayOpts);
  return `${startDay} – ${endDay}`;
}

interface AgendaCardProps {
  agenda: Agenda;
  eventCount?: number;
  onPress?: () => void;
  isPast?: boolean;
}

export function AgendaCard({ agenda, eventCount, onPress, isPast = false }: AgendaCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.card,
        {
          backgroundColor: colors.bg0,
          borderColor: colors.borderSubtle,
          opacity: isPast ? 0.65 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${agenda.title}, ${formatDateRange(agenda.startAt, agenda.endAt)}, ${agenda.status}`}
    >
      <View style={styles.header}>
        <Text
          style={[styles.title, { color: colors.fg0 }]}
          numberOfLines={1}
        >
          {agenda.title}
        </Text>
        <Icon name="chevron-right" size={16} color={colors.fg3} />
      </View>

      <Text style={[styles.dateRange, { color: colors.fg2 }]}>
        {formatDateRange(agenda.startAt, agenda.endAt)}
      </Text>

      {agenda.description ? (
        <Text style={[styles.description, { color: colors.fg2 }]} numberOfLines={1}>
          {agenda.description}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <StatusPill status={agenda.status} size="sm" />
        {eventCount !== undefined && (
          <View style={styles.eventCount}>
            <Icon name="list-checks" size={12} color={colors.fg3} />
            <Text style={[styles.eventCountText, { color: colors.fg3 }]}>
              {eventCount} {eventCount === 1 ? 'event' : 'events'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing[4],
    gap: spacing[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  title: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 22,
  },
  dateRange: {
    ...textStyles.caption,
    fontFamily: fonts.mono,
    fontSize: 12,
  },
  description: {
    ...textStyles.bodySm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: 2,
  },
  eventCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventCountText: {
    ...textStyles.caption,
  },
});
