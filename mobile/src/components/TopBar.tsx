/**
 * TopBar — translucent sticky header used on all Cadence mobile screens.
 *
 * Features:
 * - Large serif title (Instrument Serif 32) + optional micro subtitle
 * - Search + bell icon buttons on the right
 * - Translucent background with blur (via expo-blur if available)
 *
 * Usage:
 *   <TopBar title="Wednesday" subtitle="May 2026" />
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { fonts, spacing, textStyles } from '../theme/tokens';
import { Icon } from './Icon';

interface TopBarProps {
  title: string;
  subtitle?: string;
  onSearch?: () => void;
  onNotifications?: () => void;
}

export function TopBar({ title, subtitle, onSearch, onNotifications }: TopBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container,
      {
        paddingTop: insets.top + spacing[2],
        backgroundColor: colors.bgTranslucent,
        borderBottomColor: colors.borderSubtle,
      },
    ]}>
      <View style={styles.inner}>
        <View style={styles.titleBlock}>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.fg2 }]}>
              {subtitle.toUpperCase()}
            </Text>
          )}
          <Text style={[styles.title, { color: colors.fg0 }]}>
            {title}
          </Text>
        </View>

        <View style={styles.actions}>
          {onSearch && (
            <IconButton icon="search" color={colors.fg0} onPress={onSearch} />
          )}
          {onNotifications && (
            <IconButton icon="bell" color={colors.fg0} onPress={onNotifications} />
          )}
        </View>
      </View>
    </View>
  );
}

function IconButton({ icon, color, onPress }: {
  icon: Parameters<typeof Icon>[0]['name'];
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.65}
      style={styles.iconBtn}
    >
      <Icon name={icon} size={20} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
  },
  titleBlock: {
    flex: 1,
  },
  subtitle: {
    ...textStyles.micro,
    marginBottom: 2,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 32,
    letterSpacing: -0.64,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[1],
    alignItems: 'center',
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
});
