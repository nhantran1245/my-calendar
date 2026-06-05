/**
 * EventCard — displays a single calendar event in list and day views.
 *
 * Visual: colored left bar + tinted background, title + time + optional location.
 *
 * Usage:
 *   <EventCard
 *     title="Team standup"
 *     time="9:30 am"
 *     location="Zoom"
 *     category="work"
 *     compact={false}
 *   />
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarCategory, calendarColors, fonts, spacing, textStyles } from '../theme/tokens';
import { Icon } from './Icon';

interface EventCardProps {
  title: string;
  time: string;
  location?: string;
  tag?: CalendarCategory;
  compact?: boolean;
  onPress?: () => void;
}

export function EventCard({
  title,
  time,
  location,
  tag = 'personal',
  compact = false,
  onPress,
}: EventCardProps) {
  const c = calendarColors[tag];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      style={[
        styles.container,
        compact ? styles.compact : styles.full,
        {
          backgroundColor: c.tint,
          borderLeftColor: c.bar,
        },
      ]}
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            compact ? styles.titleCompact : styles.titleFull,
            { color: c.text },
          ]}
          numberOfLines={compact ? 1 : 2}
        >
          {title}
        </Text>

        <Text style={[styles.time, { color: c.text }]}>
          {time}
        </Text>

        {location && !compact && (
          <View style={styles.location}>
            <Icon name="map-pin" size={11} color={c.text} />
            <Text style={[styles.locationText, { color: c.text }]}>
              {location}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 10,
    borderLeftWidth: 3,
  },
  full: {
    padding: spacing[3],
    gap: spacing[2],
  },
  compact: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: spacing[1],
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: fonts.sansMedium,
    lineHeight: 20,
  },
  titleFull:    { fontSize: 15 },
  titleCompact: { fontSize: 13 },
  time: {
    fontFamily: fonts.mono,
    fontSize: 11,
    opacity: 0.75,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    opacity: 0.75,
  },
  locationText: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
});
