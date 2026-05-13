import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { showMessage } from 'react-native-flash-message';
import { contentApi, quizApi } from '../../src/api';
import { BASE_URL } from '../../src/api';
import { Colors, Spacing, Radius, FontSize } from '../../src/utils/theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatDateTime(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const POST_TYPE_COLOR: Record<string, string> = {
  TRAINING:   Colors.primary,
  NEWS:       '#8B5CF6',
  EVENT:      '#F59E0B',
  CHANGE:     '#EF4444',
  CAREER:     '#10B981',
  REGULATION: '#64748B',
};

const POST_TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  TRAINING:   'school-outline',
  NEWS:       'newspaper-outline',
  EVENT:      'calendar-outline',
  CHANGE:     'git-merge-outline',
  CAREER:     'briefcase-outline',
  REGULATION: 'shield-checkmark-outline',
};

const POST_TYPE_LABEL: Record<string, string> = {
  TRAINING:   'Training',
  NEWS:       'News',
  EVENT:      'Event',
  CHANGE:     'Change Notice',
  CAREER:     'Career Opportunity',
  REGULATION: 'Regulation',
};

// ─── DOCUMENT / REGULATION VIEW ───────────────────────────────────────────────
function DocumentView({ item }: { item: any }) {
  const bodyText = item.bodyHtml
    ? stripHtml(item.bodyHtml)
    : (item.description ?? 'No content available.');
  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.bodyText}>{bodyText}</Text>
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// ─── VIDEO VIEW ───────────────────────────────────────────────────────────────
function VideoView({ item, onProgress }: { item: any; onProgress: (pct: number) => void }) {
  const videoRef = useRef<Video>(null);

  if (!item.videoUrl) {
    return (
      <View style={styles.videoWrap}>
        <View style={styles.videoPlaceholder}>
          <Ionicons name="play-circle" size={64} color={Colors.textMuted} />
          <Text style={styles.videoNote}>No video file attached to this item.</Text>
          {item.description ? <Text style={styles.videoDesc}>{item.description}</Text> : null}
        </View>
      </View>
    );
  }

  const uri = item.videoUrl.startsWith('http') ? item.videoUrl : `${BASE_URL}${item.videoUrl}`;

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <Video
        ref={videoRef}
        style={styles.videoPlayer}
        source={{ uri }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        onPlaybackStatusUpdate={(status: any) => {
          if (status.isLoaded && status.durationMillis && status.positionMillis) {
            const pct = Math.round((status.positionMillis / status.durationMillis) * 100);
            onProgress(pct);
          }
        }}
      />
      {item.description ? (
        <>
          <Text style={[styles.subheading, { marginTop: Spacing.md }]}>About this Video</Text>
          <Text style={styles.bodyText}>{item.description}</Text>
        </>
      ) : null}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// ─── NEWS VIEW ────────────────────────────────────────────────────────────────
function NewsView({ item }: { item: any }) {
  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.newsMeta}>
        <Ionicons name="newspaper-outline" size={14} color="#8B5CF6" />
        <Text style={styles.newsDate}>{formatDate(item.createdAt)}</Text>
        {item.authorName ? <Text style={styles.newsAuthor}>· {item.authorName}</Text> : null}
      </View>
      <Text style={styles.bodyText}>{item.description ?? 'No content available.'}</Text>
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// ─── EVENT VIEW ───────────────────────────────────────────────────────────────
function EventView({ item }: { item: any }) {
  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.eventInfoCard}>
        {item.eventDate && (
          <View style={styles.eventRow}>
            <View style={[styles.eventIconBox, { backgroundColor: '#F59E0B22' }]}>
              <Ionicons name="calendar" size={20} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.eventRowLabel}>Date & Time</Text>
              <Text style={styles.eventRowValue}>{formatDateTime(item.eventDate)}</Text>
            </View>
          </View>
        )}
        {item.eventLocation && (
          <View style={styles.eventRow}>
            <View style={[styles.eventIconBox, { backgroundColor: '#F59E0B22' }]}>
              <Ionicons name="location" size={20} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.eventRowLabel}>Location</Text>
              <Text style={styles.eventRowValue}>{item.eventLocation}</Text>
            </View>
          </View>
        )}
      </View>
      {item.description ? (
        <>
          <Text style={styles.subheading}>About this Event</Text>
          <Text style={styles.bodyText}>{item.description}</Text>
        </>
      ) : null}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// ─── CHANGE VIEW ──────────────────────────────────────────────────────────────
