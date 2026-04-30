import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { showMessage } from 'react-native-flash-message';
import { contentApi } from '../../src/api';
import ContentCard, { ContentCardData } from '../../src/components/ContentCard';
import { Colors, Spacing, Radius, FontSize } from '../../src/utils/theme';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestDesc, setRequestDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const debouncedQuery = useDebounce(query, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => contentApi.search(debouncedQuery).then(r => r.data),
    enabled: debouncedQuery.trim().length >= 2,
  });

  const results: ContentCardData[] = data?.content ?? [];
  const isEmpty = debouncedQuery.trim().length >= 2 && !isLoading && results.length === 0;

  const handleSubmitRequest = async () => {
    if (!requestDesc.trim()) {
      showMessage({ message: 'Please describe what you need', type: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      await contentApi.submitRequest({ searchTerm: debouncedQuery, description: requestDesc.trim() });
      showMessage({ message: 'Request submitted! A mentor will be notified.', type: 'success' });
      setShowRequestModal(false);
      setRequestDesc('');
    } catch {
      showMessage({ message: 'Failed to submit request', type: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search procedures, tutorials, policies…"
            placeholderTextColor={Colors.textMuted}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* States */}
      {debouncedQuery.trim().length < 2 ? (
        <View style={styles.idleState}>
          <Text style={styles.idleIcon}>🔍</Text>
          <Text style={styles.idleTitle}>What do you need?</Text>
          <Text style={styles.idleSubtitle}>Type at least 2 characters to search across all procedures, videos, and guides</Text>
        </View>
      ) : isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : isEmpty ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔎</Text>
          <Text style={styles.emptyTitle}>No results for "{debouncedQuery}"</Text>
          <Text style={styles.emptySubtitle}>Can't find what you need? Ask a mentor to create it.</Text>
          <TouchableOpacity style={styles.requestBtn} onPress={() => setShowRequestModal(true)}>
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.requestBtnText}>Request this content</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ContentCard item={item} onPress={i => router.push(`/content/${i.id}`)} />
          )}
          ListHeaderComponent={
            <Text style={styles.resultCount}>{data?.totalElements ?? 0} result{data?.totalElements !== 1 ? 's' : ''}</Text>
          }
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Content Request Modal */}
      <Modal visible={showRequestModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Request Content</Text>
            <Text style={styles.modalSubtitle}>
              You searched for <Text style={{ color: Colors.primary }}>"{debouncedQuery}"</Text> — describe what you need and a mentor will be notified.
            </Text>

            <TextInput
              style={styles.modalInput}
              value={requestDesc}
              onChangeText={setRequestDesc}
              placeholder="Describe what procedure or guide you need…"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowRequestModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmitRequest}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.submitText}>Submit Request</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingTop: Spacing.xl + 8, paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.md },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '700' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: 12,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  idleState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: 12 },
  idleIcon: { fontSize: 56 },
  idleTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '700' },
  idleSubtitle: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: 12 },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
  requestBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  requestBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  resultCount: {
    color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.lg, gap: Spacing.md, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: Colors.border,
    borderRadius: Radius.full, alignSelf: 'center', marginBottom: Spacing.sm,
  },
  modalTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '700' },
  modalSubtitle: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  modalInput: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary,
    fontSize: FontSize.md, minHeight: 100,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.sm },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center',
  },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  submitBtn: {
    flex: 2, backgroundColor: Colors.primary, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
});
