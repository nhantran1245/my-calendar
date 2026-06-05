/**
 * StatusPill — compact tappable badge showing agenda/event status.
 *
 * Colors:
 *   active    → ember tint / ember text
 *   completed → sage tint / sage text
 *   cancelled → clay tint / clay text
 *
 * Usage:
 *   <StatusPill status="active" onPress={() => setShowPicker(true)} />
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { palette, radii, textStyles } from '../theme/tokens';

type Status = 'active' | 'completed' | 'cancelled';

const STATUS_STYLES: Record<Status, { bg: string; text: string; label: string }> = {
  active: {
    bg:    palette.ember50,
    text:  palette.ember800,
    label: 'Active',
  },
  completed: {
    bg:    'rgba(124, 139, 92, 0.12)',
    text:  palette.sage700,
    label: 'Completed',
  },
  cancelled: {
    bg:    'rgba(184, 84, 80, 0.12)',
    text:  palette.clay700,
    label: 'Cancelled',
  },
};

interface StatusPillProps {
  status: Status;
  onPress?: () => void;
  size?: 'sm' | 'md';
}

export function StatusPill({ status, onPress, size = 'md' }: StatusPillProps) {
  const s = STATUS_STYLES[status];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
      style={[
        styles.pill,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: s.bg },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Status: ${s.label}. ${onPress ? 'Tap to change.' : ''}`}
    >
      <Text style={[
        size === 'sm' ? styles.textSm : styles.textMd,
        { color: s.text },
      ]}>
        {s.label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
  },
  md: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  textMd: {
    ...textStyles.caption,
    fontWeight: '500',
  },
  textSm: {
    ...textStyles.micro,
    fontSize: 10,
  },
});