function ChangeView({ item }: { item: any }) {
  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.changeBanner}>
        <Ionicons name="warning" size={18} color="#EF4444" />
        <Text style={styles.changeBannerText}>This is an official change notice — please read carefully.</Text>
      </View>
      <Text style={styles.subheading}>Summary</Text>
      <Text style={styles.bodyText}>{item.description ?? 'No details available.'}</Text>
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// ─── CAREER VIEW ──────────────────────────────────────────────────────────────
function CareerView({ item }: { item: any }) {
  const handleApply = () => {
    if (item.applicationUrl) Linking.openURL(item.applicationUrl);
  };

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.eventInfoCard}>
        {item.jobDepartment && (
          <View style={styles.eventRow}>
            <View style={[styles.eventIconBox, { backgroundColor: '#10B98122' }]}>
              <Ionicons name="business" size={20} color="#10B981" />
            </View>
            <View>
              <Text style={styles.eventRowLabel}>Department</Text>
              <Text style={styles.eventRowValue}>{item.jobDepartment}</Text>
            </View>
          </View>
        )}
        {item.jobLocation && (
          <View style={styles.eventRow}>
            <View style={[styles.eventIconBox, { backgroundColor: '#10B98122' }]}>
              <Ionicons name="location" size={20} color="#10B981" />
            </View>
            <View>
              <Text style={styles.eventRowLabel}>Location</Text>
              <Text style={styles.eventRowValue}>{item.jobLocation}</Text>
            </View>
          </View>
        )}
      </View>
      {item.description ? (
        <>
          <Text style={styles.subheading}>Job Description</Text>
          <Text style={styles.bodyText}>{item.description}</Text>
        </>
      ) : null}
      {item.applicationUrl && (
        <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
          <Ionicons name="open-outline" size={18} color="#fff" />
          <Text style={styles.applyBtnText}>Apply Now</Text>
        </TouchableOpacity>
      )}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

