import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { feedApi } from '../src/api';
import { Colors, Spacing, Radius, FontSize } from '../src/utils/theme';

interface RegulationItem {
  id: string;
  title: string;
  description: string;
  mandatory: boolean;
  language: string;
  createdAt: string;
  userAcknowledged: boolean;
  userCompleted: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function RegulationsScreen() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['regulations'],
    queryFn: () => feedApi.getFeed(0, 50, 'REGULATION').then(r => r.data.content as RegulationItem[]),
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{
          title: 'Regulations',
          headerShown: true,
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.textPrimary,
        }} />
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: 'Regulations',
        headerShown: true,
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.textPrimary,
      }} />

      <FlatList
        data={data ?? []}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerBanner}>
            <Ionicons name="alert-circle" size={20} color={Colors.warning} />
            <Text style={styles.headerBannerText}>
              Required reading — acknowledge each regulation to confirm compliance.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No regulations found</Text>
            <Text style={styles.emptySub}>Check back later for updates</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 40 }} />}
        renderItem={({ item }) => {
          const acknowledged = item.userAcknowledged;
          return (
            <TouchableOpacity
              style={[
                styles.card,
                item.mandatory && !acknowledged && styles.cardMandatory,
                acknowledged && styles.cardAcknowledged,
              ]}
              onPress={() => router.push(`/content/${item.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.cardLeft}>
                <View style={[
                  styles.iconWrap,
                  item.mandatory && !acknowledged ? styles.iconMandatory : styles.iconNeutral,
                ]}>
                  <Ionicons
                    name={acknowledged ? 'checkmark-circle' : (item.mandatory ? 'alert-circle' : 'document-text')}
                    size={20}
                    color={acknowledged ? Colors.success : (item.mandatory ? Colors.mandatory : '#64748B')}
                  />
                </View>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                  {item.mandatory && !acknowledged && (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredBadgeText}>Required</Text>
                    </View>
                  )}
                  {acknowledged && (
                    <View style={styles.doneBadge}>
                      <Text style={styles.doneBadgeText}>Done</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.cardMeta}>
                  {formatDate(item.createdAt)} · {item.language === 'RO' ? '🇷🇴 RO' : '🇬🇧 EN'}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={styles.chevron} />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: Spacing.md },

  headerBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.warning + '15', borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.warning + '40',
    padding: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing.sm,
  },
  headerBannerText: { flex: 1, color: Colors.warning, fontSize: FontSize.sm, lineHeight: 18 },

  emptyWrap: { alignItems: 'center', paddingTop: Spacing.xl * 2, gap: 8 },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '600' },
  emptySub: { color: Colors.textMuted, fontSize: FontSize.sm },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: Spacing.sm, padding: Spacing.md, gap: Spacing.sm,
  },
  cardMandatory: { borderColor: Colors.mandatory + '55', backgroundColor: Colors.mandatoryBg + '66' },
  cardAcknowledged: { borderColor: Colors.success + '44', backgroundColor: Colors.success + '08' },

  cardLeft: { alignItems: 'center', justifyContent: 'center' },
  iconWrap: {
    width: 40, height: 40, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  iconMandatory: { backgroundColor: Colors.mandatory + '20' },
  iconNeutral: { backgroundColor: Colors.surfaceAlt },

  cardContent: { flex: 1, gap: 4 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  cardTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '600', flex: 1 },
  cardDesc: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 18 },
  cardMeta: { color: Colors.textMuted, fontSize: FontSize.xs },

  requiredBadge: {
    backgroundColor: Colors.mandatory + '22', borderRadius: Radius.full,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  requiredBadgeText: { color: Colors.mandatory, fontSize: FontSize.xs, fontWeight: '700' },
  doneBadge: {
    backgroundColor: Colors.success + '22', borderRadius: Radius.full,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  doneBadgeText: { color: Colors.success, fontSize: FontSize.xs, fontWeight: '700' },

  chevron: { flexShrink: 0 },
});
