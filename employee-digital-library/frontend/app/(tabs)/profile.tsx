import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { gamificationApi, certApi } from '../../src/api';
import { Colors, Spacing, Radius, FontSize } from '../../src/utils/theme';

const XP_PER_LEVEL = 200;

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  accent?: string;
}
function Row({ icon, label, value, onPress, danger, accent }: RowProps) {
  const color = danger ? Colors.mandatory : (accent ?? Colors.primary);
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, danger && { color: Colors.mandatory }]}>{label}</Text>
        {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} /> : null}
    </TouchableOpacity>
  );
}

const ROLE_LABEL: Record<string, string> = {
  EMPLOYEE: 'Employee',
  MASTER_MENTOR: 'Master Mentor',
  HR_ADMIN: 'HR Admin',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const { data: gamification, isLoading: loadingGam } = useQuery({
    queryKey: ['gamification'],
    queryFn: () => gamificationApi.getMyProfile().then(r => r.data as {
      xpPoints: number; level: number; xpToNextLevel: number;
      streakDays: number;
      recentEvents: { eventType: string; xpAwarded: number; createdAt: string }[];
    }),
  });

  const { data: certs, isLoading: loadingCerts } = useQuery({
    queryKey: ['my-certs'],
    queryFn: () => certApi.getMyCertifications().then(r => r.data as {
      id: string; name: string; description?: string;
      issuedAt: string; expiresAt?: string; expired: boolean;
    }[]),
  });

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = user?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';

  const xpInLevel = gamification ? gamification.xpPoints % XP_PER_LEVEL : 0;
  const xpProgress = xpInLevel / XP_PER_LEVEL;

  const formatEventType = (t: string) =>
    t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      {/* Avatar + name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {gamification && (
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{gamification.level}</Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{user?.fullName}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{ROLE_LABEL[user?.role ?? ''] ?? user?.role}</Text>
        </View>
        {user?.sectionName && (
          <Text style={styles.sectionLabel}>{user.sectionName} · {user.department}</Text>
        )}
      </View>

      {/* XP & Streak */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress</Text>
        {loadingGam ? (
          <View style={[styles.card, styles.centered]}><ActivityIndicator color={Colors.primary} /></View>
        ) : gamification ? (
          <View style={styles.card}>
            {/* XP bar */}
            <View style={styles.xpBlock}>
              <View style={styles.xpTopRow}>
                <Text style={styles.xpLabel}>Level {gamification.level}</Text>
                <Text style={styles.xpPoints}>{gamification.xpPoints} XP total</Text>
              </View>
              <View style={styles.xpBarBg}>
                <View style={[styles.xpBarFill, { width: `${Math.round(xpProgress * 100)}%` as any }]} />
              </View>
              <Text style={styles.xpSub}>{gamification.xpToNextLevel} XP to Level {gamification.level + 1}</Text>
            </View>

            <View style={styles.divider} />

            {/* Streak */}
            <View style={styles.streakRow}>
              <View style={styles.streakLeft}>
                <Text style={styles.streakFire}>🔥</Text>
                <View>
                  <Text style={styles.streakCount}>{gamification.streakDays} day{gamification.streakDays !== 1 ? 's' : ''}</Text>
                  <Text style={styles.streakSub}>current streak</Text>
                </View>
              </View>
              {user?.sectionId && (
                <TouchableOpacity
                  style={styles.leaderboardBtn}
                  onPress={() => router.push('/leaderboard')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trophy-outline" size={14} color={Colors.warning} />
                  <Text style={styles.leaderboardBtnText}>Leaderboard</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Recent XP events */}
            {gamification.recentEvents.length > 0 && (
              <>
                <View style={styles.divider} />
                <View style={styles.eventsBlock}>
                  <Text style={styles.eventsTitle}>Recent XP</Text>
                  {gamification.recentEvents.slice(0, 4).map((e, i) => (
                    <View key={i} style={styles.eventRow}>
                      <Text style={styles.eventType}>{formatEventType(e.eventType)}</Text>
                      <Text style={styles.eventXp}>+{e.xpAwarded} XP</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        ) : null}
      </View>

      {/* Certifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Certifications</Text>
        {loadingCerts ? (
          <View style={[styles.card, styles.centered]}><ActivityIndicator color={Colors.primary} /></View>
        ) : certs && certs.length > 0 ? (
          <View style={styles.card}>
            {certs.map((cert, i) => (
              <React.Fragment key={cert.id}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.certRow}>
                  <View style={[styles.certIcon, cert.expired && styles.certIconExpired]}>
                    <Ionicons name="ribbon" size={18} color={cert.expired ? Colors.textMuted : Colors.warning} />
                  </View>
                  <View style={styles.certInfo}>
                    <Text style={[styles.certName, cert.expired && styles.certNameExpired]}>{cert.name}</Text>
                    <Text style={styles.certDate}>
                      Issued {formatDate(cert.issuedAt)}
                      {cert.expiresAt ? ` · ${cert.expired ? 'Expired' : 'Expires'} ${formatDate(cert.expiresAt)}` : ' · No expiry'}
                    </Text>
                  </View>
                  {cert.expired && (
                    <View style={styles.expiredBadge}>
                      <Text style={styles.expiredBadgeText}>Expired</Text>
                    </View>
                  )}
                </View>
              </React.Fragment>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="ribbon-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No certifications yet</Text>
            <Text style={styles.emptySubtext}>Complete quizzes to earn certificates</Text>
          </View>
        )}
      </View>

      {/* Account info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <Row icon="mail-outline" label="Email" value={user?.email} />
          <View style={styles.divider} />
          <Row icon="business-outline" label="Department" value={user?.department ?? 'Not assigned'} />
          {user?.sectionName && (
            <>
              <View style={styles.divider} />
              <Row icon="people-outline" label="Section" value={user.sectionName} accent={Colors.secondary} />
            </>
          )}
          <View style={styles.divider} />
          <Row icon="language-outline" label="Language" value={user?.preferredLang === 'RO' ? '🇷🇴 Română' : '🇬🇧 English'} />
        </View>
      </View>

      {/* Help & Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Help &amp; Info</Text>
        <View style={styles.card}>
          <Row icon="document-text-outline" label="Regulations" onPress={() => router.push('/regulations')} />
          <View style={styles.divider} />
          <Row icon="business-outline" label="About &amp; Policies" onPress={() => router.push('/about')} />
          <View style={styles.divider} />
          <Row icon="chatbubbles-outline" label="Send Feedback" onPress={() => router.push('/feedback')} />
          <View style={styles.divider} />
          <Row icon="headset-outline" label="Support" onPress={() => router.push('/support')} />
        </View>
      </View>

      {/* App */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <View style={styles.card}>
          <Row icon="information-circle-outline" label="Version" value="1.0.0" />
          <View style={styles.divider} />
          <Row icon="shield-outline" label="Privacy Policy" onPress={() => router.push('/privacy')} />
        </View>
      </View>

      {/* Sign out */}
      <View style={styles.section}>
        <View style={styles.card}>
          <Row icon="log-out-outline" label="Sign Out" onPress={handleLogout} danger />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { paddingBottom: 100 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.lg },

  // Avatar
  avatarSection: { alignItems: 'center', paddingTop: Spacing.xl + 16, paddingBottom: Spacing.xl },
  avatarWrap: { position: 'relative', marginBottom: Spacing.md },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: FontSize.xl, fontWeight: '700' },
  levelBadge: {
    position: 'absolute', bottom: -4, right: -4,
    backgroundColor: Colors.warning, borderRadius: 12, width: 24, height: 24,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.bg,
  },
  levelBadgeText: { color: '#000', fontSize: 11, fontWeight: '800' },
  name: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '700' },
  roleBadge: {
    marginTop: 8, backgroundColor: Colors.primary + '22',
    borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.primary + '44',
  },
  roleText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
  sectionLabel: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 6 },

  // Sections
  section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  sectionTitle: {
    color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm,
  },
  card: { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.md },

  // XP bar
  xpBlock: { padding: Spacing.md, gap: 8 },
  xpTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xpLabel: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '700' },
  xpPoints: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
  xpBarBg: {
    height: 8, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%', backgroundColor: Colors.primary, borderRadius: Radius.full,
  },
  xpSub: { color: Colors.textMuted, fontSize: FontSize.xs },

  // Streak
  streakRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md,
  },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  streakFire: { fontSize: 28 },
  streakCount: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '700' },
  streakSub: { color: Colors.textMuted, fontSize: FontSize.xs },
  leaderboardBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.warning + '22', borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.warning + '44',
  },
  leaderboardBtnText: { color: Colors.warning, fontSize: FontSize.sm, fontWeight: '700' },

  // Recent XP events
  eventsBlock: { padding: Spacing.md, gap: 8 },
  eventsTitle: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  eventRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventType: { color: Colors.textSecondary, fontSize: FontSize.sm },
  eventXp: { color: Colors.secondary, fontSize: FontSize.sm, fontWeight: '700' },

  // Certifications
  certRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  certIcon: {
    width: 40, height: 40, borderRadius: Radius.sm,
    backgroundColor: Colors.warning + '22', alignItems: 'center', justifyContent: 'center',
  },
  certIconExpired: { backgroundColor: Colors.border },
  certInfo: { flex: 1 },
  certName: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '600' },
  certNameExpired: { color: Colors.textMuted },
  certDate: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  expiredBadge: {
    backgroundColor: Colors.border, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  expiredBadgeText: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },
  emptyCard: {
    backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', padding: Spacing.xl, gap: 8,
  },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '600' },
  emptySubtext: { color: Colors.textMuted, fontSize: FontSize.sm },

  // Row (account/app rows)
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  rowIcon: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  rowLabel: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '500' },
  rowValue: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
});
