import React from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { notifApi } from '../../src/api';
import { Colors, Spacing, Radius, FontSize } from '../../src/utils/theme';

const TYPE_ICON: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  MANDATORY_CONTENT: { icon: 'alert-circle', color: Colors.mandatory },
  NEW_CONTENT: { icon: 'sparkles', color: Colors.primary },
  REMINDER: { icon: 'time', color: Colors.warning },
  CONTENT_REQUEST_UPDATE: { icon: 'chatbubble-ellipses', color: Colors.secondary },
  SYSTEM: { icon: 'information-circle', color: Colors.textMuted },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notifApi.getAll().then(r => r.data),
  });

  const markAllRead = useMutation({
    mutationFn: () => notifApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const notifications = data?.content ?? [];
  const hasUnread = notifications.some((n: any) => !n.read);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {hasUnread && (
          <TouchableOpacity onPress={() => markAllRead.mutate()} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: { item: any }) => {
            const meta = TYPE_ICON[item.type] ?? TYPE_ICON.SYSTEM;
            return (
              <TouchableOpacity
                style={[styles.notifCard, !item.read && styles.notifCardUnread]}
                onPress={() => {
                  if (item.contentId) router.push(`/content/${item.contentId}`);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.iconWrap, { backgroundColor: meta.color + '22' }]}>
                  <Ionicons name={meta.icon} size={22} color={meta.color} />
                </View>
                <View style={styles.notifBody}>
                  <Text style={styles.notifTitle} numberOfLines={2}>{item.title}</Text>
                  {item.body && (
                    <Text style={styles.notifBodyText} numberOfLines={2}>{item.body}</Text>
                  )}
                  <Text style={styles.notifTime}>{formatTime(item.createdAt)}</Text>
                </View>
                {!item.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptySubtitle}>You're all caught up</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
          }
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Spacing.xl + 8, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '700' },
  markAllBtn: {
    backgroundColor: Colors.primary + '22', borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  markAllText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
  notifCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  notifCardUnread: {
    borderColor: Colors.primary + '44',
    backgroundColor: Colors.primary + '08',
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  notifBody: { flex: 1, gap: 3 },
  notifTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '600' },
  notifBodyText: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 18 },
  notifTime: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary,
    marginTop: 4, flexShrink: 0,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: 8, marginTop: 80 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '600' },
  emptySubtitle: { color: Colors.textMuted, fontSize: FontSize.sm },
});
