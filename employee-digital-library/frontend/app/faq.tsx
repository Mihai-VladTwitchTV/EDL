import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { pagesApi } from '../src/api';
import { Colors, Spacing, Radius, FontSize } from '../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';

interface CompanyPage {
  id: string;
  title: string;
  bodyHtml: string;
}
export default function FAQScreen() {
  const { data: faqPage, isLoading, isError } = useQuery({
    queryKey: ['faq-page'],
    queryFn: async () => {
      const r = await pagesApi.getBySection('contact');
      const allContactPages = r.data as CompanyPage[];
      // Find specifically the FAQ page by its slug
      return allContactPages.find(p => p.slug === 'faq-general');
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  // Handle the case where the page isn't found
  if (isError || !faqPage) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>FAQ-ul nu a putut fi încărcat.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Stack.Screen options={{ title: 'Întrebări Frecvente' }} />
      
      <View style={styles.card}>
        {/* Render the single FAQ page found */}
        <Text style={styles.question}>{faqPage.title}</Text>
        <Text style={styles.answer}>{faqPage.bodyHtml.replace(/<[^>]+>/g, '')}</Text>
      
        <View style={styles.linkContainer}>
            <Text style={styles.linkHeader}>Pagini recomandate:</Text>
            <TouchableOpacity onPress={() => router.push('/about')} style={styles.linkButton}>
            <Text style={styles.linkText}>• Despre Noi</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/regulations')} style={styles.linkButton}>
            <Text style={styles.linkText}>• Politici interne</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/support')} style={styles.linkButton}>
            <Text style={styles.linkText}>• Contact IT & HR</Text>
            </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.bg 
  },
  inner: { 
    // Increased top padding for better visual breathing room
    paddingTop: Spacing.xl * 3, 
    paddingHorizontal: Spacing.md, 
    paddingBottom: Spacing.xl * 2, 
    gap: Spacing.md 
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  card: { 
    backgroundColor: Colors.card, 
    padding: Spacing.lg, 
    borderRadius: Radius.md, 
    borderWidth: 1, 
    borderColor: Colors.border,
    // Ensures internal vertical flow
    gap: Spacing.sm, 
  },
  question: { 
    fontSize: FontSize.md, 
    fontWeight: '700', 
    color: Colors.textPrimary,
  },
  answer: { 
    fontSize: FontSize.sm, 
    color: Colors.textSecondary, 
    lineHeight: 24, 
    marginTop: 4,
  },
  errorText: { 
    color: Colors.mandatory, 
    textAlign: 'center', 
    marginTop: Spacing.xl 
  },
  linkContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  linkHeader: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  linkButton: {
    paddingVertical: Spacing.xs,
  },
  linkText: {
    color: Colors.primary, 
    fontSize: FontSize.sm,
    fontWeight: '600',
    letterSpacing: 0.2,
  }
});