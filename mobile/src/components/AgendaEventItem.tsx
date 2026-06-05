/**
 * AgendaEventItem — a single event row inside the Agenda Detail screen.
 *
 * Shows: status indicator dot, title, time range, tappable status pill.
 * Long-press reveals Remove action.
 *
 * Usage:
 *   <AgendaEventItem
 *     event={event}
 *     onStatusChange={(status) => handlePatch(event.id, status)}
 *     onRemove={() => handleRemove(event.id)}
 *   />
 */

import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../theme';
import { fonts, palette, radii, spacing, textStyles } from '../theme/tokens';
import { AgendaEvent, AgendaEventStatus } from '../api/agendas';
import { StatusPill } from './StatusPill';
import { Icon } from './Icon';

const STATUS_DOT: Record<AgendaEventStatus, string> = {
  active:    palette.ember500,
  completed: palette.sage500,
  cancelled: palette.clay500,
};

function formatTimeRange(startAt: string, endAt: string): string {
  const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  const s = new Date(startAt).toLocaleTimeString(undefined, opts).toLowerCase().replace(' ', '\u00a0');
  const e = new Date(endAt).toLocaleTimeString(undefined, opts).toLowerCase().replace(' ', '\u00a0');
  return `${s} – ${e}`;
}

const STATUS_CYCLE: AgendaEventStatus[] = ['active', 'completed', 'cancelled'];

interface AgendaEventItemProps {
  event: AgendaEvent;
  onStatusChange?: (status: AgendaEventStatus) => void;
  onRemove?: () => void;
  onEdit?: () => void;
}

export function AgendaEventItem({
  event,
  onStatusChange,
  onRemove,
  onEdit,
}: AgendaEventItemProps) {
  const { colors } = useTheme();
  const [showActions, setShowActions] = useState(false);

  const cycleStatus = () => {
    const idx = STATUS_CYCLE.indexOf(event.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    onStatusChange?.(next);
  };

  const confirmRemove = () => {
    Alert.alert(
      'Remove event',
      'Remove this event from the agenda?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: onRemove },
      ],
    );
  };

  const isCancelled = event.status === 'cancelled';

  return (
    <TouchableOpacity
      onLongPress={() => setShowActions((v) => !v)}
      activeOpacity={0.8}
      style={[
        styles.row,
        { borderBottomColor: colors.borderSubtle },
      ]}
      accessibilityLabel={`${event.title}, ${formatTimeRange(event.startAt, event.endAt)}, ${event.status}`}
    >
      {/* Status dot */}
      <View
        style={[styles.dot, { backgroundColor: STATUS_DOT[event.status] }]}
        accessibilityElementsHidden
      />

      {/* Main content */}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: colors.fg0 },
            isCancelled && styles.strikethrough,
          ]}
          numberOfLines={2}
        >
          {event.title}
        </Text>

        <Text style={[styles.time, { color: colors.fg3 }]}>
          {formatTimeRange(event.startAt, event.endAt)}
        </Text>
      </View>

      {/* Status pill + actions */}
      <View style={styles.right}>
        <StatusPill status={event.status} size="sm" onPress={cycleStatus} />

        {showActions && (
          <View style={styles.actionRow}>
            {onEdit && (
              <TouchableOpacity
                onPress={() => { setShowActions(false); onEdit(); }}
                style={[styles.actionBtn, { backgroundColor: colors.bg1 }]}
                accessibilityLabel="Edit event"
              >
                <Icon name="pencil" size={14} color={colors.fg1} />
              </TouchableOpacity>
            )}
            {onRemove && (
              <TouchableOpacity
                onPress={() => { setShowActions(false); confirmRemove(); }}
                style={[styles.actionBtn, { backgroundColor: 'rgba(184, 84, 80, 0.12)' }]}
                accessibilityLabel="Remove event from agenda"
              >
                <Icon name="trash-2" size={14} color={palette.clay700} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing[3],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    marginTop: 6,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  time: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 16,
  },
  right: {
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
