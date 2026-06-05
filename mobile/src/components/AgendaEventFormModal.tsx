/**
 * AgendaEventFormModal — bottom sheet for creating or editing an agenda event.
 *
 * Fields: title (required), description, startAt, endAt (native picker).
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
import { AgendaEvent, CreateAgendaEventPayload, UpdateAgendaEventPayload } from '../api/agendas';
import { useTheme } from '../theme';
import { fonts, radii, spacing, textStyles } from '../theme/tokens';
import { Icon } from './Icon';

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
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso)
    .toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase();
}

// ─── DateTimeRow ──────────────────────────────────────────────────────────────

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
  label: { ...textStyles.ui, width: 44 },
  chips: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { fontFamily: fonts.mono, fontSize: 13 },
});

// ─── Main modal ───────────────────────────────────────────────────────────────

type PickerTarget = 'start-date' | 'start-time' | 'end-date' | 'end-time' | null;

interface AgendaEventFormModalProps {
  visible: boolean;
  mode: 'create' | 'edit';
  event?: AgendaEvent;
  onSave: (payload: CreateAgendaEventPayload | UpdateAgendaEventPayload) => Promise<void>;
  onClose: () => void;
}

export function AgendaEventFormModal({
  visible,
  mode,
  event,
  onSave,
  onClose,
}: AgendaEventFormModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState(defaultStartAt());
  const [endAt, setEndAt] = useState(defaultEndAt(defaultStartAt()));
  const [saving, setSaving] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  useEffect(() => {
    if (mode === 'edit' && event) {
      setTitle(event.title);
      setDescription(event.description ?? '');
      setStartAt(event.startAt);
      setEndAt(event.endAt);
    } else if (mode === 'create') {
      const s = defaultStartAt();
      setTitle('');
      setDescription('');
      setStartAt(s);
      setEndAt(defaultEndAt(s));
    }
    setPickerTarget(null);
  }, [visible, mode, event]);

  const handlePickerChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setPickerTarget(null);
    if (!selected) return;

    if (pickerTarget === 'start-date') {
      const d = new Date(startAt);
      d.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setStartAt(d.toISOString());
    } else if (pickerTarget === 'start-time') {
      const d = new Date(startAt);
      d.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setStartAt(d.toISOString());
    } else if (pickerTarget === 'end-date') {
      const d = new Date(endAt);
      d.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setEndAt(d.toISOString());
    } else if (pickerTarget === 'end-time') {
      const d = new Date(endAt);
      d.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setEndAt(d.toISOString());
    }
  };

  const pickerValue = (): Date =>
    pickerTarget?.startsWith('start') ? new Date(startAt) : new Date(endAt);

  const pickerMode = (): 'date' | 'time' =>
    pickerTarget?.endsWith('date') ? 'date' : 'time';

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a title for the event.');
      return;
    }
    if (new Date(endAt) <= new Date(startAt)) {
      Alert.alert('Invalid time range', 'End time must be after start time.');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        startAt,
        endAt,
      });
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to save event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
            {mode === 'create' ? 'New event' : 'Edit event'}
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
            placeholder="Event title"
            placeholderTextColor={colors.fg3}
            value={title}
            onChangeText={setTitle}
            maxLength={255}
            autoFocus={mode === 'create'}
          />

          {/* Description */}
          <View style={[styles.field, { borderBottomColor: colors.borderSubtle }]}>
            <Icon name="align-left" size={18} color={colors.fg3} />
            <TextInput
              style={[styles.fieldInput, { color: colors.fg0 }]}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.fg3}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={1000}
            />
          </View>

          {/* Start */}
          <DateTimeRow
            label="Start"
            iso={startAt}
            onPressDate={() => setPickerTarget('start-date')}
            onPressTime={() => setPickerTarget('start-time')}
          />

          {/* End */}
          <DateTimeRow
            label="End"
            iso={endAt}
            onPressDate={() => setPickerTarget('end-date')}
            onPressTime={() => setPickerTarget('end-time')}
          />

          {/* iOS inline spinner */}
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

          {/* Android dialog */}
          {pickerTarget !== null && Platform.OS === 'android' && (
            <DateTimePicker
              value={pickerValue()}
              mode={pickerMode()}
              display="default"
              onChange={handlePickerChange}
            />
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
});
