import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { Colors, Spacing, Radius, FontSize } from '../../src/utils/theme';

interface RowProps { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string; onPress?: () => void; danger?: boolean; }
function Row({ icon, label, value, onPress, danger }: RowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: danger ? Colors.mandatory + '22' : Colors.primary + '22' }]}>
        <Ionicons name={icon} size={18} color={danger ? Colors.mandatory : Colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, danger && { color: Colors.mandatory }]}>{label}</Text>
        {value && <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
    </TouchableOpacity>
  );
}

const ROLE_LABEL: Record<string, string> = {
  EMPLOYEE: 'Employee',
  MASTER_MENTOR: 'Master Mentor',
  HR_ADMIN: 'HR Admin',
};

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = user?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      {/* Avatar + name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user?.fullName}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{ROLE_LABEL[user?.role ?? ''] ?? user?.role}</Text>
        </View>
      </View>

      {/* Account info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <Row icon="mail-outline" label="Email" value={user?.email} />
          <View style={styles.divider} />
          <Row icon="business-outline" label="Department" value={user?.department ?? 'Not assigned'} />
          <View style={styles.divider} />
          <Row icon="language-outline" label="Language" value={user?.preferredLang === 'RO' ? '🇷🇴 Română' : '🇬🇧 English'} />
        </View>
      </View>

      {/* App info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        <View style={styles.card}>
          <Row icon="information-circle-outline" label="Version" value="1.0.0" />
          <View style={styles.divider} />
          <Row icon="shield-outline" label="Privacy Policy" onPress={() => {}} />
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
  avatarSection: { alignItems: 'center', paddingTop: Spacing.xl + 16, paddingBottom: Spacing.xl },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: { color: '#fff', fontSize: FontSize.xl, fontWeight: '700' },
  name: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '700' },
  roleBadge: {
    marginTop: 8, backgroundColor: Colors.primary + '22',
    borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.primary + '44',
  },
  roleText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },
  section: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  sectionTitle: {
    color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm,
  },
  card: { backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  row: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md,
  },
  rowIcon: { width: 36, height: 36, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  rowLabel: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '500' },
  rowValue: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: Spacing.md + 36 + Spacing.md },
});
