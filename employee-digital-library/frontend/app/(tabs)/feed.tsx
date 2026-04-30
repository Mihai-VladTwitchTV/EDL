import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, ActivityIndicator, ScrollView,
} from 'react-native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { feedApi } from '../../src/api';
import ContentCard, { ContentCardData } from '../../src/components/ContentCard';
import { useAuthStore } from '../../src/store/authStore';
import { Colors, Spacing, Radius, FontSize } from '../../src/utils/theme';

export default function FeedScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);

  // Mandatory pending banner
  const { data: mandatoryItems } = useQuery({
    queryKey: ['mandatory-pending'],
    queryFn: () => feedApi.getMandatoryPending().then(r => r.data as ContentCardData[]),
    refetchInterval: 60_000,
  });

  // Infinite scroll feed
  const {
    data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching,
  } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = 0 }) => feedApi.getFeed(pageParam, 20).then(r => r.data),
    getNextPageParam: (lastPage: any) => lastPage.last ? undefined : lastPage.page + 1,
    initialPageParam: 0,
  });

  const allItems: ContentCardData[] = data?.pages.flatMap((p: any) => p.content) ?? [];

  const handleCardPress = (item: ContentCardData) => {
    router.push(`/content/${item.id}`);
  };

  const renderHeader = () => (
    <View>
      {/* Greeting */}
      <View style={styles.greeting}>
        <View>
          <Text style={styles.greetingHello}>Good day,</Text>
          <Text style={styles.greetingName}>{user?.fullName?.split(' ')[0] ?? 'there'} 👋</Text>
        </View>
        {user?.department && (
          <View style={styles.deptBadge}>
            <Text style={styles.deptText}>{user.department}</Text>
          </View>
        )}
      </View>

      {/* Mandatory items alert strip */}
      {mandatoryItems && mandatoryItems.length > 0 && (
        <View style={styles.mandatoryStrip}>
          <View style={styles.mandatoryHeader}>
            <Ionicons name="alert-circle" size={18} color={Colors.mandatory} />
            <Text style={styles.mandatoryTitle}>
              {mandatoryItems.length} item{mandatoryItems.length > 1 ? 's' : ''} require{mandatoryItems.length === 1 ? 's' : ''} your attention
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mandatoryScroll}>
            {mandatoryItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.mandatoryCard}
                onPress={() => handleCardPress(item)}
              >
                <Ionicons name="document-text-outline" size={20} color={Colors.mandatory} />
                <Text style={styles.mandatoryCardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.mandatoryCardCta}>Acknowledge →</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Feed label */}
      <Text style={styles.sectionLabel}>Your Feed</Text>
    </View>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return <View style={{ height: 80 }} />;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={allItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ContentCard item={item} onPress={handleCardPress} />
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No content yet</Text>
            <Text style={styles.emptySubtext}>Check back soon for new materials</Text>
          </View>
        }
        onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl + 8,
    paddingBottom: Spacing.md,
  },
  greetingHello: { color: Colors.textMuted, fontSize: FontSize.sm },
  greetingName: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '700' },
  deptBadge: {
    backgroundColor: Colors.primary + '22',
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.primary + '44',
  },
  deptText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },

  // Mandatory strip
  mandatoryStrip: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.mandatoryBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.mandatory + '44',
  },
  mandatoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  mandatoryTitle: { color: Colors.mandatory, fontSize: FontSize.sm, fontWeight: '700' },
  mandatoryScroll: { marginTop: 4 },
  mandatoryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginRight: Spacing.sm,
    width: 160,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.mandatory + '33',
  },
  mandatoryCardTitle: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600' },
  mandatoryCardCta: { color: Colors.mandatory, fontSize: FontSize.xs, fontWeight: '700' },

  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  loadingMore: { padding: Spacing.lg, alignItems: 'center' },
  empty: { alignItems: 'center', padding: Spacing.xl, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '600' },
  emptySubtext: { color: Colors.textMuted, fontSize: FontSize.sm },
});