// ─── QUIZ VIEW (real API) ─────────────────────────────────────────────────────
function QuizView({ itemId, onComplete }: { itemId: string; onComplete: () => void }) {
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<{ scorePct: number; passed: boolean; certificationName?: string } | null>(null);

  const { data: questions, isLoading } = useQuery({
    queryKey: ['quiz-questions', itemId],
    queryFn: () => quizApi.getQuestions(itemId).then(r => r.data as any[]),
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      const answers = (questions ?? []).map((q: any) => ({
        questionId: q.id,
        selectedAnswerIds: selected[q.id] ?? [],
      }));
      return quizApi.submitAttempt(itemId, answers).then(r => r.data);
    },
    onSuccess: (data: any) => {
      setResult({ scorePct: data.scorePct, passed: data.passed, certificationName: data.certificationName });
      if (data.passed) {
        onComplete();
        showMessage({ message: `Passed! ${data.scorePct}%${data.certificationName ? ` · Cert: ${data.certificationName}` : ''}`, type: 'success' });
      } else {
        showMessage({ message: `Score: ${data.scorePct}% — keep trying!`, type: 'warning' });
      }
    },
    onError: () => showMessage({ message: 'Submission failed', type: 'danger' }),
  });

  const toggleAnswer = (questionId: string, answerId: string, questionType: string) => {
    if (questionType === 'MULTIPLE_CHOICE') {
      setSelected(prev => {
        const curr = prev[questionId] ?? [];
        return {
          ...prev,
          [questionId]: curr.includes(answerId)
            ? curr.filter(id => id !== answerId)
            : [...curr, answerId],
        };
      });
    } else {
      setSelected(prev => ({ ...prev, [questionId]: [answerId] }));
    }
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  if (!questions || questions.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.bodyText}>No questions available yet.</Text>
      </View>
    );
  }

  if (result) {
    return (
      <View style={styles.quizResult}>
        <Ionicons
          name={result.passed ? 'checkmark-circle' : 'close-circle'}
          size={72}
          color={result.passed ? Colors.success : Colors.danger}
        />
        <Text style={styles.quizResultScore}>{result.scorePct}%</Text>
        <Text style={styles.quizResultLabel}>{result.passed ? 'Passed' : 'Not passed yet'}</Text>
        {result.certificationName && (
          <View style={styles.certBadge}>
            <Ionicons name="ribbon" size={14} color={Colors.warning} />
            <Text style={styles.certBadgeText}>{result.certificationName}</Text>
          </View>
        )}
        {!result.passed && (
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setResult(null); setSelected({}); }}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const allAnswered = questions.every((q: any) => (selected[q.id] ?? []).length > 0);

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      {questions.map((q: any, qi: number) => (
        <View key={q.id} style={styles.questionCard}>
          <Text style={styles.questionNum}>Question {qi + 1}</Text>
          <Text style={styles.questionText}>{q.questionText}</Text>
          {q.questionType === 'MULTIPLE_CHOICE' && (
            <Text style={styles.questionHint}>Select all that apply</Text>
          )}
          {q.answers.map((a: any) => {
            const isChosen = (selected[q.id] ?? []).includes(a.id);
            return (
              <TouchableOpacity
                key={a.id}
                style={[styles.optionBtn, isChosen && styles.optionBtnSelected]}
                onPress={() => toggleAnswer(q.id, a.id, q.questionType)}
                activeOpacity={0.75}
              >
                <View style={[styles.optionDot, isChosen && styles.optionDotSelected]}>
                  {isChosen && <Ionicons name="checkmark" size={10} color="#fff" />}
                </View>
                <Text style={[styles.optionText, isChosen && styles.optionTextSelected]}>{a.answerText}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
      <TouchableOpacity
        style={[styles.submitBtn, (!allAnswered || submitMutation.isPending) && { opacity: 0.4 }]}
        onPress={() => submitMutation.mutate()}
        disabled={!allAnswered || submitMutation.isPending}
      >
        {submitMutation.isPending
          ? <ActivityIndicator color="#fff" size="small" />
          : <Text style={styles.submitBtnText}>Submit Answers</Text>
        }
      </TouchableOpacity>
      <View style={{ height: 120 }} />
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
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => contentApi.complete(id!),
    onSuccess: () => {
      showMessage({ message: 'Completed ✓', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['content', id] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });

  if (isLoading || !item) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const postType: string = item.postType ?? 'TRAINING';
  const postColor = POST_TYPE_COLOR[postType] ?? Colors.primary;
  const postIcon = POST_TYPE_ICON[postType] ?? 'document-outline';
  const postLabel = POST_TYPE_LABEL[postType] ?? postType;

  const showAcknowledgeBtn = item.mandatory && !item.userAcknowledged;
  const showCompleteBtn = !item.userCompleted
    && !showAcknowledgeBtn
    && (postType === 'TRAINING' || postType === 'NEWS' || postType === 'REGULATION')
    && item.contentType !== 'QUIZ';

  const renderBody = () => {
    if (postType === 'EVENT') return <EventView item={item} />;
    if (postType === 'NEWS') return <NewsView item={item} />;
    if (postType === 'CHANGE') return <ChangeView item={item} />;
    if (postType === 'CAREER') return <CareerView item={item} />;
    // TRAINING / REGULATION — differentiate by contentType
    if (item.contentType === 'VIDEO') return <VideoView item={item} onProgress={pct => contentApi.updateProgress(id!, pct)} />;
    if (item.contentType === 'QUIZ') return <QuizView itemId={id!} onComplete={() => completeMutation.mutate()} />;
    return <DocumentView item={item} />;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: postLabel,
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.textPrimary,
        }}
      />

      {/* Title block */}
      <View style={styles.titleBlock}>
        <View style={styles.titleTopRow}>
          <View style={[styles.postTypePill, { backgroundColor: postColor + '22', borderColor: postColor + '55' }]}>
            <Ionicons name={postIcon} size={12} color={postColor} />
            <Text style={[styles.postTypeText, { color: postColor }]}>{postLabel}</Text>
          </View>
          {item.mandatory && (
            <View style={styles.mandatoryPill}>
              <Ionicons name="alert-circle" size={12} color={Colors.mandatory} />
              <Text style={styles.mandatoryPillText}>Mandatory</Text>
            </View>
          )}
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.metaRow}>
          {item.categoryName && (
            <Text style={[styles.metaChip, { color: item.categoryColorHex ?? Colors.primary, borderColor: item.categoryColorHex ?? Colors.primary }]}>
              {item.categoryName}
            </Text>
          )}
          {item.authorName ? <Text style={styles.metaAuthor}>by {item.authorName}</Text> : null}
          <Text style={styles.metaAuthor}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>{renderBody()}</View>

      {/* Bottom action bar */}
      {showAcknowledgeBtn && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.mandatory }, acknowledgeMutation.isPending && { opacity: 0.7 }]}
            onPress={() => acknowledgeMutation.mutate()}
            disabled={acknowledgeMutation.isPending}
          >
            {acknowledgeMutation.isPending
              ? <ActivityIndicator color="#fff" size="small" />
              : <><Ionicons name="checkmark-circle-outline" size={20} color="#fff" /><Text style={styles.actionBtnText}>I have read and understood this</Text></>
            }
          </TouchableOpacity>
        </View>
      )}

      {showCompleteBtn && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.secondary }, completeMutation.isPending && { opacity: 0.7 }]}
            onPress={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
          >
            {completeMutation.isPending
              ? <ActivityIndicator color="#fff" size="small" />
              : <><Ionicons name="checkmark-done-circle-outline" size={20} color="#fff" /><Text style={styles.actionBtnText}>Mark as Complete</Text></>
            }
          </TouchableOpacity>
        </View>
      )}

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
  scroll: { flex: 1, padding: Spacing.md },

  // Title block
  titleBlock: {
    padding: Spacing.md, paddingBottom: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 6,
  },
  titleTopRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  postTypePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  postTypeText: { fontSize: FontSize.xs, fontWeight: '700' },
  mandatoryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.mandatoryBg, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start',
  },
  mandatoryPillText: { color: Colors.mandatory, fontSize: FontSize.xs, fontWeight: '700' },
  title: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '700', lineHeight: 26 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  metaChip: {
    fontSize: FontSize.xs, fontWeight: '600',
    borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2,
  },
  metaAuthor: { color: Colors.textMuted, fontSize: FontSize.xs },
  body: { flex: 1 },

  // Shared body text
  bodyText: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 26 },
  subheading: {
    color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.md, marginBottom: Spacing.sm,
  },

  // Video
  videoWrap: { flex: 1, padding: Spacing.md },
  videoPlayer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: Radius.md,
  },
  videoPlaceholder: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    aspectRatio: 16 / 9, alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, padding: Spacing.md,
  },
  videoNote: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
  videoDesc: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center' },

  // News
  newsMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  newsDate: { color: '#8B5CF6', fontSize: FontSize.sm, fontWeight: '600' },
  newsAuthor: { color: Colors.textMuted, fontSize: FontSize.sm },

  // Event
  eventInfoCard: {
    backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.border, marginBottom: Spacing.md, overflow: 'hidden',
  },
  eventRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  eventIconBox: { width: 40, height: 40, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  eventRowLabel: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600', textTransform: 'uppercase' },
  eventRowValue: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '600', marginTop: 2 },

  // Change
  changeBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: '#450A0A', borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: '#EF444433', marginBottom: Spacing.md,
  },
  changeBannerText: { color: '#EF4444', fontSize: FontSize.sm, fontWeight: '600', flex: 1, lineHeight: 20 },

  // Career
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: '#10B981', borderRadius: Radius.md,
    padding: Spacing.md, marginTop: Spacing.lg,
  },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },

  // Quiz
  questionCard: {
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  questionNum: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase' },
  questionText: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '600', lineHeight: 22 },
  questionHint: { color: Colors.textMuted, fontSize: FontSize.xs },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.sm, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border,
  },
  optionBtnSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '18' },
  optionDot: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  optionDotSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  optionText: { color: Colors.textSecondary, fontSize: FontSize.md, flex: 1 },
  optionTextSelected: { color: Colors.textPrimary, fontWeight: '600' },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  quizResult: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: Spacing.lg },
  quizResultScore: { color: Colors.textPrimary, fontSize: 48, fontWeight: '700' },
  quizResultLabel: { color: Colors.textSecondary, fontSize: FontSize.lg },
  certBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.warning + '22', borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: Colors.warning + '44',
  },
  certBadgeText: { color: Colors.warning, fontSize: FontSize.sm, fontWeight: '700' },
  retryBtn: {
    marginTop: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  retryBtnText: { color: Colors.textSecondary, fontWeight: '600', fontSize: FontSize.md },

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
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.md },
  completedBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: Spacing.md, backgroundColor: Colors.successBg,
    borderTopWidth: 1, borderTopColor: Colors.success + '33',
  },
  completedBarText: { color: Colors.success, fontWeight: '700', fontSize: FontSize.md },
});
