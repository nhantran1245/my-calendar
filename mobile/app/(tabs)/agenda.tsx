/**
 * Agenda List Screen — tab entry point.
 *
 * Features:
 * - Future agendas by default (startAt >= now), sorted ascending
 * - "View past" button at top loads backward-paginated past agendas
 * - Infinite scroll downward for more future agendas
 * - Pull-to-refresh
 * - Create agenda via FAB
 * - Tap agenda → detail screen
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Agenda, agendasApi } from '../../src/api/agendas';
import { AGENDA_DEFAULT_PAGE_SIZE } from '../../src/constants';
import { AgendaCard } from '../../src/components/AgendaCard';
import { AgendaFormModal } from '../../src/components/AgendaFormModal';
import { Icon } from '../../src/components/Icon';
import { TopBar } from '../../src/components/TopBar';
import { useTheme } from '../../src/theme';
import { fonts, radii, spacing, textStyles } from '../../src/theme/tokens';

export default function AgendaScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── Future agendas ────────────────────────────────────────────
  const [future, setFuture] = useState<Agenda[]>([]);
  const [futureOffset, setFutureOffset] = useState(0);
  const [hasMoreFuture, setHasMoreFuture] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMoreFuture, setLoadingMoreFuture] = useState(false);

  // ── Past agendas ──────────────────────────────────────────────
  const [past, setPast] = useState<Agenda[]>([]);
  const [pastOffset, setPastOffset] = useState(0);
  const [hasMorePast, setHasMorePast] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [loadingPast, setLoadingPast] = useState(false);

  // ── Misc ──────────────────────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState(false);

  // ── Load future ───────────────────────────────────────────────

  const loadFuture = useCallback(async (offset = 0, append = false) => {
    setError(false);
    try {
      const result = await agendasApi.list({
        direction: 'forward',
        limit: AGENDA_DEFAULT_PAGE_SIZE,
        offset,
      });
      setFuture((prev) => (append ? [...prev, ...result.data] : result.data));
      setFutureOffset(offset + result.data.length);
      setHasMoreFuture(result.meta.hasMore);
    } catch {
      setError(true);
    }
  }, []);

  // ── Load past ─────────────────────────────────────────────────

  const loadPast = useCallback(async (offset = 0, append = false) => {
    try {
      const result = await agendasApi.list({
        direction: 'backward',
        limit: AGENDA_DEFAULT_PAGE_SIZE,
        offset,
      });
      // Past comes back DESC (newest-past first); prepend to keep chronological order
      setPast((prev) => (append ? [...result.data, ...prev] : result.data));
      setPastOffset(offset + result.data.length);
      setHasMorePast(result.meta.hasMore);
    } catch {
      // Silent; user can retry via button
    }
  }, []);

  // ── Initial load ──────────────────────────────────────────────

  useEffect(() => {
    loadFuture(0).finally(() => setLoadingInitial(false));
  }, [loadFuture]);

  // ── Refresh ───────────────────────────────────────────────────

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadFuture(0),
      showPast ? loadPast(0) : Promise.resolve(),
    ]);
    setRefreshing(false);
  };

  // ── Show / load more past ──────────────────────────────────────

  const handleShowPast = async () => {
    if (!showPast) {
      setShowPast(true);
      setLoadingPast(true);
      await loadPast(0);
      setLoadingPast(false);
    }
  };

  const handleLoadMorePast = async () => {
    if (loadingPast || !hasMorePast) return;
    setLoadingPast(true);
    await loadPast(pastOffset, true);
    setLoadingPast(false);
  };

  // ── Load more future ──────────────────────────────────────────

  const handleLoadMoreFuture = async () => {
    if (loadingMoreFuture || !hasMoreFuture) return;
    setLoadingMoreFuture(true);
    await loadFuture(futureOffset, true);
    setLoadingMoreFuture(false);
  };

  // ── Create agenda ─────────────────────────────────────────────

  const handleCreate = async (payload: any) => {
    const created = await agendasApi.create(payload);
    // Prepend if it starts in future, refresh otherwise
    const now = new Date();
    if (new Date(created.startAt) >= now) {
      setFuture((prev) => [created, ...prev]);
    } else {
      if (showPast) loadPast(0);
    }
  };

  // ── Today's label ─────────────────────────────────────────────

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // ── Render ─────────────────────────────────────────────────────

  if (loadingInitial) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bgPage }]}>
        <TopBar title="Agenda" subtitle={todayLabel} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  if (error && future.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: colors.bgPage }]}>
        <TopBar title="Agenda" subtitle={todayLabel} />
        <View style={styles.center}>
          <Icon name="wifi-off" size={32} color={colors.fg3} />
          <Text style={[textStyles.body, { color: colors.fg2, textAlign: 'center', marginTop: spacing[3] }]}>
            Failed to load agendas.
          </Text>
          <TouchableOpacity
            onPress={() => loadFuture(0)}
            style={[styles.retryBtn, { borderColor: colors.border }]}
          >
            <Text style={[textStyles.ui, { color: colors.accent }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const allItems: Agenda[] = [...past, ...future];

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPage }]}>
      <TopBar title="Agenda" subtitle={todayLabel} />

      <FlatList
        data={allItems}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        onEndReached={handleLoadMoreFuture}
        onEndReachedThreshold={0.3}
        // ── Header ────────────────────────────────────────────
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Load past button */}
            {!showPast ? (
              <TouchableOpacity
                onPress={handleShowPast}
                style={[styles.loadPastBtn, { borderColor: colors.border }]}
                accessibilityLabel="View past agendas"
              >
                {loadingPast ? (
                  <ActivityIndicator size="small" color={colors.fg3} />
                ) : (
                  <>
                    <Icon name="chevron-up" size={14} color={colors.fg3} />
                    <Text style={[textStyles.caption, { color: colors.fg3 }]}>
                      View past agendas
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <>
                {/* Load even older */}
                {hasMorePast && (
                  <TouchableOpacity
                    onPress={handleLoadMorePast}
                    style={[styles.loadPastBtn, { borderColor: colors.border }]}
                    disabled={loadingPast}
                  >
                    {loadingPast ? (
                      <ActivityIndicator size="small" color={colors.fg3} />
                    ) : (
                      <Text style={[textStyles.caption, { color: colors.fg3 }]}>
                        Load earlier agendas
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                {/* Past section label */}
                {past.length > 0 && (
                  <View style={[styles.sectionLabel, { borderBottomColor: colors.borderSubtle }]}>
                    <Icon name="clock" size={12} color={colors.fg3} />
                    <Text style={[textStyles.micro, { color: colors.fg3 }]}>Past</Text>
                  </View>
                )}
              </>
            )}

            {/* Today divider (only if both past and future exist) */}
            {showPast && past.length > 0 && future.length > 0 && (
              <View style={[styles.todayDivider, { borderColor: colors.accent }]}>
                <View style={[styles.todayLine, { backgroundColor: colors.borderSubtle }]} />
                <View style={[styles.todayBadge, { backgroundColor: colors.accentTint }]}>
                  <Icon name="calendar-check" size={11} color={colors.accent} />
                  <Text style={[textStyles.micro, { color: colors.accent }]}>Today</Text>
                </View>
                <View style={[styles.todayLine, { backgroundColor: colors.borderSubtle }]} />
              </View>
            )}
          </View>
        }
        // ── Render item ────────────────────────────────────────
        renderItem={({ item, index }) => {
          const isPast = index < past.length;
          return (
            <View style={[styles.cardWrapper, isPast && styles.pastCard]}>
              <AgendaCard
                agenda={item}
                isPast={isPast}
                onPress={() => router.push(`/agenda/${item.id}`)}
              />
            </View>
          );
        }}
        // ── Footer ────────────────────────────────────────────
        ListFooterComponent={
          loadingMoreFuture ? (
            <ActivityIndicator
              size="small"
              color={colors.accent}
              style={{ marginVertical: spacing[4] }}
            />
          ) : future.length === 0 ? (
            <View style={styles.empty}>
              <Icon name="calendar-days" size={36} color={colors.fg3} />
              <Text style={[styles.emptyTitle, { color: colors.fg0 }]}>No upcoming agendas</Text>
              <Text style={[textStyles.bodySm, { color: colors.fg2, textAlign: 'center' }]}>
                You don't have any agendas scheduled from now onward.
              </Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(true)}
                style={[styles.emptyBtn, { backgroundColor: colors.accent }]}
              >
                <Icon name="plus" size={16} color={colors.accentFg} />
                <Text style={[textStyles.ui, { color: colors.accentFg }]}>Create agenda</Text>
              </TouchableOpacity>
              {!showPast && (
                <TouchableOpacity onPress={handleShowPast}>
                  <Text style={[textStyles.caption, { color: colors.fg3, marginTop: spacing[2] }]}>
                    Or swipe up to view past agendas
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
      />

      {/* FAB — Create new agenda */}
      {future.length > 0 && (
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={[
            styles.fab,
            { backgroundColor: colors.accent, bottom: insets.bottom + 80 },
          ]}
          accessibilityLabel="Create new agenda"
          accessibilityRole="button"
        >
          <Icon name="plus" size={22} color={colors.accentFg} />
        </TouchableOpacity>
      )}

      {/* Create modal */}
      <AgendaFormModal
        visible={showCreateModal}
        mode="create"
        onSave={handleCreate}
        onClose={() => setShowCreateModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },

  listContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    gap: spacing[3],
  },
  listHeader: {
    gap: spacing[2],
    marginBottom: spacing[3],
  },

  cardWrapper: {
    marginBottom: spacing[3],
  },
  pastCard: {
    opacity: 0.7,
  },

  // Load past
  loadPastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing[2],
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },

  // Section label
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  // Today divider
  todayDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginVertical: spacing[2],
  },
  todayLine: {
    flex: 1,
    height: 1,
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: radii.full,
  },

  // Empty state
  empty: {
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[7],
  },
  emptyTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 18,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    marginTop: spacing[2],
  },

  // Retry
  retryBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    borderWidth: 1,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: spacing[5],
    width: 52,
    height: 52,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
});
