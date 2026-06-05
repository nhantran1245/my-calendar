import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CalendarEvent, eventsApi } from '../api/events';

export default function EventsScreen() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const today = new Date();
      const result = await eventsApi.listByMonth(today.getFullYear(), today.getMonth() + 1);
      setEvents(result.data);
    } catch {
      // Network/auth errors — leave list empty, user can pull-to-refresh
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.item}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.date}>
            {new Date(item.startAt).toLocaleString()}
          </Text>
          {item.reminderMinutesBefore != null && (
            <Text style={styles.reminder}>
              Reminder: {item.reminderMinutesBefore} min before
            </Text>
          )}
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No events yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  item: { padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 16, fontWeight: '600' },
  date: { fontSize: 13, color: '#666', marginTop: 2 },
  reminder: { fontSize: 12, color: '#0a7ea4', marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 40, color: '#aaa' },
});
