import React from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { gamificationApi } from '../src/api';
import { useAuthStore } from '../src/store/authStore';
import { Colors, Spacing, Radius, FontSize } from '../src/utils/theme';

interface Entry {
  userId: string;
  fullName: string;
  avatarUrl?: string;
  xpPoints: number;
  level: number;
  rank: number;
}

const XP_PER_LEVEL = 200;

const RANK_COLOR: Record<number, string> = {
  1: '#F59E0B',
  2: '#94A3B8',
  3: '#CD7F32',
};

const RANK_ICON: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export default function LeaderboardScreen() {
  const user = useAuthStore(s => s.user);
  const sectionId = user?.sectionId;

  const { data: entries, isLoading } = useQuery({
    queryKey: ['leaderboard', sectionId],
    queryFn: () => gamificationApi.getSectionLeaderboard(sectionId!).then(r => r.data as Entry[]),
    enabled: !!sectionId,
  });

  if (!sectionId) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Leaderboard' }} />
        <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.emptyText}>No section assigned</Text>
        <Text style={styles.emptySubtext}>Ask your manager to assign you to a section</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: user?.sectionName ?? 'Leaderboard' }} />
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: user?.sectionName ?? 'Leaderboard' }} />
        <Ionicons name="trophy-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.emptyText}>No entries yet</Text>
        <Text style={styles.emptySubtext}>Complete content to earn XP and appear here</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Entry }) => {
    const isMe = item.userId === user?.id;
    const rankColor = RANK_COLOR[item.rank];
    const xpInLevel = item.xpPoints % XP_PER_LEVEL;
    const initials = item.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    return (
      <View style={[styles.entryCard, isMe && styles.entryCardMe]}>
        {/* Rank */}
        <View style={styles.rankCol}>
          {item.rank <= 3 ? (
            <Text style={styles.rankEmoji}>{RANK_ICON[item.rank]}</Text>
          ) : (
            <Text style={[styles.rankNum, rankColor ? { color: rankColor } : undefined]}>
              #{item.rank}
            </Text>
          )}
        </View>

        {/* Avatar */}
        <View style={[styles.entryAvatar, isMe && { borderColor: Colors.primary, borderWidth: 2 }]}>
          <Text style={styles.entryAvatarText}>{initials}</Text>
        </View>

        {/* Info */}
        <View style={styles.entryInfo}>
          <View style={styles.entryTopRow}>
            <Text style={[styles.entryName, isMe && styles.entryNameMe]} numberOfLines={1}>
              {isMe ? 'You' : item.fullName}
            </Text>
            <View style={styles.levelPill}>
              <Text style={styles.levelPillText}>Lv {item.level}</Text>
            </View>
          </View>
          <View style={styles.xpBarBg}>
            <View
              style={[
                styles.xpBarFill,
                {
                  width: `${Math.round((xpInLevel / XP_PER_LEVEL) * 100)}%` as any,
                  backgroundColor: isMe ? Colors.primary : (rankColor ?? Colors.primary),
                },
              ]}
            />
          </View>
          <Text style={styles.xpText}>{item.xpPoints} XP</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: user?.sectionName ?? 'Leaderboard' }} />

      <FlatList
        data={entries}
        keyExtractor={item => item.userId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Ionicons name="trophy" size={28} color={Colors.warning} />
            <Text style={styles.headerTitle}>{user?.sectionName ?? 'Section'} Rankings</Text>
            <Text style={styles.headerSub}>{entries.length} member{entries.length !== 1 ? 's' : ''}</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 40 }} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', gap: 10, padding: Spacing.lg },
  emptyText: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '600' },
  emptySubtext: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },

  list: { paddingHorizontal: Spacing.md },

  header: { alignItems: 'center', paddingTop: Spacing.xl, paddingBottom: Spacing.lg, gap: 6 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '700' },
  headerSub: { color: Colors.textMuted, fontSize: FontSize.sm },

  entryCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
    marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  entryCardMe: {
    backgroundColor: Colors.primary + '12', borderColor: Colors.primary + '55',
  },

  rankCol: { width: 36, alignItems: 'center' },
  rankEmoji: { fontSize: 22 },
  rankNum: { color: Colors.textMuted, fontSize: FontSize.md, fontWeight: '700' },

  entryAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },
  entryAvatarText: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700' },

  entryInfo: { flex: 1, gap: 4 },
  entryTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  entryName: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '600', flex: 1 },
  entryNameMe: { color: Colors.primary },
  levelPill: {
    backgroundColor: Colors.primary + '22', borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  levelPillText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: '700' },
  xpBarBg: { height: 4, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden' },
  xpBarFill: { height: '100%', borderRadius: Radius.full },
  xpText: { color: Colors.textMuted, fontSize: FontSize.xs },
});
