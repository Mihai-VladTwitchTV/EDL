import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { showMessage } from 'react-native-flash-message';
import { contentApi } from '../../src/api';
import { Colors, Spacing, Radius, FontSize } from '../../src/utils/theme';

// ─── DOCUMENT VIEW ────────────────────────────────────────────────────────────
function DocumentView({ item }: { item: any }) {
  return (
    <ScrollView style={styles.docScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.docBody}>{item.description ?? 'No content available.'}</Text>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

// ─── VIDEO VIEW ───────────────────────────────────────────────────────────────
function VideoView({ item, onProgress }: { item: any; onProgress: (pct: number) => void }) {
  // Note: in a real build, use expo-av Video component.
  // Shown as placeholder UI since expo-av needs native build.
  return (
    <View style={styles.videoPlaceholder}>
      <View style={styles.videoPlayer}>
        <Ionicons name="play-circle" size={72} color="#fff" />
        <Text style={styles.videoNote}>Video player — use expo-av Video component in native build</Text>
        {item.description && <Text style={styles.videoDesc}>{item.description}</Text>}
      </View>
      {item.subtitleUrl && (
        <View style={styles.subtitleBadge}>
          <Ionicons name="text-outline" size={14} color={Colors.secondary} />
          <Text style={styles.subtitleText}>Subtitles available</Text>
        </View>
      )}
    </View>
  );
}

// ─── QUIZ VIEW ─────────────────────────────────────────────────────────────────
function QuizView({ itemId, onComplete }: { itemId: string; onComplete: () => void }) {
  // Placeholder quiz UI — questions would come from /api/content/{id}/quiz endpoint
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const mockQuestions = [
    { id: 0, text: 'Question 1: Sample question about the topic', options: ['Option A', 'Option B', 'Option C', 'Option D'], correct: 0 },
    { id: 1, text: 'Question 2: Another sample question', options: ['True', 'False'], correct: 0 },
  ];

  const handleSubmit = () => {
    setSubmitted(true);
    const correct = mockQuestions.filter(q => answers[q.id] === q.correct).length;
    const score = Math.round((correct / mockQuestions.length) * 100);
    if (score >= 70) {
      showMessage({ message: `Passed! Score: ${score}%`, type: 'success' });
      onComplete();
    } else {
      showMessage({ message: `Score: ${score}% — 70% required to pass`, type: 'warning' });
    }
  };

  if (submitted) {
    return (
      <View style={styles.quizDone}>
        <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
        <Text style={styles.quizDoneTitle}>Quiz Submitted</Text>
        <Text style={styles.quizDoneSubtitle}>Your answers have been recorded</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.quizScroll} showsVerticalScrollIndicator={false}>
      {mockQuestions.map(q => (
        <View key={q.id} style={styles.questionCard}>
          <Text style={styles.questionText}>{q.text}</Text>
          {q.options.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.optionBtn, answers[q.id] === i && styles.optionBtnSelected]}
              onPress={() => setAnswers(prev => ({ ...prev, [q.id]: i }))}
            >
              <View style={[styles.optionDot, answers[q.id] === i && styles.optionDotSelected]} />
              <Text style={[styles.optionText, answers[q.id] === i && styles.optionTextSelected]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
      <TouchableOpacity
        style={[styles.submitQuizBtn, Object.keys(answers).length < mockQuestions.length && styles.submitQuizBtnDisabled]}
        onPress={handleSubmit}
        disabled={Object.keys(answers).length < mockQuestions.length}
      >
        <Text style={styles.submitQuizBtnText}>Submit Answers</Text>
      </TouchableOpacity>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function ContentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: item, isLoading } = useQuery({
    queryKey: ['content', id],
    queryFn: () => contentApi.getById(id!).then(r => r.data),
    enabled: !!id,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: () => contentApi.acknowledge(id!),
    onSuccess: () => {
      showMessage({ message: 'Acknowledged ✓', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['content', id] });
      queryClient.invalidateQueries({ queryKey: ['mandatory-pending'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => contentApi.complete(id!),
    onSuccess: () => {
      showMessage({ message: 'Marked as complete ✓', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['content', id] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const handleComplete = () => {
    completeMutation.mutate();
  };

  if (isLoading || !item) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const showAcknowledgeBtn = item.mandatory && !item.userAcknowledged;
  const showCompleteBtn = !item.userCompleted && item.contentType === 'DOCUMENT';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: item.contentType === 'VIDEO' ? 'Video' : item.contentType === 'QUIZ' ? 'Quiz' : 'Document',
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.textPrimary,
        }}
      />

      {/* Title block */}
      <View style={styles.titleBlock}>
        {item.mandatory && (
          <View style={styles.mandatoryBadge}>
            <Ionicons name="alert-circle" size={12} color={Colors.mandatory} />
            <Text style={styles.mandatoryBadgeText}>Mandatory</Text>
          </View>
        )}
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.metaRow}>
          {item.categoryName && (
            <Text style={[styles.metaChip, { color: item.categoryColorHex ?? Colors.primary, borderColor: item.categoryColorHex ?? Colors.primary }]}>
              {item.categoryName}
            </Text>
          )}
          <Text style={styles.metaAuthor}>by {item.authorName}</Text>
        </View>
      </View>

      {/* Content body */}
      <View style={styles.body}>
        {item.contentType === 'DOCUMENT' && <DocumentView item={item} />}
        {item.contentType === 'VIDEO' && (
          <VideoView item={item} onProgress={pct => contentApi.updateProgress(id!, pct)} />
        )}
        {item.contentType === 'QUIZ' && (
          <QuizView itemId={id!} onComplete={handleComplete} />
        )}
      </View>

      {/* Bottom action bar */}
      {(showAcknowledgeBtn || showCompleteBtn) && (
        <View style={styles.actionBar}>
          {showAcknowledgeBtn && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.acknowledgeBtn, acknowledgeMutation.isPending && { opacity: 0.7 }]}
              onPress={() => acknowledgeMutation.mutate()}
              disabled={acknowledgeMutation.isPending}
            >
              {acknowledgeMutation.isPending
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>I have read and understood this</Text>
                  </>
              }
            </TouchableOpacity>
          )}
          {showCompleteBtn && !showAcknowledgeBtn && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.completeBtn, completeMutation.isPending && { opacity: 0.7 }]}
              onPress={handleComplete}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending
                ? <ActivityIndicator color="#fff" size="small" />
                : <>
                    <Ionicons name="checkmark-done-circle-outline" size={20} color="#fff" />
                    <Text style={styles.actionBtnText}>Mark as Complete</Text>
                  </>
              }
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Already completed state */}
      {item.userCompleted && (
        <View style={styles.completedBar}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.completedBarText}>Completed</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  titleBlock: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 6,
  },
  mandatoryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.mandatoryBg, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full,
  },
  mandatoryBadgeText: { color: Colors.mandatory, fontSize: FontSize.xs, fontWeight: '700' },
  title: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '700', lineHeight: 26 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  metaChip: {
    fontSize: FontSize.xs, fontWeight: '600',
    borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2,
  },
  metaAuthor: { color: Colors.textMuted, fontSize: FontSize.xs },
  body: { flex: 1 },

  // Document
  docScroll: { flex: 1, padding: Spacing.md },
  docBody: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 26 },

  // Video
  videoPlaceholder: { flex: 1, gap: Spacing.md, padding: Spacing.md },
  videoPlayer: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    aspectRatio: 16 / 9, alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, padding: Spacing.md,
  },
  videoNote: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
  videoDesc: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center' },
  subtitleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: Colors.successBg, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  subtitleText: { color: Colors.success, fontSize: FontSize.xs, fontWeight: '600' },

  // Quiz
  quizScroll: { flex: 1, padding: Spacing.md },
  questionCard: {
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  questionText: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '600', lineHeight: 22 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.sm, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border,
  },
  optionBtnSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  optionDot: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.border,
  },
  optionDotSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  optionText: { color: Colors.textSecondary, fontSize: FontSize.md },
  optionTextSelected: { color: Colors.textPrimary, fontWeight: '600' },
  submitQuizBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
  },
  submitQuizBtnDisabled: { opacity: 0.4 },
  submitQuizBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  quizDone: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  quizDoneTitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '700' },
  quizDoneSubtitle: { color: Colors.textMuted, fontSize: FontSize.md },

  // Action bar
  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing.md, backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, borderRadius: Radius.md, padding: Spacing.md,
  },
  acknowledgeBtn: { backgroundColor: Colors.mandatory },
  completeBtn: { backgroundColor: Colors.secondary },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  completedBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: Spacing.md, backgroundColor: Colors.successBg,
    borderTopWidth: 1, borderTopColor: Colors.success + '33',
  },
  completedBarText: { color: Colors.success, fontWeight: '700', fontSize: FontSize.md },
});
