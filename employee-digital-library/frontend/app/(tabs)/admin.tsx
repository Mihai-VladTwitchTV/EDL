import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { showMessage } from 'react-native-flash-message';
import api, { feedbackApi, supportApi, contentApi } from '../../src/api';
import ContentCard, { ContentCardData } from '../../src/components/ContentCard';
import { Colors, Spacing, Radius, FontSize } from '../../src/utils/theme';

type AdminTab = 'review' | 'requests' | 'compliance' | 'inbox';

const TABS: { key: AdminTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'review',     label: 'Review',     icon: 'checkmark-circle-outline' },
  { key: 'requests',   label: 'Requests',   icon: 'help-circle-outline' },
  { key: 'compliance', label: 'Compliance', icon: 'shield-checkmark-outline' },
  { key: 'inbox',      label: 'Inbox',      icon: 'mail-outline' },
];

const STATUS_COLOR: Record<string, string> = {
  OPEN:        Colors.warning,
  IN_PROGRESS: '#3B82F6',
  RESOLVED:    Colors.success,
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now   = new Date();
  const diff  = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1)  return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<AdminTab>('review');
  const router = useRouter();
  const queryClient = useQueryClient();

  // ── Review ──────────────────────────────────────────────────────────────────
  const { data: pendingData, isLoading: pendingLoading, refetch: refetchPending, isRefetching: pendingRefreshing } = useQuery({
    queryKey: ['pending-review'],
    queryFn: () => api.get('/api/content/pending-review').then(r => r.data),
    enabled: activeTab === 'review',
  });
  const pendingItems: ContentCardData[] = pendingData?.content ?? [];

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/content/${id}/approve`),
    onSuccess: () => {
      showMessage({ message: 'Content approved and published!', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['pending-review'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: () => showMessage({ message: 'Approval failed', type: 'danger' }),
  });

  // ── Requests ────────────────────────────────────────────────────────────────
  const { data: requestsData, isLoading: requestsLoading, refetch: refetchRequests, isRefetching: requestsRefreshing } = useQuery({
    queryKey: ['content-requests'],
    queryFn: () => api.get('/api/content-requests?status=OPEN').then(r => r.data),
    enabled: activeTab === 'requests',
  });
  const openRequests: any[] = requestsData?.content ?? [];

  const resolveRequestMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/content-requests/${id}/resolve`),
    onSuccess: () => {
      showMessage({ message: 'Request resolved', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['content-requests'] });
    },
  });

  // ── Compliance ──────────────────────────────────────────────────────────────
  const { data: complianceData, isLoading: complianceLoading, refetch: refetchCompliance, isRefetching: complianceRefreshing } = useQuery({
    queryKey: ['compliance'],
    queryFn: () => contentApi.getCompliance().then(r => r.data as ComplianceRow[]),
    enabled: activeTab === 'compliance',
  });

  // ── Inbox ────────────────────────────────────────────────────────────────────
  const { data: feedbackData, isLoading: feedbackLoading, refetch: refetchFeedback, isRefetching: feedbackRefreshing } = useQuery({
    queryKey: ['admin-feedback'],
    queryFn: () => feedbackApi.getAll(0).then(r => r.data.content as FeedbackRow[]),
    enabled: activeTab === 'inbox',
  });

  const { data: ticketsData, isLoading: ticketsLoading, refetch: refetchTickets, isRefetching: ticketsRefreshing } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: () => supportApi.getAll(0).then(r => r.data.content as TicketRow[]),
    enabled: activeTab === 'inbox',
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => supportApi.resolve(id),
    onSuccess: () => {
      showMessage({ message: 'Ticket resolved', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
    onError: () => showMessage({ message: 'Failed to resolve ticket', type: 'danger' }),
  });

  const handleApprove = (item: ContentCardData) => {
    Alert.alert('Approve & Publish', `Publish "${item.title}" to all targeted departments?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Publish', onPress: () => approveMutation.mutate(item.id) },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/create-content')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.createBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabList}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabPill, activeTab === tab.key && styles.tabPillActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons name={tab.icon} size={14} color={activeTab === tab.key ? '#fff' : Colors.textMuted} />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Review tab ─────────────────────────────────────────────────────────── */}
      {activeTab === 'review' && (
        pendingLoading ? <Centered /> : (
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
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.approveBtnText}>Approve &amp; Publish</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<EmptyState icon="checkmark-done-circle" title="Nothing to review" subtitle="All submissions are up to date" />}
            refreshControl={<RefreshControl refreshing={pendingRefreshing} onRefresh={refetchPending} tintColor={Colors.primary} />}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )
      )}

      {/* ── Requests tab ───────────────────────────────────────────────────────── */}
      {activeTab === 'requests' && (
        requestsLoading ? <Centered /> : (
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
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )
      )}

      {/* ── Compliance tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'compliance' && (
        complianceLoading ? <Centered /> : (
          <FlatList
            data={complianceData ?? []}
            keyExtractor={(i: ComplianceRow) => i.contentId}
            refreshControl={<RefreshControl refreshing={complianceRefreshing} onRefresh={refetchCompliance} tintColor={Colors.primary} />}
            contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: Spacing.md }}
            ListHeaderComponent={
              <Text style={styles.complianceHeader}>
                Mandatory content acknowledgment &amp; completion rates
              </Text>
            }
            ListEmptyComponent={<EmptyState icon="shield-checkmark" title="No mandatory content" subtitle="No published mandatory items found" />}
            renderItem={({ item }: { item: ComplianceRow }) => (
              <View style={styles.complianceCard}>
                <Text style={styles.complianceTitle} numberOfLines={2}>{item.contentTitle}</Text>
                <Text style={styles.complianceTargeted}>{item.totalTargeted} user{item.totalTargeted !== 1 ? 's' : ''} targeted</Text>

                <View style={styles.complianceRow}>
                  <Text style={styles.complianceMetaLabel}>Acknowledged</Text>
                  <Text style={styles.complianceMetaValue}>{item.acknowledged} / {item.totalTargeted}</Text>
                </View>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, styles.barFillAck, { width: `${item.ackPct}%` as any }]} />
                </View>

                <View style={[styles.complianceRow, { marginTop: 8 }]}>
                  <Text style={styles.complianceMetaLabel}>Completed</Text>
                  <Text style={styles.complianceMetaValue}>{item.completed} / {item.totalTargeted}</Text>
                </View>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, styles.barFillComp, { width: `${item.completedPct}%` as any }]} />
                </View>

                <View style={styles.pctRow}>
                  <View style={[styles.pctBadge, { backgroundColor: Colors.warning + '22' }]}>
                    <Text style={[styles.pctBadgeText, { color: Colors.warning }]}>{item.ackPct}% acked</Text>
                  </View>
                  <View style={[styles.pctBadge, { backgroundColor: Colors.success + '22' }]}>
                    <Text style={[styles.pctBadgeText, { color: Colors.success }]}>{item.completedPct}% done</Text>
                  </View>
                </View>
              </View>
            )}
          />
        )
      )}

      {/* ── Inbox tab ──────────────────────────────────────────────────────────── */}
      {activeTab === 'inbox' && (
        (feedbackLoading || ticketsLoading) ? <Centered /> : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: Spacing.md }}
            refreshControl={
              <RefreshControl
                refreshing={feedbackRefreshing || ticketsRefreshing}
                onRefresh={() => { refetchFeedback(); refetchTickets(); }}
                tintColor={Colors.primary}
              />
            }
          >
            {/* Feedback */}
            <Text style={styles.inboxSection}>
              <Ionicons name="chatbubbles-outline" size={13} color={Colors.textMuted} />
              {'  '}Feedback ({feedbackData?.length ?? 0})
            </Text>
            {feedbackData && feedbackData.length > 0 ? feedbackData.map((fb: FeedbackRow) => (
              <View key={fb.id} style={styles.inboxCard}>
                <View style={styles.inboxCardHeader}>
                  <View style={[styles.catBadge, { backgroundColor: fbColor(fb.category) + '22' }]}>
                    <Text style={[styles.catBadgeText, { color: fbColor(fb.category) }]}>
                      {fb.category.replace('_', ' ')}
                    </Text>
                  </View>
                  <Text style={styles.inboxTime}>{formatTime(fb.createdAt)}</Text>
                </View>
                <Text style={styles.inboxMsg}>{fb.message}</Text>
                <Text style={styles.inboxAuthor}>
                  {fb.anonymous ? '🕵️ Anonymous' : `From: ${fb.authorName ?? 'Unknown'}`}
                </Text>
              </View>
            )) : (
              <Text style={styles.inboxEmpty}>No feedback yet</Text>
            )}

            {/* Support tickets */}
            <Text style={[styles.inboxSection, { marginTop: Spacing.lg }]}>
              <Ionicons name="ticket-outline" size={13} color={Colors.textMuted} />
              {'  '}Support Tickets ({ticketsData?.length ?? 0})
            </Text>
            {ticketsData && ticketsData.length > 0 ? ticketsData.map((ticket: TicketRow) => {
              const statusColor = STATUS_COLOR[ticket.status] ?? Colors.textMuted;
              const isOpen = ticket.status === 'OPEN';
              return (
                <View key={ticket.id} style={styles.inboxCard}>
                  <View style={styles.inboxCardHeader}>
                    <View style={[styles.catBadge, { backgroundColor: statusColor + '22' }]}>
                      <Text style={[styles.catBadgeText, { color: statusColor }]}>{ticket.ticketType}</Text>
                    </View>
                    <View style={[styles.catBadge, { backgroundColor: statusColor + '15' }]}>
                      <Text style={[styles.catBadgeText, { color: statusColor }]}>{ticket.status.replace('_', ' ')}</Text>
                    </View>
                    <Text style={styles.inboxTime}>{formatTime(ticket.createdAt)}</Text>
                  </View>
                  <Text style={styles.inboxMsg} numberOfLines={1}>{ticket.subject}</Text>
                  <Text style={styles.inboxAuthor} numberOfLines={2}>{ticket.description}</Text>
                  {isOpen && (
                    <TouchableOpacity
                      style={styles.resolveBtn}
                      onPress={() => resolveMutation.mutate(ticket.id)}
                      disabled={resolveMutation.isPending}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.resolveBtnText}>Mark Resolved</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }) : (
              <Text style={styles.inboxEmpty}>No support tickets</Text>
            )}
          </ScrollView>
        )
      )}
    </View>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ComplianceRow {
  contentId: string;
  contentTitle: string;
  totalTargeted: number;
  acknowledged: number;
  completed: number;
  ackPct: number;
  completedPct: number;
}

interface FeedbackRow {
  id: string;
  category: string;
  message: string;
  anonymous: boolean;
  authorName?: string;
  createdAt: string;
}

interface TicketRow {
  id: string;
  ticketType: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fbColor(category: string): string {
  const map: Record<string, string> = {
    SUGGESTION: Colors.warning,
    BUG_REPORT: Colors.danger,
    COMPLIMENT: '#EC4899',
    OTHER:      Colors.primary,
  };
  return map[category] ?? Colors.primary;
}

function Centered() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator color={Colors.primary} size="large" />
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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Spacing.xl + 8, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '700' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  createBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },

  tabScroll: { flexGrow: 0 },
  tabList: { paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.md },
  tabPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  tabPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabLabel:      { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  tabLabelActive: { color: '#fff' },

  // Review
  approveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.secondary, borderRadius: Radius.md,
    marginHorizontal: Spacing.md, marginBottom: Spacing.md,
    paddingVertical: 12, justifyContent: 'center',
  },
  approveBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },

  // Requests
  requestCard: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  requestRow: { flexDirection: 'row', gap: Spacing.md },
  requestIconWrap: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.warning + '22',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  requestInfo: { flex: 1, gap: 4 },
  searchTerm:  { color: Colors.primary, fontSize: FontSize.xs, fontWeight: '600' },
  requestDesc: { color: Colors.textPrimary, fontSize: FontSize.sm, lineHeight: 18 },
  requestTime: { color: Colors.textMuted, fontSize: FontSize.xs },
  resolveBtn:  {
    backgroundColor: Colors.surfaceAlt, borderRadius: Radius.sm,
    paddingVertical: 8, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  resolveBtnText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },

  // Compliance
  complianceHeader: {
    color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5,
    paddingVertical: Spacing.md,
  },
  complianceCard: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm, gap: 4,
  },
  complianceTitle:    { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '600' },
  complianceTargeted: { color: Colors.textMuted, fontSize: FontSize.xs, marginBottom: 6 },
  complianceRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  complianceMetaLabel: { color: Colors.textSecondary, fontSize: FontSize.sm },
  complianceMetaValue: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600' },
  barBg:   { height: 6, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: Radius.full },
  barFillAck:  { backgroundColor: Colors.warning },
  barFillComp: { backgroundColor: Colors.success },
  pctRow:      { flexDirection: 'row', gap: 8, marginTop: 8 },
  pctBadge:    { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  pctBadgeText: { fontSize: FontSize.xs, fontWeight: '700' },

  // Inbox
  inboxSection: {
    color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5,
    paddingVertical: Spacing.sm,
  },
  inboxCard: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm, gap: 6,
  },
  inboxCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catBadge:    { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  catBadgeText: { fontSize: FontSize.xs, fontWeight: '700' },
  inboxTime:   { color: Colors.textMuted, fontSize: FontSize.xs, marginLeft: 'auto' },
  inboxMsg:    { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '500' },
  inboxAuthor: { color: Colors.textMuted, fontSize: FontSize.xs },
  inboxEmpty:  { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', paddingVertical: Spacing.md },

  // Empty state
  empty:         { alignItems: 'center', padding: Spacing.xl, gap: 8, marginTop: 60 },
  emptyTitle:    { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '600' },
  emptySubtitle: { color: Colors.textMuted, fontSize: FontSize.sm },
});
