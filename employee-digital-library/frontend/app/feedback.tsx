import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Switch,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { feedbackApi } from '../src/api';
import { Colors, Spacing, Radius, FontSize } from '../src/utils/theme';

const CATEGORIES: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'SUGGESTION', label: 'Suggestion', icon: 'bulb-outline', color: Colors.warning },
  { key: 'BUG_REPORT', label: 'Bug / Issue', icon: 'bug-outline', color: Colors.danger },
  { key: 'COMPLIMENT', label: 'Compliment', icon: 'heart-outline', color: '#EC4899' },
  { key: 'OTHER', label: 'Other', icon: 'chatbubble-ellipses-outline', color: Colors.primary },
];

export default function FeedbackScreen() {
  const router = useRouter();
  const [category, setCategory] = useState('SUGGESTION');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => feedbackApi.submit({ category, message: message.trim(), anonymous }),
    onSuccess: () => {
      showMessage({ message: 'Thank you for your feedback!', type: 'success' });
      router.back();
    },
    onError: () => showMessage({ message: 'Failed to submit. Please try again.', type: 'danger' }),
  });

  const canSubmit = message.trim().length >= 10 && !isPending;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.inner}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{
        title: 'Send Feedback',
        headerShown: true,
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.textPrimary,
      }} />

      {/* Intro */}
      <View style={styles.introCard}>
        <Ionicons name="chatbubbles-outline" size={28} color={Colors.primary} />
        <Text style={styles.introText}>
          Your feedback helps us improve the app and the workplace for everyone.
        </Text>
      </View>

      {/* Category */}
      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryGrid}>
        {CATEGORIES.map(cat => {
          const active = category === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[styles.catChip, active && { backgroundColor: cat.color + '22', borderColor: cat.color }]}
              onPress={() => setCategory(cat.key)}
              activeOpacity={0.7}
            >
              <Ionicons name={cat.icon} size={16} color={active ? cat.color : Colors.textMuted} />
              <Text style={[styles.catLabel, active && { color: cat.color }]}>{cat.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Message */}
      <Text style={styles.label}>Message <Text style={styles.labelHint}>(min. 10 characters)</Text></Text>
      <TextInput
        style={styles.messageInput}
        value={message}
        onChangeText={setMessage}
        placeholder="Describe your feedback in detail..."
        placeholderTextColor={Colors.textMuted}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />
      <Text style={styles.charCount}>{message.trim().length} / 1000</Text>

      {/* Anonymous toggle */}
      <View style={styles.anonRow}>
        <View style={styles.anonLeft}>
          <Ionicons name="eye-off-outline" size={18} color={Colors.textSecondary} />
          <View>
            <Text style={styles.anonTitle}>Submit anonymously</Text>
            <Text style={styles.anonSub}>Your name won't be attached to this feedback</Text>
          </View>
        </View>
        <Switch
          value={anonymous}
          onValueChange={setAnonymous}
          trackColor={{ false: Colors.border, true: Colors.primary + '66' }}
          thumbColor={anonymous ? Colors.primary : Colors.textMuted}
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
        onPress={() => mutate()}
        disabled={!canSubmit}
        activeOpacity={0.8}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="send" size={16} color="#fff" />
            <Text style={styles.submitBtnText}>Submit Feedback</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { padding: Spacing.md, paddingBottom: 60, gap: Spacing.sm },

  introCard: {
    backgroundColor: Colors.primary + '12', borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.primary + '33',
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  introText: { flex: 1, color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },

  label: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600', marginTop: Spacing.sm },
  labelHint: { color: Colors.textMuted, fontWeight: '400' },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  catLabel: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },

  messageInput: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.textPrimary, fontSize: FontSize.md,
    padding: Spacing.md, minHeight: 130,
  },
  charCount: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'right' },

  anonRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginTop: Spacing.sm,
  },
  anonLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  anonTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '500' },
  anonSub: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 14, marginTop: Spacing.md,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
