import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Switch,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { contentApi, metaApi } from '../src/api';
import { useAuthStore } from '../src/store/authStore';
import { Colors, Spacing, Radius, FontSize } from '../src/utils/theme';

// ─── Constants ────────────────────────────────────────────────────────────────

const POST_TYPES: { key: string; label: string; color: string }[] = [
  { key: 'TRAINING',   label: 'Training',   color: Colors.primary },
  { key: 'NEWS',       label: 'News',       color: '#8B5CF6' },
  { key: 'EVENT',      label: 'Event',      color: Colors.warning },
  { key: 'CHANGE',     label: 'Change',     color: Colors.danger },
  { key: 'CAREER',     label: 'Career',     color: Colors.secondary },
  { key: 'REGULATION', label: 'Regulation', color: '#64748B' },
];

const CONTENT_TYPES: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'DOCUMENT', label: 'Document', icon: 'document-text-outline' },
  { key: 'VIDEO',    label: 'Video',    icon: 'play-circle-outline' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CreateContentScreen() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const isAdmin = user?.role === 'HR_ADMIN';

  const [title, setTitle]               = useState('');
  const [description, setDescription]   = useState('');
  const [postType, setPostType]         = useState('TRAINING');
  const [contentType, setContentType]   = useState('DOCUMENT');
  const [language, setLanguage]         = useState('EN');
  const [mandatory, setMandatory]       = useState(false);
  const [categoryId, setCategoryId]     = useState<string | null>(null);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [showDepts, setShowDepts]       = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => metaApi.getCategories().then(r => r.data as { id: string; name: string; colorHex?: string }[]),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => metaApi.getDepartments().then(r => r.data as { id: string; name: string }[]),
  });

  const createMutation = useMutation({
    mutationFn: async ({ submitForReview }: { submitForReview: boolean }) => {
      const form = new FormData();
      form.append('title', title.trim());
      if (description.trim()) form.append('description', description.trim());
      form.append('contentType', contentType);
      form.append('postType', postType);
      form.append('language', language);
      form.append('mandatory', String(mandatory));
      if (categoryId) form.append('categoryId', categoryId);
      selectedDepts.forEach(id => form.append('departmentIds', id));

      const res = await contentApi.create(form);
      const created = res.data as { id: string };

      if (submitForReview) {
        await contentApi.submitForReview(created.id);
      }
      return { id: created.id, submitted: submitForReview };
    },
    onSuccess: ({ submitted }) => {
      showMessage({
        message: submitted ? 'Submitted for review!' : 'Saved as draft',
        description: submitted ? 'An admin will review your submission.' : 'You can find it in your drafts.',
        type: 'success',
      });
      router.back();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to create content';
      showMessage({ message: msg, type: 'danger' });
    },
  });

  const canSubmit = title.trim().length >= 3 && !createMutation.isPending;

  const toggleDept = (id: string) => {
    setSelectedDepts(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.inner}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{
        title: 'Create Content',
        headerShown: true,
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.textPrimary,
      }} />

      {/* Title */}
      <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter a clear, descriptive title"
        placeholderTextColor={Colors.textMuted}
      />

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Summarise what this content covers..."
        placeholderTextColor={Colors.textMuted}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {/* Post Type */}
      <Text style={styles.label}>Post Type</Text>
      <View style={styles.chipGrid}>
        {POST_TYPES.map(pt => {
          const active = postType === pt.key;
          return (
            <TouchableOpacity
              key={pt.key}
              style={[styles.chip, active && { backgroundColor: pt.color + '22', borderColor: pt.color }]}
              onPress={() => setPostType(pt.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, active && { color: pt.color }]}>{pt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content Type */}
      <Text style={styles.label}>Content Type</Text>
      <View style={styles.chipRow}>
        {CONTENT_TYPES.map(ct => {
          const active = contentType === ct.key;
          return (
            <TouchableOpacity
              key={ct.key}
              style={[styles.chip, styles.chipWide, active && { backgroundColor: Colors.primary + '22', borderColor: Colors.primary }]}
              onPress={() => setContentType(ct.key)}
              activeOpacity={0.7}
            >
              <Ionicons name={ct.icon} size={16} color={active ? Colors.primary : Colors.textMuted} />
              <Text style={[styles.chipText, active && { color: Colors.primary }]}>{ct.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Language */}
      <Text style={styles.label}>Language</Text>
      <View style={styles.chipRow}>
        {(['EN', 'RO'] as const).map(lang => (
          <TouchableOpacity
            key={lang}
            style={[styles.chip, styles.chipWide, language === lang && { backgroundColor: Colors.primary + '22', borderColor: Colors.primary }]}
            onPress={() => setLanguage(lang)}
            activeOpacity={0.7}
          >
            <Text style={styles.langFlag}>{lang === 'EN' ? '🇬🇧' : '🇷🇴'}</Text>
            <Text style={[styles.chipText, language === lang && { color: Colors.primary }]}>{lang === 'EN' ? 'English' : 'Română'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mandatory (HR_ADMIN only) */}
      {isAdmin && (
        <View style={styles.switchRow}>
          <View style={styles.switchLeft}>
            <Ionicons name="alert-circle-outline" size={18} color={mandatory ? Colors.mandatory : Colors.textMuted} />
            <View>
              <Text style={styles.switchLabel}>Mandatory</Text>
              <Text style={styles.switchSub}>Users must acknowledge this content</Text>
            </View>
          </View>
          <Switch
            value={mandatory}
            onValueChange={setMandatory}
            trackColor={{ false: Colors.border, true: Colors.mandatory + '66' }}
            thumbColor={mandatory ? Colors.mandatory : Colors.textMuted}
          />
        </View>
      )}

      {/* Category */}
      {categories && categories.length > 0 && (
        <>
          <Text style={styles.label}>Category <Text style={styles.optional}>(optional)</Text></Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <View style={styles.chipRowInner}>
              <TouchableOpacity
                style={[styles.chip, !categoryId && { backgroundColor: Colors.primary + '22', borderColor: Colors.primary }]}
                onPress={() => setCategoryId(null)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, !categoryId && { color: Colors.primary }]}>None</Text>
              </TouchableOpacity>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, categoryId === cat.id && { backgroundColor: (cat.colorHex ?? Colors.primary) + '22', borderColor: cat.colorHex ?? Colors.primary }]}
                  onPress={() => setCategoryId(cat.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, categoryId === cat.id && { color: cat.colorHex ?? Colors.primary }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </>
      )}

      {/* Departments */}
      {departments && departments.length > 0 && (
        <>
          <TouchableOpacity
            style={styles.deptsToggle}
            onPress={() => setShowDepts(s => !s)}
            activeOpacity={0.7}
          >
            <Text style={styles.label}>
              Target Departments{' '}
              <Text style={styles.optional}>
                ({selectedDepts.length === 0 ? 'all' : `${selectedDepts.length} selected`})
              </Text>
            </Text>
            <Ionicons name={showDepts ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          {showDepts && (
            <View style={styles.deptsList}>
              {departments.map(dept => {
                const selected = selectedDepts.includes(dept.id);
                return (
                  <TouchableOpacity
                    key={dept.id}
                    style={[styles.deptRow, selected && styles.deptRowSelected]}
                    onPress={() => toggleDept(dept.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                      {selected && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    <Text style={[styles.deptLabel, selected && styles.deptLabelSelected]}>
                      {dept.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.draftBtn, !canSubmit && styles.btnDisabled]}
          onPress={() => createMutation.mutate({ submitForReview: false })}
          disabled={!canSubmit}
          activeOpacity={0.8}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color={Colors.primary} size="small" />
          ) : (
            <>
              <Ionicons name="save-outline" size={16} color={Colors.primary} />
              <Text style={styles.draftBtnText}>Save as Draft</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.btnDisabled]}
          onPress={() => createMutation.mutate({ submitForReview: true })}
          disabled={!canSubmit}
          activeOpacity={0.8}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="send-outline" size={16} color="#fff" />
              <Text style={styles.submitBtnText}>Submit for Review</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { padding: Spacing.md, gap: Spacing.sm },

  label:    { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600', marginTop: Spacing.sm },
  required: { color: Colors.mandatory },
  optional: { color: Colors.textMuted, fontWeight: '400' },

  input: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.textPrimary, fontSize: FontSize.md, padding: Spacing.md,
  },
  textArea: { minHeight: 100 },

  chipGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chipRow:      { flexDirection: 'row', gap: Spacing.sm },
  chipRowInner: { flexDirection: 'row', gap: Spacing.sm },
  chipScroll:   { flexGrow: 0 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  chipWide: { flex: 1, justifyContent: 'center' },
  chipText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  langFlag: { fontSize: 14 },

  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginTop: Spacing.sm,
  },
  switchLeft:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  switchLabel: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '500' },
  switchSub:   { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  deptsToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  deptsList: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  deptRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  deptRowSelected: { backgroundColor: Colors.primary + '10' },
  checkbox: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  deptLabel:         { color: Colors.textSecondary, fontSize: FontSize.md },
  deptLabelSelected: { color: Colors.textPrimary, fontWeight: '600' },

  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  draftBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 13,
  },
  draftBtnText:  { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
  submitBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 13,
  },
  submitBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  btnDisabled: { opacity: 0.4 },
});
