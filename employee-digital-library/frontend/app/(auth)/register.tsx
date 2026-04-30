import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { showMessage } from 'react-native-flash-message';
import { useAuthStore } from '../../src/store/authStore';
import { Colors, Spacing, Radius, FontSize } from '../../src/utils/theme';
import api from '../../src/api';

interface Department { id: string; name: string; }

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [deptId, setDeptId] = useState('');
  const [lang, setLang] = useState<'RO' | 'EN'>('RO');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const router = useRouter();

  useEffect(() => {
    api.get('/api/departments').then(r => setDepartments(r.data)).catch(() => {});
  }, []);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      showMessage({ message: 'Please fill in all fields', type: 'warning' });
      return;
    }
    setLoading(true);
    try {
      await register({ fullName: fullName.trim(), email: email.trim().toLowerCase(), password, departmentId: deptId || undefined, preferredLang: lang });
    } catch (err: any) {
      const msg = err.response?.data?.message
        ?? (err.request ? 'Cannot reach server — check your network or BASE_URL in api/index.ts' : err.message ?? 'Registration failed');
      showMessage({ message: msg, type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>📚</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join your company's knowledge hub</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName}
            placeholder="Maria Ionescu" placeholderTextColor={Colors.textMuted} />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail}
            placeholder="you@company.com" placeholderTextColor={Colors.textMuted}
            keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword}
            placeholder="Min. 6 characters" placeholderTextColor={Colors.textMuted} secureTextEntry />

          <Text style={styles.label}>Department</Text>
          <View style={styles.deptGrid}>
            {departments.map(d => (
              <TouchableOpacity key={d.id}
                style={[styles.deptChip, deptId === d.id && styles.deptChipActive]}
                onPress={() => setDeptId(deptId === d.id ? '' : d.id)}>
                <Text style={[styles.deptChipText, deptId === d.id && styles.deptChipTextActive]}>{d.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Preferred Language</Text>
          <View style={styles.langRow}>
            {(['RO', 'EN'] as const).map(l => (
              <TouchableOpacity key={l} style={[styles.langBtn, lang === l && styles.langBtnActive]} onPress={() => setLang(l)}>
                <Text style={[styles.langBtnText, lang === l && styles.langBtnTextActive]}>{l === 'RO' ? '🇷🇴 Română' : '🇬🇧 English'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.linkBtn}>
            <Text style={styles.link}>Already have an account? <Text style={{ color: Colors.primary }}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  logo: { fontSize: 48, marginBottom: Spacing.sm },
  title: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '700' },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.md, marginTop: 4 },
  form: { gap: Spacing.sm },
  label: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary,
    fontSize: FontSize.md, marginBottom: Spacing.sm,
  },
  deptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.sm },
  deptChip: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  deptChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  deptChipText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  deptChipTextActive: { color: '#fff', fontWeight: '600' },
  langRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  langBtn: {
    flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    padding: Spacing.sm, alignItems: 'center',
  },
  langBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  langBtnText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  langBtnTextActive: { color: '#fff', fontWeight: '600' },
  btn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.sm,
  },
  btnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  linkBtn: { alignItems: 'center', marginTop: Spacing.md },
  link: { color: Colors.textSecondary, fontSize: FontSize.sm },
});
