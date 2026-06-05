import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notificationsApi } from '../api/notifications';
import { useTheme } from '../theme';
import { fonts, radii, spacing, textStyles } from '../theme/tokens';
import { DND_MIN_MINUTES, DND_MAX_MINUTES } from '../constants';

const QUICK_OPTIONS: { label: string; minutes: number }[] = [
  { label: '15 min', minutes: 15 },
  { label: '1 hour', minutes: 60 },
  { label: '4 hours', minutes: 240 },
  { label: 'Until tomorrow', minutes: 1440 },
];

interface Props {
  visible: boolean;
  isActive: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export function DndSheet({ visible, isActive, onClose, onChanged }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enable(minutes: number) {
    setError(null);
    setLoading(true);
    try {
      await notificationsApi.enableDnd(minutes);
      onChanged();
      onClose();
    } catch {
      setError('Failed to enable Do Not Disturb. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function disable() {
    setError(null);
    setLoading(true);
    try {
      await notificationsApi.disableDnd();
      onChanged();
      onClose();
    } catch {
      setError('Failed to disable Do Not Disturb. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleCustomSubmit() {
    const mins = parseInt(customInput, 10);
    if (isNaN(mins) || mins < DND_MIN_MINUTES || mins > DND_MAX_MINUTES) {
      setError(`Enter a number between ${DND_MIN_MINUTES} and ${DND_MAX_MINUTES}.`);
      return;
    }
    enable(mins);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: colors.bgPage, paddingBottom: insets.bottom + spacing[5] },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn} activeOpacity={0.7}>
            <Text style={[textStyles.body, { color: colors.fg1 }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.fg0 }]}>Do Not Disturb</Text>
          <View style={styles.cancelBtn} />
        </View>

        <View style={styles.content}>
          {isActive && (
            <Text style={[textStyles.bodySm, { color: colors.accent, textAlign: 'center' }]}>
              Do Not Disturb is currently active
            </Text>
          )}

          {/* Quick options */}
          <Text style={[styles.sectionLabel, { color: colors.fg2 }]}>MUTE FOR</Text>
          <View style={styles.optionGrid}>
            {QUICK_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.minutes}
                style={[
                  styles.optionBtn,
                  { backgroundColor: colors.bg0, borderColor: colors.borderSubtle },
                ]}
                onPress={() => enable(opt.minutes)}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={[textStyles.bodySm, { color: colors.fg0, fontFamily: fonts.sansMedium }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom duration */}
          <Text style={[styles.sectionLabel, { color: colors.fg2 }]}>CUSTOM (MINUTES)</Text>
          <View style={styles.customRow}>
            <TextInput
              style={[
                styles.customInput,
                {
                  backgroundColor: colors.bg0,
                  borderColor: colors.borderSubtle,
                  color: colors.fg0,
                },
              ]}
              placeholder="e.g. 90"
              placeholderTextColor={colors.fg3}
              keyboardType="number-pad"
              value={customInput}
              onChangeText={(v) => {
                setCustomInput(v);
                setError(null);
              }}
              returnKeyType="done"
              onSubmitEditing={handleCustomSubmit}
            />
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: colors.accent }]}
              onPress={handleCustomSubmit}
              disabled={loading || !customInput}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[textStyles.bodySm, { color: '#fff', fontFamily: fonts.sansMedium }]}>
                  Apply
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error && (
            <Text style={[textStyles.bodySm, { color: colors.danger, textAlign: 'center' }]}>
              {error}
            </Text>
          )}

          {/* Disable DND */}
          {isActive && (
            <TouchableOpacity
              style={[
                styles.disableBtn,
                { borderColor: colors.danger, backgroundColor: colors.dangerTint },
              ]}
              onPress={disable}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={[textStyles.body, { color: colors.danger, fontFamily: fonts.sansMedium }]}>
                Disable Do Not Disturb
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancelBtn: {
    minWidth: 64,
  },
  title: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
  },
  content: {
    padding: spacing[5],
    gap: spacing[4],
  },
  sectionLabel: {
    ...textStyles.micro,
    paddingLeft: spacing[1],
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  optionBtn: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  customRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontFamily: fonts.sansRegular,
    fontSize: 15,
  },
  applyBtn: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  disableBtn: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginTop: spacing[2],
  },
});
