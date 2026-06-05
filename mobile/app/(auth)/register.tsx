/**
 * Register screen — Cadence mobile.
 *
 * Live password strength checklist, confirm-match indicator.
 * On success (201): store tokens, navigate to (app) group.
 * On 409: show username/email conflict message.
 */

import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi } from '../../src/api/auth';
import { Button } from '../../src/components/Button';
import { FormInput } from '../../src/components/FormInput';
import {
  PasswordStrength,
  passwordIsStrong,
} from '../../src/components/PasswordStrength';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/theme';
import { fonts, spacing, textStyles } from '../../src/theme/tokens';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { storeTokens } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [username, setUsername]           = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirm]     = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  // Field-level errors
  const [usernameError, setUsernameError]   = useState('');
  const [emailError, setEmailError]         = useState('');
  const [confirmError, setConfirmError]     = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Derived state
  const passwordStrong = passwordIsStrong(password);
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;
  const passwordMismatch = confirmPassword.length > 0 && confirmPassword !== password;

  const canSubmit =
    username.trim().length >= 3 &&
    email.trim().length > 0 &&
    passwordStrong &&
    passwordsMatch &&
    !loading;

  function validateUsername(value: string) {
    if (value.length > 0 && !/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
      setUsernameError('3–20 alphanumeric characters and underscores only.');
    } else {
      setUsernameError('');
    }
  }

  function validateEmail(value: string) {
    if (value.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError('Enter a valid email address.');
    } else {
      setEmailError('');
    }
  }

  function validateConfirm(value: string) {
    if (value.length > 0 && value !== password) {
      setConfirmError('Passwords do not match.');
    } else {
      setConfirmError('');
    }
  }

  async function handleRegister() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.register(username.trim(), email.trim(), password);
      await storeTokens(data.access_token, data.refresh_token);
      router.replace('/(tabs)');
    } catch (err: any) {
      const status = err?.response?.status;
      const message: string = err?.response?.data?.message ?? '';
      if (status === 409) {
        if (message.toLowerCase().includes('email')) {
          setError('Email address is already registered.');
        } else {
          setError('Username is already taken.');
        }
      } else if (status === 400) {
        setError('Please check your details and try again.');
      } else if (!err?.response) {
        setError('Unable to connect. Check your connection and try again.');
      } else {
        setError('An error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.bgPage }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing[6], paddingBottom: insets.bottom + spacing[5] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Brand ── */}
        <View style={styles.brand}>
          <Text style={[styles.wordmark, { color: colors.fg0 }]}>Cadence</Text>
          <Text style={[styles.heading, { color: colors.fg0 }]}>Create account</Text>
        </View>

        {/* ── Form ── */}
        <View style={styles.form}>

          {/* Username */}
          <View style={styles.fieldGroup}>
            <FormInput
              label="Username"
              placeholder="e.g. jane_doe"
              value={username}
              onChangeText={(v) => { setUsername(v); setError(null); }}
              onBlur={() => validateUsername(username)}
              error={usernameError}
              helper="3–20 characters: letters, numbers, underscores"
              autoCapitalize="none"
            />
          </View>

          {/* Email */}
          <FormInput
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={(v) => { setEmail(v); setError(null); }}
            onBlur={() => validateEmail(email)}
            error={emailError}
            keyboardType="email-address"
          />

          {/* Password + strength */}
          <View style={styles.fieldGroup}>
            <FormInput
              label="Password"
              placeholder="Create a strong password"
              value={password}
              onChangeText={(v) => { setPassword(v); setError(null); }}
              onBlur={() => setPasswordTouched(true)}
              isPassword
              textContentType="none"
              invalid={passwordTouched && !passwordStrong}
            />
            <PasswordStrength password={password} />
          </View>

          {/* Confirm password */}
          <View style={styles.fieldGroup}>
            <FormInput
              label="Confirm password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={(v) => { setConfirm(v); validateConfirm(v); setError(null); }}
              isPassword
              textContentType="none"
              error={confirmError}
            />
            {passwordsMatch && (
              <View style={styles.matchRow}>
                <Text style={[styles.matchMark, { color: colors.success }]}>✓</Text>
                <Text style={[styles.matchLabel, { color: colors.success }]}>
                  Passwords match
                </Text>
              </View>
            )}
          </View>

          {/* Error banner */}
          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.dangerTint, borderColor: colors.danger }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          )}

          <Button
            label={loading ? 'Creating account...' : 'Register'}
            onPress={handleRegister}
            loading={loading}
            disabled={!canSubmit}
            size="lg"
          />
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.fg2 }]}>
            Already have an account?{'  '}
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={[styles.footerLink, { color: colors.accent }]}>
                Log in
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing[5],
    gap: spacing[6],
    flexGrow: 1,
  },
  brand: {
    alignItems: 'center',
    gap: spacing[1],
  },
  wordmark: {
    fontFamily: fonts.serif,
    fontSize: 36,
    lineHeight: 36,
    letterSpacing: -0.72,
  },
  heading: {
    ...textStyles.h4,
  },
  form: {
    gap: spacing[4],
  },
  fieldGroup: {
    gap: spacing[1],
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  matchMark: {
    fontFamily: fonts.mono,
    fontSize: 12,
    width: 12,
  },
  matchLabel: {
    ...textStyles.caption,
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing[3],
  },
  errorText: {
    ...textStyles.bodySm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footerText: { ...textStyles.bodySm },
  footerLink: {
    ...textStyles.bodySm,
    fontFamily: fonts.sansMedium,
  },
});
