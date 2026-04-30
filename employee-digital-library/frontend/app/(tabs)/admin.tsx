import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { showMessage } from 'react-native-flash-message';
import api from '../../src/api';
import ContentCard, { ContentCardData } from '../../src/components/ContentCard';
import { Colors, Spacing, Radius, FontSize } from '../../src/utils/theme';

type AdminTab = 'pending' | 'requests';

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<AdminTab>('pending');
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: pendingData, isLoading: pendingLoading, refetch: refetchPending, isRefetching: pendingRefreshing } = useQuery({
    queryKey: ['pending-review'],
    queryFn: () => api.get('/api/content/pending-review').then(r => r.data),
    enabled: activeTab === 'pending',
  });

  const { data: requestsData, isLoading: requestsLoading, refetch: refetchRequests, isRefetching: requestsRefreshing } = useQuery({
    queryKey: ['content-requests'],
    queryFn: () => api.get('/api/content-requests?status=OPEN').then(r => r.data),
    enabled: activeTab === 'requests',
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/content/${id}/approve`),
    onSuccess: () => {
      showMessage({ message: 'Content approved and published!', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['pending-review'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: () => showMessage({ message: 'Approval failed', type: 'danger' }),
  });

  const resolveRequestMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/content-requests/${id}/resolve`),
    onSuccess: () => {
      showMessage({ message: 'Request marked as resolved', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['content-requests'] });
    },
  });

  const handleApprove = (item: ContentCardData) => {
    Alert.alert('Approve & Publish', `Publish "${item.title}" to all targeted departments?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Publish', onPress: () => approveMutation.mutate(item.id) },
    ]);
  };

  const pendingItems: ContentCardData[] = pendingData?.content ?? [];
  const openRequests: any[] = requestsData?.content ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <Text style={styles.headerSubtitle}>Manage content and requests</Text>
      </View>

      {/* Segmented tabs */}
      <View style={styles.segmented}>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'pending' && styles.segmentActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.segmentText, activeTab === 'pending' && styles.segmentTextActive]}>
            Pending Review
            {pendingItems.length > 0 ? ` (${pendingItems.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'requests' && styles.segmentActive]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.segmentText, activeTab === 'requests' && styles.segmentTextActive]}>
            Content Requests
            {openRequests.length > 0 ? ` (${openRequests.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pending review list */}
      {activeTab === 'pending' && (
        pendingLoading ? (
          <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>
        ) : (
          <FlatList
            data={pendingItems}
            keyExtractor={i => i.id}
            renderItem={({ item }) => (
              <View>
                <ContentCard item={item} onPress={() => router.push(`/content/${item.id}`)} />
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => handleApprove(item)}
                  disabled={approveMutation.isPending}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.approveBtnText}>Approve & Publish</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<EmptyState icon="checkmark-done-circle" title="Nothing to review" subtitle="All submissions are up to date" />}
            refreshControl={<RefreshControl refreshing={pendingRefreshing} onRefresh={refetchPending} tintColor={Colors.primary} />}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        )
      )}

      {/* Content requests list */}
      {activeTab === 'requests' && (
        requestsLoading ? (
          <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>
        ) : (
          <FlatList
            data={openRequests}
            keyExtractor={i => i.id}
            renderItem={({ item }) => (
              <View style={styles.requestCard}>
                <View style={styles.requestRow}>
                  <View style={styles.requestIconWrap}>
                    <Ionicons name="help-circle-outline" size={20} color={Colors.warning} />
                  </View>
                  <View style={styles.requestInfo}>
                    {item.searchTerm && (
                      <Text style={styles.searchTerm}>Searched: "{item.searchTerm}"</Text>
                    )}
                    <Text style={styles.requestDesc}>{item.description}</Text>
                    <Text style={styles.requestTime}>{formatTime(item.createdAt)}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.resolveBtn}
                  onPress={() => resolveRequestMutation.mutate(item.id)}
                >
                  <Text style={styles.resolveBtnText}>Mark Resolved</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<EmptyState icon="checkmark-done-circle" title="No open requests" subtitle="All content requests have been handled" />}
            refreshControl={<RefreshControl refreshing={requestsRefreshing} onRefresh={refetchRequests} tintColor={Colors.primary} />}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        )
      )}
    </View>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={56} color={Colors.textMuted} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    </View>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingTop: Spacing.xl + 8, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '700' },
  headerSubtitle: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  segmented: {
    flexDirection: 'row', marginHorizontal: Spacing.md, marginBottom: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.sm - 2 },
  segmentActive: { backgroundColor: Colors.primary },
  segmentText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  segmentTextActive: { color: '#fff' },
  approveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.secondary, borderRadius: Radius.md,
    marginHorizontal: Spacing.md, marginBottom: Spacing.md,
    paddingVertical: 12, justifyContent: 'center',
  },
  approveBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  requestCard: {
    backgroundColor: Colors.card, borderRadius: Radius.md, marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  requestRow: { flexDirection: 'row', gap: Spacing.md },
  requestIconWrap: {
    width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.warning + '22',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  requestInfo: { flex: 1, gap: 4 },
  searchTerm: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: '600' },
  requestDesc: { color: Colors.textPrimary, fontSize: FontSize.sm, lineHeight: 18 },
  requestTime: { color: Colors.textMuted, fontSize: FontSize.xs },
  resolveBtn: {
    backgroundColor: Colors.surfaceAlt, borderRadius: Radius.sm, paddingVertical: 8,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  resolveBtnText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  empty: { alignItems: 'center', padding: Spacing.xl, gap: 8, marginTop: 60 },
  emptyTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '600' },
  emptySubtitle: { color: Colors.textMuted, fontSize: FontSize.sm },
});
