/**
 * FormInput — Cadence-styled labeled text input for forms.
 * Supports password reveal toggle, error state, and helper text.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../theme';
import { fonts, radii, spacing, textStyles } from '../theme/tokens';
import { Icon } from './Icon';

interface FormInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  helper?: string;
  isPassword?: boolean;
  invalid?: boolean;
}

export function FormInput({
  label,
  error,
  helper,
  isPassword = false,
  invalid = false,
  ...inputProps
}: FormInputProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const borderColor = error || invalid
    ? colors.danger
    : focused
    ? colors.accent
    : colors.border;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.fg1 }]}>{label}</Text>

      <View
        style={[
          styles.inputRow,
          {
            borderColor,
            backgroundColor: colors.bg0,
          },
        ]}
      >
        <TextInput
          {...inputProps}
          secureTextEntry={isPassword && !revealed}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={colors.fg3}
          onFocus={(e) => { setFocused(true); inputProps.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); inputProps.onBlur?.(e); }}
          style={[
            styles.input,
            { color: colors.fg0, fontFamily: fonts.sans },
          ]}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setRevealed((v) => !v)}
            activeOpacity={0.7}
            style={styles.eyeBtn}
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
          >
            <Icon
              name={revealed ? 'eye-off' : 'eye'}
              size={18}
              color={colors.fg2}
            />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      ) : helper ? (
        <Text style={[styles.helper, { color: colors.fg3 }]}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    ...textStyles.bodySm,
    fontFamily: fonts.sansMedium,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing[3],
    height: 46,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  eyeBtn: {
    paddingLeft: spacing[2],
    paddingVertical: spacing[2],
  },
  error: {
    ...textStyles.caption,
  },
  helper: {
    ...textStyles.caption,
  },
});
