import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { pagesApi } from '../src/api';
import { Colors, Spacing, Radius, FontSize } from '../src/utils/theme';

interface CompanyPage {
  id: string;
  slug: string;
  section: string;
  title: string;
  bodyHtml: string;
  displayOrder: number;
}

const SECTION_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  about:    { label: 'About Us',  icon: 'business-outline',      color: Colors.primary },
  policies: { label: 'Policies', icon: 'shield-checkmark-outline', color: '#8B5CF6' },
  contact:  { label: 'Contact',  icon: 'call-outline',           color: Colors.secondary },
};

const SECTION_ORDER = ['about', 'policies', 'contact'];

function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<\/?(h[1-6]|p|li|ul|ol|br)[^>]*>/gi, '\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function AboutScreen() {
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  // We added 'error' here to capture exactly what goes wrong
 const { data: pages, isLoading, isError, error } = useQuery({
    queryKey: ['company-pages'],
    queryFn: async () => {
      try {
        const r = await pagesApi.getAll();
        return r.data as CompanyPage[];
      } catch (err: any) {
        // Extract the explicit text error we just added to the Spring controller
        const backendMsg = err.response?.data;
        const errorStr = typeof backendMsg === 'string' ? backendMsg : err.message;
        throw new Error(errorStr);
      }
    },
  });

  const grouped = React.useMemo(() => {
    if (!pages || !Array.isArray(pages)) return {};
    return pages.reduce<Record<string, CompanyPage[]>>((acc, page) => {
      const sec = (page.section || 'other').toLowerCase();
      if (!acc[sec]) acc[sec] = [];
      acc[sec].push(page);
      return acc;
    }, {});
  }, [pages]);

  const orderedSections = React.useMemo(() => {
    const known = SECTION_ORDER.filter(s => grouped[s]?.length > 0);
    const unknown = Object.keys(grouped).filter(s => !SECTION_ORDER.includes(s));
    return [...known, ...unknown];
  }, [grouped]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{
          title: 'About & Policies',
          headerShown: true,
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.textPrimary,
        }} />
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Stack.Screen options={{
        title: 'About & Policies',
        headerShown: true,
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.textPrimary,
      }} />

      {/* This block will now print the EXACT error from the backend */}
      {isError && (
        <View style={styles.emptyWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.mandatory} />
          <Text style={styles.emptyText}>Failed to load pages</Text>
          <Text style={styles.emptySub}>
            {error instanceof Error ? error.message : JSON.stringify(error)}
          </Text>
          <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 12, textAlign: 'center' }}>
            Check your Spring Boot terminal for error logs.
          </Text>
        </View>
      )}

      {!isError && orderedSections.length === 0 && (
        <View style={styles.emptyWrap}>
          <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No content available</Text>
          <Text style={styles.emptySub}>Company pages have not been published yet.</Text>
        </View>
      )}

      {orderedSections.map(sectionKey => {
        const meta = SECTION_META[sectionKey] ?? { 
          label: sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1), 
          icon: 'document-outline', 
          color: Colors.primary 
        };

        return (
          <View key={sectionKey} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: meta.color + '22' }]}>
                <Ionicons name={meta.icon} size={18} color={meta.color} />
              </View>
              <Text style={[styles.sectionTitle, { color: meta.color }]}>{meta.label}</Text>
            </View>

            <View style={styles.pagesCard}>
              {grouped[sectionKey].map((page, i) => {
                const isExpanded = expandedSlug === page.slug;
                return (
                  <React.Fragment key={page.slug}>
                    {i > 0 && <View style={styles.divider} />}
                    <TouchableOpacity
                      style={styles.pageRow}
                      onPress={() => setExpandedSlug(isExpanded ? null : page.slug)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.pageRowTop}>
                        <Text style={styles.pageTitle}>{page.title}</Text>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={Colors.textMuted}
                        />
                      </View>
                      {isExpanded && (
                        <Text style={styles.pageBody}>{stripHtml(page.bodyHtml)}</Text>
                      )}
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { padding: Spacing.md, gap: Spacing.md },
  centered: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },

  emptyWrap: { alignItems: 'center', paddingTop: Spacing.xl * 2, gap: 8, paddingHorizontal: Spacing.xl },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '600' },
  emptySub: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },

  section: { gap: Spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionIconWrap: {
    width: 32, height: 32, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  pagesCard: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.md },

  pageRow: { padding: Spacing.md, gap: 8 },
  pageRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '600', flex: 1, paddingRight: Spacing.sm },
  pageBody: {
    color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 22, paddingTop: 4 },
});