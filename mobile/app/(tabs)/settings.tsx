/**
 * ProfileScreen — "Me" tab in Cadence mobile.
 *
 * Modes: loading → error → view → edit
 * Includes inline edit form and a Change Password modal.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { usersApi, UserProfile } from '../../src/api/users';
import { Button } from '../../src/components/Button';
import { FormInput } from '../../src/components/FormInput';
import {
  PasswordStrength,
  passwordIsStrong,
} from '../../src/components/PasswordStrength';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/theme';
import { fonts, radii, spacing, textStyles } from '../../src/theme/tokens';
import {
  AVATAR_URL_MAX_LENGTH,
  BIO_MAX_LENGTH,
  DEFAULT_TIMEZONE,
  DISPLAY_NAME_MAX_LENGTH,
  PROFILE_TOAST_DURATION_MS,
} from '../../src/constants';

// ─── Types ────────────────────────────────────────────────────

type ScreenMode = 'view' | 'edit';

// ─── Helpers ──────────────────────────────────────────────────

function formatMemberSince(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

function getAvatarLetter(profile: UserProfile): string {
  const name = profile.display_name?.trim() || profile.username?.trim() || '?';
  return name.charAt(0).toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────

function InfoRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={infoRowStyles.row}>
      <Text style={[infoRowStyles.label, { color: colors.fg2 }]}>{label}</Text>
      <Text style={[infoRowStyles.value, { color: colors.fg0 }]}>{value}</Text>
    </View>
  );
}

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing[3],
    gap: spacing[4],
  },
  label: {
    ...textStyles.bodySm,
    flex: 1,
  },
  value: {
    ...textStyles.bodySm,
    fontFamily: fonts.sansMedium,
    flex: 2,
    textAlign: 'right',
  },
});

function SectionCard({ children, colors }: { children: React.ReactNode; colors: any }) {
  return (
    <View
      style={[
        sectionCardStyles.card,
        { backgroundColor: colors.bg0, borderColor: colors.borderSubtle },
      ]}
    >
      {children}
    </View>
  );
}

const sectionCardStyles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    overflow: 'hidden',
  },
});

// ─── Main Screen ──────────────────────────────────────────────

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();

  // ── Screen state ──────────────────────────────────────────
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ScreenMode>('view');
  const [saving, setSaving] = useState(false);

  // ── Toast ─────────────────────────────────────────────────
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(message);
    toastTimer.current = setTimeout(() => setToastMessage(null), PROFILE_TOAST_DURATION_MS);
  }

  // ── Edit form state ───────────────────────────────────────
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);

  // Field errors
  const [displayNameError, setDisplayNameError] = useState('');
  const [bioError, setBioError] = useState('');
  const [avatarUrlError, setAvatarUrlError] = useState('');
  const [timezoneError, setTimezoneError] = useState('');

  // ── Password modal state ──────────────────────────────────
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  // ── Load profile ──────────────────────────────────────────

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.getProfile();
      setProfile(data);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        await logout();
      } else if (!err?.response) {
        setError('Unable to connect. Check your connection and try again.');
      } else {
        setError('Failed to load profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // ── Edit helpers ──────────────────────────────────────────

  function populateForm(p: UserProfile) {
    setDisplayName(p.display_name ?? '');
    setBio(p.bio ?? '');
    setAvatarUrl(p.avatar_url ?? '');
    setTimezone(p.timezone || DEFAULT_TIMEZONE);
    setDisplayNameError('');
    setBioError('');
    setAvatarUrlError('');
    setTimezoneError('');
  }

  function handleEdit() {
    if (profile) populateForm(profile);
    setMode('edit');
  }

  function formDiffersFromProfile(): boolean {
    if (!profile) return false;
    return (
      displayName !== (profile.display_name ?? '') ||
      bio !== (profile.bio ?? '') ||
      avatarUrl !== (profile.avatar_url ?? '') ||
      timezone !== (profile.timezone || DEFAULT_TIMEZONE)
    );
  }

  function handleCancel() {
    if (formDiffersFromProfile()) {
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => setMode('view'),
          },
        ],
      );
    } else {
      setMode('view');
    }
  }

  function validateEditForm(): boolean {
    let valid = true;

    if (displayName.length > DISPLAY_NAME_MAX_LENGTH) {
      setDisplayNameError(`Max ${DISPLAY_NAME_MAX_LENGTH} characters.`);
      valid = false;
    } else {
      setDisplayNameError('');
    }

    if (bio.length > BIO_MAX_LENGTH) {
      setBioError(`Max ${BIO_MAX_LENGTH} characters.`);
      valid = false;
    } else {
      setBioError('');
    }

    if (avatarUrl.length > AVATAR_URL_MAX_LENGTH) {
      setAvatarUrlError(`Max ${AVATAR_URL_MAX_LENGTH} characters.`);
      valid = false;
    } else {
      setAvatarUrlError('');
    }

    if (!timezone.trim()) {
      setTimezoneError('Timezone is required.');
      valid = false;
    } else {
      setTimezoneError('');
    }

    return valid;
  }

  const saveDisabled =
    saving ||
    !timezone.trim() ||
    displayName.length > DISPLAY_NAME_MAX_LENGTH ||
    bio.length > BIO_MAX_LENGTH ||
    avatarUrl.length > AVATAR_URL_MAX_LENGTH;

  async function handleSave() {
    if (!validateEditForm()) return;
    setSaving(true);
    try {
      const updated = await usersApi.updateProfile({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        timezone: timezone.trim(),
      });
      setProfile(updated);
      setMode('view');
      showToast('Profile updated successfully.');
    } catch (err: any) {
      if (err?.response?.status === 401) {
        await logout();
      } else if (!err?.response) {
        Alert.alert('Error', 'Unable to connect. Check your connection and try again.');
      } else {
        Alert.alert('Error', 'Failed to save profile. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  // ── Logout ────────────────────────────────────────────────

  function handleLogout() {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: () => logout() },
      ],
    );
  }

  // ── Password modal handlers ───────────────────────────────

  function handlePasswordModalClose() {
    setShowPasswordModal(false);
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setPwError(null);
    setPwSaving(false);
  }

  const passwordsMatch = confirmPw.length > 0 && confirmPw === newPw;
  const passwordMismatch = confirmPw.length > 0 && confirmPw !== newPw;
  const newPwStrong = passwordIsStrong(newPw);

  const changePwDisabled =
    pwSaving ||
    !currentPw ||
    !newPwStrong ||
    !passwordsMatch;

  async function handleChangePassword() {
    if (changePwDisabled) return;
    setPwSaving(true);
    setPwError(null);
    try {
      await usersApi.changePassword({
        current_password: currentPw,
        new_password: newPw,
      });
      handlePasswordModalClose();
      showToast('Password changed. Please log in again.');
      await logout();
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setPwError('The current password you entered is incorrect.');
      } else if (!err?.response) {
        setPwError('Unable to connect. Check your connection and try again.');
      } else {
        setPwError('Failed to change password. Please try again.');
      }
    } finally {
      setPwSaving(false);
    }
  }

  // ── Render helpers ────────────────────────────────────────

  function renderAvatar() {
    if (!profile) return null;
    const letter = getAvatarLetter(profile);
    const displayLabel = profile.display_name?.trim() || profile.username;

    return (
      <View style={styles.avatarSection}>
        <View style={[styles.avatarCircle, { backgroundColor: colors.accentTint }]}>
          <Text style={[styles.avatarLetter, { color: colors.accent }]}>{letter}</Text>
        </View>
        <Text style={[styles.displayName, { color: colors.fg0 }]}>{displayLabel}</Text>
        <Text style={[styles.username, { color: colors.fg2 }]}>@{profile.username}</Text>
      </View>
    );
  }

  function renderViewMode() {
    if (!profile) return null;

    return (
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing[7] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        {renderAvatar()}

        {/* Info card */}
        <SectionCard colors={colors}>
          <InfoRow label="Email" value={profile.email} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
          <InfoRow label="Timezone" value={profile.timezone} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
          <InfoRow
            label="Member since"
            value={formatMemberSince(profile.created_at)}
            colors={colors}
          />
        </SectionCard>

        {/* Bio */}
        <View>
          <Text style={[styles.sectionLabel, { color: colors.fg2 }]}>BIO</Text>
          <SectionCard colors={colors}>
            <Text
              style={[
                styles.bioText,
                { color: profile.bio ? colors.fg1 : colors.fg3, paddingVertical: spacing[3] },
              ]}
            >
              {profile.bio?.trim() || 'No bio added yet'}
            </Text>
          </SectionCard>
        </View>

        {/* Actions */}
        <View style={styles.actionGroup}>
          <Button
            label="Edit profile"
            onPress={handleEdit}
            variant="secondary"
          />
          <Button
            label="Change Password"
            onPress={() => setShowPasswordModal(true)}
            variant="secondary"
          />
          <Button
            label="Log Out"
            onPress={handleLogout}
            variant="danger"
          />
        </View>
      </ScrollView>
    );
  }

  function renderEditMode() {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + spacing[7] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Edit header */}
          <View style={styles.editHeader}>
            <TouchableOpacity onPress={handleCancel} activeOpacity={0.7} style={styles.headerBtn}>
              <Text style={[styles.headerBtnText, { color: colors.fg1 }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.editTitle, { color: colors.fg0 }]}>Edit Profile</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saveDisabled}
              activeOpacity={0.7}
              style={styles.headerBtn}
            >
              <Text
                style={[
                  styles.headerBtnText,
                  { color: saveDisabled ? colors.fg3 : colors.accent, fontFamily: fonts.sansMedium },
                ]}
              >
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form fields */}
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <FormInput
                label="Display Name"
                placeholder="Your display name"
                value={displayName}
                onChangeText={(v) => {
                  setDisplayName(v);
                  if (v.length > DISPLAY_NAME_MAX_LENGTH) {
                    setDisplayNameError(`Max ${DISPLAY_NAME_MAX_LENGTH} characters.`);
                  } else {
                    setDisplayNameError('');
                  }
                }}
                error={displayNameError}
                maxLength={DISPLAY_NAME_MAX_LENGTH + 1}
                autoCapitalize="words"
                autoCorrect={false}
              />
              <Text style={[styles.charCount, { color: displayName.length > DISPLAY_NAME_MAX_LENGTH ? colors.danger : colors.fg3 }]}>
                {displayName.length}/{DISPLAY_NAME_MAX_LENGTH}
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <FormInput
                label="Bio"
                placeholder="Tell people a little about yourself"
                value={bio}
                onChangeText={(v) => {
                  setBio(v);
                  if (v.length > BIO_MAX_LENGTH) {
                    setBioError(`Max ${BIO_MAX_LENGTH} characters.`);
                  } else {
                    setBioError('');
                  }
                }}
                error={bioError}
                multiline
                numberOfLines={4}
                maxLength={BIO_MAX_LENGTH + 1}
                autoCapitalize="sentences"
                autoCorrect
              />
              <Text style={[styles.charCount, { color: bio.length > BIO_MAX_LENGTH ? colors.danger : colors.fg3 }]}>
                {bio.length}/{BIO_MAX_LENGTH}
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <FormInput
                label="Avatar URL"
                placeholder="https://example.com/avatar.png"
                value={avatarUrl}
                onChangeText={(v) => {
                  setAvatarUrl(v);
                  if (v.length > AVATAR_URL_MAX_LENGTH) {
                    setAvatarUrlError(`Max ${AVATAR_URL_MAX_LENGTH} characters.`);
                  } else {
                    setAvatarUrlError('');
                  }
                }}
                error={avatarUrlError}
                keyboardType="url"
                maxLength={AVATAR_URL_MAX_LENGTH + 1}
              />
              <Text style={[styles.charCount, { color: avatarUrl.length > AVATAR_URL_MAX_LENGTH ? colors.danger : colors.fg3 }]}>
                {avatarUrl.length}/{AVATAR_URL_MAX_LENGTH}
              </Text>
            </View>

            <FormInput
              label="Timezone"
              placeholder="e.g. America/New_York"
              value={timezone}
              onChangeText={(v) => {
                setTimezone(v);
                if (!v.trim()) {
                  setTimezoneError('Timezone is required.');
                } else {
                  setTimezoneError('');
                }
              }}
              error={timezoneError}
              helper="IANA timezone string (e.g. America/New_York, Europe/London)"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  function renderChangePasswordModal() {
    return (
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handlePasswordModalClose}
      >
        <SafeAreaView style={[styles.flex, { backgroundColor: colors.bgPage }]}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing[6] }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Modal header */}
              <View style={styles.editHeader}>
                <TouchableOpacity
                  onPress={handlePasswordModalClose}
                  activeOpacity={0.7}
                  style={styles.headerBtn}
                >
                  <Text style={[styles.headerBtnText, { color: colors.fg1 }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[styles.editTitle, { color: colors.fg0 }]}>Change Password</Text>
                <View style={styles.headerBtn} />
              </View>

              <View style={styles.form}>
                <FormInput
                  label="Current password"
                  placeholder="Enter current password"
                  value={currentPw}
                  onChangeText={(v) => { setCurrentPw(v); setPwError(null); }}
                  isPassword
                  textContentType="password"
                />

                <View style={styles.fieldGroup}>
                  <FormInput
                    label="New password"
                    placeholder="Create a strong password"
                    value={newPw}
                    onChangeText={(v) => { setNewPw(v); setPwError(null); }}
                    isPassword
                    textContentType="none"
                  />
                  <PasswordStrength password={newPw} />
                </View>

                <View style={styles.fieldGroup}>
                  <FormInput
                    label="Confirm new password"
                    placeholder="Re-enter new password"
                    value={confirmPw}
                    onChangeText={(v) => { setConfirmPw(v); setPwError(null); }}
                    isPassword
                    textContentType="none"
                    error={passwordMismatch ? 'Passwords do not match.' : undefined}
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
                {pwError && (
                  <View
                    style={[
                      styles.errorBanner,
                      { backgroundColor: colors.dangerTint, borderColor: colors.danger },
                    ]}
                  >
                    <Text style={[textStyles.bodySm, { color: colors.danger }]}>{pwError}</Text>
                  </View>
                )}

                <Button
                  label={pwSaving ? 'Changing password…' : 'Change Password'}
                  onPress={handleChangePassword}
                  loading={pwSaving}
                  disabled={changePwDisabled}
                  size="lg"
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    );
  }

  // ── Root render ───────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bgPage }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bgPage, paddingHorizontal: spacing[5] }]}>
        <Text style={[textStyles.body, { color: colors.fg1, textAlign: 'center', marginBottom: spacing[4] }]}>
          {error}
        </Text>
        <Button label="Retry" onPress={loadProfile} variant="secondary" fullWidth={false} />
        <View style={{ marginTop: spacing[3] }}>
          <Button label="Log Out" onPress={handleLogout} variant="danger" fullWidth={false} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.bgPage }]}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* Screen header */}
        {mode === 'view' && (
          <View
            style={[
              styles.topBar,
              {
                backgroundColor: colors.bgTranslucent,
                borderBottomColor: colors.borderSubtle,
                paddingTop: spacing[3],
              },
            ]}
          >
            <Text style={[styles.topBarTitle, { color: colors.fg0 }]}>Me</Text>
          </View>
        )}

        {mode === 'view' ? renderViewMode() : renderEditMode()}
      </SafeAreaView>

      {renderChangePasswordModal()}

      {/* Toast */}
      {toastMessage && (
        <View
          style={[
            styles.toast,
            {
              backgroundColor: colors.fg0,
              bottom: insets.bottom + spacing[5],
            },
          ]}
          pointerEvents="none"
        >
          <Text style={[styles.toastText, { color: colors.bgPage }]}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    gap: spacing[4],
    flexGrow: 1,
  },
  topBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
  },
  topBarTitle: {
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 32,
    letterSpacing: -0.64,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 32,
    lineHeight: 38,
  },
  displayName: {
    ...textStyles.h4,
    marginTop: spacing[1],
  },
  username: {
    ...textStyles.bodySm,
  },

  // Cards
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  sectionLabel: {
    ...textStyles.micro,
    marginBottom: spacing[2],
    paddingLeft: spacing[1],
  },
  bioText: {
    ...textStyles.body,
  },

  // Actions
  actionGroup: {
    gap: spacing[3],
    marginTop: spacing[2],
  },

  // Edit header
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  editTitle: {
    ...textStyles.h4,
    flex: 1,
    textAlign: 'center',
  },
  headerBtn: {
    minWidth: 64,
  },
  headerBtnText: {
    ...textStyles.body,
  },

  // Form
  form: {
    gap: spacing[4],
  },
  fieldGroup: {
    gap: spacing[1],
  },
  charCount: {
    ...textStyles.caption,
    textAlign: 'right',
  },

  // Password modal
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
    borderRadius: radii.sm,
    padding: spacing[3],
  },

  // Toast
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radii.full,
    maxWidth: '85%',
  },
  toastText: {
    ...textStyles.bodySm,
    fontFamily: fonts.sansMedium,
    textAlign: 'center',
  },
});
