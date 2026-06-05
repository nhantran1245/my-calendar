import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Notification } from '../../src/api/notifications';
import { DndSheet } from '../../src/components/DndSheet';
import { Icon } from '../../src/components/Icon';
import { useNotifications } from '../../src/context/NotificationContext';
import { useTheme } from '../../src/theme';
import { fonts, radii, spacing, textStyles } from '../../src/theme/tokens';

type TabFilter = 'all' | 'unread';

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function NotificationCard({
  item,
  colors,
  onDismiss,
  onMarkRead,
}: {
  item: Notification;
  colors: any;
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
}) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: item.isRead ? colors.bg0 : colors.accentTint,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      <View style={styles.cardRow}>
        <View style={styles.cardBody}>
          <Text
            style={[
              textStyles.bodySm,
              { color: colors.fg0, fontFamily: item.isRead ? fonts.sansRegular : fonts.sansMedium },
            ]}
            numberOfLines={1}
          >
            {item.event?.title ?? '—'}
          </Text>
          <Text style={[textStyles.caption, { color: colors.fg2 }]}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>

        <View style={styles.cardActions}>
          {!item.isRead && (
            <TouchableOpacity
              onPress={() => onMarkRead(item.id)}
              style={[styles.actionBtn, { borderColor: colors.accent }]}
              activeOpacity={0.7}
            >
              <Text style={[textStyles.caption, { color: colors.accent }]}>Read</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => onDismiss(item.id)}
            style={styles.dismissBtn}
            activeOpacity={0.7}
          >
            <Icon name="x" size={16} color={colors.fg3} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { notifications, dndActive, setDndActive, loading, load, markRead, dismiss, dismissAll } =
    useNotifications();

  const [tab, setTab] = useState<TabFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [showDndSheet, setShowDndSheet] = useState(false);

  const displayed = tab === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  // ── Render ──────────────────────────────────────────────────

  return (
    <View style={[styles.flex, { backgroundColor: colors.bgPage }]}>
      <SafeAreaView style={styles.flex} edges={['top']}>

        {/* Top bar */}
        <View
          style={[
            styles.topBar,
            { backgroundColor: colors.bgTranslucent, borderBottomColor: colors.borderSubtle },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Icon name="chevron-left" size={22} color={colors.fg0} />
          </TouchableOpacity>
          <Text style={[styles.topBarTitle, { color: colors.fg0 }]}>Notifications</Text>
          <TouchableOpacity onPress={() => setShowDndSheet(true)} activeOpacity={0.7}>
            <Icon
              name={dndActive ? 'bell-off' : 'bell'}
              size={22}
              color={dndActive ? colors.accent : colors.fg2}
            />
          </TouchableOpacity>
        </View>

        {/* Tab filter */}
        <View style={[styles.tabs, { borderBottomColor: colors.borderSubtle }]}>
          {(['all', 'unread'] as TabFilter[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
              onPress={() => setTab(t)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  textStyles.bodySm,
                  { color: tab === t ? colors.accent : colors.fg2, fontFamily: fonts.sansMedium },
                ]}
              >
                {t === 'all' ? 'All' : 'Unread'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <FlatList
            data={displayed}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + spacing[7] },
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  await load(true);
                  setRefreshing(false);
                }}
                tintColor={colors.accent}
              />
            }
            renderItem={({ item }) => (
              <NotificationCard
                item={item}
                colors={colors}
                onDismiss={dismiss}
                onMarkRead={markRead}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Icon name="bell" size={40} color={colors.fg3} />
                <Text style={[textStyles.body, { color: colors.fg2, marginTop: spacing[3] }]}>
                  {tab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </Text>
              </View>
            }
            ListFooterComponent={
              displayed.length > 0 ? (
                <TouchableOpacity
                  style={[styles.dismissAllBtn, { borderColor: colors.borderSubtle }]}
                  onPress={dismissAll}
                  activeOpacity={0.7}
                >
                  <Text style={[textStyles.bodySm, { color: colors.fg2 }]}>Dismiss all</Text>
                </TouchableOpacity>
              ) : null
            }
          />
        )}
      </SafeAreaView>

      <DndSheet
        visible={showDndSheet}
        isActive={dndActive}
        onClose={() => setShowDndSheet(false)}
        onChanged={() => {
          load(true);
          setShowDndSheet(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBarTitle: {
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 32,
    letterSpacing: -0.64,
    flex: 1,
    marginLeft: spacing[3],
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  listContent: {
    padding: spacing[4],
    gap: spacing[3],
  },
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing[4],
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  cardBody: {
    flex: 1,
    gap: spacing[1],
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  actionBtn: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  dismissBtn: {
    padding: spacing[1],
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing[10],
  },
  dismissAllBtn: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginTop: spacing[3],
  },
});
