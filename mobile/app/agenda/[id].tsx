/**
 * Agenda Detail Screen — shows full agenda metadata and its paginated event list.
 *
 * Features:
 * - Agenda metadata section: title, date range, status (tappable), description
 * - Edit agenda via sheet modal
 * - Event list: future by default, "Load past events" button at top
 * - Optimistic status updates on events
 * - Long-press event for remove/edit actions
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Agenda,
  AgendaEvent,
  AgendaEventStatus,
  AgendaStatus,
  UpdateAgendaEventPayload,
  UpdateAgendaPayload,
  agendasApi,
} from '../../src/api/agendas';
import { AGENDA_DEFAULT_PAGE_SIZE } from '../../src/constants';
import { useTheme } from '../../src/theme';
import { fonts, palette, radii, spacing, textStyles } from '../../src/theme/tokens';
import { AgendaEventFormModal } from '../../src/components/AgendaEventFormModal';
import { AgendaEventItem } from '../../src/components/AgendaEventItem';
import { AgendaFormModal } from '../../src/components/AgendaFormModal';
import { Icon } from '../../src/components/Icon';
import { StatusPill } from '../../src/components/StatusPill';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateRange(startAt: string, endAt: string): string {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const dayOpts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

  const startDay = start.toLocaleDateString(undefined, dayOpts);
  const startTime = start.toLocaleTimeString(undefined, timeOpts).toLowerCase().replace(' ', '\u00a0');
  const endTime = end.toLocaleTimeString(undefined, timeOpts).toLowerCase().replace(' ', '\u00a0');

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  return sameDay
    ? `${startDay}  ·  ${startTime} – ${endTime}`
    : `${start.toLocaleDateString(undefined, dayOpts)} – ${end.toLocaleDateString(undefined, dayOpts)}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AgendaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // ── Agenda state ─────────────────────────────────────────────
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [agendaLoading, setAgendaLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  // ── Events state ─────────────────────────────────────────────
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<AgendaEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsRefreshing, setEventsRefreshing] = useState(false);
  const [futureOffset, setFutureOffset] = useState(0);
  const [pastOffset, setPastOffset] = useState(0);
  const [hasMoreFuture, setHasMoreFuture] = useState(false);
  const [hasMorePast, setHasMorePast] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [loadingMoreFuture, setLoadingMoreFuture] = useState(false);
  const [loadingMorePast, setLoadingMorePast] = useState(false);

  // ── Event form state ─────────────────────────────────────────
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | undefined>();

  // ── Load agenda ───────────────────────────────────────────────

  const loadAgenda = useCallback(async () => {
    if (!id) return;
    try {
      const a = await agendasApi.get(id);
      setAgenda(a);
    } catch {
      Alert.alert('Error', 'Failed to load agenda.');
    } finally {
      setAgendaLoading(false);
    }
  }, [id]);

  // ── Load future events ────────────────────────────────────────

  const loadFutureEvents = useCallback(async (offset = 0, append = false) => {
    if (!id) return;
    try {
      const result = await agendasApi.listEvents(id, {
        direction: 'forward',
        limit: AGENDA_DEFAULT_PAGE_SIZE,
        offset,
      });
      setEvents((prev) => (append ? [...prev, ...result.data] : result.data));
      setFutureOffset(offset + result.data.length);
      setHasMoreFuture(result.meta.hasMore);
    } catch {
      // Leave current list intact; user can pull-to-refresh
    }
  }, [id]);

  // ── Load past events ──────────────────────────────────────────

  const loadPastEvents = useCallback(async (offset = 0, append = false) => {
    if (!id) return;
    try {
      const result = await agendasApi.listEvents(id, {
        direction: 'backward',
        limit: AGENDA_DEFAULT_PAGE_SIZE,
        offset,
      });
      setPastEvents((prev) => (append ? [...result.data, ...prev] : result.data));
      setPastOffset(offset + result.data.length);
      setHasMorePast(result.meta.hasMore);
    } catch {
      // Silent — user can retry
    }
  }, [id]);

  // ── Initial load ──────────────────────────────────────────────

  useEffect(() => {
    loadAgenda();
    loadFutureEvents(0).finally(() => setEventsLoading(false));
  }, [loadAgenda, loadFutureEvents]);

  const handleRefresh = async () => {
    setEventsRefreshing(true);
    await Promise.all([
      loadAgenda(),
      loadFutureEvents(0),
      showPast ? loadPastEvents(0) : Promise.resolve(),
    ]);
    setEventsRefreshing(false);
  };

  // ── Show past ──────────────────────────────────────────────────

  const handleShowPast = async () => {
    if (!showPast) {
      setShowPast(true);
      setLoadingMorePast(true);
      await loadPastEvents(0);
      setLoadingMorePast(false);
    }
  };

  // ── Load more future ───────────────────────────────────────────

  const handleLoadMoreFuture = async () => {
    if (loadingMoreFuture || !hasMoreFuture) return;
    setLoadingMoreFuture(true);
    await loadFutureEvents(futureOffset, true);
    setLoadingMoreFuture(false);
  };

  // ── Event status (optimistic) ─────────────────────────────────

  const handleEventStatusChange = async (eventId: string, newStatus: AgendaEventStatus) => {
    if (!id) return;
    // Optimistic update
    const updateList = (list: AgendaEvent[]) =>
      list.map((e) => (e.id === eventId ? { ...e, status: newStatus } : e));
    setEvents(updateList);
    setPastEvents(updateList);

    try {
      await agendasApi.updateEvent(id, eventId, { status: newStatus });
    } catch {
      // Revert
      loadFutureEvents(0);
      if (showPast) loadPastEvents(0);
      Alert.alert('Error', 'Failed to update event status.');
    }
  };

  // ── Remove event ───────────────────────────────────────────────

  const handleRemoveEvent = async (eventId: string) => {
    if (!id) return;
    // Optimistic remove
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setPastEvents((prev) => prev.filter((e) => e.id !== eventId));
    try {
      await agendasApi.removeEvent(id, eventId);
    } catch {
      loadFutureEvents(0);
      if (showPast) loadPastEvents(0);
      Alert.alert('Error', 'Failed to remove event.');
    }
  };

  // ── Edit event ────────────────────────────────────────────────

  const handleEditEvent = (event: AgendaEvent) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleSaveEvent = async (payload: UpdateAgendaEventPayload) => {
    if (!id) return;
    if (editingEvent) {
      const updated = await agendasApi.updateEvent(id, editingEvent.id, payload);
      const updateList = (list: AgendaEvent[]) =>
        list.map((e) => (e.id === updated.id ? updated : e));
      setEvents(updateList);
      setPastEvents(updateList);
    } else {
      const created = await agendasApi.createEvent(id, payload as any);
      setEvents((prev) => [...prev, created]);
    }
    setEditingEvent(undefined);
  };

  // ── Edit agenda ───────────────────────────────────────────────

  const handleSaveAgenda = async (payload: UpdateAgendaPayload) => {
    if (!id) return;
    const updated = await agendasApi.update(id, payload);
    setAgenda(updated);
  };

  // ── Agenda status quick-change ─────────────────────────────────

  const handleAgendaStatusChange = async () => {
    if (!agenda || !id) return;
    const options: AgendaStatus[] = ['active', 'completed', 'cancelled'];
    Alert.alert(
      'Change status',
      undefined,
      options.map((s) => ({
        text: s.charAt(0).toUpperCase() + s.slice(1),
        onPress: async () => {
          setAgenda((prev) => prev ? { ...prev, status: s } : prev);
          try {
            await agendasApi.update(id, { status: s });
          } catch {
            loadAgenda();
          }
        },
      })).concat([{ text: 'Cancel', style: 'cancel' } as any]),
    );
  };

  // ── Render ─────────────────────────────────────────────────────

  if (agendaLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgPage }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!agenda) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgPage }]}>
        <Text style={[textStyles.body, { color: colors.fg2 }]}>Agenda not found.</Text>
      </View>
    );
  }

  const allEvents: AgendaEvent[] = [...pastEvents, ...events];

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPage }]}>
      {/* Header */}
      <View style={[
        styles.topBar,
        { paddingTop: insets.top + spacing[2], borderBottomColor: colors.borderSubtle, backgroundColor: colors.bgTranslucent },
      ]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Go back"
        >
          <Icon name="chevron-left" size={22} color={colors.fg0} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.fg0 }]} numberOfLines={1}>
          {agenda.title}
        </Text>
        <TouchableOpacity
          onPress={() => setShowEditModal(true)}
          style={styles.editBtn}
          accessibilityLabel="Edit agenda"
        >
          <Icon name="pencil" size={18} color={colors.fg1} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={allEvents}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={eventsRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        // ── Agenda metadata at top ─────────────────────────────
        ListHeaderComponent={
          <View>
            {/* Metadata card */}
            <View style={[styles.metaCard, { backgroundColor: colors.bg0, borderColor: colors.borderSubtle }]}>
              <Text style={[styles.metaTitle, { color: colors.fg0 }]}>{agenda.title}</Text>
              <Text style={[styles.metaDate, { color: colors.fg2 }]}>
                {formatDateRange(agenda.startAt, agenda.endAt)}
              </Text>

              <View style={styles.metaRow}>
                <StatusPill
                  status={agenda.status}
                  size="md"
                  onPress={handleAgendaStatusChange}
                />
              </View>

              {agenda.description ? (
                <Text style={[styles.metaDesc, { color: colors.fg2 }]}>
                  {agenda.description}
                </Text>
              ) : null}
            </View>

            {/* Events section header */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.fg0 }]}>Events</Text>
              <TouchableOpacity
                onPress={() => { setEditingEvent(undefined); setShowEventForm(true); }}
                style={[styles.addBtn, { backgroundColor: colors.accentTint }]}
                accessibilityLabel="Add event"
              >
                <Icon name="plus" size={16} color={colors.accent} />
                <Text style={[textStyles.ui, { color: colors.accent }]}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Load past button */}
            {!showPast && (
              <TouchableOpacity
                onPress={handleShowPast}
                style={[styles.loadPastBtn, { borderColor: colors.border }]}
                accessibilityLabel="Load past events"
              >
                {loadingMorePast ? (
                  <ActivityIndicator size="small" color={colors.fg3} />
                ) : (
                  <>
                    <Icon name="chevron-up" size={14} color={colors.fg3} />
                    <Text style={[textStyles.caption, { color: colors.fg3 }]}>
                      View past events
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Past events separator */}
            {showPast && pastEvents.length > 0 && (
              <View style={[styles.pastSeparator, { borderColor: colors.border }]}>
                <Icon name="clock" size={12} color={colors.fg3} />
                <Text style={[textStyles.micro, { color: colors.fg3 }]}>Past</Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item, index }) => {
          const isPast = index < pastEvents.length;
          return (
            <View style={[styles.eventRow, isPast && styles.pastEventRow]}>
              <AgendaEventItem
                event={item}
                onStatusChange={(status) => handleEventStatusChange(item.id, status)}
                onRemove={() => handleRemoveEvent(item.id)}
                onEdit={() => handleEditEvent(item)}
              />
            </View>
          );
        }}
        ItemSeparatorComponent={() => null}
        // ── Footer ────────────────────────────────────────────
        ListFooterComponent={
          eventsLoading ? (
            <ActivityIndicator
              size="small"
              color={colors.accent}
              style={{ marginVertical: spacing[4] }}
            />
          ) : allEvents.length === 0 ? (
            <View style={styles.empty}>
              <Icon name="calendar-x" size={32} color={colors.fg3} />
              <Text style={[textStyles.body, { color: colors.fg2, textAlign: 'center' }]}>
                No events in this agenda yet.
              </Text>
              <TouchableOpacity
                onPress={() => { setEditingEvent(undefined); setShowEventForm(true); }}
                style={[styles.emptyBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={[textStyles.ui, { color: colors.accentFg }]}>Add first event</Text>
              </TouchableOpacity>
            </View>
          ) : hasMoreFuture ? (
            <TouchableOpacity
              onPress={handleLoadMoreFuture}
              style={[styles.loadMoreBtn, { borderColor: colors.border }]}
              disabled={loadingMoreFuture}
            >
              {loadingMoreFuture ? (
                <ActivityIndicator size="small" color={colors.fg3} />
              ) : (
                <Text style={[textStyles.caption, { color: colors.fg3 }]}>Load more events</Text>
              )}
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Edit agenda modal */}
      <AgendaFormModal
        visible={showEditModal}
        mode="edit"
        agenda={agenda}
        onSave={handleSaveAgenda}
        onClose={() => setShowEditModal(false)}
      />

      {/* Create / edit event modal */}
      <AgendaEventFormModal
        visible={showEventForm}
        mode={editingEvent ? 'edit' : 'create'}
        event={editingEvent}
        onSave={handleSaveEvent}
        onClose={() => { setShowEventForm(false); setEditingEvent(undefined); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  topBarTitle: {
    flex: 1,
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
    lineHeight: 22,
  },
  editBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List content
  listContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },

  // Metadata card
  metaCard: {
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing[4],
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  metaTitle: {
    fontFamily: fonts.serif,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.24,
  },
  metaDate: {
    fontFamily: fonts.mono,
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  metaDesc: {
    ...textStyles.bodySm,
    marginTop: 2,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  sectionTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.full,
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
    marginBottom: spacing[2],
  },

  // Past separator
  pastSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing[2],
  },

  // Event rows
  eventRow: {
    paddingHorizontal: 0,
  },
  pastEventRow: {
    opacity: 0.7,
  },

  // Empty state
  empty: {
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[7],
  },
  emptyBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    marginTop: spacing[2],
  },

  // Load more
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing[3],
  },
});
