/**
 * DeleteConfirmModal — confirmation dialog before deleting an event.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../theme';
import { radii, spacing, textStyles } from '../theme/tokens';

interface DeleteConfirmModalProps {
  visible: boolean;
  eventTitle: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function DeleteConfirmModal({
  visible,
  eventTitle,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.bgPage, shadowColor: colors.fg0 }]}>
          <Text style={[textStyles.h4, { color: colors.fg0, marginBottom: spacing[2] }]}>
            Delete Event?
          </Text>
          <Text style={[textStyles.body, { color: colors.fg1, marginBottom: spacing[5] }]}>
            Delete &quot;{eventTitle}&quot;? This cannot be undone.
          </Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[
                styles.btn,
                styles.cancelBtn,
                { borderColor: colors.border },
              ]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={[textStyles.ui, { color: colors.fg1 }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.deleteBtn, { backgroundColor: colors.danger }]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={[textStyles.ui, { color: '#FFFFFF' }]}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[5],
  },
  card: {
    width: '100%',
    borderRadius: radii.lg,
    padding: spacing[5],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  btn: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelBtn: {
    borderWidth: 1,
  },
  deleteBtn: {},
});
