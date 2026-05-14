import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, FlatList,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { supportApi } from '../src/api';
import { Colors, Spacing, Radius, FontSize } from '../src/utils/theme';

const TICKET_TYPES: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'TECHNICAL', label: 'Technical', icon: 'hardware-chip-outline', color: '#3B82F6' },
  { key: 'HR', label: 'HR', icon: 'people-outline', color: '#8B5CF6' },
  { key: 'GENERAL', label: 'General', icon: 'help-circle-outline', color: Colors.primary },
];

const STATUS_COLOR: Record<string, string> = {
  OPEN: Colors.warning,
  IN_PROGRESS: '#3B82F6',
  RESOLVED: Colors.success,
};

const STATUS_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  OPEN: 'time-outline',
  IN_PROGRESS: 'sync-outline',
  RESOLVED: 'checkmark-circle-outline',
};

interface Ticket {
  id: string;
  ticketType: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SupportScreen() {
  const queryClient = useQueryClient();
  const [ticketType, setTicketType] = useState('TECHNICAL');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => supportApi.getMyTickets(0).then(r => r.data.content as Ticket[]),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => supportApi.create({ ticketType, subject: subject.trim(), description: description.trim() }),
    onSuccess: () => {
      showMessage({ message: 'Support ticket submitted!', type: 'success' });
      setSubject('');
      setDescription('');
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
    },
    onError: () => showMessage({ message: 'Failed to submit ticket. Please try again.', type: 'danger' }),
  });

  const canSubmit = subject.trim().length >= 3 && description.trim().length >= 10 && !isPending;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.inner}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{
        title: 'Support',
        headerShown: true,
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.textPrimary,
      }} />

      {/* New ticket button / form toggle */}
      <TouchableOpacity
        style={styles.newTicketBtn}
        onPress={() => setShowForm(s => !s)}
        activeOpacity={0.8}
      >
        <Ionicons name={showForm ? 'chevron-up' : 'add-circle-outline'} size={20} color="#fff" />
        <Text style={styles.newTicketText}>{showForm ? 'Cancel' : 'New Support Ticket'}</Text>
      </TouchableOpacity>

      {/* Form */}
      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            {TICKET_TYPES.map(t => {
              const active = ticketType === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeChip, active && { backgroundColor: t.color + '22', borderColor: t.color }]}
                  onPress={() => setTicketType(t.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={t.icon} size={15} color={active ? t.color : Colors.textMuted} />
                  <Text style={[styles.typeLabel, active && { color: t.color }]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.textInput}
            value={subject}
            onChangeText={setSubject}
            placeholder="Brief summary of your issue..."
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the issue in detail. Include steps to reproduce if applicable."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

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
                <Ionicons name="send" size={15} color="#fff" />
                <Text style={styles.submitBtnText}>Submit Ticket</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Ticket list */}
      <Text style={styles.sectionTitle}>My Tickets</Text>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : !data || data.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="ticket-outline" size={40} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No tickets yet</Text>
          <Text style={styles.emptySub}>Create a ticket above to contact support</Text>
        </View>
      ) : (
        data.map(ticket => {
          const statusColor = STATUS_COLOR[ticket.status] ?? Colors.textMuted;
          const statusIcon = STATUS_ICON[ticket.status] ?? 'help-circle-outline';
          return (
            <View key={ticket.id} style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <View style={[styles.typeBadge, { backgroundColor: statusColor + '15' }]}>
                  <Text style={[styles.typeBadgeText, { color: statusColor }]}>{ticket.ticketType}</Text>
                </View>
                <View style={[styles.statusRow, { backgroundColor: statusColor + '15' }]}>
                  <Ionicons name={statusIcon} size={12} color={statusColor} />
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {ticket.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <Text style={styles.ticketSubject}>{ticket.subject}</Text>
              <Text style={styles.ticketDesc} numberOfLines={2}>{ticket.description}</Text>
              <Text style={styles.ticketDate}>Opened {formatDate(ticket.createdAt)}</Text>
            </View>
          );
        })
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { padding: Spacing.md, gap: Spacing.sm },
  centered: { alignItems: 'center', padding: Spacing.xl },

  newTicketBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 13,
    marginBottom: Spacing.sm,
  },
  newTicketText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },

  formCard: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  label: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600' },

  typeRow: { flexDirection: 'row', gap: Spacing.sm },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  typeLabel: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },

  textInput: {
    backgroundColor: Colors.surfaceAlt, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.textPrimary, fontSize: FontSize.md, padding: Spacing.md,
  },
  textArea: { minHeight: 100 },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 12, marginTop: Spacing.xs,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },

  sectionTitle: {
    color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.sm,
  },

  emptyWrap: { alignItems: 'center', paddingVertical: Spacing.xl, gap: 8 },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '600' },
  emptySub: { color: Colors.textMuted, fontSize: FontSize.sm },

  ticketCard: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: 6,
  },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  typeBadge: {
    borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3,
  },
  typeBadgeText: { fontSize: FontSize.xs, fontWeight: '700' },
  statusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3,
  },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },
  ticketSubject: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '600' },
  ticketDesc: { color: Colors.textSecondary, fontSize: FontSize.sm },
  ticketDate: { color: Colors.textMuted, fontSize: FontSize.xs },
});
