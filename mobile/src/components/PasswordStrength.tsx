/**
 * PasswordStrength — live checklist shown beneath the password field.
 * Each requirement updates in real time as the user types.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { fonts, spacing, textStyles } from '../theme/tokens';

interface PasswordStrengthProps {
  password: string;
}

interface Check {
  label: string;
  passes: (p: string) => boolean;
}

const CHECKS: Check[] = [
  { label: 'At least 8 characters',    passes: (p) => p.length >= 8 },
  { label: 'Contains uppercase letter', passes: (p) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', passes: (p) => /[a-z]/.test(p) },
  { label: 'Contains a digit',          passes: (p) => /[0-9]/.test(p) },
];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { colors } = useTheme();

  if (!password) return null;

  return (
    <View style={styles.container}>
      {CHECKS.map((check) => {
        const ok = check.passes(password);
        return (
          <View key={check.label} style={styles.row}>
            <Text
              style={[
                styles.mark,
                { color: ok ? colors.success : colors.fg3 },
              ]}
            >
              {ok ? '✓' : '–'}
            </Text>
            <Text
              style={[
                styles.label,
                { color: ok ? colors.success : colors.fg3 },
              ]}
            >
              {check.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function passwordIsStrong(password: string): boolean {
  return CHECKS.every((c) => c.passes(password));
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[1],
    paddingTop: spacing[1],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mark: {
    fontFamily: fonts.mono,
    fontSize: 12,
    width: 12,
  },
  label: {
    ...textStyles.caption,
  },
});
