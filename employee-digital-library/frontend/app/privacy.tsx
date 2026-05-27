import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Colors, Spacing, FontSize } from '../src/utils/theme';

export default function PrivacyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Stack.Screen options={{
        title: 'Privacy Policy',
        headerShown: true,
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.textPrimary,
      }} />

      <View style={styles.header}>
        <Text style={styles.lastUpdated}>Last Updated: October 2024</Text>
        <Text style={styles.intro}>
          This Privacy Policy explains how the Employee Digital Library (EDL) application collects, uses, and protects your information as an employee.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect minimal personal data required for your employee profile. This includes your name, company email address, assigned department, and role. We also track your app usage, such as which mandatory regulations you have acknowledged, your quiz scores, and your earned certifications.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>2. How We Use Your Data</Text>
        <Text style={styles.paragraph}>
          Your data is used strictly for internal company purposes to ensure compliance with mandatory training, grant you experience points (XP) for gamification, and manage support tickets you submit. 
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>3. Device Permissions</Text>
        <Text style={styles.paragraph}>
          The app may request permission to send you Push Notifications for mandatory content updates. You can manage these permissions directly through your device's operating system settings at any time.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>4. Data Security</Text>
        <Text style={styles.paragraph}>
          All communication between the EDL mobile app and our servers is encrypted using industry-standard protocols. Your session is secured via encrypted tokens stored securely on your device.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>5. Contact</Text>
        <Text style={styles.paragraph}>
          If you have any questions regarding your data privacy, please reach out to the HR Administration team via the Support tab in the application.
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  inner: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  header: {
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastUpdated: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  intro: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 24,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  heading: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  paragraph: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
});