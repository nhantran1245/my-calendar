import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../theme';
import { fonts, radii, spacing } from '../theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const height = size === 'sm' ? 36 : size === 'lg' ? 52 : 44;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 15;

  const bg = {
    primary:   colors.accent,
    secondary: colors.bg0,
    ghost:     'transparent',
    danger:    colors.dangerTint,
  }[variant];

  const textColor = {
    primary:   colors.accentFg,
    secondary: colors.fg0,
    ghost:     colors.fg1,
    danger:    colors.danger,
  }[variant];

  const borderColor = {
    primary:   'transparent',
    secondary: colors.border,
    ghost:     'transparent',
    danger:    'transparent',
  }[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        {
          height,
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === 'secondary' ? 1 : 0,
          opacity: isDisabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
      ]}
    >
      {loading ? (
        <View style={styles.row}>
          <ActivityIndicator
            size="small"
            color={textColor}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.label, { fontSize, color: textColor }]}>
            {label}
          </Text>
        </View>
      ) : (
        <Text style={[styles.label, { fontSize, color: textColor }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontFamily: fonts.sansMedium,
    letterSpacing: 0.1,
  },
});
