/**
 * Login screen — Cadence mobile.
 *
 * Flow: enter username/email + password → call POST /auth/login
 *       on success: store tokens, navigate to (app) group
 *       on 401: show "Username or password is incorrect."
 *       on network error: show connection error
 */

import { Link, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi } from '../../src/api/auth';
import { Button } from '../../src/components/Button';
import { FormInput } from '../../src/components/FormInput';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/theme';
import { fonts, spacing, textStyles } from '../../src/theme/tokens';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { storeTokens } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);

  function clearError() {
    if (error) setError(null);
  }

  async function handleLogin() {
    if (!identifier.trim() || !password) {
      setError('Please enter your username/email and password.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const data = await authApi.login(identifier.trim(), password);
      await storeTokens(data.access_token, data.refresh_token);
      router.replace('/(tabs)');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        setError('Username or password is incorrect.');
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
          { paddingTop: insets.top + spacing[8], paddingBottom: insets.bottom + spacing[5] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Brand ── */}
        <View style={styles.brand}>
          <Text style={[styles.wordmark, { color: colors.fg0 }]}>Cadence</Text>
          <Text style={[styles.tagline, { color: colors.fg2 }]}>
            Your personal calendar
          </Text>
        </View>

        {/* ── Form ── */}
        <View style={styles.form}>
          <FormInput
            label="Username or email"
            placeholder="Enter username or email"
            value={identifier}
            onChangeText={(v) => { setIdentifier(v); clearError(); }}
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            autoFocus
          />

          <FormInput
            label="Password"
            placeholder="Enter password"
            value={password}
            onChangeText={(v) => { setPassword(v); clearError(); }}
            isPassword
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          {/* ── Error banner ── */}
          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.dangerTint, borderColor: colors.danger }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          )}

          <Button
            label={loading ? 'Logging in...' : 'Log in'}
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            size="lg"
          />
        </View>

        {/* ── Footer link ── */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.fg2 }]}>
            Don't have an account?{'  '}
          </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={[styles.footerLink, { color: colors.accent }]}>
                Register
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing[5],
    gap: spacing[7],
    flexGrow: 1,
  },
  brand: {
    alignItems: 'center',
    gap: spacing[2],
  },
  wordmark: {
    fontFamily: fonts.serif,
    fontSize: 44,
    lineHeight: 44,
    letterSpacing: -0.88,
  },
  tagline: {
    ...textStyles.bodySm,
    textAlign: 'center',
  },
  form: {
    gap: spacing[4],
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
  footerText: {
    ...textStyles.bodySm,
  },
  footerLink: {
    ...textStyles.bodySm,
    fontFamily: fonts.sansMedium,
  },
});
