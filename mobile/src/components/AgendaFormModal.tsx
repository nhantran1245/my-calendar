/**
 * AgendaFormModal — bottom sheet for creating or editing an agenda.
 *
 * Fields: title (required), description, startAt, endAt (native picker), status (edit only).
 *
 * Date/time UX:
 *   - Tap the date row → shows date picker inline (iOS) / dialog (Android)
 *   - Tap the time row → shows time picker inline (iOS) / dialog (Android)
 *   - Two separate pickers: one for date, one for time, applied to whichever
 *     field (start or end) the user last tapped.
 */

import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Agenda, AgendaStatus, CreateAgendaPayload, UpdateAgendaPayload } from '../api/agendas';
import { useTheme } from '../theme';
import { fonts, radii, spacing, textStyles } from '../theme/tokens';
import { Icon } from './Icon';
import { StatusPill } from './StatusPill';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: AgendaStatus[] = ['active', 'completed', 'cancelled'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function defaultStartAt(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d.toISOString();
}

function defaultEndAt(startIso: string): string {
  const d = new Date(startIso);
  d.setHours(d.getHours() + 1);
  return d.toISOString();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
}

// ─── DateTimeRow — one tappable row per field ─────────────────────────────────

interface DateTimeRowProps {
  label: string;
  iso: string;
  onPressDate: () => void;
  onPressTime: () => void;
}

function DateTimeRow({ label, iso, onPressDate, onPressTime }: DateTimeRowProps) {
  const { colors } = useTheme();
  return (
    <View style={[rowStyles.row, { borderTopColor: colors.borderSubtle }]}>
      <Text style={[rowStyles.label, { color: colors.fg2 }]}>{label}</Text>
      <View style={rowStyles.chips}>
        <TouchableOpacity
          onPress={onPressDate}
          style={[rowStyles.chip, { backgroundColor: colors.bg1, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Icon name="calendar" size={13} color={colors.fg2} />
          <Text style={[rowStyles.chipText, { color: colors.fg0 }]}>{formatDate(iso)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onPressTime}
          style={[rowStyles.chip, { backgroundColor: colors.bg1, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Icon name="clock" size={13} color={colors.fg2} />
          <Text style={[rowStyles.chipText, { color: colors.fg0 }]}>{formatTime(iso)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  label: {
    ...textStyles.ui,
    width: 44,
  },
  chips: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontFamily: fonts.mono,
    fontSize: 13,
  },
});

// ─── Main modal ───────────────────────────────────────────────────────────────

type PickerTarget = 'start-date' | 'start-time' | 'end-date' | 'end-time' | null;

interface AgendaFormModalProps {
  visible: boolean;
  mode: 'create' | 'edit';
  agenda?: Agenda;
  onSave: (payload: CreateAgendaPayload | UpdateAgendaPayload) => Promise<void>;
  onClose: () => void;
}

export function AgendaFormModal({
  visible,
  mode,
  agenda,
  onSave,
  onClose,
}: AgendaFormModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState(defaultStartAt());
  const [endAt, setEndAt] = useState(defaultEndAt(defaultStartAt()));
  const [status, setStatus] = useState<AgendaStatus>('active');
  const [saving, setSaving] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  // Seed form when opening
  useEffect(() => {
    if (mode === 'edit' && agenda) {
      setTitle(agenda.title);
      setDescription(agenda.description ?? '');
      setStartAt(agenda.startAt);
      setEndAt(agenda.endAt);
      setStatus(agenda.status);
    } else if (mode === 'create') {
      const s = defaultStartAt();
      setTitle('');
      setDescription('');
      setStartAt(s);
      setEndAt(defaultEndAt(s));
      setStatus('active');
    }
    setPickerTarget(null);
    setShowStatusPicker(false);
  }, [visible, mode, agenda]);

  // ── Picker change handler ─────────────────────────────────────

  const handlePickerChange = (_: DateTimePickerEvent, selected?: Date) => {
    // On Android dismiss fires with undefined — just close
    if (Platform.OS === 'android') setPickerTarget(null);
    if (!selected) return;

    if (pickerTarget === 'start-date') {
      const current = new Date(startAt);
      current.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setStartAt(current.toISOString());
    } else if (pickerTarget === 'start-time') {
      const current = new Date(startAt);
      current.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setStartAt(current.toISOString());
    } else if (pickerTarget === 'end-date') {
      const current = new Date(endAt);
      current.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setEndAt(current.toISOString());
    } else if (pickerTarget === 'end-time') {
      const current = new Date(endAt);
      current.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setEndAt(current.toISOString());
    }
  };

  const pickerValue = (): Date => {
    if (pickerTarget?.startsWith('start')) return new Date(startAt);
    return new Date(endAt);
  };

  const pickerMode = (): 'date' | 'time' =>
    pickerTarget?.endsWith('date') ? 'date' : 'time';

  // ── Save ──────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a title for the agenda.');
      return;
    }
    if (new Date(endAt) <= new Date(startAt)) {
      Alert.alert('Invalid time range', 'End time must be after start time.');
      return;
    }
    setSaving(true);
    try {
      const payload: CreateAgendaPayload | UpdateAgendaPayload = {
        title: title.trim(),
        description: description.trim() || null,
        startAt,
        endAt,
        ...(mode === 'edit' ? { status } : {}),
      };
      await onSave(payload);
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to save agenda. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.root, { backgroundColor: colors.bgPage }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn} accessibilityLabel="Cancel">
            <Text style={[textStyles.ui, { color: colors.fg2 }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.fg0 }]}>
            {mode === 'create' ? 'New agenda' : 'Edit agenda'}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={styles.headerBtn}
            accessibilityLabel="Save"
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text style={[textStyles.ui, { color: colors.accent, fontFamily: fonts.sansSemiBold }]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing[4] }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <TextInput
            style={[styles.titleInput, { color: colors.fg0, borderBottomColor: colors.borderSubtle }]}
            placeholder="Agenda title"
            placeholderTextColor={colors.fg3}
            value={title}
            onChangeText={setTitle}
            maxLength={255}
            returnKeyType="next"
            autoFocus={mode === 'create'}
          />

          {/* Description */}
          <View style={[styles.field, { borderBottomColor: colors.borderSubtle }]}>
            <Icon name="align-left" size={18} color={colors.fg3} />
            <TextInput
              style={[styles.fieldInput, { color: colors.fg0 }]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.fg3}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={1000}
            />
          </View>

          {/* Start date + time */}
          <DateTimeRow
            label="Start"
            iso={startAt}
            onPressDate={() => setPickerTarget('start-date')}
            onPressTime={() => setPickerTarget('start-time')}
          />

          {/* End date + time */}
          <DateTimeRow
            label="End"
            iso={endAt}
            onPressDate={() => setPickerTarget('end-date')}
            onPressTime={() => setPickerTarget('end-time')}
          />

          {/* iOS inline picker — shown below the tapped row */}
          {pickerTarget !== null && Platform.OS === 'ios' && (
            <View style={[styles.inlinePicker, { borderColor: colors.borderSubtle, backgroundColor: colors.bg0 }]}>
              <DateTimePicker
                value={pickerValue()}
                mode={pickerMode()}
                display="spinner"
                onChange={handlePickerChange}
                textColor={colors.fg0}
                style={styles.picker}
              />
              <TouchableOpacity
                onPress={() => setPickerTarget(null)}
                style={[styles.pickerDone, { borderTopColor: colors.borderSubtle }]}
              >
                <Text style={[textStyles.ui, { color: colors.accent, fontFamily: fonts.sansSemiBold }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Android: picker renders as a dialog automatically */}
          {pickerTarget !== null && Platform.OS === 'android' && (
            <DateTimePicker
              value={pickerValue()}
              mode={pickerMode()}
              display="default"
              onChange={handlePickerChange}
            />
          )}

          {/* Status (edit only) */}
          {mode === 'edit' && (
            <View style={[styles.field, { borderTopColor: colors.borderSubtle, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <Icon name="circle-dot" size={18} color={colors.fg3} />
              <View style={{ flex: 1, gap: spacing[1] }}>
                <Text style={[textStyles.ui, { color: colors.fg2 }]}>Status</Text>
                <TouchableOpacity onPress={() => setShowStatusPicker((v) => !v)}>
                  <StatusPill status={status} size="md" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {mode === 'edit' && showStatusPicker && (
            <View style={[styles.statusPicker, { backgroundColor: colors.bg0, borderColor: colors.borderSubtle }]}>
              {STATUS_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.statusOption}
                  onPress={() => { setStatus(s); setShowStatusPicker(false); }}
                >
                  <StatusPill status={s} size="md" />
                  {s === status && <Icon name="check" size={16} color={colors.accent} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { minWidth: 60, alignItems: 'center' },
  headerTitle: { fontFamily: fonts.sansSemiBold, fontSize: 17 },
  body: { padding: spacing[4], gap: spacing[2] },
  titleInput: {
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 36,
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing[2],
  },
  field: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fieldInput: { ...textStyles.body, flex: 1, minHeight: 40 },
  inlinePicker: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginTop: spacing[2],
  },
  picker: { height: 180 },
  pickerDone: {
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statusPicker: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginVertical: spacing[2],
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
  },
});
